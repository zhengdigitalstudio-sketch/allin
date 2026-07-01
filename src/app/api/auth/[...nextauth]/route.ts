import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = async (req: any, ctx: any) => {
  try {
    return await NextAuth(authOptions)(req, ctx)
  } catch (error: any) {
    console.error('[nextauth] Handler error:', {
      message: error?.message,
      stack: error?.stack?.slice(0, 500),
      url: req?.url,
      method: req?.method,
    })
    // Re-throw so NextAuth handles it normally
    throw error
  }
}

export { handler as GET, handler as POST }