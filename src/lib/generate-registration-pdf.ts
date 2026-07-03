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
    const maxPts = 45
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
  const ML = 60, MR = 60, CW = W - ML - MR
  const ops: string[] = []
  let y = H - 50

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

  // Load logo
  const logo = await getLogoJpeg()
  let logoX = 0, logoY = 0, logoW = 0, logoH = 0
  if (logo) {
    logoW = logo.w; logoH = logo.h
    logoX = (W - logoW) / 2
    logoY = y - logoH + 2
  }
  y -= (logo ? logoH + 10 : 10)

  // ── Header ──
  rg(0, 0, 0)
  txtC(W / 2, y, 'ASOSIASI LINGKUNGAN INDUSTRI KETENAGALISTRIKAN NASIONAL (ALLIN)', 11, true)
  y -= 15
  rg(0, 0, 0, true); line(ML, ML + CW, y, 0.8)
  y -= 13

  rg(80, 80, 80)
  txtC(W / 2, y, 'SEKRETARIAT : Ruko Sentra Menteng Blok MN 47 Bintaro Jaya Sektor 7', 8, false)
  y -= 11
  txtC(W / 2, y, 'Tangerang Selatan - Banten 15224', 8, false)
  y -= 20

  // ── Title ──
  rg(0, 0, 0, true); line(ML, ML + CW, y, 1.2)
  y -= 22
  rg(0, 0, 0)
  txtC(W / 2, y, 'FORMULIR KEANGGOTAAN', 14, true)
  y -= 6
  rg(80, 80, 80)
  txtC(W / 2, y, 'Dengan ini saya bermaksud mendaftar sebagai anggota ALLIN dengan data sebagai berikut:', 8.5, false)
  y -= 22

  // ── Fields ──
  rg(0, 0, 0)
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

  const colonX = ML + 115
  const valX = ML + 125

  for (let i = 0; i < fields.length; i++) {
    const [label, value] = fields[i]
    txt(ML, y, `${i + 1}.  ${label}`, 10, false)
    txt(colonX, y, ':', 10, false)
    const maxValW = ML + CW - valX
    const vLines = wrapText(value, 10, maxValW)
    txt(valX, y, vLines[0], 10, false)
    y -= 18
    for (let li = 1; li < vLines.length; li++) {
      txt(valX, y, vLines[li], 10, false)
      y -= 14
    }
  }

  y -= 8

  // ── Peraturan ──
  rg(0, 0, 0, true); line(ML, ML + CW, y, 0.8)
  y -= 16
  rg(0, 0, 0)
  txt(ML, y, 'Dengan ini menyatakan bahwa kami :', 10, true)
  y -= 18

  const rules = [
    'Untuk dan atas nama Perusahaan/Perorangan* tersebut mengajukan permintaan menjadi anggota Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN).',
    'Menaati seluruh kewajiban sebagai anggota Asosiasi sesuai dengan ketentuan yang berlaku.',
    'Menyetujui biaya pendaftaran atas nama Perusahaan sejumlah Rp. 10.000.000,- (Sepuluh Juta Rupiah) dan iuran tahunan sejumlah Rp. 2.500.000,- (Dua Juta Lima Ratus Ribu Rupiah).',
  ]

  for (let i = 0; i < rules.length; i++) {
    const rLines = wrapText(rules[i], 9, CW - 20)
    txt(ML, y, `${i + 1}.  ${rLines[0]}`, 9, false)
    y -= 13
    for (let li = 1; li < rLines.length; li++) {
      txt(ML + 18, y, rLines[li], 9, false)
      y -= 13
    }
    y -= 5
  }

  y -= 6

  // ── Signature ──
  const sigX = ML + CW - 170
  const sigEndX = ML + CW
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  rg(0, 0, 0)
  txt(sigX, y, `Tangerang Selatan, ${today}`, 10, false)
  y -= 20
  txt(sigX, y, data.position || '(Jabatan)', 10, false)
  y -= 30

  // Signature line
  rg(0, 0, 0, true); line(sigX, sigEndX, y, 0.5)
  y -= 5

  if (data.companyName) {
    txt(sigX, y, data.companyName, 10, false)
    y -= 16
  }
  txt(sigX, y, `(${data.fullName})`, 9, false)

  // ── Footer ──
  const footY = 70
  rg(120, 120, 120)
  txtC(W / 2, footY + 11, '*Pilih salah satu dengan melingkari', 7, false)
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