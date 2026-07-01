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
          // Jika DB gagal, tetap izinkan login — role akan di-set di JWT
          // User tetap bisa masuk, tapi tanpa role spesifik
          console.error('[auth] signIn DB error (allowing login):', error)
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        // Gunakan role dari JWT token (sudah di-set saat signIn atau default)
        if (token.role) {
          (session.user as any).role = token.role
        }
        if (token.id) {
          (session.user as any).id = token.id
        }

        // Coba ambil data terbaru dari DB
        try {
          const email = String(token.email)
          const dbUser = await db.user.findUnique({ where: { email } })
          if (dbUser) {
            Object.assign(session.user, {
              id: dbUser.id,
              role: dbUser.role,
              image: dbUser.avatar || session.user.image,
            })
            // Update JWT token dengan data terbaru
            token.role = dbUser.role
            token.id = dbUser.id
          }
        } catch (error) {
          console.error('[auth] session DB error (using JWT data):', error)
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.role = 'MEMBER' // default, akan di-overwrite oleh session callback
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    error: '/', // Redirect ke home jika ada error, bukan halaman error NextAuth
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET!,
}