'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { useAppStore } from '@/lib/store'

function SessionSync() {
  const { data: session, status } = useSession()
  const setUser = useAppStore((s) => s.setUser)
  const prevSessionRef = useRef<string | null>(null)

  useEffect(() => {
    const sessionKey = session?.user?.email ?? null

    // Only update when session actually changes
    if (sessionKey !== prevSessionRef.current) {
      prevSessionRef.current = sessionKey

      if (session?.user) {
        setUser({
          id: (session.user as any).id || '',
          name: session.user.name || '',
          email: session.user.email || '',
          role: (session.user as any).role || 'MEMBER',
          avatar: session.user.image || undefined,
        })
      } else {
        setUser(null)
      }
    }
  }, [session, setUser])

  return null
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <SessionSync />
      {children}
    </SessionProvider>
  )
}