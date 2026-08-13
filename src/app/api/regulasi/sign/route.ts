import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getSession } from '@/lib/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST - Get Cloudinary signature for direct upload
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getSession(request);
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Silakan login terlebih dahulu' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify Cloudinary config exists
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Missing Cloudinary config:', {
        hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      });
      return new NextResponse(
        JSON.stringify({ error: 'Cloudinary tidak terkonfigurasi di server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { folder = 'regulasi', fileName } = body;

    // Generate timestamp in SECONDS (Cloudinary requirement)
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Generate unique public_id
    const safeFileName = (fileName || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `${folder}/${Date.now()}-${safeFileName}`;

    // Parameters to sign - MUST include timestamp!
    const paramsToSign = {
      timestamp: timestamp, // CRITICAL: Must be included in params to sign
      folder: folder,
      public_id: publicId,
      resource_type: 'raw', // For PDF files
    };

    console.log('📝 Generating signature with params:', {
      ...paramsToSign,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.substring(0, 3) + '...',
    });

    // Generate signature using Cloudinary SDK
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET || ''
    );

    console.log('✅ Signature generated successfully');

    return new NextResponse(
      JSON.stringify({
        signature,
        timestamp: timestamp, // Return the SAME timestamp used for signing
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        params: {
          folder: folder,
          public_id: publicId,
          resource_type: 'raw',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error generating Cloudinary signature:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Gagal generate signature',
        details: error?.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
