import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

// ─── Constants ────────────────────────────────────────────────────────────────
export const COOKIE_NAME = 'allin-session'
export const JWT_EXPIRES_IN = '30d'

export const PENGURUS_ROLES = [
  'SUPER_ADMIN', 'KETUA', 'WAKIL_KETUA',
  'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA',
] as const

// Role that can perform destructive operations (seed, backup, etc.)
export const SUPER_ADMIN_ONLY = ['SUPER_ADMIN'] as const

// Email validation helper
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const APPROVER_ROLES = [
  'SUPER_ADMIN', 'KETUA', 'WAKIL_KETUA',
  'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA',
]

export const ARTICLE_CREATE_ROLES = [
  'SUPER_ADMIN', 'KETUA', 'WAKIL_KETUA',
  'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA',
]

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  avatar?: string | null
  phone?: string | null
  position?: string | null
  company?: string | null
}

// ─── Password helpers ─────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────
function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  if (!secret) {
    console.error('[AUTH] CRITICAL: NEXTAUTH_SECRET or JWT_SECRET environment variable is required')
    throw new Error('Server configuration error: Missing JWT secret. Please set NEXTAUTH_SECRET or JWT_SECRET environment variable.')
  }
  if (secret === 'allin-default-secret-change-me' || secret.length < 32) {
    console.warn('[AUTH] WARNING: JWT secret is too weak or using default value. Please use a strong random secret (min 32 characters).')
  }
  return new TextEncoder().encode(secret)
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    position: user.position,
    company: user.company,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
      avatar: (payload.avatar as string) || null,
      phone: (payload.phone as string) || null,
      position: (payload.position as string) || null,
      company: (payload.company as string) || null,
    }
  } catch {
    return null
  }
}

// ─── Session helpers (for API routes) ─────────────────────────────────────────
export async function getSession(request?: NextRequest): Promise<SessionUser | null> {
  try {
    let token: string | undefined

    if (request) {
      // Read from cookie header directly
      const cookieHeader = request.headers.get('cookie') || ''
      const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
      token = match?.[1]
    } else {
      // Use Next.js cookies() API
      const cookieStore = await cookies()
      token = cookieStore.get(COOKIE_NAME)?.value
    }

    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────
export function createSessionCookie(token: string): string {
  const maxAge = 30 * 24 * 60 * 60 // 30 days in seconds
  const isSecure = process.env.NODE_ENV === 'production'
  const secureFlag = isSecure ? '; Secure' : ''
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly${secureFlag}; SameSite=Strict; Max-Age=${maxAge}`
}

export function createLogoutCookie(): string {
  const isSecure = process.env.NODE_ENV === 'production'
  const secureFlag = isSecure ? '; Secure' : ''
  return `${COOKIE_NAME}=; Path=/; HttpOnly${secureFlag}; SameSite=Strict; Max-Age=0`
}