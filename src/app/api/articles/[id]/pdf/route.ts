import { NextRequest, NextResponse } from 'next/server'
import { getSession, PENGURUS_ROLES } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
// Allow large multipart uploads (PDF up to ~15MB).
// Multipart/form-data is not subject to the JSON bodySizeLimit the same way,
// but we still bump it to be safe.
export const bodySizeLimit = '20mb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    // ?download=true → force browser to download the file (Content-Disposition: attachment)
    // default (no param) → open inline in a new tab so user can preview before saving
    const forceDownload = searchParams.get('download') === 'true'

    const article = await db.article.findUnique({
      where: { id },
      select: { id: true, title: true, pdfName: true, pdfData: true, status: true, isMemberOnly: true },
    })

    if (!article || !article.pdfData) {
      return NextResponse.json({ error: 'PDF tidak ditemukan' }, { status: 404 })
    }

    // Member-only or non-published articles require login to download
    if (article.isMemberOnly || article.status !== 'PUBLISHED') {
      const session = await getSession(request)
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Parse base64 data URI
    const matches = article.pdfData.match(/^data:application\/pdf;base64,(.+)$/)
    if (!matches) {
      return NextResponse.json({ error: 'Format PDF tidak valid' }, { status: 400 })
    }

    const pdfBytes = Buffer.from(matches[1], 'base64')
    const fileName = article.pdfName || `${article.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${forceDownload ? 'attachment' : 'inline'}; filename="${fileName}"`,
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (error: any) {
    console.error('[PDF GET] error:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengunduh PDF' }, { status: 500 })
  }
}

/**
 * Upload PDF via multipart/form-data.
 * Field name: "file" (the PDF file)
 * Bypasses the JSON bodySizeLimit issue that happens when base64 PDF is
 * embedded in the article PUT/POST JSON body.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const article = await db.article.findUnique({ where: { id } })
    if (!article) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    // Only pengurus or article author can upload PDF
    const userRole = session.role || ''
    if (!PENGURUS_ROLES.includes(userRole) && article.authorId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File PDF tidak ditemukan dalam request' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Hanya file PDF yang diperbolehkan' }, { status: 400 })
    }

    // 15MB limit for PDF
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran PDF maksimal 15MB' }, { status: 413 })
    }

    // Convert to base64 data URI for DB storage (consistent with existing pattern)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const pdfData = `data:application/pdf;base64,${base64}`

    await db.article.update({
      where: { id },
      data: {
        pdfName: file.name,
        pdfData,
      },
    })

    return NextResponse.json({
      message: 'PDF berhasil diunggah',
      pdfName: file.name,
      pdfSize: file.size,
    })
  } catch (error: any) {
    console.error('[PDF POST] error:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal mengunggah PDF' },
      { status: 500 }
    )
  }
}

/**
 * Remove the attached PDF from an article.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const article = await db.article.findUnique({ where: { id } })
    if (!article) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    const userRole = session.role || ''
    if (!PENGURUS_ROLES.includes(userRole) && article.authorId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.article.update({
      where: { id },
      data: {
        pdfName: null,
        pdfData: null,
      },
    })

    return NextResponse.json({ message: 'PDF berhasil dihapus' })
  } catch (error: any) {
    console.error('[PDF DELETE] error:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus PDF' },
      { status: 500 }
    )
  }
}
