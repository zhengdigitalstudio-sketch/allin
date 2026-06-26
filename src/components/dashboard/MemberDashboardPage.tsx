'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { User, Mail, FileText, Calendar, Newspaper, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Announcement { id: string; title: string; content: string | null; createdAt: string }

export function MemberDashboardPage() {
  const { data: session } = useSession()
  const { navigate } = useAppStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const userName = session?.user?.name || 'Member'

  useEffect(() => {
    fetch('/api/announcements').then(r => r.json()).then(d => setAnnouncements(Array.isArray(d) ? d.slice(0, 3) : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl sm:text-3xl font-bold">Selamat Datang, {userName}</h2><p className="text-muted-foreground mt-1">Dashboard member ALLIN</p></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: User, label: 'Status', value: 'Aktif', color: 'bg-green-700' },
          { icon: Newspaper, label: 'Artikel', value: 'Tersedia', color: 'bg-yellow-500' },
          { icon: Calendar, label: 'Agenda', value: 'Mendatang', color: 'bg-green-800' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-0 shadow-sm"><CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-lg font-bold mt-1">{s.value}</p></div>
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}><s.icon className="w-5 h-5 text-white" /></div>
              </div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Button variant="outline" onClick={() => navigate('member-articles')} className="h-auto py-4 flex-col gap-1"><Newspaper className="w-5 h-5" /><span className="text-xs">Lihat Artikel</span></Button>
        <Button variant="outline" onClick={() => navigate('member-agenda')} className="h-auto py-4 flex-col gap-1"><Calendar className="w-5 h-5" /><span className="text-xs">Agenda Internal</span></Button>
        <Button variant="outline" onClick={() => navigate('member-documents')} className="h-auto py-4 flex-col gap-1"><Download className="w-5 h-5" /><span className="text-xs">Download Dokumen</span></Button>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Pengumuman Terbaru</CardTitle></CardHeader><CardContent>
          {loading ? <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div> :
          announcements.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Tidak ada pengumuman.</p> :
          <div className="space-y-3">{announcements.map(a => (
            <div key={a.id} className="p-4 rounded-lg bg-muted/50"><h4 className="font-medium text-sm">{a.title}</h4><p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p><p className="text-[10px] text-muted-foreground mt-2">{format(new Date(a.createdAt), 'dd MMM yyyy', { locale: localeId })}</p></div>
          ))}</div>}
        </CardContent></Card>
      </motion.div>
    </div>
  )
}