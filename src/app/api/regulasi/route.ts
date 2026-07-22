import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PENGURUS_ROLES } from '@/lib/auth';

// GET - List all published regulasi (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: any = {
      status: 'PUBLISHED',
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'Semua') {
      where.category = category;
    }

    const regulasiList = await db.regulasi.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        downloadCount: true,
        isMemberOnly: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(regulasiList);
  } catch (error) {
    console.error('Error fetching regulasi:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data regulasi' },
      { status: 500 }
    );
  }
}

// POST - Create new regulasi (admin only)
export async function POST(request: NextRequest) {
  try {
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
        { error: 'Hanya pengurus yang bisa membuat regulasi' },
        { status: 403 }
      );
    }

    // Parse form data or JSON
    const contentType = request.headers.get('content-type') || '';
    
    let title, description, category, fileName, fileData, fileSize, mimeType, isMemberOnly, status;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = formData.get('title') as string;
      description = formData.get('description') as string;
      category = formData.get('category') as string;
      fileName = formData.get('fileName') as string;
      fileData = formData.get('fileData') as string;
      fileSize = parseInt(formData.get('fileSize') as string || '0');
      mimeType = formData.get('mimeType') as string || 'application/pdf';
      isMemberOnly = formData.get('isMemberOnly') === 'true';
      status = formData.get('status') as string || 'PUBLISHED';
    } else {
      const body = await request.json();
      title = body.title;
      description = body.description;
      category = body.category;
      fileName = body.fileName;
      fileData = body.fileData;
      fileSize = body.fileSize;
      mimeType = body.mimeType || 'application/pdf';
      isMemberOnly = body.isMemberOnly || false;
      status = body.status || 'PUBLISHED';
    }

    // Validation
    if (!title || !fileName || !fileData) {
      return NextResponse.json(
        { error: 'Title, fileName, dan fileData wajib diisi' },
        { status: 400 }
      );
    }

    // Check file size (max 50MB for base64 encoded)
    if (fileSize > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 50MB' },
        { status: 400 }
      );
    }

    // Create regulasi
    const regulasi = await db.regulasi.create({
      data: {
        title,
        description: description || '',
        category: category || 'Umum',
        fileName,
        fileData,
        fileSize,
        mimeType,
        isMemberOnly,
        status,
        authorId: user.id,
      },
    });

    return NextResponse.json({
      message: 'Regulasi berhasil dibuat',
      regulasi: {
        id: regulasi.id,
        title: regulasi.title,
        fileName: regulasi.fileName,
      },
    });
  } catch (error) {
    console.error('Error creating regulasi:', error);
    return NextResponse.json(
      { error: 'Gagal membuat regulasi. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

// Configure for larger payload (PDF uploads)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
};
