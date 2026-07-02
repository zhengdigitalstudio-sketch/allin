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
    const { id } = await params
    const agenda = await db.agenda.findUnique({ where: { id } })

    if (!agenda) {
      return NextResponse.json({ error: 'Agenda tidak ditemukan' }, { status: 404 })
    }

    // Non-authenticated users can't see internal agenda
    if (agenda.isInternal) {
      const session = await getSession(request)
      if (!session) {
        return NextResponse.json({ error: 'Agenda tidak ditemukan' }, { status: 404 })
      }
    }

    return NextResponse.json({
      agenda: {
        ...agenda,
        date: agenda.date.toISOString(),
        createdAt: agenda.createdAt.toISOString(),
        updatedAt: agenda.updatedAt.toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil agenda' }, { status: 500 })
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

    const userRole = session.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, date, location, coverImage, isInternal, status } = body

    const existing = await db.agenda.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Agenda tidak ditemukan' }, { status: 404 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (date !== undefined) updateData.date = new Date(date)
    if (location !== undefined) updateData.location = location
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (isInternal !== undefined) updateData.isInternal = isInternal
    if (status !== undefined) updateData.status = status

    const agenda = await db.agenda.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      agenda: {
        ...agenda,
        date: agenda.date.toISOString(),
        createdAt: agenda.createdAt.toISOString(),
        updatedAt: agenda.updatedAt.toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memperbarui agenda' }, { status: 500 })
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
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existing = await db.agenda.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Agenda tidak ditemukan' }, { status: 404 })
    }

    await db.agenda.delete({ where: { id } })

    return NextResponse.json({ message: 'Agenda berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus agenda' }, { status: 500 })
  }
}