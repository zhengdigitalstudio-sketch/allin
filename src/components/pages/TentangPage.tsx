'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ChevronRight,
  Target,
  Lightbulb,
  Heart,
  Globe,
  Building2,
  Zap,
  GraduationCap,
  Briefcase,
  Users,
  Landmark,
  Banknote,
  Handshake,
  UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function SectionReveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const memberTypes = [
  { label: 'Perusahaan Energi Primer', icon: Zap },
  { label: 'Pembangkit Listrik', icon: Building2 },
  { label: 'Transmisi', icon: Globe },
  { label: 'Gardu Induk', icon: Zap },
  { label: 'Distribusi', icon: Lightbulb },
  { label: 'Profesi', icon: Briefcase },
  { label: 'Asosiasi Nirlaba', icon: Handshake },
  { label: 'BUMN', icon: Landmark },
  { label: 'Swasta', icon: Banknote },
  { label: 'Patungan & Asing', icon: Globe },
  { label: 'Perguruan Tinggi', icon: GraduationCap },
  { label: 'Koperasi', icon: Users },
  { label: 'Perorangan', icon: UserCircle },
]

const tujuan = [
  {
    icon: Target,
    title: 'Transparansi',
    description: 'Mengedepankan keterbukaan dalam setiap aspek pengelolaan organisasi dan komunikasi kepada seluruh pemangku kepentingan.',
  },
  {
    icon: Heart,
    title: 'Integritas',
    description: 'Menjunjung tinggi nilai-nilai kejujuran, etika profesional, dan akuntabilitas dalam setiap kegiatan dan kebijakan asosiasi.',
  },
  {
    icon: Lightbulb,
    title: 'Inovasi',
    description: 'Mendorong inovasi teknologi dan pendekatan baru dalam industri ketenagalistrikan untuk mencapai efisiensi dan keberlanjutan.',
  },
  {
    icon: Globe,
    title: 'Kolaborasi',
    description: 'Membangun kemitraan strategis antar anggota, pemerintah, lembaga pendidikan, dan organisasi internasional untuk kemajuan bersama.',
  },
]

