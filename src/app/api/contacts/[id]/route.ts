import { getSession, PENGURUS_ROLES } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const contact = await db.contact.findUnique({ where: { id } })

    if (!contact) {
      return NextResponse.json({ error: 'Kontak tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      contact: {
        ...contact,
        createdAt: contact.createdAt.toISOString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil data kontak'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!PENGURUS_ROLES.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const contact = await db.contact.update({
      where: { id },
      data: { isRead: body.isRead ?? true },
    })

    return NextResponse.json({
      contact: {
        ...contact,
        createdAt: contact.createdAt.toISOString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui kontak'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.role || ''
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await db.contact.delete({ where: { id } })

    return NextResponse.json({ message: 'Kontak berhasil dihapus' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus kontak'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}