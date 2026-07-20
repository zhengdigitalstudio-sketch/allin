import { getSession, PENGURUS_ROLES } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
// Allow large payloads for PDF uploads (base64 encoded)
export const bodySizeLimit = '50mb'

// GET - List all regulasi (public) or with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    // Check if user is authenticated (for member-only content)
    const session = await getSession(request)
    const isAuthenticated = !!session

    const where: any = {}

    // Filter by status
    if (status && status !== 'ALL') {
      where.status = status
    } else {
      where.status = 'PUBLISHED' // Default show only published
    }

    // Filter by category
    if (category && category !== 'SEMUA') {
      where.category = category
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // For non-authenticated users, hide member-only content
    // For authenticated users, show all (both public and member-only)
    if (!isAuthenticated) {
      where.isForMemberOnly = false
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
        status: true,
        isForMemberOnly: true,
        downloadCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({
      regulasi: regulasiList.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        // Don't send fileData in list
        fileData: undefined
      })),
      isAuthenticated // Let frontend know if user can see member-only items
    })
  } catch (error: unknown) {
    console.error('[regulasi GET] Error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data regulasi' }, { status: 500 })
  }
}

// POST - Create new regulasi (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Hanya admin yang bisa membuat regulasi' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, category, fileName, fileData, fileSize, mimeType, status, isForMemberOnly } = body

    console.log('[regulasi POST] creating:', {
      title,
      fileName,
      fileSize,
      hasFileData: !!fileData,
      fileDataLength: fileData?.length || 0,
      isForMemberOnly,
    })

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul dokumen wajib diisi' }, { status: 400 })
    }
    if (!fileName || !fileName.trim()) {
      return NextResponse.json({ error: 'Nama file wajib diisi' }, { status: 400 })
    }
    if (!fileData || !fileData.trim()) {
      return NextResponse.json({ error: 'File PDF wajib diupload' }, { status: 400 })
    }

    const regulasi = await db.regulasi.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: category || 'Umum',
        fileName: fileName.trim(),
        fileData: fileData,
        fileSize: fileSize || 0,
        mimeType: mimeType || 'application/pdf',
        status: status || 'PUBLISHED',
        isForMemberOnly: isForMemberOnly || false,
        authorId: session.id,
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        isForMemberOnly: true,
        createdAt: true,
      }
    })

    console.log('[regulasi POST] Success created:', regulasi.id)

    return NextResponse.json({
      success: true,
      regulasi: {
        ...regulasi,
        createdAt: regulasi.createdAt.toISOString()
      }
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('[regulasi POST] Error:', error)
    
    let errorMessage = 'Gagal membuat regulasi'
    if (error && typeof error === 'object') {
      const err = error as any
      if (err.message?.includes('too large') || err.message?.includes('size')) {
        errorMessage = 'Ukuran file terlalu besar. Maksimal 10MB.'
      } else if (err.code === 'P2002') {
        errorMessage = 'Data duplikat terdeteksi'
      } else if (err.message) {
        errorMessage = `Gagal membuat regulasi: ${err.message}`
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
