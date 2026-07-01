'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Newspaper, Shield, Eye, UserPlus, Calendar, TrendingUp, TrendingDown, FileText, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts'
import { useAppStore } from '@/lib/store'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

const CHART_COLORS = ['#15803d', '#eab308', '#22c55e', '#ca8a04', '#166534', '#a16207', '#86efac']

interface Stats {
  totalMembers: number
  totalArticles: number
  totalPengurus: number
  totalContacts: number
  totalAgenda: number
  totalGallery: number
  totalPendingMembers: number
}

interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  description: string
  ip: string
  createdAt: string
}

interface PendingMember {
  id: string
  fullName: string
  email: string
  companyName: string
  memberType: string
  status: string
}

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let startTime: number | null = null
    let rafId: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])
  return count
}

function StatCard({ icon: Icon, value, label, color, trend, trendLabel }: {
  icon: React.ElementType
  value: number
  label: string
  color: string
  trend?: 'up' | 'down'
  trendLabel?: string
}) {
  const animatedValue = useAnimatedCounter(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
              <p className="text-2xl sm:text-3xl font-bold">{animatedValue.toLocaleString('id-ID')}</p>
              {trend && trendLabel && (
                <div className="flex items-center gap-1">
                  {trend === 'up' ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={cn('text-xs font-medium', trend === 'up' ? 'text-green-600' : 'text-red-500')}>
                    {trendLabel}
                  </span>
                </div>
              )}
            </div>
            <div className={cn('flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl', color)}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const articleCategoryData = [
  { name: 'Berita', value: 24 },
  { name: 'Regulasi', value: 12 },
  { name: 'Teknologi', value: 18 },
  { name: 'Kegiatan', value: 30 },
  { name: 'Seminar', value: 8 },
  { name: 'Workshop', value: 15 },
  { name: 'Opini', value: 10 },
]

const monthlyRegistrationData = [
  { bulan: 'Jul', pendaftar: 12 },
  { bulan: 'Agu', pendaftar: 19 },
  { bulan: 'Sep', pendaftar: 15 },
  { bulan: 'Okt', pendaftar: 25 },
  { bulan: 'Nov', pendaftar: 22 },
  { bulan: 'Des', pendaftar: 31 },
]

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} jam lalu`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} hari lalu`
}

export function AdminDashboardPage() {
  const { navigate } = useAppStore()
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      setStats({
        totalMembers: 156,
        totalArticles: 117,
        totalPengurus: 5,
        totalContacts: 43,
        totalAgenda: 12,
        totalGallery: 28,
        totalPendingMembers: 8,
      })
    }
  }, [])

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/activity-log')
      if (res.ok) {
        const data = await res.json()
        setActivities(data.logs?.slice(0, 5) || [])
      }
    } catch {
      setActivities([])
    }
  }, [])

  const fetchPendingMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/members?status=MENUNGGU')
      if (res.ok) {
        const data = await res.json()
        setPendingMembers(data.members?.slice(0, 5) || [])
      }
    } catch {
      setPendingMembers([])
    }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchActivities(), fetchPendingMembers()])
      setLoading(false)
    }
    loadAll()
  }, [fetchStats, fetchActivities, fetchPendingMembers])

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISETUJUI' }),
      })
      if (res.ok) {
        toast.success('Anggota berhasil disetujui')
        fetchPendingMembers()
        fetchStats()
      }
    } catch {
      toast.error('Gagal menyetujui anggota')
    }
  }

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DITOLAK' }),
      })
      if (res.ok) {
        toast.success('Pendaftaran ditolak')
        fetchPendingMembers()
        fetchStats()
      }
    } catch {
      toast.error('Gagal menolak pendaftaran')
    }
  }

  const userName = session?.user?.name || 'Admin'

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Selamat Datang, {userName} 👋</h2>
        <p className="text-muted-foreground mt-1">Berikut ringkasan data organisasi Anda hari ini.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          value={stats?.totalMembers ?? 0}
          label="Total Member"
          color="bg-green-700"
          trend="up"
          trendLabel="+12% bulan ini"
        />
        <StatCard
          icon={Newspaper}
          value={stats?.totalArticles ?? 0}
          label="Total Artikel"
          color="bg-yellow-500"
          trend="up"
          trendLabel="+5 bulan ini"
        />
        <StatCard
          icon={Shield}
          value={stats?.totalPengurus ?? 0}
          label="Total Pengurus"
          color="bg-green-800"
        />
        <StatCard
          icon={Eye}
          value={1234}
          label="Pengunjung"
          color="bg-sky-600"
          trend="up"
          trendLabel="+8% minggu ini"
        />
        <StatCard
          icon={UserPlus}
          value={stats?.totalPendingMembers ?? 0}
          label="Pendaftaran Baru"
          color="bg-orange-500"
          trend="up"
          trendLabel="Perlu ditinjau"
        />
        <StatCard
          icon={Calendar}
          value={stats?.totalAgenda ?? 0}
          label="Total Kegiatan"
          color="bg-green-700"
          trend="up"
          trendLabel="+3 bulan ini"
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Statistik Artikel per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={articleCategoryData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                    formatter={(value: number) => [`${value} artikel`, 'Jumlah']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {articleCategoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Pendaftaran Anggota</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyRegistrationData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorPendaftar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                    formatter={(value: number) => [`${value} orang`, 'Pendaftar']}
                  />
                  <Area
                    type="monotone"
                    dataKey="pendaftar"
                    stroke="#15803d"
                    strokeWidth={2}
                    fill="url(#colorPendaftar)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity & Pending Members */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Aktivitas Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada aktivitas tercatat.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Waktu</TableHead>
                      <TableHead className="text-xs">Pengguna</TableHead>
                      <TableHead className="text-xs">Aksi</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Deskripsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((act) => (
                      <TableRow key={act.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(act.createdAt)}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{act.userName || '-'}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {act.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">
                          {act.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Pendaftaran Menunggu</CardTitle>
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                  {pendingMembers.length} menunggu
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pendingMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Tidak ada pendaftaran yang menunggu persetujuan.</p>
              ) : (
                <div className="space-y-3">
                  {pendingMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{member.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email} · {member.companyName || '-'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-green-700 hover:bg-green-800 text-white"
                          onClick={() => handleApprove(member.id)}
                        >
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2.5 text-xs"
                          onClick={() => handleReject(member.id)}
                        >
                          Tolak
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('admin-articles')}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Kelola Artikel
            </Button>
            <Button
              onClick={() => navigate('admin-members')}
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              Kelola Member
            </Button>
            <Button
              onClick={() => navigate('admin-contacts')}
              variant="outline"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Lihat Kontak
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}