'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Facebook,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import { useAppStore, type PageKey } from '@/lib/store'

const QUICK_LINKS: { label: string; page: PageKey }[] = [
  { label: 'Beranda', page: 'home' },
  { label: 'Tentang Kami', page: 'tentang' },
  { label: 'Visi & Misi', page: 'visi-misi' },
  { label: 'Struktur Pengurus', page: 'struktur-pengurus' },
  { label: 'Artikel', page: 'artikel' },
  { label: 'Agenda', page: 'agenda' },
  { label: 'Galeri', page: 'galeri' },
  { label: 'Pendaftaran', page: 'pendaftaran' },
  { label: 'Kontak', page: 'kontak' },
]

const SOCIAL_LINKS = [
  { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61591731504254' },
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/allin.web.id?igsh=ZzN6MG5veGV2ZGM1' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export function Footer() {
  const { navigate, currentPage } = useAppStore()

  const isDashboardPage =
    currentPage.startsWith('admin-') ||
    currentPage.startsWith('pengurus-') ||
    currentPage.startsWith('member-') ||
    currentPage === 'login'

  if (isDashboardPage) return null

  return (
    <footer className="relative mt-auto">
      {/* Decorative top wave */}
      <div className="h-1 bg-gradient-to-r from-allin-yellow via-allin-yellow-light to-allin-yellow" />

      <div className="gradient-hero text-white">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
        >
          {/* Main Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
            {/* Column 1: Logo & Description */}
            <motion.div variants={itemVariants} className="sm:pr-8 lg:pr-10">
              <button
                onClick={() => navigate('home')}
                className="inline-block group"
              >
                <Image
                  src="/logo-white.png"
                  alt="ALLIN Logo"
                  width={160}
                  height={36}
                  className="h-8 w-auto"
                />
              </button>
              <p className="mt-4 text-sm text-white/70 leading-relaxed">
                Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN) merupakan wadah
                bagi pelaku industri ketenagalistrikan untuk mewujudkan ekosistem energi yang
                berkelanjutan dan berdaya saing tinggi di Indonesia.
              </p>
            </motion.div>

            {/* Yellow separator - visible on lg+ between col 1 and 2 */}
            <div className="hidden lg:block" aria-hidden="true" />

            {/* Column 2: Quick Links */}
            <motion.div variants={itemVariants} className="lg:px-10 lg:border-x lg:border-white/10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-allin-yellow-light mb-5">
                Tautan Cepat
              </h3>
              <ul className="space-y-2.5">
                {QUICK_LINKS.map((link) => (
                  <li key={link.page}>
                    <button
                      onClick={() => navigate(link.page)}
                      className="group flex items-center gap-2 text-sm text-white/70 hover:text-allin-yellow-light transition-colors duration-200 cursor-pointer"
                    >
                      <ChevronRight className="h-3 w-3 shrink-0 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                      <span>{link.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Column 3: Contact */}
            <motion.div variants={itemVariants} className="sm:pr-8 lg:pr-10 lg:pl-10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-allin-yellow-light mb-5">
                Kontak
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 shrink-0 mt-0.5 text-allin-yellow-light" />
                  <div>
                    <p className="text-sm text-white/70">info@allin.web.id</p>
                    <p className="text-xs text-white/50 mt-0.5">Email resmi</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 shrink-0 mt-0.5 text-allin-yellow-light" />
                  <div>
                    <p className="text-sm text-white/70">+62 21 1234 5678</p>
                    <p className="text-xs text-white/50 mt-0.5">Senin - Jumat, 08:00 - 17:00</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-allin-yellow-light" />
                  <div>
                    <p className="text-sm text-white/70">
                      Jl. Ketenagalistrikan No. 123<br />
                      Jakarta Pusat 10110
                    </p>
                  </div>
                </li>
              </ul>
            </motion.div>

            {/* Column 4: Social Media */}
            <motion.div variants={itemVariants} className="lg:pl-10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-allin-yellow-light mb-5">
                Media Sosial
              </h3>
              <div className="grid grid-cols-2 gap-3 w-fit">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="group flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-allin-yellow/15 hover:border-allin-yellow/30 transition-all duration-300"
                  >
                    <social.icon className="h-5 w-5 text-white/70 group-hover:text-allin-yellow-light transition-colors duration-200" />
                    <span className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors">
                      {social.label}
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <motion.div
            variants={itemVariants}
            className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <p className="text-xs text-white/50 text-center sm:text-left">
              &copy; {new Date().getFullYear()} ALLIN — Asosiasi Lingkungan Industri Ketenagalistrikan Nasional.
              Hak cipta dilindungi undang-undang.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('privacy-policy')}
                className="text-xs text-white/50 hover:text-allin-yellow-light transition-colors cursor-pointer"
              >
                Kebijakan Privasi
              </button>
              <span className="text-white/20">|</span>
              <button
                onClick={() => navigate('sitemap')}
                className="text-xs text-white/50 hover:text-allin-yellow-light transition-colors cursor-pointer"
              >
                Peta Situs
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}