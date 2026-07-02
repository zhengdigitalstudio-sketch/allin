import { getSession, PENGURUS_ROLES, APPROVER_ROLES, ARTICLE_CREATE_ROLES } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')

    const session = await getSession(request)

    const where: any = {}

    // Non-authenticated users can't see internal (member-only) agenda
    if (!session) {
      where.isInternal = false
    }

    if (status) {
      where.status = status
    }

    const skip = (page - 1) * limit

    const [agenda, total] = await Promise.all([
      db.agenda.findMany({
        where,
        orderBy: { date: 'asc' },
        skip,
        take: limit,
      }),
      db.agenda.count({ where }),
    ])

    return NextResponse.json({
      agenda: agenda.map((a) => ({
        ...a,
        date: a.date.toISOString(),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil agenda' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!APPROVER_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, date, location, coverImage, isInternal, status } = body

    if (!title || !date) {
      return NextResponse.json({ error: 'Judul dan tanggal wajib diisi' }, { status: 400 })
    }

    const agenda = await db.agenda.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        location: location || null,
        coverImage: coverImage || null,
        isInternal: isInternal || false,
        status: status || 'AKTIF',
      },
    })

    return NextResponse.json({
      agenda: {
        ...agenda,
        date: agenda.date.toISOString(),
        createdAt: agenda.createdAt.toISOString(),
        updatedAt: agenda.updatedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal membuat agenda' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, description, date, location, coverImage, isInternal, status } = body

    if (!id) {
      return NextResponse.json({ error: 'ID agenda wajib diisi' }, { status: 400 })
    }

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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID agenda wajib diisi' }, { status: 400 })
    }

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