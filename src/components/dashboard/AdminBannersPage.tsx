'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, GripVertical, ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Banner { id: string; title: string; subtitle: string | null; imageUrl: string; linkUrl: string | null; order: number; isActive: boolean }

const initialBanners: Banner[] = [
  { id: '1', title: 'Selamat Datang di ALLIN', subtitle: 'Asosiasi Lingkungan Industri Ketenagalistrikan Nasional', imageUrl: '/banner-1.jpg', linkUrl: '/tentang', order: 1, isActive: true },
  { id: '2', title: 'Bergabunglah dengan ALLIN', subtitle: 'Wujudkan ketenagalistrikan nasional yang berkelanjutan', imageUrl: '/banner-2.jpg', linkUrl: '/pendaftaran', order: 2, isActive: true },
]

export function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>(initialBanners)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '', order: 0, isActive: true })
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Judul wajib diisi'); return }
    if (editingId) { setBanners(p => p.map(b => b.id === editingId ? { ...b, ...form } : b)); toast.success('Banner diperbarui') }
    else { setBanners(p => [...p, { ...form, id: Date.now().toString() }]); toast.success('Banner ditambahkan') }
    setOpen(false); setForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', order: 0, isActive: true }); setEditingId(null)
  }

  const handleDelete = (id: string) => { if (!confirm('Hapus banner ini?')) return; setBanners(p => p.filter(b => b.id !== id)); toast.success('Dihapus') }
  const handleEdit = (b: Banner) => { setForm({ title: b.title, subtitle: b.subtitle || '', imageUrl: b.imageUrl, linkUrl: b.linkUrl || '', order: b.order, isActive: b.isActive }); setEditingId(b.id); setOpen(true) }
  const toggleActive = (id: string) => setBanners(p => p.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Manajemen Banner</h2><p className="text-muted-foreground text-sm mt-1">Kelola banner di halaman utama website</p></div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditingId(null) }}>
          <DialogTrigger asChild><Button className="bg-allin-green hover:bg-allin-green-dark text-white"><Plus className="w-4 h-4 mr-2" />Tambah Banner</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Tambah'} Banner</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Judul *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Subtitle</Label><Input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} /></div>
              <div><Label>URL Gambar</Label><Input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} /></div>
              <div><Label>Link URL</Label><Input value={form.linkUrl} onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))} /></div>
              <div><Label>Urutan</Label><Input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} /><Label>Aktif</Label></div>
              <Button onClick={handleSave} className="w-full bg-allin-green hover:bg-allin-green-dark text-white">Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {banners.length === 0 ? <Card className="p-12 text-center"><ImageIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" /><p className="text-muted-foreground">Belum ada banner.</p></Card> :
      <div className="space-y-4">
        {banners.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-allin-green to-allin-green-dark flex items-center justify-center shrink-0"><ImageIcon className="w-8 h-8 text-white/30" /></div>
                <CardContent className="p-4 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><h3 className="font-semibold text-sm">{b.title}</h3><p className="text-xs text-muted-foreground mt-0.5">{b.subtitle}</p></div>
                    <Badge variant={b.isActive ? 'default' : 'secondary'} className={b.isActive ? 'bg-allin-green text-white text-[10px]' : 'text-[10px]'}>{b.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2"><GripVertical className="w-4 h-4 text-muted-foreground/50" /><span className="text-xs text-muted-foreground">Urutan: {b.order}</span></div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(b.id)} className="h-7 text-xs">{b.isActive ? 'Nonaktifkan' : 'Aktifkan'}</Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(b)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>}
    </div>
  )
}