'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Mail, MailOpen, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from 'sonner'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  createdAt: string
}

export function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/contacts?${params}`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.data || data.contacts || []
        setContacts(list)
        setUnreadCount(list.filter((c: ContactMessage) => !c.isRead).length)
      }
    } catch {
      setContacts([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const openDetail = (contact: ContactMessage) => {
    setSelectedContact(contact)
    setDetailOpen(true)
    if (!contact.isRead) {
      markAsRead(contact.id)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })
      if (res.ok) {
        setContacts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isRead: true } : c))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch {
      // silent fail
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        contacts.filter((c) => !c.isRead).map((c) =>
          fetch(`/api/contacts/${c.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true }),
          })
        )
      )
      toast.success('Semua pesan ditandai telah dibaca')
      fetchContacts()
    } catch {
      toast.error('Gagal menandai pesan')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold">Pesan Kontak Masuk</h2>
            <p className="text-sm text-muted-foreground">Pesan yang diterima melalui formulir kontak.</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white border-red-500 shrink-0">{unreadCount} belum dibaca</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" className="w-fit" onClick={handleMarkAllRead}>
            <MailOpen className="h-4 w-4 mr-2" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, atau subjek..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                  <TableHead className="text-xs">Subjek</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Tanggal</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
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
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Belum ada pesan kontak masuk.
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact, idx) => (
                    <TableRow
                      key={contact.id}
                      className={contact.isRead ? 'hover:bg-muted/30' : 'bg-green-50/50 hover:bg-green-50/80'}
                    >
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {!contact.isRead && <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />}
                          {contact.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{contact.email}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{contact.subject}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                        {new Date(contact.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        {contact.isRead ? (
                          <Badge variant="secondary" className="text-[10px]">Dibaca</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-[10px]">Belum</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openDetail(contact)} title="Lihat Pesan">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedContact?.subject}</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Pengirim</p>
                  <p className="text-sm font-medium">{selectedContact.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{selectedContact.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedContact.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {selectedContact.isRead ? (
                    <Badge variant="secondary" className="text-[10px]">Dibaca</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-[10px]">Belum</Badge>
                  )}
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2">Pesan</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedContact.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}