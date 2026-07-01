'use client'

import { motion } from 'framer-motion'
import { useAppStore, type PageKey } from '@/lib/store'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface SitemapItem {
  label: string
  page: PageKey
  children?: { label: string; page: PageKey }[]
}

const sitemapSections: { title: string; items: SitemapItem[] }[] = [
  {
    title: 'Halaman Utama',
    items: [{ label: 'Beranda', page: 'home' }],
  },
  {
    title: 'Informasi',
    items: [
      { label: 'Tentang ALLIN', page: 'tentang' },
      { label: 'Visi & Misi', page: 'visi-misi' },
      { label: 'Struktur Pengurus', page: 'struktur-pengurus' },
      { label: 'FAQ', page: 'faq' },
      { label: 'Kebijakan Privasi', page: 'privacy-policy' },
    ],
  },
  {
    title: 'Konten',
    items: [
      { label: 'Artikel', page: 'artikel' },
      { label: 'Agenda & Kegiatan', page: 'agenda' },
      { label: 'Galeri', page: 'galeri' },
    ],
  },
  {
    title: 'Keanggotaan',
    items: [
      { label: 'Pendaftaran Anggota', page: 'pendaftaran' },
      { label: 'Login', page: 'login' },
    ],
  },
  {
    title: 'Lainnya',
    items: [
      { label: 'Hubungi Kami', page: 'kontak' },
      { label: 'Sitemap', page: 'sitemap' },
    ],
  },
]

function TreeItem({ label, page, depth = 0 }: { label: string; page: PageKey; depth?: number }) {
  const { navigate } = useAppStore()

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2"
      style={{ paddingLeft: depth * 24 }}
    >
      {/* Tree lines */}
      {depth > 0 && (
        <div className="flex items-center">
          <div className="w-4 h-px bg-allin-green/30" />
          <div className="w-px h-4 bg-allin-green/30 -ml-[1px] -mt-4" />
        </div>
      )}
      <ChevronRight className="w-3.5 h-3.5 text-allin-green flex-shrink-0" />
      <button
        onClick={() => navigate(page)}
        className="text-sm text-foreground hover:text-allin-green transition-colors text-left"
      >
        {label}
      </button>
    </motion.div>
  )
}

export default function SitemapPage() {
  const { navigate } = useAppStore()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Sitemap</span>
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Sitemap
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-lg max-w-2xl"
          >
            Daftar seluruh halaman yang tersedia di website ALLIN
          </motion.p>
        </div>
      </section>

      {/* Sitemap */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {sitemapSections.map((section, si) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: si * 0.1 }}
              >
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-allin-green" />
                  {section.title}
                </h2>
                <div className="space-y-2.5 pl-2">
                  {section.items.map((item) => (
                    <TreeItem key={item.page} label={item.label} page={item.page} depth={1} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}