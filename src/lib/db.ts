import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Support both naming conventions:
  // - DATABASE_URL / DATABASE_AUTH_TOKEN (standard)
  // - TURSO_DATABASE_URL / TURSO_AUTH_TOKEN (Vercel)
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.TURSO_DATABASE_URL ||
    ''

  const authToken =
    process.env.DATABASE_AUTH_TOKEN ||
    process.env.TURSO_AUTH_TOKEN ||
    undefined

  // For Turso/LibSQL URLs (production on Vercel) — use the driver adapter
  if (databaseUrl.startsWith('libsql://')) {
    const libsql = createClient({
      url: databaseUrl,
      authToken,
    })

    const adapter = new PrismaLibSql(libsql)

    return new PrismaClient({
      adapter,
    })
  }

  // Default: standard PrismaClient (works with local file-based SQLite)
  return new PrismaClient()
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}