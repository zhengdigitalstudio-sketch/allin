'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useAppStore } from '@/lib/store'
import { FileText, Eye, PenLine, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Article { id: string; title: string; status: string; viewCount: number; createdAt: string; publishedAt: string | null }

function StatCard({ icon: Icon, value, label, color }: { icon: React.ElementType; value: number; label: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-sm"><CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
        </div>
      </CardContent></Card>
    </motion.div>
  )
}

export function PengurusDashboardPage() {
  const { data: session } = useSession()
  const { navigate } = useAppStore()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  const fetchArticles = useCallback(async () => {
    try {
      const userId = (session?.user as any)?.id
      const res = await fetch(`/api/articles?status=DRAFT,PUBLISHED&limit=100`)
      if (res.ok) {
        const data = await res.json()
        const all = data.articles || []
        setArticles(all.filter((a: Article) => a.author?.id === userId))
      }
    } catch {} finally { setLoading(false) }
  }, [session])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  const published = articles.filter(a => a.status === 'PUBLISHED')
  const drafts = articles.filter(a => a.status === 'DRAFT')
  const totalViews = published.reduce((s, a) => s + a.viewCount, 0)
  const userName = session?.user?.name || 'Pengurus'

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl sm:text-3xl font-bold">Selamat Datang, {userName}</h2><p className="text-muted-foreground mt-1">Dashboard pengurus ALLIN</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} value={articles.length} label="Total Artikel" color="bg-green-700" />
        <StatCard icon={Eye} value={totalViews} label="Total Views" color="bg-yellow-500" />
        <StatCard icon={PenLine} value={drafts.length} label="Draft" color="bg-orange-500" />
        <StatCard icon={TrendingUp} value={published.length} label="Dipublikasi" color="bg-green-800" />
      </div>
      <div className="flex justify-end"><Button onClick={() => navigate('pengurus-articles')} className="bg-allin-green hover:bg-allin-green-dark text-white"><PenLine className="w-4 h-4 mr-2" />Tulis Artikel Baru</Button></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Artikel Terbaru</CardTitle></CardHeader><CardContent>
          {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div> :
          articles.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Belum ada artikel.</p> :
          <div className="space-y-2">
            {articles.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{a.title}</p><p className="text-xs text-muted-foreground">{format(new Date(a.createdAt), 'dd MMM yyyy', { locale: localeId })}</p></div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge variant={a.status === 'PUBLISHED' ? 'default' : 'secondary'} className={a.status === 'PUBLISHED' ? 'bg-allin-green text-white text-[10px]' : 'text-[10px]'}>{a.status}</Badge>
                  <span className="text-xs text-muted-foreground"><Eye className="w-3 h-3 inline mr-0.5" />{a.viewCount}</span>
                </div>
              </div>
            ))}
          </div>}
        </CardContent></Card>
      </motion.div>
    </div>
  )
}