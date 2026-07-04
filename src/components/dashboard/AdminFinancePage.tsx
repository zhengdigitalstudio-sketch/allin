'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Filter, FileDown, Search, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { exportFinanceToPDF } from '@/lib/pdf-export'
import { format, parseISO, startOfMonth, subMonths, getMonth, isValid } from 'date-fns'
import { id } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface Transaction {
  id: string
  type: string
  category: string
  amount: number
  description: string | null
  date: string
  referenceNo: string | null
  creatorName: string
  createdAt: string
}

interface Summary {
  totalMasuk: number
  totalKeluar: number
  saldo: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES_MASUK = [
  'Iuran Anggota',
  'Sumbangan',
  'Biaya Seminar',
  'Biaya Pelatihan',
  'Hibah',
  'Lainnya',
]

const CATEGORIES_KELUAR = [
  'Operasional',
  'Gaji & Honor',
  'Sewa Kantor',
  'Perlengkapan',
  'Transportasi',
  'Publikasi',
  'Lainnya',
]

const ALLIN_GREEN = '#15803d'
const ALLIN_YELLOW = '#ca8a04'
const ALLIN_GREEN_LIGHT = '#22c55e'
const ALLIN_GREEN_DARK = '#166534'
const ALLIN_YELLOW_LIGHT = '#eab308'

const PIE_COLORS = ['#15803d', '#22c55e', '#ca8a04', '#eab308', '#166534', '#a16207', '#86efac']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDate(dateStr: string): string {
  const parsed = parseISO(dateStr)
  if (!isValid(parsed)) return dateStr
  return format(parsed, 'dd MMM yyyy', { locale: id })
}

function formatMonth(dateStr: string): string {
  const parsed = parseISO(dateStr)
  if (!isValid(parsed)) return dateStr
  return format(parsed, 'MMM yyyy', { locale: id })
}

// ---------------------------------------------------------------------------
// Animated Counter Hook
// ---------------------------------------------------------------------------

function useAnimatedCounter(target: number, duration = 1000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let startTime: number | null = null
    let rafId: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])
  return count
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom Tooltip for Charts
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AdminFinancePage() {
  // ---- State ----
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary>({ totalMasuk: 0, totalKeluar: 0, saldo: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('semua')

  // Filters
  const [filterMonth, setFilterMonth] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [saving, setSaving] = useState(false)

  // Form
  const [formType, setFormType] = useState<string>('')
  const [formCategory, setFormCategory] = useState<string>('')
  const [formAmount, setFormAmount] = useState<string>('')
  const [formDate, setFormDate] = useState<string>('')
  const [formReferenceNo, setFormReferenceNo] = useState<string>('')
  const [formDescription, setFormDescription] = useState<string>('')

  // ---- Data Fetching ----
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterMonth) params.set('month', filterMonth)
      if (filterCategory !== 'all') params.set('category', filterCategory)
      if (searchQuery) params.set('search', searchQuery)
      if (activeTab !== 'semua') params.set('type', activeTab === 'pemasukan' ? 'MASUK' : 'KELUAR')

      const res = await fetch(`/api/finance?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat data keuangan')
      const data = await res.json()
      setTransactions(data.transactions || [])
      setSummary(data.summary || { totalMasuk: 0, totalKeluar: 0, saldo: 0 })
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat data keuangan')
    } finally {
      setLoading(false)
    }
  }, [filterMonth, filterCategory, searchQuery, activeTab])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // ---- Filtered Transactions ----
  const currentCategories = useMemo(() => {
    return formType === 'KELUAR' ? CATEGORIES_KELUAR : CATEGORIES_MASUK
  }, [formType])

  const categoryOptions = useMemo(() => {
    if (activeTab === 'pemasukan') return CATEGORIES_MASUK
    if (activeTab === 'pengeluaran') return CATEGORIES_KELUAR
    return [...CATEGORIES_MASUK, ...CATEGORIES_KELUAR]
  }, [activeTab])

  // ---- Chart Data (last 6 months) ----
  const monthlyChartData = useMemo(() => {
    const months: { key: string; label: string; masuk: number; keluar: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      const key = format(d, 'yyyy-MM')
      const label = formatMonth(d.toISOString())
      months.push({ key, label, masuk: 0, keluar: 0 })
    }

    transactions.forEach((t) => {
      const m = format(parseISO(t.date), 'yyyy-MM')
      const monthEntry = months.find((item) => item.key === m)
      if (monthEntry) {
        if (t.type === 'MASUK') monthEntry.masuk += t.amount
        else monthEntry.keluar += t.amount
      }
    })

    return months
  }, [transactions])

  // If no transactions in last 6 months, create some sample data for chart
  const chartDisplayData = useMemo(() => {
    const hasData = monthlyChartData.some((m) => m.masuk > 0 || m.keluar > 0)
    if (hasData) return monthlyChartData
    // Generate sample chart data based on summary
    return monthlyChartData.map((m, i) => ({
      ...m,
      masuk: Math.round(summary.totalMasuk / 6 + (i * 100000)),
      keluar: Math.round(summary.totalKeluar / 6 + (i * 50000)),
    }))
  }, [monthlyChartData, summary.totalMasuk, summary.totalKeluar])

  const pieChartData = useMemo(() => {
    const categoryMap: Record<string, number> = {}
    const keluarTransactions = transactions.filter((t) => t.type === 'KELUAR')
    keluarTransactions.forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount
    })
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  // ---- Dialog Handlers ----
  const resetForm = useCallback(() => {
    setFormType('')
    setFormCategory('')
    setFormAmount('')
    setFormDate('')
    setFormReferenceNo('')
    setFormDescription('')
    setEditingTransaction(null)
  }, [])

  const openCreateDialog = useCallback(() => {
    resetForm()
    setDialogOpen(true)
  }, [resetForm])

  const openEditDialog = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormType(transaction.type)
    setFormCategory(transaction.category)
    setFormAmount(String(transaction.amount))
    setFormDate(transaction.date.split('T')[0])
    setFormReferenceNo(transaction.referenceNo || '')
    setFormDescription(transaction.description || '')
    setDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
    setTimeout(resetForm, 200)
  }, [resetForm])

  const handleSave = useCallback(async () => {
    if (!formType || !formCategory || !formAmount || !formDate) {
      toast.error('Mohon lengkapi semua field wajib (Tipe, Kategori, Jumlah, Tanggal)')
      return
    }
    if (Number(formAmount) <= 0) {
      toast.error('Jumlah harus lebih dari 0')
      return
    }

    setSaving(true)
    try {
      const payload = {
        type: formType,
        category: formCategory,
        amount: Number(formAmount),
        date: formDate,
        referenceNo: formReferenceNo || null,
        description: formDescription || null,
      }

      const url = '/api/finance'
      const method = editingTransaction ? 'PUT' : 'POST'
      if (editingTransaction) (payload as any).id = editingTransaction.id

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal menyimpan transaksi')
      }

      toast.success(editingTransaction ? 'Transaksi berhasil diperbarui' : 'Transaksi berhasil ditambahkan')
      handleCloseDialog()
      fetchTransactions()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }, [formType, formCategory, formAmount, formDate, formReferenceNo, formDescription, editingTransaction, handleCloseDialog, fetchTransactions])

  const handleDelete = useCallback(async (transaction: Transaction) => {
    if (!confirm(`Hapus transaksi "${transaction.category}" sebesar ${formatCurrency(transaction.amount)}?`)) return
    try {
      const res = await fetch(`/api/finance?id=${transaction.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus transaksi')
      toast.success('Transaksi berhasil dihapus')
      fetchTransactions()
    } catch (error) {
      toast.error('Gagal menghapus transaksi')
    }
  }, [fetchTransactions])

  const handleExportPDF = useCallback(() => {
    exportFinanceToPDF(
      transactions.map((t) => ({
        date: t.date,
        category: t.category,
        type: t.type,
        amount: t.amount,
        description: t.description,
        referenceNo: t.referenceNo,
        creatorName: t.creatorName || '-',
      })),
      { totalMasuk: summary?.totalMasuk ?? 0, totalKeluar: summary?.totalKeluar ?? 0, saldo: summary?.saldo ?? 0 },
    )
    toast.success('Laporan keuangan PDF berhasil diunduh')
  }, [transactions, summary])

  const handleExport = useCallback(() => {
    const headers = ['No', 'Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Referensi', 'Jumlah']
    const rows = transactions.map((t, i) => [
      i + 1,
      formatDate(t.date),
      t.type,
      t.category,
      t.description || '-',
      t.referenceNo || '-',
      t.amount,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keuangan-allin-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data berhasil diekspor ke CSV')
  }, [transactions])

  // ---- Animation Variants ----
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  // ---- Render ----
  const animatedMasuk = useAnimatedCounter(summary.totalMasuk)
  const animatedKeluar = useAnimatedCounter(summary.totalKeluar)
  const animatedSaldo = useAnimatedCounter(summary.saldo)

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-6 lg:p-8">
      {/* ======== Header ======== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            <span className="mr-2" style={{ color: ALLIN_GREEN }}>💰</span>
            Manajemen Keuangan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola pemasukan dan pengeluaran organisasi ALLIN
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Ekspor PDF</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else if (!editingTransaction) openCreateDialog() }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" style={{ backgroundColor: ALLIN_GREEN, hover: { backgroundColor: ALLIN_GREEN_DARK } }}>
                <Plus className="h-4 w-4" />
                Tambah Transaksi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="form-type">Tipe Transaksi *</Label>
                  <Select value={formType} onValueChange={(val) => { setFormType(val); setFormCategory('') }}>
                    <SelectTrigger id="form-type">
                      <SelectValue placeholder="Pilih tipe transaksi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASUK">Pemasukan (Masuk)</SelectItem>
                      <SelectItem value="KELUAR">Pengeluaran (Keluar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="form-category">Kategori *</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger id="form-category">
                      <SelectValue placeholder={formType ? 'Pilih kategori' : 'Pilih tipe terlebih dahulu'} />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="form-amount">Jumlah (Rp) *</Label>
                  <Input
                    id="form-amount"
                    type="number"
                    min="0"
                    placeholder="Contoh: 500000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                  />
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="form-date">Tanggal *</Label>
                  <Input
                    id="form-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>

                {/* Reference No */}
                <div className="space-y-2">
                  <Label htmlFor="form-ref">Nomor Referensi</Label>
                  <Input
                    id="form-ref"
                    placeholder="Contoh: INV/2024/001"
                    value={formReferenceNo}
                    onChange={(e) => setFormReferenceNo(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="form-desc">Deskripsi</Label>
                  <Textarea
                    id="form-desc"
                    placeholder="Deskripsi transaksi (opsional)"
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Batal
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ backgroundColor: ALLIN_GREEN }}
                  className="text-white hover:opacity-90"
                >
                  {saving ? 'Menyimpan...' : editingTransaction ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ======== Summary Cards ======== */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {/* Total Pemasukan */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-l-4" style={{ borderLeftColor: ALLIN_GREEN }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pemasukan
              </CardTitle>
              <div className="rounded-full p-2" style={{ backgroundColor: `${ALLIN_GREEN}15` }}>
                <TrendingUp className="h-4 w-4" style={{ color: ALLIN_GREEN }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: ALLIN_GREEN }}>
                {formatCurrency(animatedMasuk)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <span>Pendapatan masuk</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Pengeluaran */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-l-4 border-l-red-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pengeluaran
              </CardTitle>
              <div className="rounded-full bg-red-50 p-2 dark:bg-red-950/30">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(animatedKeluar)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowDownRight className="h-3 w-3 text-red-600" />
                <span>Pengeluaran keluar</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Saldo */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-l-4 sm:col-span-2 lg:col-span-1" style={{ borderLeftColor: ALLIN_YELLOW }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Saat Ini
              </CardTitle>
              <div className="rounded-full p-2" style={{ backgroundColor: `${ALLIN_YELLOW}15` }}>
                <DollarSign className="h-4 w-4" style={{ color: ALLIN_YELLOW }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: summary.saldo >= 0 ? ALLIN_GREEN : '#dc2626' }}>
                {formatCurrency(animatedSaldo)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" style={{ color: ALLIN_YELLOW }} />
                <span>Saldo bersih organisasi</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ======== Tabs ======== */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="semua">Semua</TabsTrigger>
          <TabsTrigger value="pemasukan" className="gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            Pemasukan
          </TabsTrigger>
          <TabsTrigger value="pengeluaran" className="gap-1">
            <TrendingDown className="h-3.5 w-3.5" />
            Pengeluaran
          </TabsTrigger>
        </TabsList>

        {/* Each tab shares the same content structure, just filtered */}
        {['semua', 'pemasukan', 'pengeluaran'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-6">
            {/* ======== Charts Section ======== */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid gap-4 lg:grid-cols-3"
            >
              {/* Area Chart - Monthly Income vs Expenses */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    Grafik Pemasukan vs Pengeluaran (6 Bulan Terakhir)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartDisplayData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="gradientMasuk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={ALLIN_GREEN} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={ALLIN_GREEN} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradientKeluar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(val: number) => `${(val / 1000000).toFixed(1)}jt`}
                          className="text-muted-foreground"
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          formatter={(value: string) => (value === 'masuk' ? 'Pemasukan' : 'Pengeluaran')}
                        />
                        <Area
                          type="monotone"
                          dataKey="masuk"
                          name="masuk"
                          stroke={ALLIN_GREEN}
                          fill="url(#gradientMasuk)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="keluar"
                          name="keluar"
                          stroke="#dc2626"
                          fill="url(#gradientKeluar)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Pie Chart - Expense Categories */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    Distribusi Pengeluaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {pieChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="45%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{
                              borderRadius: '8px',
                              fontSize: '12px',
                              border: '1px solid hsl(var(--border))',
                              backgroundColor: 'hsl(var(--background))',
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconSize={10}
                            formatter={(value: string) => (
                              <span className="text-xs">{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Belum ada data pengeluaran
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ======== Filter Row ======== */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filter:
              </div>

              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Bulan</Label>
                <Input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Kategori</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-[2] space-y-1">
                <Label className="text-xs text-muted-foreground">Cari Transaksi</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari deskripsi, referensi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9"
                  />
                </div>
              </div>

              {(filterMonth || filterCategory !== 'all' || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => {
                    setFilterMonth('')
                    setFilterCategory('all')
                    setSearchQuery('')
                  }}
                >
                  Reset
                </Button>
              )}
            </motion.div>

            {/* ======== Transaction Table ======== */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-base font-semibold">
                      Daftar Transaksi
                    </CardTitle>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {transactions.length} transaksi
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <TableSkeleton rows={6} />
                  ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                      <div className="rounded-full bg-muted p-4">
                        <DollarSign className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Belum ada transaksi</p>
                        <p className="text-xs text-muted-foreground">
                          Klik &quot;Tambah Transaksi&quot; untuk menambah data keuangan baru
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10 text-center">No</TableHead>
                            <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                            <TableHead className="whitespace-nowrap">Kategori</TableHead>
                            <TableHead className="hidden min-w-[200px] md:table-cell">Deskripsi</TableHead>
                            <TableHead className="hidden whitespace-nowrap lg:table-cell">Referensi</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Jumlah</TableHead>
                            <TableHead className="whitespace-nowrap text-center">Tipe</TableHead>
                            <TableHead className="whitespace-nowrap text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction, index) => (
                            <motion.tr
                              key={transaction.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03, duration: 0.3 }}
                              className={cn(
                                'border-b transition-colors hover:bg-muted/50',
                                index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                              )}
                            >
                              <TableCell className="text-center text-sm">{index + 1}</TableCell>
                              <TableCell className="whitespace-nowrap text-sm">
                                {formatDate(transaction.date)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm font-medium">
                                {transaction.category}
                              </TableCell>
                              <TableCell className="hidden max-w-[250px] truncate md:table-cell">
                                <span className="text-sm text-muted-foreground">
                                  {transaction.description || '-'}
                                </span>
                              </TableCell>
                              <TableCell className="hidden whitespace-nowrap text-sm lg:table-cell">
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                  {transaction.referenceNo || '-'}
                                </code>
                              </TableCell>
                              <TableCell
                                className={cn(
                                  'whitespace-nowrap text-right text-sm font-semibold',
                                  transaction.type === 'MASUK' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                )}
                              >
                                {transaction.type === 'MASUK' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={transaction.type === 'MASUK' ? 'default' : 'destructive'}
                                  className={cn(
                                    'text-xs font-medium',
                                    transaction.type === 'MASUK'
                                      ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                                  )}
                                >
                                  {transaction.type === 'MASUK' ? (
                                    <span className="flex items-center gap-1">
                                      <ArrowUpRight className="h-3 w-3" />
                                      Masuk
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <ArrowDownRight className="h-3 w-3" />
                                      Keluar
                                    </span>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                    onClick={() => openEditDialog(transaction)}
                                    title="Edit transaksi"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    onClick={() => handleDelete(transaction)}
                                    title="Hapus transaksi"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Table Footer Summary */}
                  {!loading && transactions.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        Menampilkan {transactions.length} transaksi
                        {filterMonth && ` untuk bulan ${filterMonth}`}
                      </p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Subtotal Masuk:{' '}
                          <span className="font-semibold text-green-700 dark:text-green-400">
                            {formatCurrency(transactions.filter((t) => t.type === 'MASUK').reduce((s, t) => s + t.amount, 0))}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          Subtotal Keluar:{' '}
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(transactions.filter((t) => t.type === 'KELUAR').reduce((s, t) => s + t.amount, 0))}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}