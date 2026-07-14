'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Maximize2, Minimize2, Upload, X, ImageIcon, CheckCircle2, Loader2, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ARTICLE_CATEGORIES } from '@/lib/store'
import { toast } from 'sonner'

interface Article {
  id: string
  title: string
  category: string
  author: string | { name: string }
  authorId: string
  status: string
  viewCount: number
  createdAt: string
  updatedAt: string
  excerpt?: string
  content?: string
  coverImage?: string
  metaTitle?: string
  metaDescription?: string
  isMemberOnly?: boolean
  pdfName?: string | null
}

const ITEMS_PER_PAGE = 10

const emptyForm = {
  title: '',
  category: 'Berita',
  status: 'DRAFT',
  excerpt: '',
  content: '',
  coverImage: '',
  metaTitle: '',
  metaDescription: '',
  isMemberOnly: false,
  pdfName: '',
  pdfData: '',
}

type ArticleForm = typeof emptyForm

function getStatusBadge(status: string) {
  switch (status) {
    case 'PUBLISHED':
      return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Dipublikasi</Badge>
    case 'DRAFT':
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">Draft</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('SEMUA')
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ArticleForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pdfUploading, setPdfUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'SEMUA') params.set('status', statusFilter)
      if (categoryFilter !== 'SEMUA') params.set('category', categoryFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', String(ITEMS_PER_PAGE))
      const res = await fetch(`/api/articles?${params}`)
      if (res.ok) {
        const data = await res.json()
        setArticles(Array.isArray(data) ? data : data.data || data.articles || [])
      }
    } catch {
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, statusFilter, page])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (article: Article) => {
    setEditingId(article.id)
    setForm({
      title: article.title,
      category: article.category,
      status: article.status || 'DRAFT',
      excerpt: article.excerpt || '',
      content: article.content || '',
      coverImage: article.coverImage || '',
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || '',
      isMemberOnly: article.isMemberOnly || false,
      pdfName: (article as any).pdfName || '',
      pdfData: '',
    })
    setDialogOpen(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, coverImage: reader.result as string }))
      toast.success('Gambar berhasil dipilih')
      setUploading(false)
    }
    reader.onerror = () => {
      toast.error('Gagal memproses gambar')
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setForm((prev) => ({ ...prev, coverImage: '' }))
  }

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Hanya file PDF yang diperbolehkan')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran PDF maksimal 10MB')
      return
    }
    setPdfUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, pdfName: file.name, pdfData: reader.result as string }))
      toast.success(`PDF "${file.name}" berhasil dipilih`)
      setPdfUploading(false)
    }
    reader.onerror = () => {
      toast.error('Gagal memproses PDF')
      setPdfUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const removePdf = () => {
    setForm((prev) => ({ ...prev, pdfName: '', pdfData: '' }))
    if (pdfInputRef.current) pdfInputRef.current.value = ''
  }

  const handleSubmit = async (submitStatus: 'DRAFT' | 'PUBLISHED') => {
    if (!form.title.trim()) {
      toast.error('Judul artikel wajib diisi')
      return
    }
    setSubmitting(true)
    try {
      const url = editingId ? `/api/articles/${editingId}` : '/api/articles'
      const method = editingId ? 'PUT' : 'POST'
      const body: any = { ...form, status: submitStatus }

      // PDF payload strategy:
      // - Create new article without PDF: send pdfData: '' so DB stores null
      // - Edit existing, new PDF uploaded: send pdfData (base64) to replace
      // - Edit existing, PDF unchanged (pdfName set, pdfData empty): don't send
      //   pdfData so existing file in DB is preserved
      // - Edit existing, PDF removed (pdfName empty, pdfData empty): send
      //   pdfData: null to clear the existing file from DB
      if (!editingId) {
        if (!body.pdfData) body.pdfData = ''
      } else {
        if (body.pdfData) {
          // new PDF uploaded → send both pdfName and pdfData, both will be applied
        } else if (body.pdfName) {
          // existing PDF kept → don't send pdfData, preserve existing in DB
          delete body.pdfData
        } else {
          // PDF removed → explicitly clear pdfData in DB
          body.pdfData = null
        }
      }

      // For PUT, include the article id (also goes in URL but API supports both)
      if (editingId) {
        Object.assign(body, { id: editingId })
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        if (submitStatus === 'PUBLISHED') {
          toast.success(editingId ? 'Artikel berhasil dipublikasi' : 'Artikel berhasil dipublikasi')
        } else {
          toast.success(editingId ? 'Artikel disimpan sebagai draft' : 'Artikel disimpan sebagai draft')
        }
        setDialogOpen(false)
        setIsFullscreen(false)
        fetchArticles()
      } else {
        // Try to extract the actual server-side error message
        let serverMsg = 'Gagal menyimpan artikel'
        try {
          const errData = await res.json()
          if (errData?.error) serverMsg = errData.error
        } catch {
          // Response body wasn't JSON — likely a framework-level error (e.g. 413 Payload Too Large)
          if (res.status === 413) {
            serverMsg = 'Ukuran file terlalu besar. Maksimal 5MB untuk gambar, 10MB untuk PDF.'
          } else if (res.status === 403) {
            serverMsg = 'Anda tidak memiliki izin untuk menyimpan artikel.'
          } else if (res.status === 401) {
            serverMsg = 'Sesi login berakhir. Silakan login ulang lalu coba lagi.'
          }
        }
        toast.error(serverMsg)
      }
    } catch (err) {
      toast.error('Gagal menyimpan artikel. Periksa koneksi internet lalu coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Artikel berhasil dihapus')
        fetchArticles()
      }
    } catch {
      toast.error('Gagal menghapus artikel')
    }
  }

  const handleTogglePublish = async (article: Article) => {
    const newStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(newStatus === 'PUBLISHED' ? 'Artikel dipublikasi' : 'Artikel dijadikan draft')
        fetchArticles()
      }
    } catch {
      toast.error('Gagal mengubah status artikel')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Artikel</h2>
          <p className="text-sm text-muted-foreground">Kelola konten artikel organisasi.</p>
        </div>
        <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold w-fit" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Artikel Baru
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul atau penulis..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Kategori</SelectItem>
                {ARTICLE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Dipublikasi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card List */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-12" /></div>
                <Skeleton className="h-8 w-full" />
              </CardContent></Card>
            ))
          ) : articles.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center text-muted-foreground">
              Tidak ada artikel ditemukan.
            </CardContent></Card>
          ) : (
            articles.map((article) => (
              <Card key={article.id} className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug flex-1">{article.title}</p>
                    {getStatusBadge(article.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{article.category}</Badge>
                    <span>{new Date(article.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>{article.viewCount ?? 0} views</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" onClick={() => openEditDialog(article)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" onClick={() => handleTogglePublish(article)}>
                      {article.status === 'PUBLISHED' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {article.status === 'PUBLISHED' ? 'Draft' : 'Publikasi'}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 gap-1.5" onClick={() => handleDelete(article.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          {/* Mobile Pagination */}
          {!loading && articles.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {articles.length} artikel
              </p>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm font-medium">{page}</span>
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={articles.length < ITEMS_PER_PAGE} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs w-10">No</TableHead>
                <TableHead className="text-xs">Judul</TableHead>
                <TableHead className="text-xs">Kategori</TableHead>
                <TableHead className="text-xs">Penulis</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Views</TableHead>
                <TableHead className="text-xs">Tanggal</TableHead>
                <TableHead className="text-xs text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Tidak ada artikel ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                articles.map((article, idx) => (
                  <TableRow key={article.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs text-muted-foreground">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                    <TableCell className="text-sm font-medium max-w-[250px] truncate">{article.title}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">{article.category}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{typeof article.author === 'string' ? article.author : article.author?.name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(article.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{article.viewCount ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(article.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(article)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleTogglePublish(article)} title={article.status === 'PUBLISHED' ? 'Jadikan Draft' : 'Publikasi'}>
                          {article.status === 'PUBLISHED' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(article.id)} title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {/* Desktop Pagination */}
          {!loading && articles.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-xs text-muted-foreground">
                Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, articles.length)} dari {articles.length}
              </p>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm font-medium">{page}</span>
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={articles.length < ITEMS_PER_PAGE} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen && !isFullscreen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setIsFullscreen(false) }}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
          onInteractOutside={(e) => { if (isFullscreen) e.preventDefault() }}
          onEscapeKeyDown={(e) => { if (isFullscreen) e.preventDefault() }}
        >
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Artikel' : 'Buat Artikel Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Judul</Label>
              <Input
                placeholder="Masukkan judul artikel"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Status selector removed — use the Publikasikan / Simpan Draft buttons below */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ringkasan</Label>
              <Textarea
                placeholder="Tulis ringkasan singkat artikel..."
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Konten</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground"
                  onClick={(e) => { e.stopPropagation(); setIsFullscreen(true) }}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Fullscreen
                </Button>
              </div>
              <Textarea
                placeholder="Tulis konten lengkap artikel..."
                rows={8}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="resize-y min-h-[200px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gambar Cover</Label>
              <div className="space-y-3">
                {form.coverImage ? (
                  <div className="relative rounded-lg overflow-hidden border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
                    <img
                      src={form.coverImage}
                      alt="Cover preview"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-green-600 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-md">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Gambar terupload
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md"
                      onClick={removeImage}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors',
                      uploading
                        ? 'border-allin-green/50 bg-allin-green/5 pointer-events-none'
                        : 'border-muted-foreground/25 hover:border-allin-green/50 hover:bg-muted/50'
                    )}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-allin-green animate-spin" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {uploading ? 'Mengupload...' : 'Ketuk untuk upload gambar'}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">Maks. 5MB — JPG, PNG, GIF, WebP</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="absolute w-px h-px p-0 -m-px overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0"
                  onChange={handleImageUpload}
                />
                {form.coverImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Ganti Gambar
                  </Button>
                )}
              </div>
            </div>
            {/* Upload PDF / Lampiran */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Lampiran PDF</Label>
                {form.category === 'Regulasi' && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                    Direkomendasikan untuk Regulasi
                  </Badge>
                )}
              </div>
              {form.category === 'Regulasi' && !form.pdfName && (
                <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md px-3 py-2">
                  💡 Untuk kategori <strong>Regulasi</strong>, sangat disarankan upload file PDF dokumen regulasi resmi agar bisa diunduh oleh pembaca.
                </p>
              )}
              {form.pdfName ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-green-500/50 bg-green-50 dark:bg-green-950/20 p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
                      <FileText className="h-4.5 w-4.5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{form.pdfName}</p>
                      <p className="text-xs text-muted-foreground">PDF terupload</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={removePdf}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors',
                    pdfUploading
                      ? 'border-allin-green/50 bg-allin-green/5 pointer-events-none'
                      : 'border-muted-foreground/25 hover:border-red-400/50 hover:bg-muted/50'
                  )}
                  onClick={() => !pdfUploading && pdfInputRef.current?.click()}
                >
                  {pdfUploading ? (
                    <Loader2 className="h-6 w-6 text-allin-green animate-spin shrink-0" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {pdfUploading ? 'Memproses PDF...' : 'Ketuk untuk upload PDF'}
                    </p>
                    <p className="text-xs text-muted-foreground">Maks. 10MB — khusus file .pdf</p>
                  </div>
                </div>
              )}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="absolute w-px h-px p-0 -m-px overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0"
                onChange={handlePdfUpload}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Meta Title (SEO)</Label>
                <Input
                  placeholder="Meta title untuk SEO"
                  value={form.metaTitle}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Meta Description (SEO)</Label>
                <Input
                  placeholder="Meta description untuk SEO"
                  value={form.metaDescription}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="memberOnly"
                checked={form.isMemberOnly}
                onCheckedChange={(checked) => setForm({ ...form, isMemberOnly: !!checked })}
              />
              <Label htmlFor="memberOnly" className="text-sm font-medium cursor-pointer">
                Khusus Anggota
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => { setDialogOpen(false); setIsFullscreen(false) }}>Batal</Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-100"
                onClick={() => handleSubmit('DRAFT')}
                disabled={submitting || !form.title.trim()}
              >
                {submitting ? 'Menyimpan...' : 'Simpan Draft'}
              </Button>
              <Button
                className="bg-green-700 hover:bg-green-800 text-white font-semibold"
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={submitting || !form.title.trim()}
              >
                {submitting ? 'Mempublikasi...' : <><Eye className="h-4 w-4 mr-1.5" /> Publikasikan</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Content Editor Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors shrink-0"
                  onClick={(e) => { e.stopPropagation(); setIsFullscreen(false) }}
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <h3 className="text-sm font-semibold truncate">Edit Konten</h3>
                <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">{form.title || 'Tanpa judul'}</Badge>
              </div>
            </div>
            {/* Fullscreen Textarea */}
            <div className="flex-1 p-3 sm:p-4 overflow-hidden">
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Tulis konten lengkap artikel di sini..."
                className="h-full w-full resize-none text-base sm:text-lg leading-relaxed rounded-lg border-0 outline-none bg-transparent p-0"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
            {/* Fullscreen Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t shrink-0 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                {form.content.length} karakter
              </p>
              <Button
                className="bg-green-700 hover:bg-green-800 text-white h-9 text-sm"
                onClick={(e) => { e.stopPropagation(); setIsFullscreen(false) }}
              >
                <Minimize2 className="h-3.5 w-3.5 mr-1.5" />
                Selesai
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}