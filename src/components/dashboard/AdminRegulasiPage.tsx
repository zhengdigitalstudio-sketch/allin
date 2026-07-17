'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, Eye, FileText, Download, Upload, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Regulasi {
  id: string
  title: string
  description: string | null
  fileName: string | null
  fileSize: number | null
  category: string
  status: string
  downloadCount: number
  createdAt: string
  updatedAt: string
}

const REGULASI_CATEGORIES = ['Umum', 'PLN', 'Ketenagalistrikan', 'Lingkungan', 'Energi', 'Keselamatan', 'SDM']

const emptyForm = {
  title: '',
  description: '',
  category: 'Umum',
  status: 'DRAFT' as const,
}

type RegulasiForm = typeof emptyForm

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

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

export function AdminRegulasiPage() {
  const [regulasiList, setRegulasiList] = useState<Regulasi[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('SEMUA')
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RegulasiForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const fetchRegulasi = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'SEMUA') params.set('status', statusFilter)
      if (categoryFilter !== 'SEMUA') params.set('category', categoryFilter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/regulasi?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRegulasiList(Array.isArray(data) ? data : data.regulasi || [])
      }
    } catch {
      setRegulasiList([])
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, statusFilter])

  useEffect(() => {
    fetchRegulasi()
  }, [fetchRegulasi])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setSelectedFile(null)
    setSubmitError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (regulasi: Regulasi) => {
    setEditingId(regulasi.id)
    setForm({
      title: regulasi.title,
      description: regulasi.description || '',
      category: regulasi.category,
      status: regulasi.status as 'DRAFT' | 'PUBLISHED',
    })
    setSelectedFile(null)
    setSubmitError(null)
    setDialogOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file)
    toast.success(`PDF "${file.name}" dipilih`)
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Judul wajib diisi')
      return
    }

    // For new regulasi or when replacing PDF, file is required
    if (!editingId && !selectedFile) {
      toast.error('File PDF wajib diunggah')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('title', form.title.trim())
      formData.append('description', form.description)
      formData.append('category', form.category)
      formData.append('status', form.status)
      
      if (selectedFile) {
        formData.append('file', selectedFile)
      }
      
      if (editingId) {
        formData.append('id', editingId)
      }

      const url = editingId ? '/api/regulasi' : '/api/regulasi'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, { method, body: formData })

      if (!res.ok) {
        let errorMsg = 'Gagal menyimpan regulasi'
        try {
          const errData = await res.json()
          if (errData?.error) errorMsg = errData.error
        } catch {}
        
        toast.error(errorMsg)
        setSubmitError(errorMsg)
        setSubmitting(false)
        return
      }

      toast.success(editingId ? 'Regulasi berhasil diperbarui' : 'Regulasi berhasil dibuat')
      setDialogOpen(false)
      fetchRegulasi()
    } catch (err) {
      console.error('Submit error:', err)
      const errMsg = err instanceof Error ? err.message : 'Gagal menyimpan regulasi'
      toast.error(errMsg)
      setSubmitError(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus regulasi ini?')) return
    
    try {
      const res = await fetch(`/api/regulasi?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Regulasi berhasil dihapus')
        fetchRegulasi()
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Gagal menghapus regulasi')
      }
    } catch {
      toast.error('Gagal menghapus regulasi')
    }
  }

  const handleTogglePublish = async (regulasi: Regulasi) => {
    const newStatus = regulasi.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    
    try {
      const res = await fetch('/api/regulasi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: regulasi.id, status: newStatus }),
      })
      
      if (res.ok) {
        toast.success(newStatus === 'PUBLISHED' ? 'Regulasi dipublikasikan' : 'Regulasi dijadikan draft')
        fetchRegulasi()
      } else {
        toast.error('Gagal mengubah status')
      }
    } catch {
      toast.error('Gagal mengubah status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Regulasi</h2>
          <p className="text-sm text-muted-foreground">Kelola dokumen regulasi yang dapat diunduh komunitas.</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold w-fit" onClick={openCreateDialog}>
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
                placeholder="Cari judul regulasi..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); }}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Kategori</SelectItem>
                {REGULASI_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : regulasiList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada regulasi ditemukan.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Ukuran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Download</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regulasiList.map((regulasi, index) => (
                  <TableRow key={regulasi.id} className="group">
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="font-medium line-clamp-1">{regulasi.title}</p>
                        {regulasi.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{regulasi.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{regulasi.category}</Badge></TableCell>
                    <TableCell>
                      <span className="text-sm">{regulasi.fileName || '-'}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {regulasi.fileSize ? formatFileSize(regulasi.fileSize) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(regulasi.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {regulasi.downloadCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(regulasi.createdAt).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => handleTogglePublish(regulasi)}>
                          {regulasi.status === 'PUBLISHED' ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(regulasi)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(regulasi.id)}>
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
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Regulasi' : 'Upload Regulasi Baru'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Judul Dokumen *</Label>
              <Input
                id="title"
                placeholder="Contoh: Peraturan PLN No. 2024 tentang..."
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="desc">Deskripsi</Label>
              <Textarea
                id="desc"
                placeholder="Deskripsi singkat dokumen..."
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                disabled={submitting}
              />
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGULASI_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v as 'DRAFT' | 'PUBLISHED' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Publikasikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* PDF Upload */}
            <div className="space-y-2">
              <Label>File PDF {!editingId && '*'}</Label>
              
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <FileText className="h-8 w-8 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={removeSelectedFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : editingId ? (
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Kosongkan jika tidak ingin mengganti PDF
                  </p>
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm transition-colors">
                      <Upload className="h-4 w-4" />
                      Ganti PDF
                    </span>
                  </label>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Ketuk atau drag untuk upload PDF</p>
                        <p className="text-xs text-muted-foreground mt-1">Maksimal 10MB • Format .pdf</p>
                      </>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Error Display */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
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
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Batal
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                onClick={handleSubmit}
                disabled={submitting || !form.title.trim()}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin /> Menyimpan...</>
                ) : editingId ? (
                  'Simpan Perubahan'
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Upload Regulasi</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
