import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

// ============================================
// ☁️ CLOUDINARY UPLOAD PROXY v2
// ============================================

// Config
const CLOUD_CONFIG = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'czpvpb9j',
  api_key: process.env.CLOUDINARY_API_KEY || '256494922449866',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'H8NX41ph3VSJSl5GkakrPU4DH7Q',
};

// Parse CLOUDINARY_URL if exists
function parseCloudinaryUrl() {
  const url = process.env.CLOUDINARY_URL;
  if (!url) return null;
  
  try {
    const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) return { api_key: match[1], api_secret: match[2], cloud_name: match[3] };
  } catch {}
  return null;
}

function getConfig() {
  const urlConfig = parseCloudinaryUrl();
  return {
    cloud_name: urlConfig?.cloud_name || CLOUD_CONFIG.cloud_name,
    api_key: urlConfig?.api_key || CLOUD_CONFIG.api_key,
    api_secret: urlConfig?.api_secret || CLOUD_CONFIG.api_secret,
  };
}

function generateSignature(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort();
  const sigStr = sorted.map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(sigStr + secret).digest('hex');
}

// POST - Upload with timeout & better error handling
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Auth check
    const user = await getSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = getConfig();
    
    console.log('📤 [PROXY] Upload started at:', new Date().toISOString());
    console.log('📤 [PROXY] Config:', { 
      cloud: config.cloud_name, 
      keyLen: config.api_key.length,
      source: process.env.CLOUDINARY_URL ? 'URL' : process.env.CLOUDINARY_CLOUD_NAME ? 'ENV' : 'FALLBACK'
    });

    // Parse form data WITH SIZE LIMIT
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file' }, { status: 400 });
    }

    // Validate PDF
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Hanya file PDF' }, { status: 400 });
    }

    // Size validation
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: `File terlalu besar: ${(file.size/1024/1024).toFixed(1)}MB > 20MB limit` 
      }, { status: 400 });
    }

    console.log(`📄 [PROXY] File: ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`);

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`⏱️ [PROXY] Buffer ready in ${Date.now() - startTime}ms`);

    // Generate signature
    const timestamp = Math.round(Date.now() / 1000).toString();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `regulasi/${Date.now()}-${safeFileName}`;

    const paramsToSign = { timestamp, folder: 'regulasi', public_id: publicId, resource_type: 'raw' };
    const signature = generateSignature(paramsToSign, config.api_secret);

    // Build multipart body
    const boundary = '----Blob' + Math.random().toString(36).substring(2);
    
    const parts = [
      // Params
      ...Object.entries(paramsToSign).map(([k, v]) => 
        `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`
      ),
      // API Key
      `--${boundary}\r\nContent-Disposition: form-data; name="api_key"\r\n\r\n${config.api_key}\r\n`,
      // Signature
      `--${boundary}\r\nContent-Disposition: form-data; name="signature"\r\n\r\n${signature}\r\n`,
      // File header
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${safeFileName}"\r\nContent-Type: application/pdf\r\n\r\n`
    ];

    const headerBuffer = Buffer.from(parts.join(''));
    const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const bodyBuffer = Buffer.concat([headerBuffer, buffer, footerBuffer]);

    console.log(`📤 [PROXY] Uploading to Cloudinary... (${bodyBuffer.length} bytes total)`);

    // UPLOAD TO CLOUDINARY with TIMEOUT (30 seconds)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    let response: Response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloud_name}/raw/upload`,
        {
          method: 'POST',
          headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
          body: bodyBuffer,
          signal: controller.signal,
        }
      );
    } catch (fetchError: any) {
      clearTimeout(timeout);
      
      console.error('❌ [PROXY] Fetch error:', fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          error: 'Upload timeout - Cloudinary tidak merespons dalam 30 detik',
          suggestion: 'Coba file lebih kecil atau cek koneksi internet'
        }, { status: 504 }); // Gateway Timeout
      }
      
      return NextResponse.json({
        error: 'Gagal hubungi Cloudinary',
        details: fetchError.message
      }, { status: 502 });
    }
    
    clearTimeout(timeout);
    
    const responseText = await response.text();
    const elapsed = Date.now() - startTime;
    
    console.log(`📥 [PROXY] Response ${response.status} in ${elapsed}ms`);

    // Handle errors
    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      let errorDetails = responseText.substring(0, 500);
      
      try {
        const errJson = JSON.parse(responseText);
        errorMsg = errJson.error?.message || errorMsg;
      } catch {}

      console.error(`❌ [PROXY] Error: ${errorMsg}`);

      return NextResponse.json({
        error: 'Upload gagal',
        details: errorMsg,
        httpStatus: response.status,
        debug: {
          cloudName: config.cloud_name,
          elapsedMs: elapsed,
          fileSize: file.size,
        }
      }, { status: 500 });
    }

    // Success!
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error('Invalid JSON from Cloudinary');
    }

    console.log(`✅ [PROXY] SUCCESS! URL: ${result.secure_url?.substring(0, 60)}... (${elapsed}ms total)`);

    return NextResponse.json({
      success: true,
      message: 'Upload berhasil!',
      url: result.secure_url || result.url,
      publicId: result.public_id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/pdf',
      debug: { elapsedMs: elapsed },
    });

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ [PROXY] Error after ${elapsed}ms:`, error);
    
    return NextResponse.json({
      error: error.message || 'Server error',
      details: error.stack?.substring(0, 200),
      elapsedMs: elapsed,
    }, { status: 500 });
  }
}

// GET - Health check
export async function GET() {
  const config = getConfig();
  return NextResponse.json({
    status: 'ok',
    config: {
      cloudName: config.cloud_name,
      hasApiKey: !!config.api_key && config.api_key.length > 10,
      hasSecret: !!config.api_secret && config.api_secret.length > 10,
      source: process.env.CLOUDINARY_URL ? 'CLOUDINARY_URL' : 
               process.env.CLOUDINARY_CLOUD_NAME ? 'ENV_VARS' : 'FALLBACK'
    },
    timestamp: new Date().toISOString(),
  });
}
