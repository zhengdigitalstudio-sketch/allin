'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Shield,
  GraduationCap,
  FileText,
  Scale,
  Handshake,
  ArrowRight,
  MapPin,
  Calendar,
  Eye,
  Newspaper,
  Megaphone,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Article {
  id: string
  title: string
  excerpt: string | null
  category: string
  coverImage: string | null
  viewCount: number
  author: { name: string } | null
  createdAt: string
}

interface AgendaItem {
  id: string
  title: string
  description: string | null
  date: string
  location: string | null
  status: string
}

interface Announcement {
  id: string
  title: string
  content: string | null
  createdAt: string
}

interface Stats {
  totalMembers: number
  totalArticles: number
  totalPengurus: number
  totalAgenda: number
}

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) return
    let startTime: number | null = null
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])

  return <span>{count.toLocaleString('id-ID')}</span>
}

function SectionWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const { navigate, setSelectedArticle } = useAppStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [agendas, setAgendas] = useState<AgendaItem[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, articlesRes, agendaRes, announcementsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/articles?limit=3&status=PUBLISHED'),
          fetch('/api/agenda?limit=3&status=AKTIF'),
          fetch('/api/announcements?limit=3'),
        ])
        const [statsData, articlesData, agendaData, announcementsData] = await Promise.all([
          statsRes.json(),
          articlesRes.json(),
          agendaRes.json(),
          announcementsRes.json(),
        ])
        if (!statsData.error) setStats(statsData)
        if (!articlesData.error) setArticles(articlesData.articles || [])
        if (!agendaData.error) {
          const upcoming = (agendaData.agenda || []).filter(
            (a: AgendaItem) => new Date(a.date) >= new Date(new Date().toDateString())
          )
          setAgendas(upcoming.slice(0, 3))
        }
        if (!announcementsData.error) setAnnouncements(announcementsData.announcements || [])
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const features = [
    { icon: Users, title: 'Jaringan Profesional', description: 'Terhubung dengan para profesional dan pelaku industri ketenagalistrikan dari seluruh Indonesia untuk memperluas jejaring dan peluang kolaborasi.' },
    { icon: Shield, title: 'Regulasi Terkini', description: 'Akses informasi terbaru mengenai regulasi dan kebijakan di sektor ketenagalistrikan nasional yang relevan untuk bisnis Anda.' },
    { icon: GraduationCap, title: 'Pelatihan & Seminar', description: 'Ikuti berbagai program pelatihan, seminar, dan workshop yang dirancang khusus untuk meningkatkan kompetensi di industri ini.' },
    { icon: FileText, title: 'Akses Dokumen', description: 'Dapatkan akses ke dokumen standar, panduan teknis, dan publikasi penting di bidang ketenagalistrikan dan lingkungan industri.' },
    { icon: Scale, title: 'Advokasi Kebijakan', description: 'ALLIN berperan aktif dalam mengadvokasi kebijakan yang mendukung perkembangan industri ketenagalistrikan yang berkelanjutan.' },
    { icon: Handshake, title: 'Kolaborasi Industri', description: 'Fasilitasi kolaborasi antar perusahaan, institusi pendidikan, dan pemerintah untuk kemajuan industri ketenagalistrikan nasional.' },
  ]

  const statItems = [
    { label: 'Anggota Aktif', value: stats?.totalMembers ?? 0, icon: Users },
    { label: 'Artikel', value: stats?.totalArticles ?? 0, icon: Newspaper },
    { label: 'Pengurus', value: stats?.totalPengurus ?? 0, icon: Shield },
    { label: 'Kegiatan', value: stats?.totalAgenda ?? 0, icon: Calendar },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-hero min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
        {/* Animated floating decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-4 h-4 rounded-full bg-allin-yellow-light/30 animate-float" />
          <div className="absolute top-40 right-[15%] w-6 h-6 rounded-full bg-white/10 animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-32 left-[20%] w-3 h-3 rounded-full bg-allin-yellow-light/20 animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-60 left-[60%] w-5 h-5 rounded-full bg-white/5 animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-48 right-[25%] w-8 h-8 rounded-full bg-allin-yellow-light/15 animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-32 left-[40%] w-2 h-2 rounded-full bg-white/15 animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-24 left-[70%] w-4 h-4 rounded-full bg-allin-yellow-light/25 animate-float" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-16 right-[40%] w-3 h-3 rounded-full bg-white/10 animate-float" style={{ animationDelay: '4s' }} />
          <div className="absolute top-[70%] left-[5%] w-6 h-6 rounded-full bg-allin-green-light/10 animate-float" style={{ animationDelay: '3.5s' }} />
          <div className="absolute top-[45%] right-[8%] w-5 h-5 rounded-full bg-allin-yellow-light/10 animate-float" style={{ animationDelay: '1.2s' }} />
          {/* Overlay pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.03)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(234,179,8,0.04)_0%,transparent_50%)]" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 glass-card rounded-full px-5 py-2 mb-8"
            >
              <Zap className="w-4 h-4 text-allin-yellow-light" />
              <span className="text-white/80 text-sm font-medium">Asosiasi Terkemuka di Industri Ketenagalistrikan</span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Asosiasi Lingkungan Industri{' '}
              <span className="text-gradient-gold">Ketenagalistrikan Nasional</span>
            </h1>

            <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
              ALLIN adalah asosiasi terbuka yang menghimpun seluruh pemangku kepentingan di industri ketenagalistrikan Indonesia. Bersama kita membangun ekosistem industri yang lebih kuat, berkelanjutan, dan berdaya saing.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('pendaftaran')}
                className="gradient-gold text-allin-green-dark font-bold px-8 py-6 text-base hover:opacity-90 transition-opacity shadow-lg"
              >
                Bergabung Sekarang
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('tentang')}
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base transition-colors"
              >
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="gradient-green py-8 md:py-10">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 bg-white/10" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="bg-white/95 shadow-md border-0 p-4 md:p-6 text-center">
                    <CardContent className="p-0">
                      <item.icon className="w-6 h-6 text-allin-green mx-auto mb-2" />
                      <div className="text-2xl md:text-3xl font-bold text-allin-green">
                        <AnimatedCounter target={item.value} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Preview */}
      <SectionWrapper className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-1 gradient-green rounded-full" />
              <span className="text-allin-green font-semibold text-sm uppercase tracking-wider">Tentang Kami</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-8">Tentang ALLIN</h2>

            <div className="space-y-5 text-muted-foreground leading-relaxed text-base md:text-lg">
              <p>
                Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN) merupakan organisasi yang berdedikasi untuk memajukan dan mengembangkan industri ketenagalistrikan di Indonesia. Didirikan sebagai wadah bagi seluruh pelaku industri, ALLIN berkomitmen untuk menciptakan lingkungan bisnis yang kondusif bagi pertumbuhan sektor kelistrikan nasional.
              </p>
              <p>
                Sebagai asosiasi terbuka, ALLIN menerima keanggotaan dari berbagai lapisan industri mulai dari perusahaan energi primer, pembangkit listrik, transmisi, distribusi, hingga perguruan tinggi dan perorangan yang memiliki kepedulian terhadap kemajuan ketenagalistrikan Indonesia. Dengan keragaman anggota ini, ALLIN mampu menjadi forum yang representatif untuk menyuarakan aspirasi seluruh pemangku kepentingan.
              </p>
              <p>
                Melalui berbagai program dan kegiatan, ALLIN terus berupaya meningkatkan kompetensi sumber daya manusia, mendorong inovasi teknologi, serta memperkuat kerja sama antar pemangku kepentingan dalam rangka mewujudkan ketahanan energi nasional yang berkelanjutan.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('tentang')}
              className="mt-8 border-allin-green text-allin-green hover:bg-allin-green hover:text-white"
            >
              Selengkapnya
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </SectionWrapper>

      {/* Features / Why Join */}
      <SectionWrapper className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-1 gradient-gold rounded-full" />
              <span className="text-allin-yellow-dark font-semibold text-sm uppercase tracking-wider">Keunggulan</span>
              <div className="w-12 h-1 gradient-gold rounded-full" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Mengapa Bergabung dengan ALLIN?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Manfaat nyata yang akan Anda dapatkan sebagai anggota ALLIN untuk mendukung pertumbuhan bisnis dan profesionalisme Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-allin-green/10 flex items-center justify-center mb-4 group-hover:bg-allin-green/20 transition-colors">
                      <feature.icon className="w-7 h-7 text-allin-green" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Latest Articles */}
      <SectionWrapper className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-1 gradient-green rounded-full" />
                <span className="text-allin-green font-semibold text-sm uppercase tracking-wider">Publikasi</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold">Artikel Terbaru</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('artikel')}
              className="border-allin-green text-allin-green hover:bg-allin-green hover:text-white"
            >
              Lihat Semua Artikel
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <Card className="p-12 text-center">
              <Newspaper className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada artikel yang dipublikasikan.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card
                    className="h-full cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden"
                    onClick={() => {
                      setSelectedArticle(article.id)
                      navigate('artikel-detail')
                    }}
                  >
                    {/* Cover placeholder */}
                    <div className="h-44 gradient-green flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                      <Newspaper className="w-12 h-12 text-white/40" />
                      <Badge className="absolute top-3 left-3 bg-allin-yellow-light text-allin-green-dark text-xs font-semibold">
                        {article.category}
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-allin-green transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                        {article.excerpt || 'Artikel terbaru dari ALLIN mengenai perkembangan industri ketenagalistrikan nasional.'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{article.author?.name || 'Redaksi ALLIN'}</span>
                        <span>{format(new Date(article.createdAt), 'dd MMM yyyy', { locale: localeId })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </SectionWrapper>

      {/* Upcoming Agenda */}
      <SectionWrapper className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-1 gradient-gold rounded-full" />
                <span className="text-allin-yellow-dark font-semibold text-sm uppercase tracking-wider">Jadwal</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold">Agenda Mendatang</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('agenda')}
              className="border-allin-green text-allin-green hover:bg-allin-green hover:text-white"
            >
              Lihat Semua
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : agendas.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada agenda yang dijadwalkan.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {agendas.map((agenda, i) => {
                const agendaDate = new Date(agenda.date)
                return (
                  <motion.div
                    key={agenda.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-allin-green/10 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-allin-green leading-none">
                              {format(agendaDate, 'dd')}
                            </span>
                            <span className="text-xs text-allin-green font-medium uppercase">
                              {format(agendaDate, 'MMM', { locale: localeId })}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-base mb-1 line-clamp-2">{agenda.title}</h3>
                            {agenda.location && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{agenda.location}</span>
                              </div>
                            )}
                            {agenda.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{agenda.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </SectionWrapper>

      {/* Announcements */}
      {announcements.length > 0 && (
        <SectionWrapper className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-1 gradient-green rounded-full" />
                <span className="text-allin-green font-semibold text-sm uppercase tracking-wider">Informasi</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold">Pengumuman</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.map((announcement, i) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>{format(new Date(announcement.createdAt), 'dd MMMM yyyy', { locale: localeId })}</span>
                      </div>
                      <CardTitle className="text-base leading-snug">{announcement.title}</CardTitle>
                    </CardHeader>
                    {announcement.content && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-3">{announcement.content}</p>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* CTA Section */}
      <section className="gradient-green py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-[10%] w-32 h-32 rounded-full bg-white/5 animate-float" />
          <div className="absolute bottom-10 left-[15%] w-24 h-24 rounded-full bg-allin-yellow-light/10 animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <SectionWrapper>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
              Siap Bergabung?
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8 text-lg">
              Jadilah bagian dari komunitas profesional industri ketenagalistrikan terbesar di Indonesia. Bersama kita wujudkan ketahanan energi nasional.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('pendaftaran')}
              className="gradient-gold text-allin-green-dark font-bold px-10 py-6 text-base hover:opacity-90 transition-opacity shadow-lg"
            >
              Daftar Sekarang
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </SectionWrapper>
        </div>
      </section>
    </div>
  )
}