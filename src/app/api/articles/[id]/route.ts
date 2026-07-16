import { getSession, PENGURUS_ROLES } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Allow large payloads so cover images (max 5MB) and PDFs (max 10MB) encoded
// as base64 (~33% overhead) don't hit the default 4MB App Router body limit.
// Bumped to 50mb to safely handle combined cover + PDF + base64 expansion.
export const bodySizeLimit = '50mb'

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
    const MAX_VIEWED_IDS = 100 // Limit cookie size to prevent unbounded growth
    let viewedIds: string[] = []
    const cookieHeader = request.headers.get('cookie') || ''
    const viewedCookie = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('viewed='))
    if (viewedCookie) {
      try {
        viewedIds = decodeURIComponent(viewedCookie.split('=')[1]).split(',')
      } catch {
        viewedIds = [] // Invalid cookie, reset
      }
    }
    
    // Only add if not already viewed
    let newViewedIds = viewedIds.includes(id) ? viewedIds : [...viewedIds, id]
    
    // Trim to last MAX_VIEWED_IDS to prevent cookie overflow
    if (newViewedIds.length > MAX_VIEWED_IDS) {
      newViewedIds = newViewedIds.slice(-MAX_VIEWED_IDS)
    }
    
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
  } catch (error: unknown) {
    console.error('[Article Detail API] Error:', error)
    return NextResponse.json({ error: 'Gagal mengambil artikel' }, { status: 500 })
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
    const { title, content, excerpt, coverImage, category, status, isMemberOnly, metaTitle, metaDescription, pdfName, pdfData } = body

    const existing = await db.article.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    const userRole = session.role || ''
    const userId = session.id || ''

    if (!PENGURUS_ROLES.includes(userRole) && existing.authorId !== userId) {
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
    // PDF support: pdfName always updatable, pdfData only when a new file is uploaded
    if (pdfName !== undefined) updateData.pdfName = pdfName
    if (pdfData !== undefined) updateData.pdfData = pdfData

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
  } catch (error: unknown) {
    console.error('[articles/[id] PUT] Error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui artikel' }, { status: 500 })
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

    if (!PENGURUS_ROLES.includes(userRole) && existing.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.article.delete({ where: { id } })

    return NextResponse.json({ message: 'Artikel berhasil dihapus' })
  } catch (error: unknown) {
    console.error('[articles/[id] DELETE] Error:', error)
    return NextResponse.json({ error: 'Gagal menghapus artikel' }, { status: 500 })
  }
}