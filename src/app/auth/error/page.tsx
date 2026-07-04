'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, RefreshCw, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'

const ERROR_MESSAGES: Record<string, { title: string; description: string; suggestion: string }> = {
  OAuthAccountNotLinked: {
    title: 'Akun Tidak Terhubung',
    description: 'Email ini sudah terdaftar dengan metode login lain.',
    suggestion: 'Coba gunakan akun Google yang sama, atau hubungi admin.',
  },
  OAuthCallback: {
    title: 'Error Callback OAuth',
    description: 'Google menolak callback. Biasanya karena redirect URI tidak terdaftar.',
    suggestion: 'Lihat detail error Google di bawah ini.',
  },
  OAuthSignin: {
    title: 'Error Memulai Login',
    description: 'Tidak dapat memulai proses login Google.',
    suggestion: 'Refresh halaman dan coba lagi.',
  },
  OAuthCreateAccount: {
    title: 'Gagal Membuat Akun',
    description: 'Tidak dapat membuat akun baru dari login Google.',
    suggestion: 'Coba lagi beberapa saat.',
  },
  Callback: {
    title: 'Error Callback',
    description: 'Terjadi kesalahan pada proses callback.',
    suggestion: 'Pastikan cookie tidak diblokir oleh browser.',
  },
  Configuration: {
    title: 'Error Konfigurasi',
    description: 'Konfigurasi server tidak lengkap.',
    suggestion: 'Hubungi admin untuk memeriksa konfigurasi.',
  },
  AccessDenied: {
    title: 'Akses Ditolak',
    description: 'Anda tidak diizinkan mengakses aplikasi ini.',
    suggestion: 'Hubungi admin.',
  },
  Default: {
    title: 'Terjadi Kesalahan',
    description: 'Proses login gagal.',
    suggestion: 'Coba login kembali.',
  },
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [errorType, setErrorType] = useState('Default')
  const [googleError, setGoogleError] = useState('')
  const [detail, setDetail] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const error = searchParams.get('error') || 'Unknown'
    const gErr = searchParams.get('google_error') || ''
    const det = searchParams.get('detail') || ''
    setErrorType(error)
    setGoogleError(gErr)
    setDetail(det)
    console.error('[auth-error] Error:', { error, googleError: gErr, detail: det })
  }, [searchParams])

  const errorInfo = ERROR_MESSAGES[errorType] || ERROR_MESSAGES['Default']

  // Build the full debug text to copy
  const debugText = [
    `Error: ${errorType}`,
    googleError ? `Google Error: ${googleError}` : '',
    detail ? `Detail: ${detail}` : '',
  ].filter(Boolean).join('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(debugText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
                Error: {errorType}{googleError ? ` (${googleError})` : ''}
              </p>
            </div>
          </div>

          <CardContent className="p-6 md:p-8 space-y-5">
            {/* Error Description */}
            <div className="space-y-3">
              <p className="text-sm text-foreground/80">{errorInfo.description}</p>

              {/* Show Google error detail if available */}
              {(googleError || detail) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-red-700">Detail Error dari Google:</p>
                    <button onClick={handleCopy} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                      <Copy className="w-3 h-3" />
                      {copied ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                  {googleError && (
                    <p className="text-sm font-mono text-red-800 break-all">{googleError}</p>
                  )}
                  {detail && detail !== googleError && (
                    <p className="text-xs text-red-600 break-all mt-1">{detail}</p>
                  )}
                </div>
              )}

              {/* Suggestion */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground font-medium mb-1">Saran:</p>
                <p className="text-sm text-foreground/70 whitespace-pre-line">{errorInfo.suggestion}</p>
                {errorType === 'OAuthCallback' && (
                  <div className="mt-3 pt-3 border-t border-muted">
                    <p className="text-xs font-medium text-foreground/80 mb-2">Pastikan di Google Cloud Console terdaftar:</p>
                    <div className="space-y-1">
                      <p className="text-xs font-mono bg-background px-2 py-1 rounded select-all">https://allin.web.id/api/auth/callback/google</p>
                      <p className="text-xs font-mono bg-background px-2 py-1 rounded select-all">https://www.allin.web.id/api/auth/callback/google</p>
                    </div>
                  </div>
                )}
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

            <div className="text-xs text-muted-foreground/50 text-center pt-2">
              Screenshot halaman ini dan kirim ke admin untuk bantuan.
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