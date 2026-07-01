'use client'

import { useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useAppStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAppStore((s) => s.setUser)
  const prevEmailRef = useRef<string | null>(null)
  const router = useRouter()

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          const u = data.user
          setUser({
            id: u.id || '',
            name: u.name || '',
            email: u.email || '',
            role: u.role || 'MEMBER',
            avatar: u.avatar || undefined,
          })
          prevEmailRef.current = u.email
        } else {
          if (prevEmailRef.current) {
            setUser(null)
            prevEmailRef.current = null
          }
        }
      }
    } catch {
      // Silent fail
    }
  }, [setUser])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // Expose logout globally via window for components that need it
  useEffect(() => {
    ;(window as any).__allin_logout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      } catch {}
      setUser(null)
      prevEmailRef.current = null
      router.push('/')
    }
    return () => {
      delete (window as any).__allin_logout
    }
  }, [setUser, router])

  return <>{children}</>
}

/** Client-side logout helper — calls the server to clear the cookie */
export function logout() {
  ;(window as any).__allin_logout?.()
}

/** Get current user from Zustand store */
export function useAuth() {
  const user = useAppStore((s) => s.user)
  return { user, isLoggedIn: !!user }
}