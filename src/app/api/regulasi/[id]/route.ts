import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PENGURUS_ROLES } from '@/lib/auth';

// GET single regulasi / download
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';

    const regulasi = await db.regulasi.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!regulasi) {
      return NextResponse.json(
        { error: 'Regulasi tidak ditemukan' },
        { status: 404 }
      );
    }

    // If download requested, return file as blob
    if (download) {
      // Increment download count
      await db.regulasi.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      });

      // Convert base64 to buffer
      const base64Data = regulasi.fileData.replace(/^data:\w+\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': regulasi.mimeType,
          'Content-Disposition': `attachment; filename="${regulasi.fileName}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    return NextResponse.json(regulasi);
  } catch (error) {
    console.error('Error fetching regulasi:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data regulasi' },
      { status: 500 }
    );
  }
}

// PUT - Update regulasi (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let user;
    
    try {
      const { verifyToken } = await import('@/lib/auth');
      user = verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    // Check role
    if (!PENGURUS_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: 'Hanya pengurus yang bisa mengedit regulasi' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isMemberOnly !== undefined) updateData.isMemberOnly = body.isMemberOnly;
    
    // Update file if provided
    if (body.fileName && body.fileData) {
      updateData.fileName = body.fileName;
      updateData.fileData = body.fileData;
      updateData.fileSize = body.fileSize;
      updateData.mimeType = body.mimeType || 'application/pdf';
    }

    const regulasi = await db.regulasi.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Regulasi berhasil diperbarui',
      regulasi,
    });
  } catch (error) {
    console.error('Error updating regulasi:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui regulasi' },
      { status: 500 }
    );
  }
}

// DELETE - Delete regulasi (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let user;
    
    try {
      const { verifyToken } = await import('@/lib/auth');
      user = verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    // Check role
    if (!PENGURUS_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: 'Hanya pengurus yang bisa menghapus regulasi' },
        { status: 403 }
      );
    }

    await db.regulasi.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Regulasi berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting regulasi:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus regulasi' },
      { status: 500 }
    );
  }
}
