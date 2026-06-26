'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight, MapPin, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isPast, isFuture, startOfDay } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface AgendaItem {
  id: string
  title: string
  description: string | null
  date: string
  location: string | null
  status: string
  isInternal: boolean
}

export default function AgendaPage() {
  const { navigate } = useAppStore()
  const [agendas, setAgendas] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming')

  const fetchAgendas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agenda?limit=50&status=AKTIF')
      const data = await res.json()
      if (!data.error) {
        let items: AgendaItem[] = data.agenda || []
        if (filter === 'upcoming') {
          items = items.filter((a) => isFuture(new Date(a.date)))
        }
        setAgendas(items)
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchAgendas()
  }, [fetchAgendas])

  const getStatusInfo = (date: string, status: string) => {
    const d = new Date(date)
    if (isPast(d) && startOfDay(d) < startOfDay(new Date())) {
      return { label: 'Selesai', className: 'bg-muted text-muted-foreground' }
    }
    if (status === 'AKTIF') {
      return { label: 'Akan Datang', className: 'bg-allin-green/10 text-allin-green' }
    }
    return { label: status, className: 'bg-muted text-muted-foreground' }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Agenda</span>
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Agenda & Kegiatan
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-lg max-w-2xl"
          >
            Jadwal kegiatan, seminar, workshop, dan acara ALLIN
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Filter */}
          <div className="flex gap-2 mb-8">
            <Button
              variant={filter === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('upcoming')}
              className={filter === 'upcoming' ? 'bg-allin-green hover:bg-allin-green-dark text-white' : ''}
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Akan Datang
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-allin-green hover:bg-allin-green-dark text-white' : ''}
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              Semua
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : agendas.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">Belum ada agenda</p>
              <p className="text-muted-foreground text-sm">
                {filter === 'upcoming' ? 'Tidak ada agenda yang akan datang saat ini.' : 'Belum ada agenda yang tercatat.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {agendas.map((agenda, i) => {
                const agendaDate = new Date(agenda.date)
                const statusInfo = getStatusInfo(agenda.date, agenda.status)
                return (
                  <motion.div
                    key={agenda.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow overflow-hidden border-0 shadow-sm">
                      <div className="flex">
                        {/* Date block */}
                        <div className="w-20 md:w-24 gradient-green flex flex-col items-center justify-center p-4 flex-shrink-0">
                          <span className="text-2xl md:text-3xl font-bold text-white leading-none">
                            {format(agendaDate, 'dd')}
                          </span>
                          <span className="text-xs md:text-sm text-white/80 font-medium uppercase mt-1">
                            {format(agendaDate, 'MMM yyyy', { locale: localeId })}
                          </span>
                        </div>

                        {/* Content */}
                        <CardContent className="p-4 md:p-5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className={cn('text-xs font-semibold', statusInfo.className)}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-base md:text-lg mb-1.5">{agenda.title}</h3>
                          {agenda.description && (
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{agenda.description}</p>
                          )}
                          {agenda.location && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{agenda.location}</span>
                            </div>
                          )}
                        </CardContent>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}