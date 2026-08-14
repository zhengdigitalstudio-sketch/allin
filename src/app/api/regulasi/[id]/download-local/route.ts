import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { readFile, stat, access } from 'fs/promises';
import { join } from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Upload directory configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/home/z/my-project/upload';

// GET - Serve file from local filesystem (bypasses Cloudinary 401 completely!)
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    console.log(`📥 [LOCAL-DOWNLOAD] Request for regulasi ID: ${id}`);

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

    // Try to find file in local upload directory
    const fileName = regulasi.fileName;
    const filePath = join(UPLOAD_DIR, fileName);
    
    console.log(`📥 [LOCAL-DOWNLOAD] Looking for file: ${fileName}`);
    console.log(`📥 [LOCAL-DOWNLOAD] Full path: ${filePath}`);

    let fileBuffer: Buffer;
    let fileSize: number;
    
    try {
      // Check if file exists locally
      await access(filePath);
      
      // Read file from local storage
      fileBuffer = await readFile(filePath);
      fileSize = fileBuffer.length;
      
      console.log(`✅ [LOCAL-DOWNLOAD] File found locally: ${fileName} (${fileSize} bytes)`);
      
    } catch (localError) {
      console.log(`⚠️ [LOCAL-DOWNLOAD] File not found locally, trying Cloudinary URL...`);
      console.log(`   Local path: ${filePath}`);
      console.log(`   Cloudinary URL: ${regulasi.fileUrl}`);
      
      // Fallback: Fetch from Cloudinary if not found locally
      try {
        const response = await fetch(regulasi.fileUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'ALLIN-Download-Proxy/1.0' },
        });

        if (!response.ok) {
          throw new Error(`Cloudinary returned ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        fileSize = fileBuffer.length;
        
        console.log(`✅ [LOCAL-DOWNLOAD] File fetched from Cloudinary: ${fileSize} bytes`);
        
      } catch (cloudinaryError) {
        console.error(`❌ [LOCAL-DOWNLOAD] Both local and Cloudinary failed!`);
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'File tidak ditemukan',
            details: `File "${fileName}" tidak ada di server maupun Cloudinary`,
            hint: 'Hubungi admin untuk re-upload file ini'
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Increment download count
    await prisma.regulasi.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    // Determine content type
    const mimeType = regulasi.mimeType || 'application/pdf';
    
    // Return file to client with proper headers for download
    console.log(`📤 [LOCAL-DOWNLOAD] Serving file: ${regulasi.fileName} (${fileSize} bytes, ${mimeType})`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(regulasi.fileName)}"`,
        'Content-Length': String(fileSize),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Regulasi-Id': id,
        'X-Source': 'local', // Indicate source for debugging
      },
    });

  } catch (error: any) {
    console.error('❌ [LOCAL-DOWNLOAD] Error:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Gagal memproses unduhan',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } }
      );
  }
}
