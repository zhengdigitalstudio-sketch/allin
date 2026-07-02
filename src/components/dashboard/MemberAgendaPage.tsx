'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format, isPast, startOfDay } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface AgendaItem { id: string; title: string; description: string | null; date: string; location: string | null; status: string }

export function MemberAgendaPage() {
  const [agendas, setAgendas] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAgendas = useCallback(async () => {
    try {
      const res = await fetch('/api/agenda?status=AKTIF&limit=50')
      const data = await res.json()
      // Member can see all agendas (internal + public) because session cookie is sent
      setAgendas(data.agenda || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAgendas() }, [fetchAgendas])

  const getStatus = (date: string) => {
    if (isPast(new Date(date)) && startOfDay(new Date(date)) < startOfDay(new Date())) return { label: 'Selesai', cls: 'bg-muted text-muted-foreground' }
    return { label: 'Akan Datang', cls: 'bg-allin-green/10 text-allin-green' }
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Agenda Internal</h2><p className="text-muted-foreground text-sm mt-1">Jadwal kegiatan internal untuk anggota</p></div>
      {loading ? <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div> :
      agendas.length === 0 ? <Card className="p-12 text-center"><Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" /><p className="text-muted-foreground">Tidak ada agenda saat ini.</p></Card> :
      <div className="space-y-4">
        {agendas.map((a, i) => {
          const s = getStatus(a.date)
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex">
                  <div className="w-20 md:w-24 gradient-green flex flex-col items-center justify-center p-4 shrink-0">
                    <span className="text-2xl md:text-3xl font-bold text-white leading-none">{format(new Date(a.date), 'dd')}</span>
                    <span className="text-xs text-white/80 font-medium uppercase mt-1">{format(new Date(a.date), 'MMM yyyy', { locale: localeId })}</span>
                  </div>
                  <CardContent className="p-4 md:p-5 flex-1 min-w-0">
                    <Badge className={cn('text-xs font-semibold mb-2', s.cls)}>{s.label}</Badge>
                    <h3 className="font-bold text-sm md:text-base">{a.title}</h3>
                    {a.description && <p className="text-muted-foreground text-xs line-clamp-2 mt-1">{a.description}</p>}
                    {a.location && <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2"><MapPin className="w-3 h-3" />{a.location}</div>}
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>}
    </div>
  )
}

