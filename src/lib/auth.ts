// Force NEXTAUTH_URL
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'https://allin.web.id'
}

import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
      // Disable PKCE — PKCE stores code_verifier in a cookie which can be lost
      // during the OAuth redirect on certain Vercel/Next.js 16 configurations.
      // Google OAuth still works without PKCE (uses client_secret_post instead).
      checks: ['state'] as any,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user?.email) {
        try {
          const existing = await db.user.findUnique({
            where: { email: user.email },
          })
          if (existing) {
            if (!existing.isActive) {
              console.error(`[auth] User ${user.email} is deactivated`)
              return false
            }
            if (!existing.avatar && user.image) {
              await db.user.update({
                where: { email: user.email },
                data: { avatar: user.image },
              })
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
          const dbUser = await db.user.findUnique({ where: { email: String(token.email) } })
          if (dbUser) {
            Object.assign(session.user, {
              id: dbUser.id,
              role: dbUser.role,
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
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.role = 'MEMBER'
        token.id = user.id
      }
      return token
    },
  },
  // Log errors to Vercel function logs for debugging
  events: {
    async signInError({ error }: any) {
      console.error('[nextauth] signInError event:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
      })
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}