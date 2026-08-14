'use client'

import { AuthProvider } from '@/components/layout/AuthProvider'
import { AppRouter } from '@/components/layout/AppRouter'

// Force dynamic rendering - prevents SSR/prerender errors with react-pdf
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}