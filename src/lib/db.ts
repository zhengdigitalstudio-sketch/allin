import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Support multiple env var naming conventions
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.TURSO_DATABASE_URL ||
    process.env.TURSO_DB_URL ||
    ''

  // Guard: skip LibSQL if URL is empty or invalid
  if (!databaseUrl || databaseUrl === 'undefined' || !databaseUrl.startsWith('libsql://')) {
    console.warn('[db] No valid libsql:// DATABASE_URL found, using default PrismaClient')
    return new PrismaClient()
  }

  const authToken =
    process.env.DATABASE_AUTH_TOKEN ||
    process.env.TURSO_AUTH_TOKEN ||
    undefined

  try {
    const libsql = createClient({
      url: databaseUrl,
      authToken,
    })

    const adapter = new PrismaLibSql(libsql)

    return new PrismaClient({
      adapter,
    })
  } catch (error) {
    console.error('[db] Failed to create LibSQL client, falling back to default:', error)
    return new PrismaClient()
  }
}

// Lazy initialization — don't create client at import time during build
let _db: PrismaClient | null = null

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_db) {
      _db = createPrismaClient()
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = _db
      }
    }
    const instance = globalForPrisma.prisma || _db
    const value = (instance as any)[prop]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})