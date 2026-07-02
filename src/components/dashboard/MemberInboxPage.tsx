'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MailOpen, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Message { id: string; sender: string; subject: string; content: string; date: string; isRead: boolean }

const initialMessages: Message[] = [
  { id: '1', sender: 'Sekretariat ALLIN', subject: 'Konfirmasi Keanggotaan', content: 'Selamat, keanggotaan Anda telah disetujui. Silakan lengkapi profil Anda di dashboard member.', date: '2024-12-15T10:00:00', isRead: false },
  { id: '2', sender: 'Sekretariat ALLIN', subject: 'Undangan Seminar Nasional', content: 'Anda diundang untuk menghadiri Seminar Nasional Transisi Energi yang akan diselenggarakan pada 20 Januari 2025 di Jakarta.', date: '2024-12-10T09:00:00', isRead: true },
  { id: '3', sender: 'Ketua ALLIN', subject: 'Pengumuman Rapat Anggota', content: 'Rapat Anggota Tahunan ALLIN akan dilaksanakan pada 15 Februari 2025. Mohon hadir tepat waktu.', date: '2024-12-05T14:00:00', isRead: true },
]

export function MemberInboxPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [selected, setSelected] = useState<Message | null>(null)
  const [open, setOpen] = useState(false)

  const markRead = (id: string) => setMessages(p => p.map(m => m.id === id ? { ...m, isRead: true } : m))

  const unread = messages.filter(m => !m.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Pesan</h2><p className="text-muted-foreground text-sm mt-1">Kotak masuk Anda</p></div>
        {unread > 0 && <Badge className="bg-allin-green text-white">{unread} belum dibaca</Badge>}
      </div>
      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-2 space-y-2">
          {messages.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={cn('border-0 shadow-sm cursor-pointer hover:shadow-md transition-all', !m.isRead && 'border-l-4 border-l-allin-green')}
                onClick={() => { setSelected(m); markRead(m.id) }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!m.isRead && <div className="w-2 h-2 rounded-full bg-allin-green shrink-0" />}
                        <p className={cn('text-sm truncate', !m.isRead && 'font-semibold')}>{m.subject}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{m.sender}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(m.date), 'dd MMM', { locale: localeId })}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="md:col-span-3">
          {selected ? (
            <Card className="border-0 shadow-sm sticky top-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div><h3 className="font-bold text-lg">{selected.subject}</h3><p className="text-sm text-muted-foreground mt-1">{selected.sender} &middot; {format(new Date(selected.date), 'dd MMMM yyyy, HH:mm', { locale: localeId })}</p></div>
                  {selected.isRead && <Badge variant="secondary" className="text-[10px]"><MailOpen className="w-3 h-3 mr-1" />Dibaca</Badge>}
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">{selected.content}</div>
                <div className="mt-4 pt-4 border-t"><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" className="border-allin-green text-allin-green"><Send className="w-4 h-4 mr-2" />Balas</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Balas Pesan</DialogTitle></DialogHeader>
                    <div className="space-y-4"><Textarea placeholder="Tulis balasan..." rows={4} /><Button onClick={() => { setOpen(false); toast.success('Balasan terkirim') }} className="bg-allin-green hover:bg-allin-green-dark text-white w-full"><Send className="w-4 h-4 mr-2" />Kirim Balasan</Button></div>
                  </DialogContent></Dialog></div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center border-0"><Mail className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" /><p className="text-muted-foreground">Pilih pesan untuk membaca</p></Card>
          )}
        </div>
      </div>
    </div>
  )
}

