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
<<<<<<< HEAD
  // Read env vars fresh each time (important during build vs runtime)
=======
>>>>>>> 1fcdbaf (fix: remove env(DATABASE_URL) from schema, fix db.ts lazy loading)
  const databaseUrl =
    (process.env.TURSO_DATABASE_URL ?? '') ||
    (process.env.DATABASE_URL ?? '') ||
    (process.env.TURSO_DB_URL ?? '') ||
    ''

<<<<<<< HEAD
  // Always pass an explicit datasource URL to prevent Prisma from
  // looking up the env("DATABASE_URL") that may not exist in Vercel.
  const fallbackUrl = databaseUrl || 'file:./dev.db'

  // Guard: only use LibSQL adapter if we have a valid libsql:// URL
  if (
    !databaseUrl ||
    databaseUrl === 'undefined' ||
    !databaseUrl.startsWith('libsql://')
  ) {
    console.warn('[db] No valid libsql:// URL — using default PrismaClient (local SQLite)')
    return new PrismaClient({
      datasources: { db: { url: fallbackUrl } },
    })
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
    return new PrismaClient({
      adapter,
      datasources: { db: { url: databaseUrl } },
    })
  } catch (error) {
    console.error('[db] LibSQL init failed, falling back to default PrismaClient:', error)
    return new PrismaClient({
      datasources: { db: { url: fallbackUrl } },
    })
  }
=======
  const authToken =
    (process.env.TURSO_AUTH_TOKEN ?? '') ||
    (process.env.DATABASE_AUTH_TOKEN ?? '') ||
    undefined

  // Only use LibSQL adapter if we have a valid libsql:// URL
  if (databaseUrl && databaseUrl !== 'undefined' && databaseUrl.startsWith('libsql://')) {
    try {
      // Dynamic require — LibSQL modules are ONLY loaded here at runtime,
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
      console.log('[db] Using LibSQL adapter for Turso')
      return new PrismaClient({ adapter })
    } catch (error) {
      console.error('[db] LibSQL adapter failed, falling back to local SQLite:', error)
    }
  }

  // Fallback: local SQLite (schema URL is "file:./dev.db")
  console.log('[db] Using local SQLite (no libsql:// URL found)')
  return new PrismaClient()
>>>>>>> 1fcdbaf (fix: remove env(DATABASE_URL) from schema, fix db.ts lazy loading)
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