'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, Download, FileText, Upload, X, Loader2, CheckCircle2, Lock, Globe } from 'lucide-react'
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

const REGULASI_CATEGORIES = ['Umum', 'Lingkungan', 'K3', 'Teknologi', 'Hukum', 'Keuangan', 'SDM']

interface RegulasiItem {
  id: string
  title: string
  description: string | null
  category: string
  fileName: string
  fileSize: number
  mimeType: string
  status: string
  isForMemberOnly: boolean
  downloadCount: number
  createdAt: string
  author: { id: string; name: string }
}

const emptyForm = {
  title: '',
  description: '',
  category: 'Umum',
  fileName: '',
  fileData: '',
  fileSize: 0,
  status: 'PUBLISHED',
  isForMemberOnly: false,
}

type RegulasiForm = typeof emptyForm

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function AdminRegulasiPage() {
  const [regulasiList, setRegulasiList] = useState<RegulasiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('SEMUA')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RegulasiForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchRegulasi = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      // Admin can see all (including drafts)
      params.set('status', 'ALL')
      if (categoryFilter !== 'SEMUA') params.set('category', categoryFilter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/regulasi?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRegulasiList(Array.isArray(data) ? data : data.regulasi || [])
      }
    } catch (err) {
      console.error('Fetch regulasi error:', err)
      setRegulasiList([])
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  useEffect(() => {
    fetchRegulasi()
  }, [fetchRegulasi])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: RegulasiItem) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      description: item.description || '',
      category: item.category,
      fileName: item.fileName,
      fileData: '', // Don't load existing file data for edit
      fileSize: item.fileSize,
      status: item.status,
      isForMemberOnly: item.isForMemberOnly,
    })
    setDialogOpen(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('document')) {
      toast.error('Hanya file PDF yang diperbolehkan')
      return
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB')
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setForm(prev => ({
        ...prev,
        fileName: file.name,
        fileData: result,
        fileSize: file.size,
      }))
      setUploading(false)
      toast.success(`File "${file.name}" berhasil dipilih`)
    }
    reader.onerror = () => {
      toast.error('Gagal membaca file')
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const removeFile = () => {
    setForm(prev => ({ ...prev, fileName: '', fileData: '', fileSize: 0 }))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Judul dokumen wajib diisi')
      return
    }
    if (!form.fileData && !editingId) {
      toast.error('File PDF wajib diupload')
      return
    }

    setSubmitting(true)
    try {
      const url = editingId ? `/api/regulasi/${editingId}` : '/api/regulasi'
      const method = editingId ? 'PUT' : 'POST'

      const body: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        fileName: form.fileName,
        fileSize: form.fileSize,
        mimeType: 'application/pdf',
        status: form.status,
        isForMemberOnly: form.isForMemberOnly,
      }

      // Only send fileData if it's a new upload or changed
      if (form.fileData) {
        body.fileData = form.fileData
      }

      // Include ID for update
      if (editingId) {
        body.id = editingId
      }

      console.log('[AdminRegulasi] Submitting:', {
        url,
        method,
        hasFileData: !!body.fileData,
        fileDataLength: body.fileData?.length || 0,
        fileName: body.fileName,
        isForMemberOnly: body.isForMemberOnly,
      })

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('[AdminRegulasi] Error response:', data)
        throw new Error(data.error || 'Gagal menyimpan regulasi')
      }

      toast.success(editingId ? 'Regulasi berhasil diperbarui' : 'Regulasi berhasil dibuat')
      setDialogOpen(false)
      fetchRegulasi()
    } catch (error: any) {
      console.error('[AdminRegulasi] Submit error:', error)
      toast.error(error.message || 'Gagal menyimpan regulasi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus regulasi ini?')) return
    
    try {
      const res = await fetch(`/api/regulasi/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Regulasi berhasil dihapus')
        fetchRegulasi()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus')
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus regulasi')
    }
  }

  const handleDownload = async (item: RegulasiItem) => {
    try {
      const res = await fetch(`/api/regulasi/${item.id}?download=true`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = item.fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast.error('Gagal mendownload file')
      }
    } catch {
      toast.error('Gagal mendownload file')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Regulasi</h2>
          <p className="text-sm text-muted-foreground">Kelola dokumen regulasi yang dapat diunduh oleh pengunjung.</p>
        </div>
        <Button 
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold w-fit"
          onClick={openCreateDialog}
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Regulasi Baru
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari regulasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Kategori</SelectItem>
                {REGULASI_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : regulasiList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada regulasi</p>
              <p className="text-sm mt-1">Klik tombol di atas untuk upload dokumen regulasi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Judul Dokumen</TableHead>
                  <TableHead className="text-xs">Kategori</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Ukuran</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Download</TableHead>
                  <TableHead className="text-xs">Visibility</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regulasiList.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-500 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.fileName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {formatFileSize(item.fileSize)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {item.downloadCount}
                    </TableCell>
                    <TableCell>
                      {item.isForMemberOnly ? (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">
                          <Lock className="h-3 w-3 mr-1" />
                          Member Only
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                          <Globe className="h-3 w-3 mr-1" />
                          Publik
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        item.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }>
                        {item.status === 'PUBLISHED' ? 'Publikasi' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDownload(item)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(item)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(item.id)}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Regulasi' : 'Upload Regulasi Baru'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-2">
              <Label>Judul Dokumen <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Masukkan judul dokumen regulasi"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi singkat tentang dokumen ini..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Category & Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGULASI_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLISHED">Publikasikan</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Visibility Toggle - NEW FEATURE */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Visibility (Siapa yang bisa lihat?)
              </Label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={!form.isForMemberOnly}
                    onChange={() => setForm({ ...form, isForMemberOnly: false })}
                    className="w-4 h-4 text-green-600"
                  />
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      <strong>Publik</strong>
                      <span className="text-muted-foreground ml-1">(Semua orang)</span>
                    </span>
                  </div>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={form.isForMemberOnly}
                    onChange={() => setForm({ ...form, isForMemberOnly: true })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">
                      <strong>Member Only</strong>
                      <span className="text-muted-foreground ml-1">(Hanya anggota)</span>
                    </span>
                  </div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {form.isForMemberOnly 
                  ? '⚠️ Dokumen ini hanya bisa dilihat dan diunduh oleh pengguna yang sudah login sebagai anggota.'
                  : '✅ Dokumen ini bisa dilihat dan diunduh oleh semua pengunjung website.'
                }
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>File PDF {!editingId && <span className="text-red-500">*</span>}</Label>
              
              {form.fileName ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-green-500/50 bg-green-50 dark:bg-green-950/20 p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{form.fileName}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(form.fileSize)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 shrink-0"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors',
                    uploading
                      ? 'border-yellow-500/50 bg-yellow-50 pointer-events-none'
                      : 'border-muted-foreground/25 hover:border-yellow-400/50 hover:bg-muted/50'
                  )}
                  onClick={() => !uploading && document.getElementById('regulasi-file-input')?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 text-yellow-500 animate-spin shrink-0" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {uploading ? 'Memproses...' : 'Ketuk untuk upload PDF'}
                    </p>
                    <p className="text-xs text-muted-foreground">Maks. 10MB — format .pdf</p>
                  </div>
                </div>
              )}
              
              <input
                id="regulasi-file-input"
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              {editingId && !form.fileName && (
                <p className="text-xs text-amber-600">
                  💡 Kosongkan jika tidak ingin mengganti file PDF yang ada
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : editingId ? (
                  'Simpan Perubahan'
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Upload Regulasi
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminRegulasiPage
