import { NextResponse } from 'next/server';

// Test endpoint to verify Cloudinary configuration
export async function GET() {
  const config = {
    hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? `${process.env.CLOUDINARY_CLOUD_NAME.substring(0, 3)}...` : 'NOT SET',
    apiKey: process.env.CLOUDINARY_API_KEY ? `${process.env.CLOUDINARY_API_KEY.substring(0, 3)}...` : 'NOT SET',
    apiSecret: process.env.CLOUDINARY_API_SECRET ? 'SET (hidden)' : 'NOT SET',
  };

  const allSet = config.hasCloudName && config.hasApiKey && config.hasApiSecret;

  return NextResponse.json({
    status: allSet ? 'OK' : 'MISSING_CONFIG',
    message: allSet 
      ? 'Cloudinary environment variables are configured' 
      : 'Missing Cloudinary environment variables!',
    config,
    nodeEnv: process.env.NODE_ENV,
  });
}
