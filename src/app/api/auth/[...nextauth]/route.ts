import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// CRITICAL: NextAuth v4 requires Node.js runtime, NOT Edge runtime.
// Next.js 16 may default to Edge for API routes, which breaks NextAuth
// because it needs Node.js crypto and other built-in modules.
export const runtime = 'nodejs'
// Force dynamic rendering — never cache auth routes
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }