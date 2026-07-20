import { getSession, PENGURUS_ROLES } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET single regulasi (with fileData for download)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download')

    const regulasi = await db.regulasi.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true }
        }
      }
    })

    if (!regulasi) {
      return NextResponse.json({ error: 'Regulasi tidak ditemukan' }, { status: 404 })
    }

    // Check member-only access for download
    if (regulasi.isForMemberOnly && download === 'true') {
      const session = await getSession(request)
      if (!session) {
        return NextResponse.json({ 
          error: 'Login diperlukan untuk mendownload dokumen ini' 
        }, { status: 401 })
      }
    }

    // If download requested, increment counter and return file
    if (download === 'true') {
      await db.regulasi.update({
        where: { id },
        data: { downloadCount: { increment: 1 } }
      })

      // Return the file data
      const fileData = regulasi.fileData
      let buffer: Buffer

      // Handle data URL format
      if (fileData.startsWith('data:')) {
        const base64 = fileData.split(',')[1]
        buffer = Buffer.from(base64, 'base64')
      } else {
        // Assume raw base64
        buffer = Buffer.from(fileData, 'base64')
      }

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': regulasi.mimeType || 'application/pdf',
          'Content-Disposition': `attachment; filename="${regulasi.fileName}"`,
          'Content-Length': buffer.length.toString(),
        },
      })
    }

    // Return metadata only (without file data for list view)
    return NextResponse.json({
      regulasi: {
        ...regulasi,
        createdAt: regulasi.createdAt.toISOString(),
        updatedAt: regulasi.updatedAt.toISOString(),
        fileData: undefined
      }
    })
  } catch (error: unknown) {
    console.error('[regulasi/[id] GET] Error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data regulasi' }, { status: 500 })
  }
}

// UPDATE regulasi
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, category, fileName, fileData, fileSize, mimeType, status, isForMemberOnly } = body

    // Check if exists
    const existing = await db.regulasi.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Regulasi tidak ditemukan' }, { status: 404 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (category !== undefined) updateData.category = category
    if (fileName !== undefined) updateData.fileName = fileName
    if (fileData !== undefined) updateData.fileData = fileData
    if (fileSize !== undefined) updateData.fileSize = fileSize
    if (mimeType !== undefined) updateData.mimeType = mimeType
    if (status !== undefined) updateData.status = status
    if (isForMemberOnly !== undefined) updateData.isForMemberOnly = isForMemberOnly

    const regulasi = await db.regulasi.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      regulasi: {
        ...regulasi,
        createdAt: regulasi.createdAt.toISOString(),
        updatedAt: regulasi.updatedAt.toISOString(),
        fileData: undefined
      }
    })
  } catch (error: unknown) {
    console.error('[regulasi/[id] PUT] Error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui regulasi' }, { status: 500 })
  }
}

// DELETE regulasi
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    
    // Check if exists
    const existing = await db.regulasi.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Regulasi tidak ditemukan' }, { status: 404 })
    }

    await db.regulasi.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Regulasi berhasil dihapus' })
  } catch (error: unknown) {
    console.error('[regulasi/[id] DELETE] Error:', error)
    return NextResponse.json({ error: 'Gagal menghapus regulasi' }, { status: 500 })
  }
}
