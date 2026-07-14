'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Download, Eye, Check, X, Trash2, ChevronLeft, ChevronRight, Pencil, Copy, MessageCircle, KeyRound, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MEMBER_TYPES, MEMBER_STATUSES } from '@/lib/store'
import { toast } from 'sonner'

interface Member {
  id: string
  fullName: string
  email: string
  companyName: string
  memberType: string
  status: string
  phone?: string
  address?: string
  position?: string
  city?: string
  province?: string
  institution?: string
  reason?: string
  createdAt: string
  updatedAt: string
}

const ITEMS_PER_PAGE = 10
const DEFAULT_MEMBER_PASSWORD = 'member123'

function getStatusBadge(status: string) {
  switch (status) {
    case 'MENUNGGU':
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Menunggu</Badge>
    case 'DISETUJUI':
      return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Disetujui</Badge>
    case 'DITOLAK':
      return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Ditolak</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

/** Convert ISO date to yyyy-mm-dd for <input type="date"> */
function isoToDateInput(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return ''
  }
}

/** Sanitize phone number to international format for wa.me */
function sanitizeWaPhone(phone: string): string {
  let cleaned = (phone || '').replace(/\D/g, '')
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1)
  return cleaned
}

export function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA')
  const [typeFilter, setTypeFilter] = useState<string>('SEMUA')
  const [page, setPage] = useState(1)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<{ fullName: string; email: string; phone: string; companyName: string; memberType: string; position: string; address: string; createdAt: string }>({ fullName: '', email: '', phone: '', companyName: '', memberType: '', position: '', address: '', createdAt: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [approvalResult, setApprovalResult] = useState<{ password: string; member: Member; message?: string } | null>(null)
  const [approving, setApproving] = useState(false)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'SEMUA') params.set('status', statusFilter)
      if (typeFilter !== 'SEMUA') params.set('type', typeFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', String(ITEMS_PER_PAGE))
      const res = await fetch(`/api/members?${params}`)
      if (res.ok) {
        const data = await res.json()
        setMembers(Array.isArray(data) ? data : data.data || data.members || [])
      }
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, typeFilter, page])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleUpdateStatus = async (id: string, status: string) => {
    if (status === 'DISETUJUI') {
      // Show approval dialog first
      const member = members.find((m) => m.id === id)
      if (member) {
        setSelectedMember(member)
        // Proceed directly to approve (will show password after)
        setApproving(true)
        try {
          const res = await fetch(`/api/members/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
          const data = await res.json()
          if (res.ok) {
            if (data.generatedPassword) {
              setApprovalResult({ password: data.generatedPassword, member: data.member, message: data.message })
            } else {
              toast.success('Anggota berhasil disetujui (akun sudah ada)')
            }
            fetchMembers()
          } else {
            toast.error(data.error || 'Gagal menyetujui anggota')
          }
        } catch {
          toast.error('Gagal mengupdate status')
        } finally {
          setApproving(false)
        }
      }
      return
    }

    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success('Pendaftaran ditolak')
        fetchMembers()
      }
    } catch {
      toast.error('Gagal mengupdate status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus anggota ini? Tindakan ini tidak dapat dibatalkan.')) return
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Anggota berhasil dihapus')
        fetchMembers()
      }
    } catch {
      toast.error('Gagal menghapus anggota')
    }
  }

  const openDetail = (member: Member) => {
    setSelectedMember(member)
    setDetailOpen(true)
  }

  const openEdit = (member: Member) => {
    setSelectedMember(member)
    setEditForm({
      fullName: member.fullName || '',
      email: member.email || '',
      phone: member.phone || '',
      companyName: member.companyName || '',
      memberType: member.memberType || '',
      position: member.position || '',
      address: member.address || '',
      createdAt: isoToDateInput(member.createdAt),
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedMember) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        toast.success('Data anggota berhasil diperbarui')
        setEditOpen(false)
        fetchMembers()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Gagal memperbarui data')
      }
    } catch {
      toast.error('Gagal memperbarui data')
    } finally {
      setSavingEdit(false)
    }
  }

  const copyPassword = (pw: string) => {
    navigator.clipboard.writeText(pw)
    toast.success('Password disalin ke clipboard')
  }

  const sendPasswordViaWa = (member: Member, pw: string) => {
    const phone = sanitizeWaPhone(member.phone || '')
    if (!phone) {
      toast.error('Nomor WhatsApp anggota tidak tersedia')
      return
    }
    const message = [
      `*Selamat Datang di ALLIN*`,
      ``,
      `Halo ${member.fullName},`,
      ``,
      `Pendaftaran keanggotaan Anda di ALLIN telah *DISETUJUI*.`,
      ``,
      `Berikut informasi login akun Anda:`,
      `*Email:* ${member.email}`,
      `*Password:* ${pw}`,
      ``,
      `Silakan login di website ALLIN dan segera ganti password Anda demi keamanan.`,
      ``,
      `Terima kasih,`,
      `Tim Pengurus ALLIN`,
    ].join('\n')
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  const filteredMembers = members

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Anggota</h2>
          <p className="text-sm text-muted-foreground">Kelola data pendaftaran dan keanggotaan organisasi.</p>
        </div>
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => toast.info('Fitur export akan segera tersedia')}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Info Banner - Default Password */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900 dark:text-blue-100">Informasi Password Default Member</p>
          <p className="text-blue-700 dark:text-blue-300 mt-1">
            Saat anggota disetujui, akun akan dibuat dengan password default <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded font-mono font-bold">{DEFAULT_MEMBER_PASSWORD}</code>.
            Password akan ditampilkan di dialog approval dan bisa langsung dikirim ke anggota via WhatsApp.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, email, atau perusahaan..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Status</SelectItem>
                {MEMBER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Jenis</SelectItem>
                {MEMBER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs w-10">No</TableHead>
                  <TableHead className="text-xs">Nama</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Perusahaan</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Jenis</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden xl:table-cell">Tanggal</TableHead>
                  <TableHead className="text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Tidak ada data anggota ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member, idx) => (
                    <TableRow key={member.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{member.fullName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{member.email}</TableCell>
                      <TableCell className="text-xs hidden lg:table-cell">{member.companyName || '-'}</TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">{member.memberType || '-'}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">
                        {new Date(member.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openDetail(member)} title="Lihat Detail">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(member)} title="Edit Data">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {member.status === 'MENUNGGU' && (
                            <>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-700 hover:text-green-800 hover:bg-green-50" onClick={() => handleUpdateStatus(member.id, 'DISETUJUI')} title="Setujui" disabled={approving}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleUpdateStatus(member.id, 'DITOLAK')} title="Tolak">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(member.id)} title="Hapus">
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
          {!loading && filteredMembers.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-xs text-muted-foreground">
                Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, filteredMembers.length)} dari {filteredMembers.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm font-medium">{page}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={filteredMembers.length < ITEMS_PER_PAGE}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Anggota</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nama Lengkap</p>
                  <p className="text-sm font-medium">{selectedMember.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium break-all">{selectedMember.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telepon</p>
                  <p className="text-sm font-medium">{selectedMember.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Perusahaan</p>
                  <p className="text-sm font-medium">{selectedMember.companyName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jabatan</p>
                  <p className="text-sm font-medium">{selectedMember.position || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jenis Anggota</p>
                  <p className="text-sm font-medium">{selectedMember.memberType || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStatusBadge(selectedMember.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Daftar</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedMember.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Alamat</p>
                  <p className="text-sm font-medium">{selectedMember.address || '-'}</p>
                </div>
                {selectedMember.reason && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Alasan Bergabung</p>
                    <p className="text-sm font-medium">{selectedMember.reason}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setDetailOpen(false); openEdit(selectedMember) }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {selectedMember.status === 'MENUNGGU' && (
                  <>
                    <Button
                      className="flex-1 bg-green-700 hover:bg-green-800 text-white"
                      onClick={() => { handleUpdateStatus(selectedMember.id, 'DISETUJUI'); setDetailOpen(false) }}
                      disabled={approving}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Setujui
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => { handleUpdateStatus(selectedMember.id, 'DITOLAK'); setDetailOpen(false) }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Tolak
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Data Anggota</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Nama Lengkap</Label>
                <Input
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Telepon</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Perusahaan</Label>
                <Input
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Jabatan</Label>
                <Input
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Jenis Anggota</Label>
                <Select value={editForm.memberType} onValueChange={(v) => setEditForm({ ...editForm, memberType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis anggota" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Alamat</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              {/* Edit Tanggal Pendaftaran */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <Label className="text-sm font-medium text-amber-900 dark:text-amber-100">Tanggal Pendaftaran</Label>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                  Edit tanggal pendaftaran untuk menyamakan data database dengan dokumen fisik.
                </p>
                <Input
                  type="date"
                  value={editForm.createdAt}
                  onChange={(e) => setEditForm({ ...editForm, createdAt: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-allin-green hover:bg-allin-green-dark text-white"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Result Dialog - Shows Password */}
      <Dialog open={!!approvalResult} onOpenChange={(open) => { if (!open) setApprovalResult(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <Check className="w-5 h-5" />
              Anggota Berhasil Disetujui!
            </DialogTitle>
          </DialogHeader>
          {approvalResult && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Akun login telah dibuat untuk <strong className="text-foreground">{approvalResult.member.fullName}</strong>.
                Berikut informasi login yang harus diberikan kepada anggota:
              </div>

              {/* Login Info Card */}
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Email Login</p>
                    <p className="text-sm font-medium break-all">{approvalResult.member.email}</p>
                  </div>
                </div>
                <div className="border-t border-green-200 dark:border-green-900 pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Password</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white dark:bg-background border border-green-200 dark:border-green-900 rounded font-mono font-bold text-base">
                      {approvalResult.password}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyPassword(approvalResult.password)}
                      title="Salin Password"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
                ⚠️ <strong>Penting:</strong> Sarankan anggota untuk segera mengganti password setelah login pertama demi keamanan akun.
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => sendPasswordViaWa(approvalResult.member, approvalResult.password)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Kirim Password via WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setApprovalResult(null); setDetailOpen(false) }}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
