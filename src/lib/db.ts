import { PrismaClient } from '@prisma/client'

/**
 * Lazy Prisma client — NEVER connects at import/build time.
 * LibSQL modules are loaded via require() only when the first
 * query actually runs (inside the Proxy getter).
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _db: PrismaClient | null = null

function createPrismaClient(): PrismaClient {
  // Read env vars fresh each time (important during build vs runtime)
  const databaseUrl =
    (process.env.TURSO_DATABASE_URL ?? '') ||
    (process.env.DATABASE_URL ?? '') ||
    (process.env.TURSO_DB_URL ?? '') ||
    ''

  // Guard: only use LibSQL adapter if we have a valid libsql:// URL
  if (
    !databaseUrl ||
    databaseUrl === 'undefined' ||
    !databaseUrl.startsWith('libsql://')
  ) {
    console.warn('[db] No valid libsql:// URL — using default PrismaClient (local SQLite)')
    return new PrismaClient()
  }

  const authToken =
    (process.env.TURSO_AUTH_TOKEN ?? '') ||
    (process.env.DATABASE_AUTH_TOKEN ?? '') ||
    undefined

  try {
    // Dynamic require — LibSQL modules are ONLY loaded here,
    // never at module-import or build-analysis time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require('@prisma/adapter-libsql')

    const libsql = createClient({
      url: databaseUrl,
      authToken: authToken || undefined,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  } catch (error) {
    console.error('[db] LibSQL init failed, falling back to default PrismaClient:', error)
    return new PrismaClient()
  }
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (prop === 'then' || prop === Symbol.toPrimitive) {
      return undefined // Prevent "thenable" coercion
    }
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