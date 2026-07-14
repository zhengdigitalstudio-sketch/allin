'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, ARTICLE_CATEGORIES } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronRight,
  Search,
  Newspaper,
  Eye,
  User,
  ArrowLeft,
  ArrowRight,
  X,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string
  coverImage: string | null
  viewCount: number
  author: { name: string } | null
  createdAt: string
  pdfName?: string | null
}

interface CategoryCount {
  category: string
  count: number
}

const categories = ['Semua', ...ARTICLE_CATEGORIES]

export default function ArtikelPage() {
  const { navigate, navigateArticle, setSelectedArticle } = useAppStore()
  const [articles, setArticles] = useState<Article[]>([])
  const [popularArticles, setPopularArticles] = useState<Article[]>([])
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([])
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 6

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', 'PUBLISHED')
      params.set('limit', String(limit))
      params.set('page', String(page))
      if (activeCategory !== 'Semua') params.set('category', activeCategory)
      if (search) params.set('search', search)

      const res = await fetch(`/api/articles?${params}`)
      const data = await res.json()
      if (!data.error) {
        setArticles(data.articles || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [activeCategory, search, page])

  const fetchSidebar = useCallback(async () => {
    try {
      const [popularRes, allRes] = await Promise.all([
        fetch('/api/articles?status=PUBLISHED&limit=3'),
        fetch('/api/articles?status=PUBLISHED&limit=100'),
      ])
      const popularData = await popularRes.json()
      const allData = await allRes.json()

      if (!popularData.error) {
        const sorted = [...(popularData.articles || [])].sort((a: Article, b: Article) => b.viewCount - a.viewCount)
        setPopularArticles(sorted.slice(0, 3))
      }

      if (!allData.error) {
        const counts: Record<string, number> = {}
        ;(allData.articles || []).forEach((a: Article) => {
          counts[a.category] = (counts[a.category] || 0) + 1
        })
        setCategoryCounts(
          Object.entries(counts)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
        )
      }
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  useEffect(() => {
    fetchSidebar()
  }, [fetchSidebar])

  useEffect(() => {
    setPage(1)
  }, [activeCategory, search])

  const handleSearch = () => {
    setSearch(searchInput)
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Artikel</span>
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Artikel
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-md"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari artikel..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-white/95"
                />
              </div>
              {search && (
                <Button variant="ghost" size="icon" onClick={() => { setSearchInput(''); setSearch('') }}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-8">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      activeCategory === cat
                        ? 'bg-allin-green hover:bg-allin-green-dark text-white'
                        : 'border-border hover:border-allin-green hover:text-allin-green'
                    )}
                  >
                    {cat}
                  </Button>
                ))}
              </div>

              {/* Articles */}
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <Card className="p-12 text-center">
                  <Newspaper className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg mb-2">Tidak ada artikel ditemukan</p>
                  <p className="text-muted-foreground text-sm">Coba ubah filter pencarian atau kategori Anda.</p>
                </Card>
              ) : (
                <>
                  <div className="space-y-4">
                    {articles.map((article, i) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                      >
                        <Card
                          className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden group border-0 shadow-sm"
                          onClick={() => {
                            if (article.slug) navigateArticle(article.slug)
                          }}
                        >
                          <div className="flex flex-col sm:flex-row">
                            {/* Cover */}
                            <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0 relative overflow-hidden">
                              {article.coverImage ? (
                                <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full gradient-green flex items-center justify-center">
                                  <Newspaper className="w-8 h-8 text-white/30" />
                                </div>
                              )}
                              <Badge className="absolute top-2 left-2 bg-allin-yellow-light text-allin-green-dark text-[10px] font-semibold">
                                {article.category}
                              </Badge>
                            </div>
                            {/* Content */}
                            <CardContent className="p-4 sm:p-5 flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-1.5">
                                <h3 className="font-bold text-base line-clamp-2 group-hover:text-allin-green transition-colors flex-1">
                                  {article.title}
                                </h3>
                                {article.pdfName && (
                                  <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] font-semibold shrink-0 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    PDF
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                                {article.excerpt || 'Artikel terbaru dari ALLIN mengenai perkembangan industri ketenagalistrikan nasional.'}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {article.author?.name || 'Redaksi ALLIN'}
                                  </span>
                                  <span>{format(new Date(article.createdAt), 'dd MMM yyyy', { locale: localeId })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {article.pdfName && (
                                    <a
                                      href={`/api/articles/${article.id}/pdf`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:underline font-medium"
                                      title={`Unduh ${article.pdfName}`}
                                    >
                                      <FileText className="w-3 h-3" />
                                      Unduh PDF
                                    </a>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {article.viewCount}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Button
                          key={p}
                          variant={page === p ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(p)}
                          className={page === p ? 'bg-allin-green hover:bg-allin-green-dark text-white' : ''}
                        >
                          {p}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
              {/* Popular Articles */}
              <div className="bg-muted/50 rounded-xl p-5">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-allin-green" />
                  Artikel Populer
                </h3>
                {popularArticles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data.</p>
                ) : (
                  <div className="space-y-4">
                    {popularArticles.map((article, i) => (
                      <div
                        key={article.id}
                        className="flex gap-3 cursor-pointer group"
                        onClick={() => {
                          if (article.slug) navigateArticle(article.slug)
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-allin-green/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-allin-green">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium line-clamp-2 group-hover:text-allin-green transition-colors">
                            {article.title}
                          </h4>
                          <span className="text-xs text-muted-foreground">{article.viewCount}x dilihat</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Categories */}
              <div className="bg-muted/50 rounded-xl p-5">
                <h3 className="font-bold text-base mb-4">Kategori</h3>
                {categoryCounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data.</p>
                ) : (
                  <div className="space-y-2">
                    {categoryCounts.map((item) => (
                      <button
                        key={item.category}
                        onClick={() => {
                          setActiveCategory(item.category)
                          setPage(1)
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                          activeCategory === item.category
                            ? 'bg-allin-green text-white font-medium'
                            : 'hover:bg-allin-green/10 text-muted-foreground hover:text-allin-green'
                        )}
                      >
                        <span>{item.category}</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs',
                            activeCategory === item.category && 'bg-white/20 text-white'
                          )}
                        >
                          {item.count}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}