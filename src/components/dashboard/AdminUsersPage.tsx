'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ALL_ROLES } from '@/lib/store'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

const ITEMS_PER_PAGE = 10

const ROLE_BADGE_CLASSES: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200',
  KETUA: 'bg-green-100 text-green-700 border-green-200',
  WAKIL_KETUA: 'bg-teal-100 text-teal-700 border-teal-200',
  SEKRETARIS: 'bg-blue-100 text-blue-700 border-blue-200',
  WAKIL_SEKRETARIS: 'bg-purple-100 text-purple-700 border-purple-200',
  BENDAHARA: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  MEMBER: 'bg-gray-100 text-gray-600 border-gray-200',
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  KETUA: 'Ketua',
  WAKIL_KETUA: 'Wakil Ketua',
  SEKRETARIS: 'Sekretaris',
  WAKIL_SEKRETARIS: 'Wakil Sekretaris',
  BENDAHARA: 'Bendahara',
  MEMBER: 'Member',
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'MEMBER',
  isActive: true,
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', String(ITEMS_PER_PAGE))
      const res = await fetch(`/api/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : data.data || data.users || [])
      }
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingId(user.id)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nama dan email wajib diisi')
      return
    }
    if (!editingId && !form.password) {
      toast.error('Password wajib diisi untuk user baru')
      return
    }
    setSubmitting(true)
    try {
      const url = editingId ? `/api/users/${editingId}` : '/api/users'
      const method = editingId ? 'PUT' : 'POST'
      const body: Record<string, string | boolean> = {
        name: form.name,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
      }
      if (form.password) body.password = form.password
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(editingId ? 'User berhasil diperbarui' : 'User berhasil ditambahkan')
        setDialogOpen(false)
        fetchUsers()
      } else {
        toast.error('Gagal menyimpan user')
      }
    } catch {
      toast.error('Gagal menyimpan user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('User berhasil dihapus')
        fetchUsers()
      }
    } catch {
      toast.error('Gagal menghapus user')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manajemen User</h2>
          <p className="text-sm text-muted-foreground">Kelola akun pengguna dan hak akses.</p>
        </div>
        <Button className="bg-green-700 hover:bg-green-800 text-white w-fit" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah User
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau email..."
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
                  <TableHead className="text-xs">Nama</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-xs hidden xl:table-cell">Tanggal</TableHead>
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
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Tidak ada user ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, idx) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{user.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px] border', ROLE_BADGE_CLASSES[user.role] || ROLE_BADGE_CLASSES.MEMBER)}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={user.isActive ? 'default' : 'secondary'} className={cn('text-[10px]', user.isActive ? 'bg-green-100 text-green-700 hover:bg-green-100' : '')}>
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">
                        {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(user)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(user.id)} title="Hapus">
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
          {!loading && users.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-xs text-muted-foreground">
                Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, users.length)} dari {users.length}
              </p>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm font-medium">{page}</span>
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={users.length < ITEMS_PER_PAGE} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nama</Label>
              <Input
                placeholder="Nama lengkap"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                placeholder="email@contoh.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{editingId ? 'Password (kosongkan jika tidak diubah)' : 'Password'}</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Status Aktif</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
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