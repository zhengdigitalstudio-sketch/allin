import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const PENGURUS_ROLES = ['SUPER_ADMIN', 'KETUA', 'WAKIL_KETUA', 'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const session = await getServerSession(authOptions)

    const where: any = {}

    if (!session) {
      // Non-authenticated users only see public announcements
      where.isForMemberOnly = false
    }

    const skip = (page - 1) * limit

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.announcement.count({ where }),
    ])

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        ...a,
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
    return NextResponse.json({ error: error.message || 'Gagal mengambil pengumuman' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role as string
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, isForMemberOnly } = body

    if (!title) {
      return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content: content || null,
        isForMemberOnly: isForMemberOnly || false,
      },
    })

    return NextResponse.json({
      announcement: {
        ...announcement,
        createdAt: announcement.createdAt.toISOString(),
        updatedAt: announcement.updatedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal membuat pengumuman' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role as string
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID pengumuman wajib diisi' }, { status: 400 })
    }

    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 })
    }

    await db.announcement.delete({ where: { id } })

    return NextResponse.json({ message: 'Pengumuman berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus pengumuman' }, { status: 500 })
  }
}