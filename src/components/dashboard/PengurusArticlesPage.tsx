'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ARTICLE_CATEGORIES } from '@/lib/store'

interface Article { id: string; title: string; content: string | null; excerpt: string | null; category: string; status: string; isMemberOnly: boolean; viewCount: number; createdAt: string; publishedAt: string | null; author: { id: string; name: string } | null }

const emptyForm = { title: '', content: '', excerpt: '', category: 'Berita', status: 'DRAFT', isMemberOnly: false, metaTitle: '', metaDescription: '' }

export function PengurusArticlesPage() {
  const { user } = useAppStore()
  const userId = user?.id
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/articles?limit=100')
      if (res.ok) { const data = await res.json(); setArticles((data.articles || []).filter((a: Article) => a.author?.id === userId)) }
    } catch {} finally { setLoading(false) }
  }, [userId])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Judul wajib diisi'); return }
    setSaving(true)
    try {
      const url = editingId ? '/api/articles' : '/api/articles'
      const body = editingId ? { ...form, id: editingId } : form
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { toast.success(editingId ? 'Artikel diperbarui' : 'Artikel dibuat'); setOpen(false); setForm(emptyForm); setEditingId(null); fetchArticles() }
      else { const d = await res.json(); toast.error(d.error || 'Gagal') }
    } catch { toast.error('Terjadi kesalahan') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus artikel ini?')) return
    try { await fetch(`/api/articles?id=${id}`, { method: 'DELETE' }); toast.success('Dihapus'); fetchArticles() } catch { toast.error('Gagal menghapus') }
  }

  const handleEdit = (a: Article) => {
    setForm({ title: a.title, content: a.content || '', excerpt: a.excerpt || '', category: a.category, status: a.status, isMemberOnly: a.isMemberOnly, metaTitle: '', metaDescription: '' })
    setEditingId(a.id); setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-bold">Artikel Saya</h2><p className="text-muted-foreground text-sm mt-1">Kelola artikel yang Anda tulis</p></div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null) } }}>
          <DialogTrigger asChild><Button className="bg-allin-green hover:bg-allin-green-dark text-white"><Plus className="w-4 h-4 mr-2" />Tulis Artikel Baru</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Tulis'} Artikel</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Judul *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Konten</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={8} placeholder="Tulis konten artikel..." /></div>
              <div><Label>Ringkasan</Label><Textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Kategori</Label><Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ARTICLE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="PUBLISHED">Publikasikan</SelectItem></SelectContent></Select></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.isMemberOnly} onCheckedChange={v => setForm(p => ({ ...p, isMemberOnly: v }))} /><Label>Khusus Member</Label></div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-allin-green hover:bg-allin-green-dark text-white">{saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Menyimpan...</> : 'Simpan'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div> :
      articles.length === 0 ? <Card className="p-12 text-center"><p className="text-muted-foreground">Belum ada artikel.</p></Card> :
      <div className="space-y-3">
        {articles.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge variant={a.status === 'PUBLISHED' ? 'default' : 'secondary'} className={a.status === 'PUBLISHED' ? 'bg-allin-green text-white text-[10px]' : 'text-[10px]'}>{a.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                    {a.isMemberOnly && <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-200">Member Only</Badge>}
                    <span className="text-xs text-muted-foreground">{format(new Date(a.createdAt), 'dd MMM yyyy', { locale: localeId })}</span>
                    <span className="text-xs text-muted-foreground"><Eye className="w-3 h-3 inline mr-0.5" />{a.viewCount}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>}
    </div>
  )
}