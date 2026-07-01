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
]

export const APPROVER_ROLES = ['SUPER_ADMIN', 'KETUA', 'WAKIL_KETUA']

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
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'allin-default-secret-change-me'
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
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

export function createLogoutCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}