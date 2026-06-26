'use client'

import { AuthProvider } from '@/components/layout/AuthProvider'
import { AppRouter } from '@/components/layout/AppRouter'

export default function Home() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}