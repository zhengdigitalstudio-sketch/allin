import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Proxy download file from Cloudinary (bypasses 401 error)
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    // Get regulasi from database
    const regulasi = await prisma.regulasi.findUnique({
      where: { id },
    });

    if (!regulasi) {
      return new NextResponse(
        JSON.stringify({ error: 'Regulasi tidak ditemukan' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if status is PUBLISHED
    if (regulasi.status !== 'PUBLISHED') {
      return new NextResponse(
        JSON.stringify({ error: 'Dokumen tidak tersedia untuk publik' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Increment download count
    await prisma.regulasi.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    // Fetch file from Cloudinary
    const cloudinaryUrl = regulasi.fileUrl;
    
    console.log(`📥 [DOWNLOAD-PROXY] Fetching file from Cloudinary for regulasi: ${regulasi.title}`);
    
    const response = await fetch(cloudinaryUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ALLIN-Download-Proxy/1.0',
      },
    });

    if (!response.ok) {
      console.error(`❌ [DOWNLOAD-PROXY] Cloudinary returned ${response.status}: ${response.statusText}`);
      
      // If Cloudinary fails, try with fl_attachment flag (force download)
      const attachmentUrl = cloudinaryUrl.includes('?') 
        ? `${cloudinaryUrl}&fl_attachment=${encodeURIComponent(regulasi.fileName)}`
        : `${cloudinaryUrl}?fl_attachment=${encodeURIComponent(regulasi.fileName)}`;
      
      const attachmentResponse = await fetch(attachmentUrl);
      
      if (!attachmentResponse.ok) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Gagal mengambil file dari server penyimpanan',
            details: `Cloudinary error: ${response.status}`,
            hint: 'Periksa setting Upload Preset di Cloudinary dashboard'
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Return attachment response
      const contentType = attachmentResponse.headers.get('content-type') || 'application/pdf';
      const buffer = Buffer.from(await attachmentResponse.arrayBuffer());
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${regulasi.fileName}"`,
          'Content-Length': String(buffer.length),
          'Cache-Control': 'no-cache',
          'X-Regulasi-Id': id,
        },
      });
    }

    // Get content type and buffer from successful response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());

    console.log(`✅ [DOWNLOAD-PROXY] Successfully fetched file: ${regulasi.fileName} (${buffer.length} bytes)`);

    // Return file to client with proper headers for download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${regulasi.fileName}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Regulasi-Id': id,
      },
    });

  } catch (error: any) {
    console.error('❌ [DOWNLOAD-PROXY] Error:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Gagal memproses unduhan',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
