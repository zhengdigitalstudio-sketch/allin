'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { ChevronRight, Quote } from 'lucide-react'

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

const visiText = 'Menjadi asosiasi terkemuka dan terpercaya yang menjadi motor penggerak kemajuan industri ketenagalistrikan nasional, serta mampu berkontribusi nyata dalam mewujudkan ketahanan energi Indonesia yang berkelanjutan dan berdaya saing global.'

const misiItems = [
  {
    number: 1,
    title: 'Menghimpun dan Memersatukan',
    description: 'Menghimpun dan mempersatukan seluruh pelaku industri ketenagalistrikan nasional dalam satu wadah organisasi yang inklusif, transparan, dan akuntabel untuk memperkuat posisi industri di tingkat nasional maupun internasional.',
  },
  {
    number: 2,
    title: 'Meningkatkan Kompetensi SDM',
    description: 'Menyelenggarakan program pelatihan, seminar, workshop, dan sertifikasi profesional untuk meningkatkan kompetensi sumber daya manusia di sektor ketenagalistrikan agar mampu bersaing di era transisi energi.',
  },
  {
    number: 3,
    title: 'Mendorong Inovasi Teknologi',
    description: 'Memfasilitasi pengembangan dan adopsi teknologi baru di bidang ketenagalistrikan, termasuk energi terbarukan, smart grid, efisiensi energi, dan teknologi penyimpanan energi untuk mendukung dekarbonisasi nasional.',
  },
  {
    number: 4,
    title: 'Menjalin Kerja Sama Strategis',
    description: 'Membangun dan memperkuat kerja sama dengan pemerintah, lembaga regulasi, perguruan tinggi, asosiasi industri terkait, serta organisasi internasional untuk menciptakan ekosistem ketenagalistrikan yang kondusif.',
  },
  {
    number: 5,
    title: 'Mengadvokasi Kebijakan Publik',
    description: 'Menyampaikan aspirasi dan rekomendasi kebijakan kepada pemerintah dan regulator terkait peraturan perundang-undangan yang berdampak pada industri ketenagalistrikan, guna menciptakan iklim usaha yang fair dan prediktabel.',
  },
  {
    number: 6,
    title: 'Mendukung Transisi Energi',
    description: 'Berkontribusi aktif dalam upaya transisi energi nasional menuju sistem ketenagalistrikan yang lebih hijau, rendah emisi, dan berkelanjutan sesuai dengan komitmen Indonesia terhadap Perjanjian Paris dan Tujuan Pembangunan Berkelanjutan (SDGs).',
  },
  {
    number: 7,
    title: 'Meningkatkan Kesadaran Publik',
    description: 'Mengedukasi masyarakat mengenai pentingnya efisiensi energi, keamanan listrik, dan peran industri ketenagalistrikan dalam kehidupan sehari-hari melalui berbagai program sosialisasi dan publikasi.',
  },
]

export default function VisiMisiPage() {
  const { navigate } = useAppStore()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Visi & Misi</span>
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Visi & Misi
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-lg max-w-2xl"
          >
            Arah dan tujuan yang menjadi landasan setiap langkah ALLIN
          </motion.p>
        </div>
      </section>

      {/* Visi */}
      <SectionReveal className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-1 gradient-green rounded-full" />
              <span className="text-allin-green font-semibold text-sm uppercase tracking-wider">Visi</span>
            </div>

            <div className="relative pl-8 md:pl-12 border-l-4 border-allin-green">
              <Quote className="absolute -left-3 top-0 w-6 h-6 text-allin-green -rotate-90 hidden md:block" />
              <blockquote className="text-xl md:text-2xl lg:text-3xl font-bold leading-relaxed text-foreground">
                {visiText}
              </blockquote>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* Misi */}
      <SectionReveal className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-1 gradient-gold rounded-full" />
              <span className="text-allin-yellow-dark font-semibold text-sm uppercase tracking-wider">Misi</span>
            </div>

            <div className="space-y-8">
              {misiItems.map((item, i) => (
                <motion.div
                  key={item.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex gap-5"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full gradient-green flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {item.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </SectionReveal>
    </div>
  )
}