import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken, createSessionCookie, isValidEmail, type SessionUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simple in-memory rate limiting for login attempts
// In production, consider using Redis or a proper rate-limiting library
const loginAttempts = new Map<string, { count: number; resetTime: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = loginAttempts.get(ip)
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    loginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return { allowed: true }
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }
  
  record.count++
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const rateLimitResult = checkRateLimit(ip)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan login. Coba lagi dalam ${rateLimitResult.retryAfter} detik.` },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter || 900) } }
      )
    }

    const { email, password } = await request.json()

    // Validate email format
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }

    // Password strength validation
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Akun Anda tidak aktif. Hubungi admin.' }, { status: 403 })
    }

    // Verify password — skip if no password hash (legacy Google accounts)
    if (user.password) {
      const valid = await verifyPassword(password, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
      }
    } else {
      // User has no password (old Google account) — can't login with password
      return NextResponse.json(
        { error: 'Akun ini belum memiliki password. Hubungi admin untuk mengatur password.' },
        { status: 403 }
      )
    }

    // Clear rate limit on successful login
    loginAttempts.delete(ip)

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      position: user.position,
      company: user.company,
    }

    const token = await createToken(sessionUser)

    return NextResponse.json(
      { user: sessionUser },
      {
        status: 200,
        headers: { 'Set-Cookie': createSessionCookie(token) },
      }
    )
  } catch (error: unknown) {
    console.error('[auth/login] Error:', error)
    return NextResponse.json({ error: 'Login gagal. Silakan coba lagi.' }, { status: 500 })
  }
}
