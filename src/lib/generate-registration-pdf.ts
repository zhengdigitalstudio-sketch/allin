// Zero-dependency PDF generator — formulir keanggotaan ALLIN (rapi & presis)

interface RegistrationData {
  fullName: string
  position: string
  companyName: string
  address: string
  phone: string
  email: string
  memberType: string
  reason?: string
  registrationId?: string
  registeredAt?: string
}

const MEMBER_TYPE_LABELS: Record<string, string> = {
  Perusahaan: 'Perusahaan', Profesi: 'Profesi', Asosiasi: 'Asosiasi',
  BUMN: 'BUMN', Swasta: 'Swasta', 'Perguruan Tinggi': 'Perguruan Tinggi',
  Koperasi: 'Koperasi', Perorangan: 'Perorangan',
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapText(text: string, fontSize: number, maxW: number): string[] {
  const maxC = Math.floor(maxW / (fontSize * 0.52))
  if (maxC <= 0) return [text]
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (test.length > maxC && cur) { lines.push(cur); cur = w } else { cur = test }
  }
  if (cur) lines.push(cur)
  return lines
}

async function getLogoJpeg(): Promise<{ bytes: number[]; w: number; h: number } | null> {
  try {
    const res = await fetch('/logo.png')
    const blob = await res.blob()
    const img = await createImageBitmap(blob)
    const maxPts = 40
    const scale = Math.min(maxPts / img.width, maxPts / img.height)
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    const jpgBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
    const buf = await jpgBlob.arrayBuffer()
    return { bytes: Array.from(new Uint8Array(buf)), w, h }
  } catch { return null }
}

