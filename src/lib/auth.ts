import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google OAuth: link ke akun yang sudah ada atau buat baru
      if (account?.provider === 'google' && user.email) {
        try {
          const existing = await db.user.findUnique({ where: { email: user.email } })

          if (existing) {
            if (!existing.isActive) return false

            // Update avatar dari Google jika belum ada
            if (!existing.avatar && user.image) {
              await db.user.update({
                where: { email: user.email },
                data: { avatar: user.image },
              })
            }
          } else {
            // Buat akun baru — default MEMBER
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
          console.error('[auth] signIn error:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        try {
          const email = String(token.email)
          const dbUser = await db.user.findUnique({ where: { email } })
          if (dbUser) {
            Object.assign(session.user, {
              id: dbUser.id,
              role: dbUser.role,
              image: dbUser.avatar || session.user.image,
            })
          }
        } catch (error) {
          console.error('[auth] session error:', error)
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'allin-secret-key-2024-change-in-production',
}