'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, ImageIcon, Loader2 } from 'lucide-react'
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

interface GalleryItem {
  id: string; title: string; description: string | null; imageUrl: string; category: string | null; createdAt: string
}

const emptyForm = { title: '', description: '', imageUrl: '', category: '' }

export function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/gallery?limit=100')
      const data = await res.json()
      setItems(data.gallery || [])
    } catch { setItems([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Judul wajib diisi'); return }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Manajemen Galeri</h2><p className="text-muted-foreground text-sm mt-1">Kelola foto dan dokumentasi kegiatan ALLIN</p></div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null) } }}>
          <DialogTrigger asChild><Button className="bg-allin-green hover:bg-allin-green-dark text-white"><Plus className="w-4 h-4 mr-2" />Tambah Galeri</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Tambah'} Galeri</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Judul *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Deskripsi</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <div><Label>URL Gambar</Label><Input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." /></div>
              <div><Label>Kategori</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Kegiatan, Kunjungan, dll" /></div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-allin-green hover:bg-allin-green-dark text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div> :
      items.length === 0 ? <Card className="p-12 text-center"><ImageIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" /><p className="text-muted-foreground">Belum ada item galeri.</p></Card> :
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="overflow-hidden border-0 shadow-sm"><div className="h-32 bg-gradient-to-br from-allin-green to-allin-green-dark flex items-center justify-center"><ImageIcon className="w-8 h-8 text-white/30" /></div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2"><h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>{item.category && <Badge variant="secondary" className="text-[10px] shrink-0">{item.category}</Badge>}</div>
                {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                <div className="flex items-center justify-between mt-3"><span className="text-[10px] text-muted-foreground">{format(new Date(item.createdAt), 'dd MMM yyyy', { locale: localeId })}</span>
                  <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>}
    </div>
  )
}