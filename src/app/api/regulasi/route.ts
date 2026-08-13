import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { PENGURUS_ROLES } from '@/lib/auth';
import { uploadPDFToCloudinary } from '@/lib/cloudinary';

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

    // Return with proper headers to ensure JSON response
    return new NextResponse(JSON.stringify(regulasiList), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching regulasi:', error);
    
    // Return proper JSON error response
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

// POST - Create new regulasi with Cloudinary upload
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

    let formData;
    try {
      formData = await request.formData();
      console.log('✅ FormData parsed successfully');
    } catch (formError) {
      console.error('❌ Failed to parse FormData:', formError);
      return new NextResponse(
        JSON.stringify({ error: 'Gagal membaca data form. Pastikan mengirim multipart/form-data.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const isForMemberOnly = formData.get('isForMemberOnly') === 'true';
    const status = (formData.get('status') as string) || 'PUBLISHED';
    const file = formData.get('file') as File | null;

    console.log(`📄 Form data: title=${title}, hasFile=${!!file}, fileSize=${file?.size}`);

    // Validation
    if (!title) {
      return new NextResponse(
        JSON.stringify({ error: 'Title wajib diisi' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!file || file.size === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'File PDF wajib diunggah' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return new NextResponse(
        JSON.stringify({ error: 'Hanya file PDF yang diterima' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (20MB max - optimized for Cloudinary + Vercel)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB (increased from 10MB)
    if (file.size > MAX_FILE_SIZE) {
      return new NextResponse(
        JSON.stringify({ 
          error: `Ukuran file terlalu besar. Maksimal 20MB (file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB)` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to buffer for Cloudinary upload
    console.log('📤 Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    let uploadResult;
    try {
      console.log('☁️ Uploading to Cloudinary...');
      uploadResult = await uploadPDFToCloudinary(buffer, file.name, 'regulasi');
      console.log(`✅ Cloudinary upload success: ${uploadResult.url}`);
    } catch (uploadError: any) {
      console.error('❌ Cloudinary upload error:', uploadError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Gagal mengupload file ke Cloudinary', 
          details: uploadError?.message || 'Unknown cloudinary error',
          tip: 'Pastikan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET sudah benar di environment variables'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create regulasi record in database with Cloudinary URL
    console.log('💾 Saving to database...');
    const regulasi = await prisma.regulasi.create({
      data: {
        title,
        description: description || null,
        category: category || 'Umum',
        fileName: file.name,
        fileUrl: uploadResult.url,
        fileSize: file.size,
        mimeType: file.type || 'application/pdf',
        publicId: uploadResult.publicId,
        status,
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
