import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface MemberRow {
  name: string
  email: string
  company: string | null
  type: string
  status: string
  phone: string | null
  city: string | null
  province: string | null
  createdAt: string
}

interface TransactionRow {
  date: string
  category: string
  type: string
  amount: number
  description: string | null
  referenceNo: string | null
  creatorName: string
}

interface FinanceSummary {
  totalMasuk: number
  totalKeluar: number
  saldo: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GREEN_HEADER = [21, 128, 61] // #15803d

function formatRupiah(amount: number): string {
  return `Rp ${Math.abs(amount).toLocaleString('id-ID')}`
}

function formatDateID(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function todayID(): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function todayFilestamp(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

/** Add the standard ALLIN header and export-date line to the document. */
function addHeader(doc: jsPDF): void {
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional', 14, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tanggal Export: ${todayID()}`, 14, 26)

  // Thin separator line
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 29, doc.internal.pageSize.getWidth() - 14, 29)
}

// ---------------------------------------------------------------------------
// Export – Members
// ---------------------------------------------------------------------------

export function exportMembersToPDF(members: MemberRow[], title?: string): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  addHeader(doc)

  // Optional custom title
  const sectionTitle = title ?? 'Data Anggota'
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(sectionTitle, 14, 36)

  const head = [['No', 'Nama', 'Email', 'Perusahaan', 'Jenis', 'Status', 'Telepon', 'Kota', 'Tgl Daftar']]

  const body = members.map((m, i) => [
    i + 1,
    m.name,
    m.email,
    m.company ?? '-',
    m.type,
    m.status,
    m.phone ?? '-',
    m.city ?? '-',
    formatDateID(m.createdAt),
  ])

  autoTable(doc, {
    startY: 40,
    head,
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: GREEN_HEADER,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 }, // No
      8: { halign: 'center', cellWidth: 28 }, // Tgl Daftar
    },
    margin: { left: 14, right: 14 },
  })

  const filename = `data-anggota-allin-${todayFilestamp()}.pdf`
  doc.save(filename)
}

// ---------------------------------------------------------------------------
// Export – Finance
// ---------------------------------------------------------------------------

export function exportFinanceToPDF(
  transactions: TransactionRow[],
  summary: FinanceSummary,
  title?: string,
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  addHeader(doc)

  const sectionTitle = title ?? 'Laporan Keuangan'
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(sectionTitle, 14, 36)

  const head = [['No', 'Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Referensi', 'Jumlah (Rp)', 'Created By']]

  const body = transactions.map((t, i) => [
    i + 1,
    formatDateID(t.date),
    t.type,
    t.category,
    t.description ?? '-',
    t.referenceNo ?? '-',
    t.type.toLowerCase() === 'masuk'
      ? `+ ${formatRupiah(t.amount)}`
      : `- ${formatRupiah(t.amount)}`,
    t.creatorName,
  ])

  autoTable(doc, {
    startY: 40,
    head,
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: GREEN_HEADER,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 }, // No
      1: { halign: 'center', cellWidth: 28 }, // Tanggal
      6: { halign: 'right', cellWidth: 34 }, // Jumlah
    },
    margin: { left: 14, right: 14 },
    didParseCell(data) {
      // Color-code amounts: green for masuk, red for keluar
      if (data.section === 'body' && data.column.index === 6) {
        const raw = String(data.cell.raw)
        if (raw.startsWith('-')) {
          data.cell.styles.textColor = [220, 38, 38] // red-600
          data.cell.styles.fontStyle = 'bold'
        } else if (raw.startsWith('+')) {
          data.cell.styles.textColor = [21, 128, 61] // #15803d
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  // ---- Summary section ----
  // We need the Y position after the transaction table
  const finalY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? doc.internal.pageSize.getHeight() - 50

  const summaryHead = [['', '']]
  const summaryBody = [
    ['Total Pemasukan', formatRupiah(summary.totalMasuk)],
    ['Total Pengeluaran', `(${formatRupiah(summary.totalKeluar)})`],
    ['Saldo', formatRupiah(summary.saldo)],
  ]

  autoTable(doc, {
    startY: finalY + 4,
    head: summaryHead,
    body: summaryBody,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: GREEN_HEADER, textColor: [255, 255, 255] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 60 },
    },
    margin: { left: 14, right: 14 },
    didParseCell(data) {
      // Highlight the Saldo row
      if (data.section === 'body' && data.row.index === 2) {
        data.cell.styles.fillColor = [240, 253, 244] // green-50
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 10
      }
    },
  })

  const filename = `laporan-keuangan-allin-${todayFilestamp()}.pdf`
  doc.save(filename)
}

// ---------------------------------------------------------------------------
// Export – Dashboard Summary
// ---------------------------------------------------------------------------

interface DashboardData {
  stats: {
    totalMembers: number
    totalArticles: number
    totalPengurus: number
    totalContacts: number
    totalAgenda: number
    totalGallery: number
    totalPendingMembers: number
  }
  recentActivities: { userName: string; action: string; description: string; createdAt: string }[]
  pendingMembers: { name: string; email: string; company: string; status: string }[]
}

export function exportDashboardToPDF(data: DashboardData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  addHeader(doc)

  // Title
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Ringkasan Dashboard ALLIN', 14, 36)

  // ── Stats Table ──
  const statsHead = [['Metrik', 'Jumlah']]
  const statsBody = [
    ['Total Anggota', String(data.stats.totalMembers)],
    ['Total Artikel', String(data.stats.totalArticles)],
    ['Total Pengurus', String(data.stats.totalPengurus)],
    ['Total Pesan Masuk', String(data.stats.totalContacts)],
    ['Total Agenda/Kegiatan', String(data.stats.totalAgenda)],
    ['Total Galeri', String(data.stats.totalGallery)],
    ['Pendaftaran Menunggu', String(data.stats.totalPendingMembers)],
  ]

  autoTable(doc, {
    startY: 42,
    head: statsHead,
    body: statsBody,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: {
      fillColor: GREEN_HEADER,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'center', cellWidth: 40 },
    },
    margin: { left: 14, right: 14 },
  })

  // ── Recent Activities ──
  const finalY1 = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 120

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Aktivitas Terbaru', 14, finalY1 + 6)

  const actHead = [['Waktu', 'Pengguna', 'Aksi', 'Deskripsi']]
  const actBody = data.recentActivities.slice(0, 10).map((a) => [
    formatDateID(a.createdAt),
    a.userName,
    a.action,
    (a.description || '-').substring(0, 60),
  ])

  autoTable(doc, {
    startY: finalY1 + 10,
    head: actHead,
    body: actBody,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: GREEN_HEADER,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35 },
      3: { cellWidth: 90 },
    },
    margin: { left: 14, right: 14 },
  })

  // ── Pending Members ──
  const finalY2 = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 200

  // Check if we need a new page
  let startY3: number
  if (finalY2 > 230) {
    doc.addPage()
    startY3 = 20
  } else {
    startY3 = finalY2 + 6
  }

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Pendaftaran Menunggu Persetujuan', 14, startY3)

  const pendHead = [['Nama', 'Email', 'Perusahaan', 'Status']]
  const pendBody = data.pendingMembers.map((m) => [
    m.name,
    m.email,
    m.company || '-',
    m.status,
  ])

  autoTable(doc, {
    startY: startY3 + 4,
    head: pendHead,
    body: pendBody,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: GREEN_HEADER,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  })

  const filename = `ringkasan-dashboard-allin-${todayFilestamp()}.pdf`
  doc.save(filename)
}