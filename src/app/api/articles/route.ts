import { getSession, PENGURUS_ROLES, APPROVER_ROLES, ARTICLE_CREATE_ROLES } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const viewId = searchParams.get('view')
    const slug = searchParams.get('slug')

    // Increment view count if requested
    if (viewId) {
      await db.article.update({
        where: { id: viewId },
        data: { viewCount: { increment: 1 } },
      })
    }

    const session = await getSession(request)

    const where: any = {}

    // Filter by status
    if (status) {
      where.status = status
    } else if (!session) {
      where.status = 'PUBLISHED'
    }

    // Filter by slug
    if (slug) {
      where.slug = slug
    }

    // Filter by category
    if (category) {
      where.category = category
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Non-authenticated users can't see member-only articles
    if (!session) {
      where.isMemberOnly = false
    }

    const skip = (page - 1) * limit

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.article.count({ where }),
    ])

    return NextResponse.json({
      articles: articles.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        publishedAt: a.publishedAt?.toISOString() || null,
        author: a.author
          ? { ...a.author, createdAt: undefined, updatedAt: undefined }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil artikel' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const { title, content, excerpt, coverImage, category, status, isMemberOnly, metaTitle, metaDescription } = body

    if (!title) {
      return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })
    }

    let slug = generateSlug(title)

    // Ensure slug uniqueness
    const existing = await db.article.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const article = await db.article.create({
      data: {
        title,
        slug,
        content: content || null,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        category: category || 'Berita',
        status: status || 'DRAFT',
        isMemberOnly: isMemberOnly || false,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        authorId: session.id,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
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
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal membuat artikel' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, content, excerpt, coverImage, category, status, isMemberOnly, metaTitle, metaDescription } = body

    if (!id) {
      return NextResponse.json({ error: 'ID artikel wajib diisi' }, { status: 400 })
    }

    const existing = await db.article.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    const userRole = session?.role || ''
    const userId = session?.id || ''

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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID artikel wajib diisi' }, { status: 400 })
    }

    const existing = await db.article.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    const userRole = session?.role || ''
    const userId = session?.id || ''

    if (userRole !== 'SUPER_ADMIN' && existing.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.article.delete({ where: { id } })

    return NextResponse.json({ message: 'Artikel berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus artikel' }, { status: 500 })
  }
}