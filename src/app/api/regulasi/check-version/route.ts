import { NextResponse } from 'next/server';

// Cache buster - no caching allowed!
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: 'v8-CACHE-BUST',
    timestamp: new Date().toISOString(),
    deployTime: '2026-08-14T08:02:00+07:00',
    message: 'If you see v8-CACHE-BUST, the latest code is deployed!',
    
    // Upload proxy config verification
    uploadConfig: {
      sendsSignature: false,
      sendsFolder: false,
      sendsPublicId: false,
      sendsTimestamp: false,
      onlySends: ['file', 'upload_preset'],
      presetName: 'regulasi_pdf_upload',
      mode: 'UNSIGNED'
    },
    
    instructions: {
      step1: 'If version shows v8-CACHE-BUST, deploy is successful',
      step2: 'Open Incognito window (Ctrl+Shift+N)',
      step3: 'Go to /dashboard/regulasi',
      step4: 'Click "Tambah Regulasi Baru"',
      step5: 'Look for YELLOW PULSING BADGE in dialog header',
      step6: 'Upload PDF and look for ASCII art alert'
    }
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}
