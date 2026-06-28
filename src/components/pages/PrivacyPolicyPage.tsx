'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { ChevronRight } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const sections = [
  {
    title: 'Pendahuluan',
    content: `Kebijakan Privasi ini menjelaskan bagaimana Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN) mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi pengguna website ini. Kebijakan ini berlaku untuk seluruh pengunjung dan pengguna layanan yang tersedia di website ALLIN.

Dengan mengakses dan menggunakan website ini, Anda menyetujui praktik pengumpulan dan penggunaan data yang dijelaskan dalam Kebijakan Privasi ini. Jika Anda tidak setuju dengan kebijakan ini, mohon untuk tidak menggunakan website ini.`,
  },
  {
    title: 'Pengumpulan Data',
    content: `ALLIN mengumpulkan data pribadi melalui beberapa cara:

1. Data yang Anda berikan secara sukarela: Saat Anda mendaftar sebagai anggota, mengisi formulir kontak, atau berinteraksi dengan fitur website lainnya, kami mengumpulkan data seperti nama, email, nomor telepon, alamat, nama perusahaan, dan informasi lain yang Anda sampaikan.

2. Data yang dikumpulkan secara otomatis: Saat Anda mengunjungi website kami, kami secara otomatis mengumpulkan informasi teknis seperti alamat IP, jenis browser, sistem operasi, halaman yang dikunjungi, waktu akses, dan data navigasi lainnya melalui cookies dan teknologi serupa.

3. Data dari pihak ketiga: Kami dapat menerima data tentang Anda dari sumber pihak ketiga, seperti mitra kerja sama atau layanan analitik, selama sesuai dengan hukum yang berlaku.`,
  },
  {
    title: 'Penggunaan Data',
    content: `Data pribadi yang dikumpulkan digunakan untuk:

1. Mengelola keanggotaan ALLIN, termasuk verifikasi, persetujuan, dan komunikasi terkait status keanggotaan.
2. Menyediakan, mengoperasikan, dan memelihara layanan website.
3. Mengirimkan informasi, pengumuman, dan pemberitahuan yang relevan kepada anggota.
4. Merespons pertanyaan, permintaan, dan keluhan yang disampaikan melalui formulir kontak.
5. Menganalisis penggunaan website untuk meningkatkan kualitas layanan dan pengalaman pengguna.
6. Mematuhi kewajiban hukum dan regulasi yang berlaku.
7. Menyelenggarakan kegiatan dan program ALLIN, termasuk pendaftaran acara dan pelatihan.`,
  },
  {
    title: 'Keamanan Data',
    content: `ALLIN berkomitmen untuk melindungi data pribadi Anda dengan menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai. Meskipun demikian, perlu diketahui bahwa tidak ada metode transmisi data melalui internet atau metode penyimpanan elektronik yang 100% aman.

Kami menerapkan langkah-langkah keamanan termasuk enkripsi data, penggunaan firewall, akses terbatas terhadap data pribadi hanya kepada personel yang berwenang, serta audit keamanan secara berkala.

Jika Anda mengetahui atau menduga adanya pelanggaran keamanan data, silakan segera hubungi kami melalui informasi kontak yang tersedia di website ini.`,
  },
  {
    title: 'Hak Pengguna',
    content: `Sebagai pengguna website ALLIN, Anda memiliki hak untuk:

1. Mengakses: Anda berhak untuk mengetahui dan meminta salinan data pribadi yang kami simpan tentang Anda.
2. Memperbaiki: Anda berhak meminta koreksi atas data pribadi yang tidak akurat atau tidak lengkap.
3. Menghapus: Anda berhak meminta penghapusan data pribadi Anda, dengan tunduk pada kewajiban hukum yang berlaku.
4. Membatasi: Anda berhak meminta pembatasan pemrosesan data pribadi Anda dalam kondisi tertentu.
5. Menarik persetujuan: Jika pemrosesan data didasarkan pada persetujuan, Anda dapat menarik persetujuan tersebut kapan saja.

Untuk mengajukan permintaan terkait hak-hak Anda, silakan hubungi kami melalui halaman Kontak.`,
  },
  {
    title: 'Perubahan Kebijakan',
    content: `ALLIN berhak untuk memperbarui atau mengubah Kebijakan Privasi ini sewaktu-waktu. Perubahan akan diumumkan melalui website ini dan berlaku segera setelah dipublikasikan. Kami menyarankan Anda untuk meninjau halaman ini secara berkala untuk mengetahui perubahan terbaru.

Penggunaan website setelah perubahan kebijakan dipublikasikan dianggap sebagai penerimaan Anda terhadap kebijakan yang telah diperbarui.`,
  },
  {
    title: 'Kontak',
    content: `Jika Anda memiliki pertanyaan, permintaan, atau keluhan terkait Kebijakan Privasi ini atau praktik pengelolaan data kami, silakan hubungi:

Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN)
Email: info@allin.web.id
Telepon: +62 21 1234 5678
Alamat: Jakarta, Indonesia

Tim kami akan merespons permintaan Anda sesegera mungkin dalam waktu kerja yang wajar.`,
  },
]

export default function PrivacyPolicyPage() {
  const { navigate } = useAppStore()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Kebijakan Privasi</span>
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Kebijakan Privasi
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-lg max-w-2xl"
          >
            Komitmen kami dalam melindungi data pribadi Anda
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-10"
          >
            {sections.map((section, i) => (
              <div key={section.title}>
                <h2 className="text-xl font-bold mb-4 flex items-start gap-3">
                  <span className="text-allin-green font-bold text-lg mt-0.5">{i + 1}.</span>
                  {section.title}
                </h2>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
                {i < sections.length - 1 && (
                  <Separator className="mt-8" />
                )}
              </div>
            ))}
          </motion.div>

          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </section>
    </div>
  )
}