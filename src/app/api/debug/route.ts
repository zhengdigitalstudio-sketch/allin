import { NextResponse } from 'next/server'
import { getSession, SUPER_ADMIN_ONLY } from '@/lib/auth'

// Debug endpoint — shows env var status (values masked)
// 🔒 PROTECTED: Only SUPER_ADMIN can access this endpoint
// Visit: https://allin.web.id/api/debug
// TODO: remove this endpoint before production deployment
export async function GET(request: Request) {
  try {
    // Authentication check - only SUPER_ADMIN can access
    const session = await getSession(request as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!SUPER_ADMIN_ONLY.includes(session.role as any)) {
      return NextResponse.json({ error: 'Forbidden — Super Admin access required' }, { status: 403 })
    }

    const envStatus = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(NOT SET)',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
        ? `${process.env.GOOGLE_CLIENT_ID.slice(0, 8)}...${process.env.GOOGLE_CLIENT_ID.slice(-4)}`
        : '(NOT SET)',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '(SET)' : '(NOT SET)',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? `(SET - ${process.env.NEXTAUTH_SECRET.length} chars)` : '(NOT SET)',
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
      // Mask sensitive values
      _securityNote: 'This endpoint is protected and only accessible by SUPER_ADMIN',
    }

    return NextResponse.json(envStatus)
  } catch (error: unknown) {
    console.error('[Debug API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
