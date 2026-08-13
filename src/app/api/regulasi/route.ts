import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { PENGURUS_ROLES } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/cloudinary';

// GET - List all regulasi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (category && category !== 'Semua') {
      where.category = category;
    }
    
    if (status) {
      where.status = status;
    }

    const regulasiList = await prisma.regulasi.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return new NextResponse(JSON.stringify(regulasiList), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching regulasi:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Gagal mengambil data regulasi',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// POST - Create new regulasi (file already uploaded to Cloudinary)
export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/regulasi - Starting...');
    
    // Check authentication (cookie-based)
    const user = await getSession(request);
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Silakan login terlebih dahulu' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ User authenticated: ${user.name} (${user.role})`);

    // Check role (only pengurus can create)
    if (!PENGURUS_ROLES.includes(user.role)) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden - Hanya pengurus yang dapat membuat regulasi' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON body (file already uploaded to Cloudinary)
    let body;
    try {
      body = await request.json();
      console.log('✅ JSON body parsed successfully');
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON:', jsonError);
      return new NextResponse(
        JSON.stringify({ error: 'Gagal membaca data. Pastikan mengirim JSON valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract fields
    const { 
      title, 
      description, 
      category, 
      isForMemberOnly = false, 
      status: regulasiStatus = 'PUBLISHED',
      fileName,
      fileUrl,
      publicId,
      fileSize,
      mimeType = 'application/pdf'
    } = body;

    console.log(`📄 Data received: title=${title}, fileUrl=${!!fileUrl}, publicId=${publicId}`);

    // Validation
    if (!title) {
      return new NextResponse(
        JSON.stringify({ error: 'Title wajib diisi' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!fileUrl || !publicId) {
      return new NextResponse(
        JSON.stringify({ error: 'File URL dan Public ID wajib diisi (upload ke Cloudinary dulu)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create regulasi record in database with Cloudinary URL
    console.log('💾 Saving to database...');
    const regulasi = await prisma.regulasi.create({
      data: {
        title,
        description: description || null,
        category: category || 'Umum',
        fileName: fileName || 'document.pdf',
        fileUrl, // From direct Cloudinary upload
        fileSize: fileSize || 0,
        mimeType,
        publicId, // For deletion later
        status: regulasiStatus,
        isForMemberOnly,
        authorId: user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    console.log(`✅ Regulasi created: ${regulasi.id}`);

    return new NextResponse(
      JSON.stringify({
        message: 'Regulasi berhasil dibuat',
        regulasi,
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('❌ Error creating regulasi:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Gagal membuat regulasi', 
        details: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
