import { getSession, PENGURUS_ROLES } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - List all regulasi (admin) or published only (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    
    const session = await getSession(request)
    const isAdmin = session && PENGURUS_ROLES.includes(session.role || '')

    const where: any = {}
    
    // Non-admin only see published regulasi
    if (!isAdmin) {
      where.status = 'PUBLISHED'
    } else if (status && status !== 'SEMUA') {
      where.status = status
    }

    if (category && category !== 'SEMUA') {
      where.category = category
    }

    const regulasiList = await db.regulasi.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        fileSize: true,
        category: true,
        publishDate: true,
        status: true,
        downloadCount: true,
        createdAt: true,
        updatedAt: true,
        // Don't include pdfData in list to reduce payload
      }
    })

    return NextResponse.json({ regulasi: regulasiList })
  } catch (error: unknown) {
    console.error('[regulasi GET] Error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data regulasi' }, { status: 500 })
  }
}

// POST - Create new regulasi with PDF upload
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if multipart form data (PDF upload)
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle PDF upload via multipart
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const category = formData.get('category') as string
      const status = formData.get('status') as string

      if (!title?.trim()) {
        return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })
      }

      if (!file) {
        return NextResponse.json({ error: 'File PDF wajib diunggah' }, { status: 400 })
      }

      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Hanya file PDF yang diperbolehkan' }, { status: 400 })
      }

      // Max 10MB for PDF
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Ukuran PDF maksimal 10MB' }, { status: 400 })
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const regulasi = await db.regulasi.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          fileName: file.name,
          fileSize: file.size,
          pdfData: buffer,
          category: category || 'Umum',
          status: status || 'DRAFT',
          publishDate: status === 'PUBLISHED' ? new Date() : null,
          uploadedBy: session.id,
        }
      })

      return NextResponse.json({
        message: 'Regulasi berhasil dibuat',
        regulasi: {
          id: regulasi.id,
          title: regulasi.title,
          fileName: regulasi.fileName,
          status: regulasi.status,
        }
      }, { status: 201 })
    } else {
      // Handle JSON body (without PDF initially)
      const body = await request.json()
      const { title, description, category, status } = body

      if (!title?.trim()) {
        return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })
      }

      const regulasi = await db.regulasi.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          fileName: null,
          category: category || 'Umum',
          status: status || 'DRAFT',
          publishDate: status === 'PUBLISHED' ? new Date() : null,
          uploadedBy: session.id,
        }
      })

      return NextResponse.json({
        message: 'Regulasi berhasil dibuat',
        regulasi
      }, { status: 201 })
    }
  } catch (error: unknown) {
    console.error('[regulasi POST] Error:', error)
    return NextResponse.json({ error: 'Gagal membuat regulasi' }, { status: 500 })
  }
}

// PUT - Update regulasi
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Update with new PDF
      const formData = await request.formData()
      const id = formData.get('id') as string
      const file = formData.get('file') as File | null
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const category = formData.get('category') as string
      const status = formData.get('status') as string

      if (!id) {
        return NextResponse.json({ error: 'ID regulasi wajib diisi' }, { status: 400 })
      }

      const existing = await db.regulasi.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ error: 'Regulasi tidak ditemukan' }, { status: 404 })
      }

      const updateData: any = {
        title: title?.trim() || existing.title,
        description: description?.trim() || existing.description,
        category: category || existing.category,
        status: status || existing.status,
      }

      // Update publish date if publishing for first time
      if (status === 'PUBLISHED' && !existing.publishDate) {
        updateData.publishDate = new Date()
      }

      // If new PDF provided
      if (file && file.size > 0) {
        if (file.type !== 'application/pdf') {
          return NextResponse.json({ error: 'Hanya file PDF yang diperbolehkan' }, { status: 400 })
        }
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: 'Ukuran PDF maksimal 10MB' }, { status: 400 })
        }
        
        const bytes = await file.arrayBuffer()
        updateData.pdfData = Buffer.from(bytes)
        updateData.fileName = file.name
        updateData.fileSize = file.size
      }

      const updated = await db.regulasi.update({
        where: { id },
        data: updateData
      })

      return NextResponse.json({ message: 'Regulasi berhasil diperbarui', regulasi: updated })
    } else {
      // JSON update (metadata only)
      const body = await request.json()
      const { id, title, description, category, status } = body

      if (!id) {
        return NextResponse.json({ error: 'ID regulasi wajib diisi' }, { status: 400 })
      }

      const existing = await db.regulasi.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ error: 'Regulasi tidak ditemukan' }, { status: 404 })
      }

      const updateData: any = {}
      if (title !== undefined) updateData.title = title.trim()
      if (description !== undefined) updateData.description = description?.trim() || null
      if (category !== undefined) updateData.category = category
      if (status !== undefined) {
        updateData.status = status
        if (status === 'PUBLISHED' && !existing.publishDate) {
          updateData.publishDate = new Date()
        }
      }

      const updated = await db.regulasi.update({
        where: { id },
        data: updateData
      })

      return NextResponse.json({ message: 'Regulasi berhasil diperbarui', regulasi: updated })
    }
  } catch (error: unknown) {
    console.error('[regulasi PUT] Error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui regulasi' }, { status: 500 })
  }
}

// DELETE - Delete regulasi
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID regulasi wajib diisi' }, { status: 400 })
    }

    const existing = await db.regulasi.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Regulasi tidak ditemukan' }, { status: 404 })
    }

    await db.regulasi.delete({ where: { id } })

    return NextResponse.json({ message: 'Regulasi berhasil dihapus' })
  } catch (error: unknown) {
    console.error('[regulasi DELETE] Error:', error)
    return NextResponse.json({ error: 'Gagal menghapus regulasi' }, { status: 500 })
  }
}
