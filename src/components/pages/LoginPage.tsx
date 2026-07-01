'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'

export default function LoginPage() {
  const { navigate, setUser } = useAppStore()
  const { data: session, status } = useSession()

  const [error, setError] = useState('')

  // Redirect berdasarkan role setelah Google login berhasil
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userData = session.user as any
      const role = userData.role || 'MEMBER'

      // Sync ke Zustand store
      setUser({
        id: userData.id || '',
        name: userData.name || '',
        email: userData.email || '',
        role,
        avatar: userData.image || userData.avatar || undefined,
      })

      // Navigate ke dashboard sesuai role
      if (role === 'SUPER_ADMIN') {
        navigate('admin-dashboard')
      } else if (['KETUA', 'WAKIL_KETUA', 'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA'].includes(role)) {
        navigate('pengurus-dashboard')
      } else {
        navigate('member-dashboard')
      }
    }
  }, [status, session, navigate, setUser])

  const handleGoogleLogin = () => {
    setError('')
    signIn('google', {
      callbackUrl: '/',
      redirect: true,
    })
  }

  // Loading state sementara menunggu session
  if (status === 'loading') {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Back Button */}
      <button
        onClick={() => navigate('home')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Kembali ke Menu</span>
      </button>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-4 h-4 rounded-full bg-allin-yellow-light/20 animate-float" />
        <div className="absolute bottom-32 right-[15%] w-6 h-6 rounded-full bg-white/5 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[60%] right-[30%] w-3 h-3 rounded-full bg-allin-yellow-light/15 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-0 shadow-2xl">
          {/* Logo */}
          <div className="gradient-green py-8 rounded-t-xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-3">
                <Image src="/logo-icon.png" alt="ALLIN" width={80} height={80} className="w-16 h-16 rounded-full" />
              </div>
              <h1 className="text-2xl font-bold text-white">ALLIN</h1>
              <p className="text-white/60 text-sm mt-1">Masuk ke akun Anda</p>
            </div>
          </div>

          <CardContent className="p-6 md:p-8 space-y-5">
            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Google Login — Only Method */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-5 px-4 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer h-auto shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="font-semibold">Masuk dengan Google</span>
            </Button>

            {/* Register link */}
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{' '}
                <button
                  onClick={() => navigate('pendaftaran')}
                  className="text-allin-green font-medium hover:underline"
                >
                  Daftar sebagai anggota
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}