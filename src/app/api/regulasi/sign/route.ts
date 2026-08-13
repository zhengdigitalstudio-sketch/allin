import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

// ============================================
// 🔑 CLOUDINARY SIGNATURE ENDPOINT (for client-side upload)
// ============================================
// This gives the browser permission to upload directly to Cloudinary
// Bypassing Vercel's 4.5MB limit!

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

// POST - Generate signature for DIRECT client-side upload
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = getConfig();
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      body = { fileName: 'file.pdf' };
    }
    
    const { fileName, folder = 'regulasi' } = body;

    console.log('📝 Generating signature for CLIENT-SIDE direct upload');

    // Generate timestamp & signature
    const timestamp = Math.round(Date.now() / 1000).toString();
    const safeFileName = (fileName || 'file.pdf').replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `${folder}/${Date.now()}-${safeFileName}`;

    const paramsToSign = {
      timestamp,
      folder,
      public_id: publicId,
      resource_type: 'raw',
    };

    const signature = generateSignature(paramsToSign, config.api_secret);

    console.log(`✅ Signature generated for direct upload`);

    // Return signature data for client-side upload
    return NextResponse.json({
      success: true,
      // For signed upload to Cloudinary
      signatureData: {
        signature,
        timestamp,
        apiKey: config.api_key,
        cloudName: config.cloud_name,
        params: {
          folder,
          public_id: publicId,
          resource_type: 'raw',
        },
      },
      // Upload URL where browser should POST the file
      uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloud_name}/raw/upload`,
      
      instructions: {
        method: 'POST',
        fields: [
          { name: 'file', type: 'file' },
          { name: 'api_key', value: config.api_key },
          { name: 'timestamp', value: timestamp },
          { name: 'signature', value: signature },
          { name: 'folder', value: folder },
          { name: 'public_id', value: publicId },
          { name: 'resource_type', value: 'raw' },
        ],
      },
    });

  } catch (error: any) {
    console.error('❌ Sign error:', error);
    
    return NextResponse.json({
      error: 'Gagal generate signature',
      details: error?.message
    }, { status: 500 });
  }
}
