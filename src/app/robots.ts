import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin', '/login', '/pendaftaran'],
      },
    ],
    sitemap: 'https://allin.web.id/sitemap.xml',
  }
}