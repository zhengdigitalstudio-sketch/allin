'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const { navigate, setUser } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email atau password salah. Silakan coba lagi.')
      } else {
        // Fetch user data
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()

        if (session?.user) {
          const userData = session.user as any
          setUser({
            id: userData.id || '',
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role || 'MEMBER',
            avatar: userData.avatar || undefined,
          })

          // Navigate based on role
          if (userData.role === 'SUPER_ADMIN') {
            navigate('admin-dashboard')
          } else if (['KETUA', 'WAKIL_KETUA', 'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA'].includes(userData.role)) {
            navigate('pengurus-dashboard')
          } else {
            navigate('member-dashboard')
          }
        } else {
          navigate('home')
        }
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12 relative overflow-hidden">
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
          <div className="gradient-green py-6 rounded-t-xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-3">
                <Zap className="w-8 h-8 text-allin-yellow-light" />
              </div>
              <h1 className="text-2xl font-bold text-white">ALLIN</h1>
              <p className="text-white/60 text-sm mt-1">Masuk ke akun Anda</p>
            </div>
          </div>

          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-allin-green hover:underline"
                  >
                    Lupa Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-allin-green hover:bg-allin-green-dark text-white font-bold py-5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
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