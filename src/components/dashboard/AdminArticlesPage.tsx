'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Maximize2, Minimize2, Upload, X, ImageIcon, Loader2 } from 'lucide-react'
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
  status: 'DRAFT',
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
  const [submitError, setSubmitError] = useState<string | null>(null)
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
    setSubmitError(null)
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
    })
    setSubmitError(null)
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

  const handleSubmit = async (submitStatus: 'DRAFT' | 'PUBLISHED') => {
    if (!form.title.trim()) {
      toast.error('Judul artikel wajib diisi')
      return
    }

    console.log('[handleSubmit] Starting...', {
      submitStatus,
      editingId,
      title: form.title,
      category: form.category,
    })

    setSubmitting(true)
    setSubmitError(null)
    try {
      const url = editingId ? `/api/articles/${editingId}` : '/api/articles'
      const method = editingId ? 'PUT' : 'POST'

      const body: any = {
        title: form.title,
        category: form.category,
        status: submitStatus,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        isMemberOnly: form.isMemberOnly,
      }

      if (editingId) {
        Object.assign(body, { id: editingId })
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      console.log('[handleSubmit] Response received:', { status: res.status, ok: res.ok })

      if (!res.ok) {
        let serverMsg = 'Gagal menyimpan artikel'
        try {
          const errData = await res.json()
          if (errData?.error) serverMsg = errData.error
        } catch {
          if (res.status === 413) {
            serverMsg = 'Ukuran file terlalu besar. Maksimal 5MB untuk gambar cover.'
          } else if (res.status === 403) {
            serverMsg = 'Anda tidak memiliki izin untuk menyimpan artikel.'
          } else if (res.status === 401) {
            serverMsg = 'Sesi login berakhir. Silakan login ulang lalu coba lagi.'
          } else if (res.status === 400) {
            serverMsg = 'Data artikel tidak valid. Periksa kembali input Anda.'
          }
        }
        console.error('[Submit Error]', { status: res.status, message: serverMsg })
        toast.error(serverMsg)
        setSubmitError(serverMsg)
        setSubmitting(false)
        return
      }

      const data = await res.json()

      if (submitStatus === 'PUBLISHED') {
        toast.success(editingId ? 'Artikel berhasil dipublikasi' : 'Artikel berhasil dipublikasi')
      } else {
        toast.success(editingId ? 'Artikel disimpan sebagai draft' : 'Artikel disimpan sebagai draft')
      }
      setDialogOpen(false)
      setIsFullscreen(false)
      fetchArticles()
    } catch (err) {
      console.error('Submit error:', err)
      const errMsg = err instanceof Error ? err.message : 'Gagal menyimpan artikel. Periksa koneksi internet lalu coba lagi.'
      toast.error(errMsg)
      setSubmitError(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus artikel ini?')) return
    
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Artikel berhasil dihapus')
        fetchArticles()
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Gagal menghapus artikel')
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
      } else {
        toast.error('Gagal mengubah status artikel')
      }
    } catch {
      toast.error('Gagal mengubah status artikel')
    }
  }

  // Pagination
  const totalPages = Math.ceil(articles.length / ITEMS_PER_PAGE) || 1
  const paginatedArticles = articles.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

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
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Status</SelectItem>
                <SelectItem value="PUBLISHED">Dipublikasi</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Articles Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada artikel ditemukan.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Penulis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedArticles.map((article, index) => (
                    <TableRow key={article.id} className="group">
                      <TableCell className="font-medium text-muted-foreground">
                        {(page - 1) * ITEMS_PER_PAGE + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <p className="font-medium line-clamp-1">{article.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{article.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {typeof article.author === 'string' ? article.author : article.author?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(article.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{article.viewCount}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(article.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => handleTogglePublish(article)}>
                            {article.status === 'PUBLISHED' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(article)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(article.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, articles.length)} dari {articles.length} artikel
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">Halaman {page} dari {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setIsFullscreen(false) }}>
        <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isFullscreen && "max-w-full max-h-full")}>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Artikel' : 'Buat Artikel Baru'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Judul</Label>
              <Input
                id="title"
                placeholder="Masukkan judul artikel..."
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                disabled={submitting}
              />
            </div>

            {/* Category & Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))} disabled={submitting}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTICLE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex items-center space-x-6 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={form.isMemberOnly}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, isMemberOnly: !!checked }))}
                      disabled={submitting}
                    />
                    <span className="text-sm">Khusus Anggota</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Ringkasan</Label>
              <Textarea
                id="excerpt"
                placeholder="Ringkasan singkat artikel..."
                value={form.excerpt}
                onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={2}
                disabled={submitting}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Konten</Label>
                {!isFullscreen && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsFullscreen(true)}>
                    <Maximize2 className="h-4 w-4 mr-1" /> Fullscreen
                  </Button>
                )}
              </div>
              <Textarea
                id="content"
                placeholder="Tulis konten artikel di sini (mendukung HTML)..."
                value={form.content}
                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                disabled={submitting}
                className={cn(isFullscreen && "min-h-[50vh]")}
              />
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>Gambar Cover</Label>
              {form.coverImage ? (
                <div className="relative group rounded-lg overflow-hidden border">
                  <img src={form.coverImage} alt="Cover" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Ganti
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={removeImage}>
                      Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {uploading ? 'Memproses...' : 'Ketuk untuk upload gambar'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Maks. 5MB — JPG, PNG, GIF, WebP</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* SEO Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
                <Input
                  id="metaTitle"
                  placeholder="Meta title..."
                  value={form.metaTitle}
                  onChange={(e) => setForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDesc">Meta Description (SEO)</Label>
                <Input
                  id="metaDesc"
                  placeholder="Meta description..."
                  value={form.metaDescription}
                  onChange={(e) => setForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Error Display */}
            {submitError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium flex items-start gap-2">
                  <span>❌</span>
                  <span>{submitError}</span>
                </p>
                <button
                  onClick={() => setSubmitError(null)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1 underline"
                >
                  Tutup pesan error
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => { setDialogOpen(false); setIsFullscreen(false) }} disabled={submitting}>
                Batal
              </Button>
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

      {/* Fullscreen Editor Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(false)}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <span className="font-medium truncate">Editor Konten</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSubmit('DRAFT')} disabled={submitting || !form.title.trim()}>
                  Simpan Draft
                </Button>
                <Button size="sm" onClick={() => handleSubmit('PUBLISHED')} disabled={submitting || !form.title.trim()}>
                  {submitting ? 'Mempublikasi...' : 'Publikasikan'}
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <Textarea
                placeholder="Tulis konten artikel di sini..."
                value={form.content}
                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-full resize-none border-none shadow-none focus-visible:ring-0 text-base leading-relaxed"
                disabled={submitting}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
