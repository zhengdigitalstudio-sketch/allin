'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, ARTICLE_CATEGORIES } from '@/lib/store'
import { Search, Newspaper, Eye, User, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Article { id: string; title: string; excerpt: string | null; category: string; viewCount: number; author: { name: string } | null; createdAt: string }

const categories = ['Semua', ...ARTICLE_CATEGORIES]

export function MemberArticlesPage() {
  const { navigate, setSelectedArticle } = useAppStore()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchArticles = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: 'PUBLISHED', limit: '50' })
      if (activeCategory !== 'Semua') params.set('category', activeCategory)
      if (search) params.set('search', search)
      const res = await fetch(`/api/articles?${params}`)
      const data = await res.json()
      setArticles(data.articles || [])
    } catch {} finally { setLoading(false) }
  }, [activeCategory, search])

  useEffect(() => { fetchArticles() }, [fetchArticles])
  useEffect(() => { setSearch(searchInput) }, [searchInput])
  useEffect(() => { setSearchInput(''); setSearch('') }, [activeCategory])

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Artikel</h2><p className="text-muted-foreground text-sm mt-1">Baca artikel terbaru dari ALLIN</p></div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)} placeholder="Cari artikel..." className="pl-10" /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button key={cat} variant={activeCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(cat)}
            className={cn(activeCategory === cat ? 'bg-allin-green hover:bg-allin-green-dark text-white' : '')}>{cat}</Button>
        ))}
      </div>
      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div> :
      articles.length === 0 ? <Card className="p-12 text-center"><Newspaper className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" /><p className="text-muted-foreground">Tidak ada artikel.</p></Card> :
      <div className="space-y-3">
        {articles.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setSelectedArticle(a.id); navigate('artikel-detail') }}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-allin-green transition-colors">{a.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                    <span className="text-xs text-muted-foreground">{a.author?.name || 'Redaksi'}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(a.createdAt), 'dd MMM yyyy', { locale: localeId })}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0"><Eye className="w-3 h-3 inline mr-0.5" />{a.viewCount}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>}
    </div>
  )
}