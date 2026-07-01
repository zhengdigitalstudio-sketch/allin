'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Error descriptions in Indonesian
const ERROR_MESSAGES: Record<string, { title: string; description: string; suggestion: string }> = {
  OAuthAccountNotLinked: {
    title: 'Akun Tidak Terhubung',
    description: 'Email ini sudah terdaftar dengan metode login lain. Hubungkan akun Google Anda terlebih dahulu.',
    suggestion: 'Coba gunakan akun Google yang sama, atau hubungi admin untuk menghubungkan akun.',
  },
  OAuthCallback: {
    title: 'Error Callback OAuth',
    description: 'Terjadi kesalahan saat Google mengembalikan data login. Ini biasanya disebabkan oleh konfigurasi redirect URI.',
    suggestion: 'Pastikan URL berikut sudah terdaftar di Google Cloud Console:\n• https://allin.web.id/api/auth/callback/google\n• https://www.allin.web.id/api/auth/callback/google',
  },
  OAuthSignin: {
    title: 'Error Memulai Login',
    description: 'Tidak dapat memulai proses login Google. Periksa koneksi internet Anda.',
    suggestion: 'Refresh halaman dan coba lagi.',
  },
  OAuthCreateAccount: {
    title: 'Gagal Membuat Akun',
    description: 'Tidak dapat membuat akun baru dari login Google.',
    suggestion: 'Coba lagi beberapa saat. Jika tetap gagal, hubungi admin.',
  },
  Callback: {
    title: 'Error Callback',
    description: 'Terjadi kesalahan pada proses callback setelah login.',
    suggestion: 'Coba login kembali. Pastikan cookie tidak diblokir oleh browser.',
  },
  Configuration: {
    title: 'Error Konfigurasi',
    description: 'Konfigurasi server tidak lengkap. Beberapa environment variable mungkin belum di-set.',
    suggestion: 'Hubungi admin untuk memeriksa konfigurasi server.',
  },
  AccessDenied: {
    title: 'Akses Ditolak',
    description: 'Anda tidak diizinkan untuk mengakses aplikasi ini.',
    suggestion: 'Hubungi admin jika Anda merasa ini adalah kesalahan.',
  },
  Verification: {
    title: 'Verifikasi Gagal',
    description: 'Link verifikasi sudah kadaluarsa atau tidak valid.',
    suggestion: 'Minta link verifikasi baru.',
  },
  Default: {
    title: 'Terjadi Kesalahan',
    description: 'Proses login gagal karena error yang tidak diketahui.',
    suggestion: 'Coba login kembali. Jika masalah berlanjut, hubungi admin.',
  },
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [errorType, setErrorType] = useState('Default')

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setErrorType(error)
      // Log error for debugging
      console.error('[auth-error] OAuth error type:', error)
    }
  }, [searchParams])

  const errorInfo = ERROR_MESSAGES[errorType] || ERROR_MESSAGES['Default']

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Back Button */}
      <button
        onClick={() => router.push('/login')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Kembali ke Login</span>
      </button>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-4 h-4 rounded-full bg-allin-yellow-light/20 animate-float" />
        <div className="absolute bottom-32 right-[15%] w-6 h-6 rounded-full bg-white/5 animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-0 shadow-2xl">
          {/* Header */}
          <div className="bg-destructive/10 py-8 rounded-t-xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-3">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-xl font-bold text-foreground">{errorInfo.title}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Error: {errorType}
              </p>
            </div>
          </div>

          <CardContent className="p-6 md:p-8 space-y-5">
            {/* Error Description */}
            <div className="space-y-3">
              <p className="text-sm text-foreground/80">{errorInfo.description}</p>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground font-medium mb-1">Saran:</p>
                <p className="text-sm text-foreground/70 whitespace-pre-line">{errorInfo.suggestion}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push('/login')}
                className="w-full flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Login Kembali
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 cursor-pointer"
              >
                Kembali ke Beranda
              </Button>
            </div>

            {/* Debug info (hidden in production look but visible for admin) */}
            <div className="text-xs text-muted-foreground/50 text-center pt-2">
              Jika masalah berlanjut, hubungi admin ALLIN dengan menyebutkan error code di atas.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen gradient-hero flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  )
}