'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronRight,
  ChevronLeft,
  User,
  Calendar,
  Eye,
  Share2,
  MessageCircle,
  Newspaper,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Article {
  id: string
  title: string
  content: string | null
  excerpt: string | null
  category: string
  coverImage: string | null
  viewCount: number
  author: { name: string; id: string } | null
  createdAt: string
  publishedAt: string | null
}

export default function ArtikelDetailPage() {
  const { navigate, selectedArticleId, setSelectedArticle } = useAppStore()
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedArticleId) {
      setLoading(false)
      return
    }

    const fetchArticle = async () => {
      setLoading(true)
      try {
        // Increment view count
        await fetch(`/api/articles?view=${selectedArticleId}`)

        const articleRes = await fetch(`/api/articles?status=PUBLISHED&limit=100`)
        const articleData = await articleRes.json()

        if (!articleData.error && articleData.articles) {
          const found = articleData.articles.find((a: Article) => a.id === selectedArticleId)
          if (found) {
            setArticle(found)

            // Fetch related articles
            const related = articleData.articles
              .filter((a: Article) => a.category === found.category && a.id !== found.id)
              .slice(0, 3)
            setRelatedArticles(related)
          }
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [selectedArticleId])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = article?.title || ''

  const shareLinks = [
    {
      name: 'WhatsApp',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      color: 'bg-sky-500 hover:bg-sky-600',
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'LinkedIn',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: 'bg-blue-700 hover:bg-blue-800',
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen">
        <section className="gradient-hero py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-60 bg-white/10 mb-6" />
            <Skeleton className="h-12 w-96 bg-white/10 max-w-full" />
          </div>
        </section>
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-64 mb-6" />
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Newspaper className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Artikel Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-6">Artikel yang Anda cari tidak tersedia atau telah dihapus.</p>
          <Button onClick={() => navigate('artikel')} variant="outline" className="border-allin-green text-allin-green">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Kembali ke Artikel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb in hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => { setSelectedArticle(null); navigate('artikel') }} className="hover:text-white transition-colors">Artikel</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white line-clamp-1 max-w-[200px]">{article.title}</span>
          </nav>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="bg-allin-yellow-light text-allin-green-dark text-xs font-semibold mb-4">
              {article.category}
            </Badge>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {article.author?.name || 'Redaksi ALLIN'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(article.publishedAt || article.createdAt), 'dd MMMM yyyy', { locale: localeId })}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {article.viewCount}x dilihat
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => { setSelectedArticle(null); navigate('artikel') }}
            className="mb-8 -ml-2 text-muted-foreground hover:text-allin-green"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Kembali ke Daftar Artikel
          </Button>

          {/* Cover */}
          {article.coverImage ? (
            <div className="rounded-2xl overflow-hidden mb-8">
              <img src={article.coverImage} alt={article.title} className="w-full h-64 md:h-96 object-cover" />
            </div>
          ) : (
            <div className="h-48 md:h-72 gradient-green rounded-2xl mb-8 flex items-center justify-center">
              <Newspaper className="w-16 h-16 text-white/20" />
            </div>
          )}

          {/* Article body */}
          <div className="prose prose-lg max-w-none">
            {article.content ? (
              <div
                className="text-muted-foreground leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <p className="text-muted-foreground">
                {article.excerpt || 'Konten artikel sedang dalam proses penulisan.'}
              </p>
            )}
          </div>

          {/* Share */}
          <div className="mt-10 pt-8 border-t">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Share2 className="w-4 h-4 text-allin-green" />
                Bagikan:
              </div>
              <div className="flex gap-2">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${link.color} text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors`}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-allin-green" />
                Artikel Terkait
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((related, i) => (
                  <motion.div
                    key={related.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <Card
                      className="h-full cursor-pointer border-0 shadow-sm hover:shadow-md transition-all group"
                      onClick={() => {
                        setSelectedArticle(related.id)
                        window.scrollTo(0, 0)
                        // Re-fetch
                        setArticle(related)
                        setRelatedArticles(relatedArticles.filter(a => a.id !== related.id).slice(0, 3))
                      }}
                    >
                      <CardContent className="p-5">
                        <Badge className="bg-allin-green/10 text-allin-green text-xs font-semibold mb-3">
                          {related.category}
                        </Badge>
                        <h3 className="font-bold text-sm line-clamp-2 group-hover:text-allin-green transition-colors mb-2">
                          {related.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {related.viewCount}
                          </span>
                          <span>
                            {format(new Date(related.createdAt), 'dd MMM yyyy', { locale: localeId })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}