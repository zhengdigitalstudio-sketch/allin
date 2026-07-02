'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
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
import { toast } from 'sonner'

interface AgendaItem {
  id: string
  title: string
  description: string
  date: string
  location: string
  status: string
  isInternal: boolean
  createdAt: string
}

const ITEMS_PER_PAGE = 10

const AGENDA_STATUSES = ['AKTIF', 'SELESAI', 'DIBATALKAN']

const emptyForm = {
  title: '',
  description: '',
  date: '',
  location: '',
  isInternal: false,
  status: 'AKTIF',
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'AKTIF':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Aktif</Badge>
    case 'SELESAI':
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">Selesai</Badge>
    case 'DIBATALKAN':
      return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Dibatalkan</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function AdminAgendaPage() {
  const [agendas, setAgendas] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchAgendas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', String(ITEMS_PER_PAGE))
      const res = await fetch(`/api/agenda?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAgendas(Array.isArray(data) ? data : data.data || data.agendas || [])
      }
    } catch {
      setAgendas([])
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    fetchAgendas()
  }, [fetchAgendas])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (agenda: AgendaItem) => {
    setEditingId(agenda.id)
    setForm({
      title: agenda.title,
      description: agenda.description || '',
      date: agenda.date ? agenda.date.split('T')[0] : '',
      location: agenda.location || '',
      isInternal: agenda.isInternal || false,
      status: agenda.status,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.date) {
      toast.error('Judul dan tanggal wajib diisi')
      return
    }
    setSubmitting(true)
    try {
      const url = editingId ? `/api/agenda/${editingId}` : '/api/agenda'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(editingId ? 'Agenda berhasil diperbarui' : 'Agenda berhasil ditambahkan')
        setDialogOpen(false)
        fetchAgendas()
      } else {
        toast.error('Gagal menyimpan agenda')
      }
    } catch {
      toast.error('Gagal menyimpan agenda')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/agenda/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Agenda berhasil dihapus')
        fetchAgendas()
      }
    } catch {
      toast.error('Gagal menghapus agenda')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Agenda</h2>
          <p className="text-sm text-muted-foreground">Kelola jadwal kegiatan dan acara organisasi.</p>
        </div>
        <Button className="bg-green-700 hover:bg-green-800 text-white w-fit" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Agenda
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari agenda..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs w-10">No</TableHead>
                  <TableHead className="text-xs">Judul</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Tanggal</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Lokasi</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Tipe</TableHead>
                  <TableHead className="text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : agendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Tidak ada agenda ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  agendas.map((agenda, idx) => (
                    <TableRow key={agenda.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                      <TableCell className="text-sm font-medium max-w-[200px] truncate">{agenda.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                        {new Date(agenda.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[150px]">{agenda.location || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(agenda.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {agenda.isInternal ? (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 text-[10px]">Internal</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Publik</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(agenda)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(agenda.id)} title="Hapus">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && agendas.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-xs text-muted-foreground">
                Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, agendas.length)} dari {agendas.length}
              </p>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm font-medium">{page}</span>
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={agendas.length < ITEMS_PER_PAGE} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Agenda' : 'Tambah Agenda Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Judul</Label>
              <Input
                placeholder="Masukkan judul agenda"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi agenda..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tanggal</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Lokasi</Label>
                <Input
                  placeholder="Lokasi kegiatan"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGENDA_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isInternal"
                checked={form.isInternal}
                onCheckedChange={(checked) => setForm({ ...form, isInternal: !!checked })}
              />
              <Label htmlFor="isInternal" className="text-sm font-medium cursor-pointer">
                Agenda Internal (khusus anggota)
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
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
    </div>
  )
}