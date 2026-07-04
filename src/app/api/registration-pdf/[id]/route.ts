import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import PDFDocument from 'pdfkit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MEMBER_TYPE_LABELS: Record<string, string> = {
  Perusahaan: 'Perusahaan',
  Profesi: 'Profesi',
  Asosiasi: 'Asosiasi',
  BUMN: 'BUMN',
  Swasta: 'Swasta',
  'Perguruan Tinggi': 'Perguruan Tinggi',
  Koperasi: 'Koperasi',
  Perorangan: 'Perorangan',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const member = await db.member.findUnique({ where: { id } })

    if (!member) {
      return NextResponse.json({ error: 'Data pendaftaran tidak ditemukan' }, { status: 404 })
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Formulir Pendaftaran Anggota ALLIN - ${member.fullName}`,
        Author: 'ALLIN',
        Subject: 'Formulir Pendaftaran Anggota',
      },
    })

    // Use built-in PDF standard fonts (Helvetica) — no external font files needed,
    // works reliably on Vercel serverless without filesystem font access.
    const FONT_REGULAR = 'Helvetica'
    const FONT_BOLD = 'Helvetica-Bold'

    const pageWidth = doc.page.width - 100 // margins
    const left = 50
    let y = 50

    // ── Header ──
    doc.font(FONT_BOLD).fontSize(16).text('FORMULIR PENDAFTARAN ANGGOTA', left, y, { width: pageWidth, align: 'center' })
    y += 20
    doc.font(FONT_BOLD).fontSize(12).text('ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional', left, y, { width: pageWidth, align: 'center' })
    y += 8
    doc.font(FONT_REGULAR).fontSize(9).text('SEKRETARIAT: Ruko Sentra Menteng, Bintaro Jaya, Sektor VII Blok MN 47, Kota Tangerang Selatan, Banten 15224', left, y, { width: pageWidth, align: 'center' })
    y += 20

    // Separator line
    doc.moveTo(left, y).lineTo(left + pageWidth, y).lineWidth(1.5).stroke('#333333')
    y += 15

    // ── Form fields ──
    const fields: [string, string][] = [
      ['Nama Lengkap', member.fullName],
      ['Jabatan / Posisi', member.position || '-'],
      ['Email', member.email],
      ['Telepon / HP', member.phone || '-'],
      ['Nama Perusahaan / Institusi', member.companyName || '-'],
      ['Institusi', member.institution || '-'],
      ['Jenis Keanggotaan', MEMBER_TYPE_LABELS[member.memberType] || member.memberType],
      ['Alamat', member.address || '-'],
      ['Kota', member.city || '-'],
      ['Provinsi', member.province || '-'],
      ['Alasan Bergabung', member.reason || '-'],
    ]

    const labelWidth = 180
    const valueWidth = pageWidth - labelWidth - 10
    const lineHeight = 22

    for (const [label, value] of fields) {
      // Check page break
      if (y + lineHeight + 40 > doc.page.height - 50) {
        doc.addPage()
        y = 50
      }

      // Draw horizontal field line
      doc.moveTo(left, y + lineHeight - 2).lineTo(left + pageWidth, y + lineHeight - 2).lineWidth(0.5).stroke('#cccccc')

      // Label
      doc.font(FONT_REGULAR).fontSize(10).fillColor('#555555')
      doc.text(label, left, y + 4, { width: labelWidth })

      // Value (right-aligned text block)
      doc.fillColor('#111111').font(FONT_BOLD).fontSize(10.5)
      doc.text(value, left + labelWidth + 10, y + 4, { width: valueWidth })

      y += lineHeight
    }

    y += 10

    // ── Signature section ──
    // Check page break
    if (y + 150 > doc.page.height - 50) {
      doc.addPage()
      y = 50
    }

    doc.moveTo(left, y).lineTo(left + pageWidth, y).lineWidth(0.5).stroke('#cccccc')
    y += 15

    // Tanda tangan pendaftar
    const sigLabelX = left
    const sigLineX = left + 200
    const sigLineEndX = sigLineX + 200

    doc.font(FONT_BOLD).fontSize(10).fillColor('#111111')
    doc.text('Tanda Tangan Pendaftar:', sigLabelX, y)
    y += 30

    // Signature dotted line
    doc.moveTo(sigLineX, y).lineTo(sigLineEndX, y).dash(3, { space: 3 }).lineWidth(0.8).stroke('#333333')
    doc.undash()
    doc.font(FONT_REGULAR).fontSize(8).fillColor('#888888')
    doc.text('(Tanda tangan di sini)', sigLineX, y + 3, { width: 200, align: 'center' })

    // Meterai placeholder (top-right of signature area)
    const meteraiX = left + pageWidth - 120
    const meteraiY = y - 35
    const meteraiSize = 70

    // Draw meterai box
    doc.rect(meteraiX, meteraiY, meteraiSize, meteraiSize).lineWidth(0.5).stroke('#999999')
    doc.font(FONT_REGULAR).fontSize(8).fillColor('#aaaaaa')
    doc.text('Tempel Meterai', meteraiX, meteraiY + meteraiSize / 2 - 5, { width: meteraiSize, align: 'center' })
    doc.text('Rp 10.000', meteraiX, meteraiY + meteraiSize / 2 + 7, { width: meteraiSize, align: 'center' })

    // Nama & tanggal
    y += 50
    doc.font(FONT_REGULAR).fontSize(10).fillColor('#111111')
    doc.text('Nama Terang:', sigLabelX, y)
    y += 15
    doc.moveTo(sigLineX, y).lineTo(sigLineEndX, y).dash(3, { space: 3 }).lineWidth(0.8).stroke('#333333')
    doc.undash()
    y += 15
    doc.text('Tanggal:', sigLabelX, y)
    y += 15
    doc.moveTo(sigLineX, y).lineTo(sigLineEndX, y).dash(3, { space: 3 }).lineWidth(0.8).stroke('#333333')
    doc.undash()

    // ── Footer ──
    const footerY = doc.page.height - 80
    doc.moveTo(left, footerY).lineTo(left + pageWidth, footerY).lineWidth(0.5).stroke('#cccccc')
    doc.font(FONT_REGULAR).fontSize(8).fillColor('#888888')
    doc.text(
      'Formulir ini harap dicetak, ditandatangani, dan ditempel meterai Rp 10.000 kemudian dikirimkan ke sekretariat ALLIN.',
      left,
      footerY + 10,
      { width: pageWidth, align: 'center' }
    )
    doc.text(
      `ID Pendaftaran: ${member.id}  |  Terdaftar: ${member.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      left,
      footerY + 24,
      { width: pageWidth, align: 'center' }
    )

    // Generate PDF buffer
    const pdfBytes = await new Promise<Buffer>((resolve, reject) => {
      const buffers: Buffer[] = []
      doc.on('data', (chunk: Buffer) => buffers.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)
      doc.end()
    })

    const safeName = member.fullName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '')
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Formulir-Pendaftaran-ALLIN-${safeName}.pdf"`,
        'Content-Length': String(pdfBytes.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: error.message || 'Gagal generate PDF' }, { status: 500 })
  }
}