'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Search, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface SeoData { page: string; label: string; metaTitle: string; metaDescription: string; ogTitle: string; ogDescription: string }

const initialSeo: SeoData[] = [
  { page: 'home', label: 'Beranda', metaTitle: 'ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional', metaDescription: 'Organisasi profesi ketenagalistrikan nasional.', ogTitle: 'ALLIN', ogDescription: 'Asosiasi Lingkungan Industri Ketenagalistrikan Nasional' },
  { page: 'tentang', label: 'Tentang', metaTitle: 'Tentang ALLIN - Asosiasi Ketenagalistrikan Nasional', metaDescription: 'Mengenal lebih dekat ALLIN.', ogTitle: 'Tentang ALLIN', ogDescription: 'Mengenal ALLIN' },
  { page: 'artikel', label: 'Artikel', metaTitle: 'Artikel ALLIN - Berita & Informasi Ketenagalistrikan', metaDescription: 'Baca artikel terbaru dari ALLIN.', ogTitle: 'Artikel ALLIN', ogDescription: 'Berita & Informasi' },
  { page: 'agenda', label: 'Agenda', metaTitle: 'Agenda & Kegiatan ALLIN', metaDescription: 'Jadwal kegiatan ALLIN.', ogTitle: 'Agenda ALLIN', ogDescription: 'Kegiatan ALLIN' },
  { page: 'galeri', label: 'Galeri', metaTitle: 'Galeri ALLIN', metaDescription: 'Dokumentasi kegiatan ALLIN.', ogTitle: 'Galeri ALLIN', ogDescription: 'Galeri Kegiatan' },
  { page: 'kontak', label: 'Kontak', metaTitle: 'Hubungi ALLIN', metaDescription: 'Hubungi tim ALLIN.', ogTitle: 'Kontak ALLIN', ogDescription: 'Hubungi Kami' },
]

export function AdminSeoPage() {
  const [seoData, setSeoData] = useState<SeoData[]>(initialSeo)
  const [editing, setEditing] = useState<SeoData | null>(null)
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    if (!editing) return
    setSeoData(p => p.map(s => s.page === editing.page ? editing : s))
    toast.success(`SEO untuk "${editing.label}" diperbarui`)
    setOpen(false); setEditing(null)
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Pengaturan SEO</h2><p className="text-muted-foreground text-sm mt-1">Kelola meta tag SEO untuk setiap halaman website</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seoData.map((seo, i) => (
          <motion.div key={seo.page} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-allin-green" />{seo.label}<Badge variant="secondary" className="text-[10px] ml-auto">{seo.page}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Meta Title</p><p className="text-sm line-clamp-1">{seo.metaTitle}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Meta Description</p><p className="text-xs text-muted-foreground line-clamp-2">{seo.metaDescription}</p></div>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => { setEditing({ ...seo }); setOpen(true) }}><Pencil className="w-3.5 h-3.5 mr-1.5" />Edit SEO</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(null) }}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit SEO - {editing?.label}</DialogTitle></DialogHeader>
          {editing && <div className="space-y-4">
            <div><Label>Meta Title</Label><Input value={editing.metaTitle} onChange={e => setEditing({ ...editing, metaTitle: e.target.value })} /></div>
            <div><Label>Meta Description</Label><Textarea value={editing.metaDescription} onChange={e => setEditing({ ...editing, metaDescription: e.target.value })} rows={3} /></div>
            <div><Label>OG Title</Label><Input value={editing.ogTitle} onChange={e => setEditing({ ...editing, ogTitle: e.target.value })} /></div>
            <div><Label>OG Description</Label><Textarea value={editing.ogDescription} onChange={e => setEditing({ ...editing, ogDescription: e.target.value })} rows={2} /></div>
            <Button onClick={handleSave} className="w-full bg-allin-green hover:bg-allin-green-dark text-white">Simpan</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}