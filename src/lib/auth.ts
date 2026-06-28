import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { db } from './db'

const PENGURUS_ROLES = ['SUPER_ADMIN', 'KETUA', 'WAKIL_KETUA', 'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA']

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.password || user.password !== credentials.password) return null
        if (!user.isActive) return null
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google OAuth: link ke akun yang sudah ada atau buat baru
      if (account?.provider === 'google' && user.email) {
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
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        const email = String(token.email)
        const dbUser = await db.user.findUnique({ where: { email } })
        if (dbUser) {
          Object.assign(session.user, {
            id: dbUser.id,
            role: dbUser.role,
            image: dbUser.avatar || session.user.image,
          })
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
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
  pages: {
    signIn: undefined, // gunakan default NextAuth sign-in page sebagai fallback
  },
}