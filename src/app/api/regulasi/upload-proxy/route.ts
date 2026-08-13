import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

// ============================================
// ☁️ CLOUDINARY UPLOAD PROXY (Direct REST API)
// ============================================

// Config dengan fallback
const CLOUD_CONFIG = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'czpvpb9j',
  api_key: process.env.CLOUDINARY_API_KEY || '256494922449866',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'H8NX41ph3VSJSl5GkakrPU4DH7Q',
};

// Parse CLOUDINARY_URL
function parseCloudinaryUrl(): Partial<typeof CLOUD_CONFIG> | null {
  const url = process.env.CLOUDINARY_URL;
  if (!url) return null;
  
  try {
    const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      return {
        api_key: match[1],
        api_secret: match[2],
        cloud_name: match[3],
      };
    }
  } catch (e) {
    console.error('Failed to parse CLOUDINARY_URL:', e);
  }
  return null;
}

// Get final config
function getConfig() {
  const urlConfig = parseCloudinaryUrl();
  
  return {
    cloud_name: urlConfig?.cloud_name || CLOUD_CONFIG.cloud_name,
    api_key: urlConfig?.api_key || CLOUD_CONFIG.api_key,
    api_secret: urlConfig?.api_secret || CLOUD_CONFIG.api_secret,
  };
}

// Generate signature
function generateSignature(paramsToSign: Record<string, string>, apiSecret: string): string {
  const sortedKeys = Object.keys(paramsToSign).sort();
  const sigString = sortedKeys.map(key => `${key}=${paramsToSign[key]}`).join('&');
  return crypto.createHash('sha1').update(sigString + apiSecret).digest('hex');
}

// POST - Upload to Cloudinary
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get config
    const config = getConfig();
    
    console.log('📤 Upload Proxy Config:', {
      cloudName: config.cloud_name,
      apiKey: config.api_key.substring(0, 6) + '...',
      source: process.env.CLOUDINARY_URL ? 'CLOUDINARY_URL' : 
               process.env.CLOUDINARY_CLOUD_NAME ? 'Env Vars' : 'Fallback'
    });

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file' }, { status: 400 });
    }

    // Validate
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Hanya PDF' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 20MB' }, { status: 400 });
    }

    console.log(`📄 File: ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`);

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate params
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `regulasi/${Date.now()}-${safeFileName}`;

    const paramsToSign = {
      timestamp,
      folder: 'regulasi',
      public_id: publicId,
      resource_type: 'raw',
    };

    const signature = generateSignature(paramsToSign, config.api_secret);
    
    console.log(`🔐 Signature: ${signature.substring(0, 10)}...`);

    // Build multipart body
    const boundary = '----CloudinaryBoundary' + Math.random().toString(36).substring(2);
    
    let body = '';
    
    for (const [key, value] of Object.entries(paramsToSign)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="api_key"\r\n\r\n`;
    body += `${config.api_key}\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="signature"\r\n\r\n`;
    body += `${signature}\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${safeFileName}"\r\n`;
    body += `Content-Type: application/pdf\r\n\r\n`;
    
    const bodyBuffer = Buffer.concat([Buffer.from(body), buffer, Buffer.from(`\r\n--${boundary}--\r\n`)]);

    console.log(`📤 Uploading to: https://api.cloudinary.com/v1_1/${config.cloud_name}/raw/upload`);

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloud_name}/raw/upload`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: bodyBuffer,
      }
    );

    const responseText = await response.text();
    console.log(`📥 Response ${response.status}: ${responseText.substring(0, 150)}`);

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errJson = JSON.parse(responseText);
        errorMsg = errJson.error?.message || errorMsg;
      } catch {}
      
      return NextResponse.json({
        error: 'Upload gagal',
        details: errorMsg,
        httpStatus: response.status,
        debug: {
          cloudName: config.cloud_name,
          apiKeyLength: config.api_key.length,
        }
      }, { status: 500 });
    }

    // Success!
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error('Invalid response');
    }

    console.log(`✅ UPLOAD SUCCESS! URL: ${result.secure_url}`);

    return NextResponse.json({
      success: true,
      message: 'File berhasil diupload!',
      url: result.secure_url || result.url,
      publicId: result.public_id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
