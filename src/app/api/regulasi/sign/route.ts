import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// ============================================
// ⛔ SIGN ENDPOINT - DISABLED (v8-FIXED)
// ============================================
// This endpoint was causing issues because OLD client code
// was using signed uploads instead of unsigned presets.
// 
// We now use UNSIGNED upload preset only!
// No signature needed!

export async function POST(request: NextRequest) {
  // Auth check
  const user = await getSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ❌ RETURN ERROR - Tell client to use unsigned preset instead!
  return NextResponse.json({
    error: 'SIGN_ENDPOINT_DISABLED',
    message: 'This endpoint is disabled. Use UNSIGNED upload preset instead.',
    instructions: {
      newMethod: 'UNSIGNED_PRESET',
      presetName: 'regulasi_pdf_upload',
      fieldsToSend: ['file', 'upload_preset'],
      url: 'https://api.cloudinary.com/v1_1/czpvpb9j/raw/upload',
      note: 'Do NOT call /api/regulasi/sign anymore!'
    }
  }, { status: 410 }); // 410 Gone
}

export async function GET() {
  return NextResponse.json({
    status: 'DISABLED',
    message: 'Sign endpoint is disabled in v8-FIXED',
    reason: 'Old signed upload code was causing Invalid Signature errors',
    solution: 'Use unsigned preset "regulasi_pdf_upload" instead'
  });
}
