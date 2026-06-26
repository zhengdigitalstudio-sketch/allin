'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home } from 'lucide-react'

export default function NotFoundPage() {
  const { navigate } = useAppStore()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center max-w-md"
      >
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="w-40 h-40 mx-auto rounded-full bg-allin-green/10 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-allin-green/5 flex items-center justify-center">
              <span className="text-7xl md:text-8xl font-bold text-gradient-green">404</span>
            </div>
          </div>
          <div className="absolute top-2 right-1/2 translate-x-[60px] -translate-y-2">
            <AlertTriangle className="w-8 h-8 text-allin-yellow animate-pulse-slow" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-3">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan. Silakan kembali ke halaman utama untuk melanjutkan.
        </p>

        <Button
          onClick={() => navigate('home')}
          className="bg-allin-green hover:bg-allin-green-dark text-white font-medium px-8"
        >
          <Home className="w-4 h-4 mr-2" />
          Kembali ke Beranda
        </Button>
      </motion.div>
    </div>
  )
}