export async function generateRegistrationPdf(data: RegistrationData): Promise<void> {
  const W = 595.28, H = 841.89
  const ML = 65, MR = 55
  const CW = W - ML - MR  // content width ~475
  const ops: string[] = []
  let y = H - 45

  // ── Helper functions ──
  const rg = (r: number, g: number, b: number, stroke = false) =>
    ops.push(`${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} ${stroke ? 'RG' : 'rg'}`)

  const txt = (x: number, yy: number, s: string, sz: number, bold: boolean) =>
    ops.push(`BT /${bold ? 'F2' : 'F1'} ${sz} Tf 1 0 0 1 ${x.toFixed(1)} ${yy.toFixed(1)} Tm (${esc(s)}) Tj ET`)

  const txtC = (cx: number, yy: number, s: string, sz: number, bold: boolean) => {
    const tw = s.length * sz * 0.52
    txt(cx - tw / 2, yy, s, sz, bold)
  }

  const line = (x1: number, x2: number, yy: number, lw: number) =>
    ops.push(`${lw} w ${x1.toFixed(1)} ${yy.toFixed(1)} m ${x2.toFixed(1)} ${yy.toFixed(1)} l S`)

  // ── Load logo ──
  const logo = await getLogoJpeg()
  let logoX = 0, logoY = 0, logoW = 0, logoH = 0
  if (logo) {
    logoW = logo.w; logoH = logo.h
    logoX = (W - logoW) / 2
    logoY = y - logoH + 2
  }
  y -= (logo ? logoH + 12 : 12)

  // ── Header: Nama Organisasi ──
  rg(0, 0, 0)
  txtC(W / 2, y, 'ASOSIASI LINGKUNGAN INDUSTRI', 12, true)
  y -= 16
  txtC(W / 2, y, 'KETENAGALISTRIKAN NASIONAL (ALLIN)', 12, true)
  y -= 6
  rg(0, 0, 0, true); line(ML, ML + CW, y, 0.6)
  y -= 12

  // ── Sekretariat ──
  rg(80, 80, 80)
  txtC(W / 2, y, 'Sekretariat : Ruko Sentra Menteng, Bintaro Jaya, Sektor VII Blok MN 47', 7.5, false)
  y -= 10
  txtC(W / 2, y, 'Pd. Jaya, Kec. Pd. Aren, Kota Tangerang Selatan, Banten 15227', 7.5, false)
  y -= 10
  txtC(W / 2, y, 'Email: asosialis.allin@gmail.com  |  Telp: +62 813-5954-5500', 7.5, false)
  y -= 18

  // ── Title ──
  rg(0, 0, 0, true); line(ML, ML + CW, y, 1.0)
  y -= 20
  rg(0, 0, 0)
  txtC(W / 2, y, 'FORMULIR KEANGGOTAAN', 13, true)
  y -= 16

  // ── Intro text ──
  rg(40, 40, 40)
  txt(ML, y, 'Dengan ini saya bermaksud mendaftar sebagai anggota ALLIN', 9.5, false)
  y -= 13
  txt(ML, y, 'dengan data sebagai berikut :', 9.5, false)
  y -= 20

  // ── Fields ──
  // Calculate colon position based on longest label
  const fields: [string, string][] = [
    ['Nama', data.fullName],
    ['Jabatan', data.position || '-'],
    ['Nama Perusahaan', data.companyName || '-'],
    ['Alamat', data.address || '-'],
    ['Telepon', data.phone || '-'],
    ['Email', data.email],
    ['Jenis Usaha', MEMBER_TYPE_LABELS[data.memberType] || data.memberType || '-'],
  ]
  if (data.reason) fields.push(['Alasan Bergabung', data.reason])

  // Colon aligns after the longest label "Nama Perusahaan" = 15 chars
  const numW = 25       // "7.  " width
  const colonX = ML + numW + 80  // fixed colon position
  const valX = colonX + 10       // value starts after colon + gap
  const lineEndX = ML + CW       // underline end

  for (let i = 0; i < fields.length; i++) {
    const [label, value] = fields[i]
    const numStr = `${i + 1}.`
    rg(0, 0, 0)

    // Number
    txt(ML, y, numStr, 10, false)
    // Label
    txt(ML + numW, y, label, 10, false)
    // Colon
    txt(colonX, y, ':', 10, false)
    // Value
    const maxValW = lineEndX - valX
    const vLines = wrapText(value, 10, maxValW)
    txt(valX, y, vLines[0], 10, false)

    // Underline for single-line fields (looks like a proper form)
    if (vLines.length <= 1) {
      rg(180, 180, 180, true); line(valX, lineEndX, y - 4, 0.3)
    }

    y -= 22

    // Multi-line values
    for (let li = 1; li < vLines.length; li++) {
      txt(valX, y, vLines[li], 10, false)
      y -= 15
    }
  }

  y -= 10

  // ── Peraturan section ──
  rg(0, 0, 0, true); line(ML, ML + CW, y, 0.8)
  y -= 18
  rg(0, 0, 0)
  txt(ML, y, 'Dengan menandatangani formulir ini, saya menyatakan bahwa :', 9.5, true)
  y -= 18

  const rules = [
    'Untuk dan atas nama Perusahaan/Perorangan* tersebut mengajukan permintaan menjadi anggota Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN).',
    'Menaati seluruh kewajiban sebagai anggota Asosiasi sesuai dengan ketentuan yang berlaku.',
    'Menyetujui biaya pendaftaran atas nama Perusahaan sejumlah Rp. 10.000.000,- (Sepuluh Juta Rupiah) dan iuran tahunan sejumlah Rp. 2.500.000,- (Dua Juta Lima Ratus Ribu Rupiah).',
  ]

  for (let i = 0; i < rules.length; i++) {
    const rLines = wrapText(rules[i], 9, CW - 25)
    txt(ML, y, `${i + 1}.  ${rLines[0]}`, 9, false)
    y -= 14
    for (let li = 1; li < rLines.length; li++) {
      txt(ML + 20, y, rLines[li], 9, false)
      y -= 14
    }
    y -= 6
  }

  y -= 10

  // ── Signature section ──
  const sigW = 200  // signature block width
  const sigX = ML + CW - sigW
  const sigEndX = ML + CW

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  rg(0, 0, 0)
  txt(sigX, y, `Tangerang Selatan, ${today}`, 9.5, false)
  y -= 22
  txt(sigX, y, data.position || '(Jabatan)', 9.5, false)
  y -= 45  // space for signature

  // Signature line
  rg(0, 0, 0, true); line(sigX, sigEndX, y, 0.6)
  y -= 16

  // Company name below line
  if (data.companyName) {
    txt(sigX, y, data.companyName, 9.5, false)
    y -= 16
  }
  // Name in parentheses
  txt(sigX, y, `(${data.fullName})`, 9, false)

  // ── Footer notes ──
  const footY = 55
  rg(120, 120, 120)
  txtC(W / 2, footY + 12, '*Pilih salah satu dengan melingkari', 7, false)
  txtC(W / 2, footY, '**Jika mendaftar sebagai perusahaan, jika sebagai perorangan cukup mengisi kolom nama', 7, false)

  // ── Build PDF binary ──
  let stream = ops.join('\n')
  let contentBytes: Uint8Array
  const hasLogo = !!logo

  if (hasLogo) {
    const imgCmd = `q ${logoW.toFixed(1)} 0 0 ${logoH.toFixed(1)} ${logoX.toFixed(1)} ${logoY.toFixed(1)} cm /Im0 Do Q\n`
    contentBytes = new TextEncoder().encode(imgCmd + stream)
  } else {
    contentBytes = new TextEncoder().encode(stream)
  }

  const parts: { offset: number; chunks: Uint8Array[] }[] = []
  const enc = new TextEncoder()
  let curOff = 0

  const addObj = (text: string) => {
    const b = enc.encode(text)
    parts.push({ offset: curOff, chunks: [b] })
    curOff += b.length
  }

  const hdr = enc.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  curOff = hdr.length

  addObj('1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n')
  addObj('2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n')

  if (hasLogo) {
    addObj(`3 0 obj\n<</Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 4 0 R /Resources <</Font <</F1 5 0 R /F2 6 0 R>> /XObject <</Im0 7 0 R>>>>>>\nendobj\n`)
  } else {
    addObj(`3 0 obj\n<</Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 4 0 R /Resources <</Font <</F1 5 0 R /F2 6 0 R>>>>>>\nendobj\n`)
  }

  addObj(`4 0 obj\n<</Length ${contentBytes.length}>>\nstream\n`)
  parts[parts.length - 1].chunks.push(contentBytes)
  curOff += contentBytes.length
  addObj('\nendstream\nendobj\n')

  addObj('5 0 obj\n<</Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding>>\nendobj\n')
  addObj('6 0 obj\n<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding>>\nendobj\n')

  if (hasLogo && logo) {
    const imgBytes = new Uint8Array(logo.bytes)
    const pre = enc.encode(`7 0 obj\n<</Type /XObject /Subtype /Image /Width ${logoW} /Height ${logoH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length}>>\nstream\n`)
    const post = enc.encode('\nendstream\nendobj\n')
    parts.push({ offset: curOff, chunks: [pre, imgBytes, post] })
    curOff += pre.length + imgBytes.length + post.length
  }

  const xrefOff = curOff
  const numObjs = hasLogo ? 8 : 7
  let xrefStr = `xref\n0 ${numObjs}\n0000000000 65535 f \n`
  for (const p of parts) {
    xrefStr += String(p.offset).padStart(10, '0') + ' 00000 n \n'
  }

  const trailer = enc.encode(`${xrefStr}trailer\n<</Size ${numObjs} /Root 1 0 R>>\nstartxref\n${xrefOff}\n%%EOF\n`)

  const totalSize = hdr.length + parts.reduce((s, p) => s + p.chunks.reduce((cs, c) => cs + c.length, 0), 0) + trailer.length
  const pdf = new Uint8Array(totalSize)
  let pos = 0
  pdf.set(hdr, pos); pos += hdr.length
  for (const p of parts) { for (const c of p.chunks) { pdf.set(c, pos); pos += c.length } }
  pdf.set(trailer, pos)

  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Formulir-Keanggotaan-ALLIN-${data.fullName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '')}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}