'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Download, Eye, Check, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  createdAt: string
  updatedAt: string
}

const ITEMS_PER_PAGE = 10

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

export function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA')
  const [typeFilter, setTypeFilter] = useState<string>('SEMUA')
  const [page, setPage] = useState(1)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

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
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(status === 'DISETUJUI' ? 'Anggota berhasil disetujui' : 'Pendaftaran ditolak')
        fetchMembers()
      }
    } catch {
      toast.error('Gagal mengupdate status')
    }
  }

  const handleDelete = async (id: string) => {
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
                          {member.status === 'MENUNGGU' && (
                            <>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-700 hover:text-green-800 hover:bg-green-50" onClick={() => handleUpdateStatus(member.id, 'DISETUJUI')} title="Setujui">
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
                  <p className="text-sm font-medium">{selectedMember.email}</p>
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
                  <p className="text-xs text-muted-foreground">Jenis Anggota</p>
                  <p className="text-sm font-medium">{selectedMember.memberType || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStatusBadge(selectedMember.status)}
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Alamat</p>
                  <p className="text-sm font-medium">{selectedMember.address || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Daftar</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedMember.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              {selectedMember.status === 'MENUNGGU' && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    className="flex-1 bg-green-700 hover:bg-green-800 text-white"
                    onClick={() => { handleUpdateStatus(selectedMember.id, 'DISETUJUI'); setDetailOpen(false) }}
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
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}