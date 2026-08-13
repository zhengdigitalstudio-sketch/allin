import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

// ============================================
// 🔐 CLOUDINARY SIGNATURE GENERATOR
// ============================================
// Manual signature generation (tanpa SDK dependency)

// Config dengan fallback
const CLOUD_CONFIG = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'czpvpb9j',
  api_key: process.env.CLOUDINARY_API_KEY || '256494922449866',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'H8NX41ph3VSJSl5GkakrPU4DH7Q',
};

// Parse CLOUDINARY_URL jika ada (format: cloudinary://api_key:api_secret@cloud_name)
function parseCloudinaryUrl(): Partial<typeof CLOUD_CONFIG> | null {
  const url = process.env.CLOUDINARY_URL;
  if (!url) return null;
  
  try {
    // Format: cloudinary://api_key:api_secret@cloud_name
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

// Get final config (env vars > CLOUDINARY_URL > fallback)
function getConfig() {
  const urlConfig = parseCloudinaryUrl();
  
  return {
    cloud_name: urlConfig?.cloud_name || CLOUD_CONFIG.cloud_name,
    api_key: urlConfig?.api_key || CLOUD_CONFIG.api_key,
    api_secret: urlConfig?.api_secret || CLOUD_CONFIG.api_secret,
  };
}

// Generate signature manually (SHA-1)
function generateSignature(paramsToSign: Record<string, any>, apiSecret: string): string {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(paramsToSign).sort();
  
  // Build signature string: key=value&key=value...
  const sigString = sortedKeys.map(key => `${key}=${paramsToSign[key]}`).join('&');
  
  console.log('📝 String to sign:', sigString);
  
  // SHA-1 hash with api_secret
  const signature = crypto.createHash('sha1').update(sigString + apiSecret).digest('hex');
  
  return signature;
}

// POST - Generate Cloudinary signature
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Silakan login' },
        { status: 401 }
      );
    }

    // Get config
    const config = getConfig();
    
    console.log('☁️ Sign Route Config:', {
      cloudName: config.cloud_name,
      apiKey: config.api_key.substring(0, 6) + '...',
      apiKeyLength: config.api_key.length,
      hasApiSecret: !!config.api_secret && config.api_secret.length > 10,
      source: process.env.CLOUDINARY_URL ? 'CLOUDINARY_URL' : 
               process.env.CLOUDINARY_CLOUD_NAME ? 'Env Vars' : 'Fallback'
    });

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = { folder: 'regulasi', fileName: 'file.pdf' };
    }
    
    const { folder = 'regulasi', fileName } = body;

    // Generate timestamp in SECONDS (Cloudinary requirement!)
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Generate unique public_id
    const safeFileName = (fileName || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `${folder}/${Date.now()}-${safeFileName}`;

    // Parameters to sign
    const paramsToSign = {
      timestamp: timestamp.toString(),
      folder: folder,
      public_id: publicId,
      resource_type: 'raw', // For PDF files
    };

    console.log('📝 Params to sign:', paramsToSign);

    // Generate signature
    const signature = generateSignature(paramsToSign, config.api_secret);

    console.log('✅ Signature generated:', signature.substring(0, 10) + '...');

    // Return signature data
    return NextResponse.json({
      success: true,
      signature: signature,
      timestamp: timestamp,
      cloudName: config.cloud_name,
      apiKey: config.api_key,
      params: {
        folder: folder,
        public_id: publicId,
        resource_type: 'raw',
      },
    });

  } catch (error: any) {
    console.error('❌ Error generating signature:', error);
    
    return NextResponse.json(
      { 
        error: 'Gagal mendapatkan signature',
        details: error?.message || 'Unknown error',
        stack: error?.stack
      },
      { status: 500 }
    );
  }
}
