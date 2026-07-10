'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, ImageIcon, Loader2, Upload, X, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface GalleryItem {
  id: string; title: string; description: string | null; imageUrl: string; category: string | null; createdAt: string
}

const GALLERY_CATEGORIES = ['Kegiatan', 'Kunjungan', 'Rapat', 'Seminar', 'Workshop', 'Dokumentasi', 'Lainnya'] as const

const emptyForm = { title: '', description: '', imageUrl: '', category: '' }

export function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/gallery?limit=100')
      const data = await res.json()
      setItems(data.gallery || [])
    } catch { setItems([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan (JPG, PNG, GIF, WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB')
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, imageUrl: reader.result as string }))
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
    setForm((prev) => ({ ...prev, imageUrl: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Judul wajib diisi'); return }
    if (!form.imageUrl) { toast.error('Gambar wajib diupload'); return }
    setSaving(true)
    try {
      const url = editingId ? `/api/gallery?id=${editingId}` : '/api/gallery'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success(editingId ? 'Galeri diperbarui' : 'Galeri ditambahkan'); setOpen(false); setForm(emptyForm); setEditingId(null); fetchItems() }
      else { const d = await res.json(); toast.error(d.error || 'Gagal menyimpan') }
    } catch { toast.error('Terjadi kesalahan') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus item galeri ini?')) return
    try { await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' }); toast.success('Dihapus'); fetchItems() } catch { toast.error('Gagal menghapus') }
  }

  const handleEdit = (item: GalleryItem) => { setForm({ title: item.title, description: item.description || '', imageUrl: item.imageUrl, category: item.category || '' }); setEditingId(item.id); setOpen(true) }

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Manajemen Galeri</h2><p className="text-muted-foreground text-sm mt-1">Kelola foto dan dokumentasi kegiatan ALLIN</p></div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null) } }}>
          <DialogTrigger asChild><Button className="bg-allin-green hover:bg-allin-green-dark text-white" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Tambah Galeri</Button></DialogTrigger>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Tambah'} Galeri</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Judul *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Misal: Kegiatan Bakti Sosial 2025" /></div>
              <div><Label>Deskripsi</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Deskripsi singkat foto..." /></div>

              {/* Image Upload */}
              <div>
                <Label>Gambar *</Label>
                <div className="space-y-3 mt-1">
                  {form.imageUrl ? (
                    <div className="relative rounded-lg overflow-hidden border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover"
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
                  {form.imageUrl && (
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

              <div>
                <Label>Kategori</Label>
                <Input
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  placeholder="Kegiatan, Kunjungan, dll"
                  list="gallery-categories"
                />
                <datalist id="gallery-categories">
                  {GALLERY_CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <Button onClick={handleSave} disabled={saving || uploading} className="w-full bg-allin-green hover:bg-allin-green-dark text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div> :
      items.length === 0 ? <Card className="p-12 text-center"><ImageIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" /><p className="text-muted-foreground">Belum ada item galeri. Klik &quot;Tambah Galeri&quot; untuk menambahkan.</p></Card> :
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="overflow-hidden border-0 shadow-sm">
              <div className="h-32 bg-muted relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-allin-green to-allin-green-dark flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white/30" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                  {item.category && <Badge variant="secondary" className="text-[10px] shrink-0">{item.category}</Badge>}
                </div>
                {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-muted-foreground">{format(new Date(item.createdAt), 'dd MMM yyyy', { locale: localeId })}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>}
    </div>
  )
}
