'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ChevronRight, Search } from 'lucide-react'

const faqItems = [
  {
    question: 'Apa itu ALLIN?',
    answer: 'ALLIN (Asosiasi Lingkungan Industri Ketenagalistrikan Nasional) adalah organisasi asosiasi terbuka yang menghimpun seluruh pelaku industri ketenagalistrikan di Indonesia. ALLIN berperan sebagai wadah komunikasi, advokasi, dan kolaborasi antar pemangku kepentingan di sektor kelistrikan nasional.',
  },
  {
    question: 'Siapa saja yang bisa bergabung menjadi anggota ALLIN?',
    answer: 'ALLIN menerima keanggotaan dari berbagai jenis entitas, termasuk perusahaan energi primer, pembangkit listrik, transmisi, gardu induk, distribusi, profesi individu, asosiasi nirlaba, BUMN, perusahaan swasta, perusahaan patungan dan asing, perguruan tinggi, koperasi, dan perorangan yang memiliki kepedulian terhadap industri ketenagalistrikan.',
  },
  {
    question: 'Bagaimana cara mendaftar sebagai anggota ALLIN?',
    answer: 'Pendaftaran dapat dilakukan secara online melalui halaman Pendaftaran di website ini. Anda perlu mengisi formulir pendaftaran dengan data pribadi dan perusahaan, memilih jenis keanggotaan, serta melampirkan dokumen yang diperlukan. Setelah pendaftaran dikirim, tim pengurus ALLIN akan melakukan verifikasi dan memberikan konfirmasi melalui email.',
  },
  {
    question: 'Apakah ada biaya keanggotaan?',
    answer: 'Informasi mengenai biaya keanggotaan (iuran) disampaikan setelah pendaftaran Anda disetujui. Besaran iuran dapat bervariasi tergantung pada jenis keanggotaan yang dipilih. Untuk informasi lebih lanjut, silakan hubungi sekretariat ALLIN melalui halaman Kontak.',
  },
  {
    question: 'Apa saja manfaat menjadi anggota ALLIN?',
    answer: 'Sebagai anggota ALLIN, Anda mendapatkan akses ke jaringan profesional industri ketenagalistrikan, informasi regulasi terkini, program pelatihan dan seminar, akses dokumen dan publikasi, partisipasi dalam advokasi kebijakan, serta kesempatan kolaborasi dengan berbagai pemangku kepentingan industri.',
  },
  {
    question: 'Berapa lama proses verifikasi pendaftaran?',
    answer: 'Proses verifikasi pendaftaran biasanya memerlukan waktu 7-14 hari kerja. Tim pengurus akan memeriksa kelengkapan data dan dokumen yang Anda kirimkan. Jika terdapat kekurangan, Anda akan dihubungi melalui email untuk melengkapi persyaratan.',
  },
  {
    question: 'Apakah ALLIN menyelenggarakan kegiatan rutin?',
    answer: 'Ya, ALLIN secara rutin menyelenggarakan berbagai kegiatan seperti seminar, workshop, pelatihan, rapat anggota, dan pertemuan dengan pemangku kepentingan. Informasi mengenai jadwal kegiatan dapat dilihat pada halaman Agenda di website ini.',
  },
  {
    question: 'Bagaimana cara menghubungi pengurus ALLIN?',
    answer: 'Anda dapat menghubungi pengurus ALLIN melalui halaman Kontak di website ini, atau mengirim email langsung ke alamat email yang tercantum. Untuk keperluan mendesak, Anda juga dapat menghubungi melalui nomor telepon yang tersedia.',
  },
  {
    question: 'Apakah anggota ALLIN bisa berpartisipasi dalam kebijakan regulasi?',
    answer: 'Salah satu fungsi utama ALLIN adalah mengadvokasi kebijakan yang mendukung industri ketenagalistrikan. Anggota dapat berpartisipasi dengan menyampaikan aspirasi melalui forum diskusi, rapat anggota, atau secara langsung kepada tim pengurus yang berkomunikasi dengan regulator dan pemerintah.',
  },
  {
    question: 'Apakah ALLIN bekerja sama dengan lembaga internasional?',
    answer: 'Ya, ALLIN terbuka untuk menjalin kerja sama dengan berbagai organisasi dan lembaga internasional di bidang ketenagalistrikan. Kerja sama ini bertujuan untuk memperluas wawasan, berbagi praktik terbaik, dan meningkatkan daya saing industri ketenagalistrikan Indonesia di tingkat global.',
  },
]

export default function FAQPage() {
  const { navigate } = useAppStore()
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
    if (!search.trim()) return faqItems
    const q = search.toLowerCase()
    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">FAQ</span>
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Pertanyaan Umum (FAQ)
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-lg max-w-2xl"
          >
            Temukan jawaban untuk pertanyaan yang sering diajukan tentang ALLIN
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari pertanyaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Tidak ada pertanyaan yang cocok dengan pencarian Anda.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Accordion type="single" collapsible className="space-y-3">
                {filteredItems.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="bg-background border rounded-xl shadow-sm px-6 data-[state=open]:shadow-md transition-shadow"
                  >
                    <AccordionTrigger className="text-left text-base font-medium hover:no-underline py-5">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          )}

          {search && filteredItems.length > 0 && (
            <p className="text-sm text-muted-foreground mt-6">
              Menampilkan {filteredItems.length} dari {faqItems.length} pertanyaan
            </p>
          )}
        </div>
      </section>
    </div>
  )
}