import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
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
    async session({ session, token }) {
      if (session.user && token.email) {
        const email = String(token.email)
        const dbUser = await db.user.findUnique({ where: { email } })
        if (dbUser) {
          const uid = dbUser.id
          const urole = dbUser.role
          Object.assign(session.user, { id: uid, role: urole })
        }
      }
      return session
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'allin-secret-key-2024',
  pages: { signIn: undefined },
}