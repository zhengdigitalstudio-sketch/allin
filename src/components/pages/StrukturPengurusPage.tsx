'use client'

import { motion } from 'framer-motion'
import { useAppStore, PENGURUS_DATA } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getRoleStyle(role: string) {
  switch (role) {
    case 'KETUA':
      return { size: 'lg', badge: 'bg-allin-green text-white' }
    case 'WAKIL_KETUA':
      return { size: 'md', badge: 'bg-allin-green/80 text-white' }
    default:
      return { size: 'sm', badge: 'bg-allin-green/10 text-allin-green' }
  }
}

function PengurusCard({
  person,
  index,
  size = 'sm',
}: {
  person: (typeof PENGURUS_DATA)[number]
  index: number
  size?: 'lg' | 'md' | 'sm'
}) {
  const { badge } = getRoleStyle(person.role)
  const isLg = size === 'lg'
  const isMd = size === 'md'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      <Card
        className={cn(
          'border-0 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden',
          isLg && 'border-2 border-allin-green'
        )}
      >
        {/* Top accent bar */}
        <div className={cn('h-1.5 gradient-green', isLg && 'h-2')} />

        <CardContent className={cn('p-6 text-center', isLg && 'p-8')}>
          {/* Avatar */}
          <div
            className={cn(
              'mx-auto rounded-full gradient-green flex items-center justify-center text-white font-bold mb-4',
              isLg ? 'w-24 h-24 text-2xl' : isMd ? 'w-20 h-20 text-xl' : 'w-16 h-16 text-lg'
            )}
          >
            {getInitials(person.name)}
          </div>

          <h3 className={cn('font-bold text-foreground', isLg ? 'text-xl' : 'text-base')}>{person.name}</h3>

          <Badge className={cn('mt-2 text-xs font-semibold', badge)}>
            {person.roleLabel}
          </Badge>

          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-3">
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate max-w-[200px]">{person.email}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function StrukturPengurusPage() {
  const { navigate } = useAppStore()
  const ketua = PENGURUS_DATA.find((p) => p.role === 'KETUA')!
  const wakil = PENGURUS_DATA.find((p) => p.role === 'WAKIL_KETUA')!
  const others = PENGURUS_DATA.filter(
    (p) => p.role !== 'KETUA' && p.role !== 'WAKIL_KETUA'
  )

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Struktur Pengurus</span>
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Struktur Pengurus
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-lg max-w-2xl"
          >
            Susunan pengurus ALLIN yang berkomitmen memajukan industri ketenagalistrikan
          </motion.p>
        </div>
      </section>

      {/* Org Chart */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Ketua */}
            <div className="flex justify-center mb-4">
              <div className="w-full max-w-xs">
                <PengurusCard person={ketua} index={0} size="lg" />
              </div>
            </div>

            {/* Connector line */}
            <div className="flex justify-center my-2">
              <div className="w-0.5 h-8 bg-allin-green/30" />
            </div>

            {/* Wakil Ketua */}
            <div className="flex justify-center mb-4">
              <div className="w-full max-w-xs">
                <PengurusCard person={wakil} index={1} size="md" />
              </div>
            </div>

            {/* Connector line to bottom row */}
            <div className="flex justify-center my-2">
              <div className="w-0.5 h-8 bg-allin-green/30" />
            </div>

            {/* Horizontal connector */}
            <div className="hidden md:flex justify-center my-2 relative">
              <div className="w-2/3 h-0.5 bg-allin-green/30" />
              {/* Vertical drops */}
              <div className="absolute left-0 top-0 translate-x-[-50%] w-0.5 h-8 bg-allin-green/30" />
              <div className="absolute left-1/2 top-0 -translate-x-1/2 w-0.5 h-8 bg-allin-green/30" />
              <div className="absolute right-0 translate-x-[50%] top-0 w-0.5 h-8 bg-allin-green/30" />
            </div>

            {/* Bottom row: Sekretaris, Wakil Sekretaris, Bendahara */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 md:mt-12">
              {others.map((person, i) => (
                <PengurusCard key={person.role} person={person} index={i + 2} size="sm" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}