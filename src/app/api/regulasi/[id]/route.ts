import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { PENGURUS_ROLES } from '@/lib/auth';
import { deleteFromCloudinary, uploadPDFToCloudinary } from '@/lib/cloudinary';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single regulasi or download file
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';

    const regulasi = await prisma.regulasi.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!regulasi) {
      return new NextResponse(
        JSON.stringify({ error: 'Regulasi tidak ditemukan' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If download requested, return Cloudinary URL
    if (download) {
      // Increment download count
      await prisma.regulasi.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      });

      return new NextResponse(
        JSON.stringify({
          url: regulasi.fileUrl,
          fileName: regulasi.fileName,
          mimeType: regulasi.mimeType,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify(regulasi),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching regulasi:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Gagal mengambil data regulasi',
        details: error?.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// PUT - Update regulasi (JSON body with optional new file URL)
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const user = await getSession(request);
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!PENGURUS_ROLES.includes(user.role)) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = await context.params;
    
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return new NextResponse(
        JSON.stringify({ error: 'Gagal membaca data. Pastikan mengirim JSON valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if regulasi exists
    const existingRegulasi = await prisma.regulasi.findUnique({ where: { id } });
    if (!existingRegulasi) {
      return new NextResponse(
        JSON.stringify({ error: 'Regulasi tidak ditemukan' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract fields
    const { 
      title, 
      description, 
      category, 
      isForMemberOnly, 
      status: regulasiStatus,
      fileName,
      fileUrl,
      publicId,
      fileSize,
      mimeType
    } = body;

    // Build update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (category !== undefined) updateData.category = category;
    if (isForMemberOnly !== undefined) updateData.isForMemberOnly = isForMemberOnly;
    if (regulasiStatus !== undefined) updateData.status = regulasiStatus;

    // If new file URL provided (file re-uploaded to Cloudinary)
    if (fileUrl && publicId) {
      // Delete old file from Cloudinary
      if (existingRegulasi.publicId && existingRegulasi.publicId !== publicId) {
        try {
          await deleteFromCloudinary(existingRegulasi.publicId);
          console.log(`🗑️ Deleted old file from Cloudinary: ${existingRegulasi.publicId}`);
        } catch (deleteError) {
          console.error('Failed to delete old file from Cloudinary:', deleteError);
        }
      }

      // Update file-related fields
      updateData.fileName = fileName || existingRegulasi.fileName;
      updateData.fileUrl = fileUrl;
      updateData.fileSize = fileSize || existingRegulasi.fileSize;
      updateData.mimeType = mimeType || existingRegulasi.mimeType;
      updateData.publicId = publicId;
    }

    const updatedRegulasi = await prisma.regulasi.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    console.log(`✅ Regulasi updated: ${id}`);

    return new NextResponse(
      JSON.stringify({
        message: 'Regulasi berhasil diperbarui',
        regulasi: updatedRegulasi,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error updating regulasi:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Gagal memperbarui regulasi',
        details: error?.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// DELETE - Delete regulasi
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const user = await getSession(request);
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!PENGURUS_ROLES.includes(user.role)) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = await context.params;

    // Check if regulasi exists
    const existingRegulasi = await prisma.regulasi.findUnique({ where: { id } });
    if (!existingRegulasi) {
      return new NextResponse(
        JSON.stringify({ error: 'Regulasi tidak ditemukan' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete file from Cloudinary
    if (existingRegulasi.publicId) {
      try {
        await deleteFromCloudinary(existingRegulasi.publicId);
        console.log(`🗑️ Deleted from Cloudinary: ${existingRegulasi.publicId}`);
      } catch (deleteError) {
        console.error('Failed to delete from Cloudinary:', deleteError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete from database
    await prisma.regulasi.delete({ where: { id } });

    console.log(`🗑️ Regulasi deleted: ${id}`);

    return new NextResponse(
      JSON.stringify({
        message: 'Regulasi berhasil dihapus',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error deleting regulasi:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Gagal menghapus regulasi',
        details: error?.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