export default function TentangPage() {
  const { navigate } = useAppStore()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Tentang ALLIN</span>
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Tentang ALLIN
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-lg max-w-2xl"
          >
            Mengenal lebih dekat Asosiasi Lingkungan Industri Ketenagalistrikan Nasional
          </motion.p>
        </div>
      </section>

      {/* What is ALLIN */}
      <SectionReveal className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-1 gradient-green rounded-full" />
              <span className="text-allin-green font-semibold text-sm uppercase tracking-wider">Profil</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-8">Apa itu ALLIN?</h2>

            <div className="space-y-6 text-muted-foreground leading-relaxed text-base md:text-lg">
              <p>
                Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN) adalah organisasi kemasyarakatan yang berbentuk asosiasi terbuka, didirikan sebagai wadah pemersatu bagi seluruh pelaku industri ketenagalistrikan di Indonesia. ALLIN hadir untuk menjembatani kepentingan berbagai pemangku kepentingan mulai dari perusahaan energi primer, pembangkit listrik, transmisi, distribusi, hingga profesi dan institusi akademis yang terlibat dalam ekosistem ketenagalistrikan nasional.
              </p>
              <p>
                Sebagai asosiasi terbuka, ALLIN tidak membatasi keanggotaan hanya pada satu segmen industri tertentu. Sebaliknya, ALLIN membuka pintu seluas-luasnya bagi perusahaan Badan Usaha Milik Negara (BUMN), swasta nasional, perusahaan patungan, maupun entitas asing yang beroperasi di sektor ketenagalistrikan Indonesia. Hal ini menjadikan ALLIN sebagai platform yang benar-benar inklusif dan representatif dalam mewakili suara industri ketenagalistrikan di tingkat nasional.
              </p>
              <p>
                Dalam menjalankan perannya, ALLIN aktif berkomunikasi dengan pemerintah, khususnya Kementerian Energi dan Sumber Daya Mineral (ESDM), regulator sektor kelistrikan, serta lembaga terkait lainnya. ALLIN berperan dalam menyampaikan aspirasi anggota, memberikan masukan terhadap kebijakan publik, serta memfasilitasi dialog konstruktif yang bertujuan untuk mewujudkan industri ketenagalistrikan yang transparan, berdaya saing, dan berkelanjutan demi kesejahteraan masyarakat Indonesia.
              </p>
            </div>
          </div>
        </div>
      </SectionReveal>

      <Separator className="max-w-6xl mx-auto" />

      {/* Anggota / Member Types */}
      <SectionReveal className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-1 gradient-gold rounded-full" />
              <span className="text-allin-yellow-dark font-semibold text-sm uppercase tracking-wider">Keanggotaan</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Jenis Anggota</h2>
            <p className="text-muted-foreground mb-10 max-w-2xl text-base md:text-lg">
              ALLIN menerima keanggotaan dari berbagai jenis entitas yang terlibat dalam ekosistem industri ketenagalistrikan nasional:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {memberTypes.map((type, i) => (
                <motion.div
                  key={type.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border hover:border-allin-green/30 hover:shadow-sm transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-allin-green/10 flex items-center justify-center flex-shrink-0 group-hover:bg-allin-green/20 transition-colors">
                      <type.icon className="w-5 h-5 text-allin-green" />
                    </div>
                    <span className="text-sm font-medium leading-tight">{type.label}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* Sejarah */}
      <SectionReveal className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-1 gradient-green rounded-full" />
              <span className="text-allin-green font-semibold text-sm uppercase tracking-wider">Latar Belakang</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-8">Sejarah Singkat</h2>

            <div className="relative pl-8 border-l-2 border-allin-green/20 space-y-8">
              <div className="relative">
                <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-allin-green border-4 border-background" />
                <h3 className="font-bold text-lg mb-2">Fondasi Awal</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ALLIN didirikan oleh sekelompok profesional dan pelaku industri ketenagalistrikan yang menyadari pentingnya sebuah wadah organisasi yang mampu menyatukan berbagai elemen industri. Mereka melihat kebutuhan akan sebuah platform yang bisa menjadi jembatan komunikasi antara pelaku industri, pemerintah, dan masyarakat.
                </p>
              </div>
              <div className="relative">
                <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-allin-green border-4 border-background" />
                <h3 className="font-bold text-lg mb-2">Pertumbuhan Organisasi</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Seiring berjalannya waktu, ALLIN terus berkembang dan memperluas basis keanggotaannya. Dari yang semula hanya diikuti oleh segelintir perusahaan, kini ALLIN telah menjadi asosiasi yang dihormati dengan anggota dari berbagai segmen industri ketenagalistrikan di seluruh Indonesia.
                </p>
              </div>
              <div className="relative">
                <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-allin-green border-4 border-background" />
                <h3 className="font-bold text-lg mb-2">Komitmen Masa Depan</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ALLIN berkomitmen untuk terus menjadi mitra strategis pemerintah dan masyarakat dalam mewujudkan ketahanan energi nasional. Melalui program-program yang inovatif dan kolaboratif, ALLIN terus mendorong transformasi industri ketenagalistrikan Indonesia menuju arah yang lebih hijau, efisien, dan berkelanjutan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* Values / Tujuan */}
      <SectionReveal className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-12 h-1 gradient-green rounded-full" />
                <span className="text-allin-green font-semibold text-sm uppercase tracking-wider">Nilai-Nilai</span>
                <div className="w-12 h-1 gradient-green rounded-full" />
              </div>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">Nilai & Tujuan ALLIN</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Empat pilar utama yang menjadi landasan setiap langkah dan kebijakan ALLIN dalam melayani anggota dan industri ketenagalistrikan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {tujuan.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-allin-green/10 flex items-center justify-center mb-4">
                        <item.icon className="w-6 h-6 text-allin-green" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* CTA */}
      <SectionReveal className="py-16 md:py-24 gradient-green">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">Bergabunglah dengan ALLIN</h2>
          <p className="text-white/75 max-w-xl mx-auto mb-8 text-lg">
            Jadilah bagian dari keluarga besar ALLIN dan berkontribusi dalam memajukan industri ketenagalistrikan Indonesia.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('pendaftaran')}
            className="gradient-gold text-allin-green-dark font-bold px-10 py-6 text-base hover:opacity-90 transition-opacity shadow-lg"
          >
            Daftar Sekarang
          </Button>
        </div>
      </SectionReveal>
    </div>
  )
}