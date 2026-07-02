'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Maximize2, Minimize2, Upload, X, ImageIcon } from 'lucide-react'
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
}

const ITEMS_PER_PAGE = 10

const emptyForm = {
  title: '',
  category: 'Berita',
  excerpt: '',
  content: '',
  coverImage: '',
  metaTitle: '',
  metaDescription: '',
  isMemberOnly: false,
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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      excerpt: article.excerpt || '',
      content: article.content || '',
      coverImage: article.coverImage || '',
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || '',
      isMemberOnly: article.isMemberOnly || false,
    })
    setDialogOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setForm((prev) => ({ ...prev, coverImage: data.url }))
        toast.success('Gambar berhasil diupload')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Gagal mengupload gambar')
      }
    } catch {
      toast.error('Gagal mengupload gambar')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = () => {
    setForm((prev) => ({ ...prev, coverImage: '' }))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Judul artikel wajib diisi')
      return
    }
    setSubmitting(true)
    try {
      const url = editingId ? `/api/articles/${editingId}` : '/api/articles'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(editingId ? 'Artikel berhasil diperbarui' : 'Artikel berhasil dibuat')
        setDialogOpen(false)
        setIsFullscreen(false)
        fetchArticles()
      } else {
        toast.error('Gagal menyimpan artikel')
      }
    } catch {
      toast.error('Gagal menyimpan artikel')
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
                  <div className="relative rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={form.coverImage}
                      alt="Cover preview"
                      className="w-full h-40 object-cover"
                    />
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
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Ketuk untuk upload gambar</p>
                    <p className="text-xs text-muted-foreground/70">JPG, PNG, GIF, WebP (maks. 5MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
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
                    {uploading ? 'Mengupload...' : 'Ganti Gambar'}
                  </Button>
                )}
              </div>
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
                className="bg-green-700 hover:bg-green-800 text-white"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}
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