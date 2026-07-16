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
  FileText,
  Download,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Article {
  id: string
  slug: string
  title: string
  content: string | null
  excerpt: string | null
  category: string
  coverImage: string | null
  viewCount: number
  author: { name: string; id: string } | null
  createdAt: string
  publishedAt: string | null
  pdfName?: string | null
}

export default function ArtikelDetailPage() {
  const { navigate, navigateArticle, selectedArticleSlug, setSelectedArticle } = useAppStore()
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedArticleSlug) {
      setLoading(false)
      setArticle(null)
      setRelatedArticles([])
      return
    }

    const fetchArticle = async () => {
      setLoading(true)
      try {
        // Fetch article by slug
        const articleRes = await fetch(`/api/articles?slug=${encodeURIComponent(selectedArticleSlug)}&status=PUBLISHED`)
        const articleData = await articleRes.json()

        if (!articleData.error && articleData.articles?.length > 0) {
          const found = articleData.articles[0] as Article
          setArticle(found)

          // Update document title
          document.title = `${found.title} - ALLIN`

          // Fetch related articles (same category, published)
          const relatedRes = await fetch(`/api/articles?status=PUBLISHED&category=${encodeURIComponent(found.category)}&limit=10`)
          const relatedData = await relatedRes.json()
          if (!relatedData.error && relatedData.articles) {
            setRelatedArticles(relatedData.articles.filter((a: Article) => a.id !== found.id).slice(0, 3))
          }
        } else {
          setArticle(null)
          setRelatedArticles([])
        }
      } catch {
        setArticle(null)
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [selectedArticleSlug])

  // Scroll to top when article changes (must be before any early returns - Rules of Hooks)
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [selectedArticleSlug])

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
    <div className="min-h-screen overflow-x-hidden">
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
        <div className="container mx-auto px-4 max-w-4xl w-full">
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

          {/* ====== REGULASI: tampilkan box download PDF sebagai konten utama ====== */}
          {article.category === 'Regulasi' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="pdf-download-section"
            >
              <div className="flex flex-col items-center text-center gap-4 sm:gap-6">
                {/* Animated PDF Icon */}
                <motion.div 
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-allin-green to-allin-green-dark shadow-lg shadow-allin-green/30"
                >
                  <FileText className="h-12 w-12 text-white" />
                </motion.div>
                <div className="space-y-3">
                  <h2 className="text-2xl md:text-3xl font-bold text-allin-green-dark">
                    📄 Dokumen Regulasi Tersedia
                  </h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Dokumen regulasi resmi dalam format PDF. Unduh untuk dibaca offline atau buka langsung di browser Anda.
                  </p>
                </div>

                {article.pdfName ? (
                  <>
                    {/* File Info Card */}
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-full max-w-md p-4 rounded-xl bg-white/80 dark:bg-white/5 border border-allin-green/20 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {article.pdfName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            File PDF • Dokumen Resmi
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Download Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pdf-download-buttons">
                      <motion.a
                        href={`/api/articles/${article.id}/pdf?download=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={article.pdfName || undefined}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-allin-green hover:bg-allin-green-dark text-white font-bold text-lg transition-all shadow-lg shadow-allin-green/30 hover:shadow-xl hover:shadow-allin-green/40"
                      >
                        <Download className="h-6 w-6" />
                        Unduh PDF Sekarang
                      </motion.a>
                      <motion.a
                        href={`/api/articles/${article.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-allin-green border-2 border-allin-green/30 font-bold transition-all"
                      >
                        <FileText className="h-5 w-5" />
                        Buka di Browser
                      </motion.a>
                    </div>

                    {/* Helper Text */}
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Klik "Unduh PDF Sekarang" untuk menyimpan file ke perangkat Anda
                    </p>
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-5 py-4 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-900 max-w-md"
                  >
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      ⏳ Dokumen PDF belum diunggah
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      Silakan hubungi pengurus untuk informasi lebih lanjut mengenai dokumen regulasi ini.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              {/* ====== NON-REGULASI: tampilkan body artikel seperti biasa ====== */}
              <div className="prose prose-lg max-w-none [&_img]:max-w-full [&_img]:h-auto [&_iframe]:max-w-full [&_video]:max-w-full [&_a]:break-all [&_pre]:overflow-x-auto">
                {article.content ? (
                  <div
                    className="text-muted-foreground leading-relaxed space-y-4 break-words overflow-wrap-anywhere"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {article.excerpt || 'Konten artikel sedang dalam proses penulisan.'}
                  </p>
                )}
              </div>

              {/* PDF Download — for non-Regulasi articles with attached PDF */}
              {article.pdfName && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="mt-8 p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-2 border-red-200 dark:border-red-900 rounded-2xl shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <motion.div 
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md"
                    >
                      <FileText className="h-8 w-8 text-white" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-red-900 dark:text-red-100 mb-1">
                        📎 Lampiran PDF Tersedia
                      </h3>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 truncate mb-2">
                        {article.pdfName}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Dokumen terkait artikel ini. Klik tombol untuk mengunduh atau membuka di browser.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                      <motion.a
                        href={`/api/articles/${article.id}/pdf?download=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={article.pdfName || undefined}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-md hover:shadow-lg"
                      >
                        <Download className="h-5 w-5" />
                        Unduh PDF
                      </motion.a>
                      <a
                        href={`/api/articles/${article.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-white/10 text-red-600 border border-red-300 dark:border-red-700 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        Buka
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Share */}
          <div className="mt-10 pt-8 border-t">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Share2 className="w-4 h-4 text-allin-green" />
                Bagikan:
              </div>
              <div className="flex flex-wrap gap-2">
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
                {/* Download PDF button — shown for non-Regulasi articles with PDF attached.
                    Regulasi already has the prominent download area above. */}
                {article.pdfName && article.category !== 'Regulasi' && (
                  <motion.a
                    href={`/api/articles/${article.id}/pdf?download=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={article.pdfName || undefined}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                    title={`Unduh ${article.pdfName}`}
                  >
                    <Download className="w-4 h-4" />
                    Unduh PDF
                  </motion.a>
                )}
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
                        if (related.slug) navigateArticle(related.slug)
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