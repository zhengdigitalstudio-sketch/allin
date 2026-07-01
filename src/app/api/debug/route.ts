import { NextResponse } from 'next/server'

// Debug endpoint — shows env var status (values masked)
// Visit: https://allin.web.id/api/debug
// TODO: remove this after fixing auth
export async function GET() {
  const envStatus = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(NOT SET)',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
      ? `${process.env.GOOGLE_CLIENT_ID.slice(0, 8)}...${process.env.GOOGLE_CLIENT_ID.slice(-4)}`
      : '(NOT SET)',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '(SET)' : '(NOT SET)',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '(SET)' : '(NOT SET)',
    DATABASE_URL: process.env.DATABASE_URL
      ? `${process.env.DATABASE_URL.slice(0, 25)}...`
      : '(NOT SET)',
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL
      ? `${process.env.TURSO_DATABASE_URL.slice(0, 25)}...`
      : '(NOT SET)',
    TURSO_DB_URL: process.env.TURSO_DB_URL || '(NOT SET)',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? '(SET)' : '(NOT SET)',
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN ? '(SET)' : '(NOT SET)',
    NODE_ENV: process.env.NODE_ENV || '(NOT SET)',
    VERCEL_URL: process.env.VERCEL_URL || '(NOT SET)',
    computedCallbackUrl: `${process.env.NEXTAUTH_URL || 'https://allin.web.id'}/api/auth/callback/google`,
  }

  return NextResponse.json(envStatus)
}