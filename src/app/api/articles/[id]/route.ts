import { getSession, PENGURUS_ROLES } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const article = await db.article.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    if (!article) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    // Non-published articles require authentication or authorship
    if (article.status !== 'PUBLISHED') {
      const session = await getSession(request)
      if (!session) {
        return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
      }
    }

    // Non-authenticated users can't see member-only articles
    if (article.isMemberOnly) {
      const session = await getSession(request)
      if (!session) {
        return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
      }
    }

    // Increment view count (check cookie to prevent duplicates)
    let viewedIds: string[] = []
    const cookieHeader = request.headers.get('cookie') || ''
    const viewedCookie = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('viewed='))
    if (viewedCookie) {
      viewedIds = decodeURIComponent(viewedCookie.split('=')[1]).split(',')
    }
    const newViewedIds = viewedIds.includes(id) ? viewedIds : [...viewedIds, id]
    const shouldIncrement = !viewedIds.includes(id)

    if (shouldIncrement) {
      await db.article.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })
    }

    return NextResponse.json({
      article: {
        ...article,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        publishedAt: article.publishedAt?.toISOString() || null,
      },
    }, {
      headers: {
        'Set-Cookie': `viewed=${encodeURIComponent(newViewedIds.join(','))}; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil artikel' }, { status: 500 })
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

    const { id } = await params
    const body = await request.json()
    const { title, content, excerpt, coverImage, category, status, isMemberOnly, metaTitle, metaDescription } = body

    const existing = await db.article.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    const userRole = session.role || ''
    const userId = session.id || ''

    if (userRole !== 'SUPER_ADMIN' && existing.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}
    if (title !== undefined) {
      updateData.title = title
      updateData.slug = generateSlug(title)
    }
    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (category !== undefined) updateData.category = category
    if (status !== undefined) {
      updateData.status = status
      if (status === 'PUBLISHED' && !existing.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }
    if (isMemberOnly !== undefined) updateData.isMemberOnly = isMemberOnly
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription

    // Ensure slug uniqueness if title changed
    if (updateData.slug) {
      const slugExists = await db.article.findFirst({ where: { slug: updateData.slug, NOT: { id } } })
      if (slugExists) {
        updateData.slug = `${updateData.slug}-${Date.now()}`
      }
    }

    const article = await db.article.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({
      article: {
        ...article,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        publishedAt: article.publishedAt?.toISOString() || null,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memperbarui artikel' }, { status: 500 })
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

    const { id } = await params

    const existing = await db.article.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    const userRole = session.role || ''
    const userId = session.id || ''

    if (userRole !== 'SUPER_ADMIN' && existing.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.article.delete({ where: { id } })

    return NextResponse.json({ message: 'Artikel berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus artikel' }, { status: 500 })
  }
}