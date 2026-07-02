import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken, createSessionCookie, type SessionUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
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
  } catch (error: any) {
    console.error('[auth/login]', error)
    return NextResponse.json({ error: error.message || 'Login gagal' }, { status: 500 })
  }
}