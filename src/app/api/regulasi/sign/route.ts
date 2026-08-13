import { NextRequest, NextResponse } from 'next/server';
import { generateSignature } from '@/lib/cloudinary';
import { getSession } from '@/lib/auth';

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

    const body = await request.json();
    const { folder = 'regulasi', fileName } = body;

    // Generate unique public_id
    const timestamp = Date.now();
    const safeFileName = (fileName || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `${folder}/${timestamp}-${safeFileName}`;

    // Parameters to sign
    const paramsToSign = {
      folder,
      public_id: publicId,
      resource_type: 'raw', // For PDF files
      type: 'upload',
      access_mode: 'public',
    };

    // Generate signature
    const { signature, timestamp: sigTimestamp } = generateSignature(paramsToSign);

    return new NextResponse(
      JSON.stringify({
        signature,
        timestamp: sigTimestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        params: paramsToSign,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error generating Cloudinary signature:', error);
    
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
