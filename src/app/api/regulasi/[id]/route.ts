import { getSession, PENGURUS_ROLES } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Download PDF for a specific regulasi
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === 'true'

    // Get regulasi with PDF data
    const regulasi = await db.regulasi.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        fileName: true,
        pdfData: true,
        status: true,
      }
    })

    if (!regulasi) {
      return NextResponse.json({ error: 'Regulasi tidak ditemukan' }, { status: 404 })
    }

    if (!regulasi.pdfData) {
      return NextResponse.json({ error: 'PDF tidak tersedia untuk regulasi ini' }, { status: 404 })
    }

    // Check access for non-published regulasi
    if (regulasi.status !== 'PUBLISHED') {
      const session = await getSession(request)
      if (!session || !PENGURUS_ROLES.includes(session.role || '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Increment download count
    await db.regulasi.update({
      where: { id },
      data: { downloadCount: { increment: 1 } }
    })

    // Return PDF file
    const fileName = regulasi.fileName || `${regulasi.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    
    return new NextResponse(regulasi.pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${fileName}"`,
        'Content-Length': regulasi.pdfData.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: unknown) {
    console.error('[regulasi/[id] GET] Error:', error)
    return NextResponse.json({ error: 'Gagal mengunduh PDF' }, { status: 500 })
  }
}
