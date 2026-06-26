import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const PENGURUS_ROLES = ['SUPER_ADMIN', 'KETUA', 'WAKIL_KETUA', 'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const where: any = {}
    if (category) {
      where.category = category
    }

    const skip = (page - 1) * limit

    const [gallery, total] = await Promise.all([
      db.gallery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.gallery.count({ where }),
    ])

    return NextResponse.json({
      gallery: gallery.map((g) => ({
        ...g,
        createdAt: g.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil galeri' }, { status: 500 })
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
    const { title, description, imageUrl, category } = body

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Judul dan URL gambar wajib diisi' }, { status: 400 })
    }

    const gallery = await db.gallery.create({
      data: {
        title,
        description: description || null,
        imageUrl,
        category: category || null,
      },
    })

    return NextResponse.json({
      gallery: {
        ...gallery,
        createdAt: gallery.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menambahkan galeri' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role as string
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID galeri wajib diisi' }, { status: 400 })
    }

    const existing = await db.gallery.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Galeri tidak ditemukan' }, { status: 404 })
    }

    await db.gallery.delete({ where: { id } })

    return NextResponse.json({ message: 'Galeri berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus galeri' }, { status: 500 })
  }
}