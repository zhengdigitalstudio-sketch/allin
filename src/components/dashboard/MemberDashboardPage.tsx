'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { User, Mail, FileText, Calendar, Newspaper, Download, Users, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Announcement { id: string; title: string; content: string | null; createdAt: string; isForMemberOnly: boolean }

interface DashboardStats {
  totalArticles: number
  totalAgenda: number
  totalMembers: number
  upcomingAgenda: number
}

export function MemberDashboardPage() {
  const { navigate, user } = useAppStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const userName = user?.name || 'Member'

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch announcements
      const announcementsRes = await fetch('/api/announcements')
      if (announcementsRes.ok) {
        const announcementsData = await announcementsRes.json()
        // Filter: show non-member-only + member-only (since user is logged in)
        const allAnnouncements = announcementsData.announcements || []
        setAnnouncements(allAnnouncements.slice(0, 3))
      }

      // Fetch stats from various endpoints
      const [articlesRes, agendaRes, membersRes] = await Promise.all([
        fetch('/api/articles?status=PUBLISHED&limit=1'),
        fetch('/api/agenda?status=AKTIF&limit=1'),
        fetch('/api/members?status=DISETUJUI&limit=1'),
      ])

      const newStats: DashboardStats = {
        totalArticles: 0,
        totalAgenda: 0,
        totalMembers: 0,
        upcomingAgenda: 0,
      }

      if (articlesRes.ok) {
        const articlesData = await articlesRes.json()
        newStats.totalArticles = articlesData.pagination?.total || 0
      }

      if (agendaRes.ok) {
        const agendaData = await agendaRes.json()
        newStats.totalAgenda = agendaData.pagination?.total || agendaData.length || 0
        // Count upcoming agendas (date >= today)
        const agendas = agendaData.agendas || agendaData || []
        const today = new Date()
        newStats.upcomingAgenda = Array.isArray(agendas) 
          ? agendas.filter((a: any) => new Date(a.date) >= today).length 
          : 0
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        newStats.totalMembers = membersData.pagination?.total || 0
      }

      setStats(newStats)
    } catch (error) {
      console.error('[MemberDashboard] Error fetching data:', error)
      // Set default values on error to prevent UI breakage
      setStats({
        totalArticles: 0,
        totalAgenda: 0,
        totalMembers: 0,
        upcomingAgenda: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Selamat Datang, {userName}</h2>
        <p className="text-muted-foreground mt-1">Dashboard member ALLIN</p>
      </div>

      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { 
            icon: User, 
            label: 'Status', 
            value: user?.isActive !== false ? 'Aktif' : 'Non-Aktif', 
            color: user?.isActive !== false ? 'bg-green-700' : 'bg-gray-500',
            isLoading: false 
          },
          { 
            icon: Newspaper, 
            label: 'Artikel', 
            value: loading ? '...' : `${stats?.totalArticles || 0} Artikel`, 
            color: 'bg-yellow-500',
            isLoading: loading && !stats 
          },
          { 
            icon: Calendar, 
            label: 'Agenda', 
            value: loading ? '...' : `${stats?.upcomingAgenda || 0} Mendatang`, 
            color: 'bg-green-800',
            isLoading: loading && !stats 
          },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    {s.isLoading ? (
                      <Skeleton className="h-6 w-20 mt-1" />
                    ) : (
                      <p className="text-lg font-bold mt-1">{s.value}</p>
                    )}
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Action Buttons */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Button variant="outline" onClick={() => navigate('member-articles')} className="h-auto py-4 flex-col gap-1">
          <Newspaper className="w-5 h-5" />
          <span className="text-xs">Lihat Artikel</span>
        </Button>
        <Button variant="outline" onClick={() => navigate('member-agenda')} className="h-auto py-4 flex-col gap-1">
          <Calendar className="w-5 h-5" />
          <span className="text-xs">Agenda Internal</span>
        </Button>
        <Button variant="outline" onClick={() => navigate('member-documents')} className="h-auto py-4 flex-col gap-1">
          <Download className="w-5 h-5" />
          <span className="text-xs">Download Dokumen</span>
        </Button>
      </div>

      {/* Announcements Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pengumuman Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Tidak ada pengumuman.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map(a => (
                  <div key={a.id} className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm">{a.title}</h4>
                      {a.isForMemberOnly && (
                        <Badge variant="secondary" className="text-xs shrink-0">Internal</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {format(new Date(a.createdAt), 'dd MMM yyyy', { locale: localeId })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
