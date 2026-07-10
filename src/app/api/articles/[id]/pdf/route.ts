import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const article = await db.article.findUnique({
      where: { id },
      select: { id: true, title: true, pdfName: true, pdfData: true },
    })

    if (!article || !article.pdfData) {
      return NextResponse.json({ error: 'PDF tidak ditemukan' }, { status: 404 })
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
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengunduh PDF' }, { status: 500 })
  }
}