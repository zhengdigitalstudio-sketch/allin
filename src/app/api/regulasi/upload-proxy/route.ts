import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

// ============================================
// ☁️ CLOUDINARY DIRECT REST API (TANPA SDK!)
// ============================================
// Menggunakan fetch langsung ke Cloudinary API
// Menghindari masalah config SDK

const CLOUD_CONFIG = {
  cloud_name: 'czpvpb9j',
  api_key: '256494922449866',
  api_secret: 'H8NX41ph3VSJSl5GkakrPU4DH7Q',
};

// Generate signature untuk signed upload
function generateSignature(paramsToSign: Record<string, string>, apiSecret: string): string {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(paramsToSign).sort();
  
  // Build signature string
  const sigString = sortedKeys.map(key => `${key}=${paramsToSign[key]}`).join('&');
  
  // SHA-1 hash with secret
  return crypto.createHash('sha1').update(sigString + apiSecret).digest('hex');
}

// POST - Upload via Direct REST API
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📤 Processing DIRECT REST API upload...');
    console.log(`☁️ Cloud: ${CLOUD_CONFIG.cloud_name}`);
    console.log(`🔑 API Key: ${CLOUD_CONFIG.api_key.substring(0, 6)}...`);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file' }, { status: 400 });
    }

    // Validate PDF
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Hanya PDF' }, { status: 400 });
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 20MB' }, { status: 400 });
    }

    console.log(`📄 File: ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate timestamp & signature
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const paramsToSign = {
      timestamp,
      folder: 'regulasi',
      public_id: `regulasi/${Date.now()}-${safeFileName}`,
      resource_type: 'raw',
      type: 'upload',
    };

    const signature = generateSignature(paramsToSign, CLOUD_CONFIG.api_secret);
    
    console.log(`🔐 Signature generated: ${signature.substring(0, 10)}...`);
    console.log(`⏰ Timestamp: ${timestamp}`);

    // Build multipart form data for Cloudinary
    const boundary = '----CloudinaryBoundary' + Math.random().toString(36).substring(2);
    
    let body = '';
    
    // Add fields
    for (const [key, value] of Object.entries(paramsToSign)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }
    
    // Add API key
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="api_key"\r\n\r\n`;
    body += `${CLOUD_CONFIG.api_key}\r\n`;
    
    // Add signature
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="signature"\r\n\r\n`;
    body += `${signature}\r\n`;
    
    // Add file
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${safeFileName}"\r\n`;
    body += `Content-Type: application/pdf\r\n\r\n`;
    
    const bodyBuffer = Buffer.concat([Buffer.from(body), buffer, Buffer.from(`\r\n--${boundary}--\r\n`)]);

    console.log(`📤 Sending to Cloudinary REST API...`);
    console.log(`   URL: https://api.cloudinary.com/v1_1/${CLOUD_CONFIG.cloud_name}/raw/upload`);
    console.log(`   Body size: ${bodyBuffer.length} bytes`);

    // Direct fetch to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_CONFIG.cloud_name}/raw/upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: bodyBuffer,
      }
    );

    const responseText = await response.text();
    console.log(`📥 Response status: ${response.status}`);
    console.log(`📥 Response: ${responseText.substring(0, 200)}...`);

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      let errorDetails = responseText;
      
      try {
        const errJson = JSON.parse(responseText);
        errorMsg = errJson.error?.message || errorMsg;
        errorDetails = JSON.stringify(errJson, null, 2);
      } catch {}
      
      // Detailed diagnosis for 401
      if (response.status === 401) {
        console.error('❌ AUTH FAILED');
        
        return NextResponse.json({
          error: 'Cloudinary Auth Failed (401)',
          details: errorMsg,
          debugInfo: {
            cloudName: CLOUD_CONFIG.cloud_name,
            apiKeyFull: CLOUD_CONFIG.api_key,
            apiKeyLength: CLOUD_CONFIG.api_key.length,
            apiSecretLength: CLOUD_CONFIG.api_secret?.length || 0,
            rawError: errorDetails,
          },
          fixSteps: [
            '1. Buka dashboard.cloudinary.com',
            '2. Klik Settings (pojok kanan atas)',
            '3. Pilih tab "Security" → "API Keys"',
            '4. Copy API Key yang ditampilkan (BULATkan, tanpa spasi)',
            '5. Jika perlu, generate API Key baru',
            '6. Share ke saya untuk di-update'
          ]
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'Upload gagal', 
        details: errorMsg 
      }, { status: 500 });
    }

    // Parse success response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error('Invalid response from Cloudinary');
    }

    console.log(`✅ UPLOAD BERHASIL! URL: ${result.secure_url}`);

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
    console.error('❌ Upload error:', error);
    return NextResponse.json({
      error: error.message || 'Upload error'
    }, { status: 500 });
  }
}
