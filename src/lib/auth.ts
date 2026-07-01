if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'https://allin.web.id'
}

import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// NOTE: db is imported dynamically inside callbacks to avoid
// triggering the Prisma/LibSQL lazy-proxy during module evaluation.
// This prevents build-time connection attempts.

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
      checks: ['state'] as any, // PKCE disabled — avoid code_verifier cookie issues
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user?.email) {
        try {
          // Dynamic import — only loads db when a sign-in actually happens
          const { db } = await import('./db')

          const existing = await db.user.findUnique({ where: { email: user.email } })
          if (existing) {
            if (!existing.isActive) { return false }
            if (!existing.avatar && user.image) {
              await db.user.update({ where: { email: user.email }, data: { avatar: user.image } })
            }
          } else {
            await db.user.create({
              data: {
                name: user.name || 'Pengguna Google',
                email: user.email,
                role: 'MEMBER',
                avatar: user.image || null,
                isActive: true,
              },
            })
          }
        } catch (error) {
          // Allow login even if DB is down (graceful degradation)
          console.error('[auth] signIn DB error (allowing login):', error)
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        if (token.role) (session.user as any).role = token.role
        if (token.id) (session.user as any).id = token.id
        try {
          // Dynamic import — only loads db when a session is checked
          const { db } = await import('./db')

          const dbUser = await db.user.findUnique({ where: { email: String(token.email) } })
          if (dbUser) {
            Object.assign(session.user, {
              id: dbUser.id, role: dbUser.role,
              image: dbUser.avatar || session.user.image,
            })
            token.role = dbUser.role
            token.id = dbUser.id
          }
        } catch (error) {
          console.error('[auth] session DB error:', error)
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email; token.name = user.name
        token.picture = user.image; token.role = 'MEMBER'; token.id = user.id
      }
      return token
    },
  },
  events: {
    async signInError({ error }: any) {
      console.error('[nextauth] signInError event:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack?.substring(0, 500),
      })
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}