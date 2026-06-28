import type { MetadataRoute } from 'next'

const BASE_URL = 'https://allin.web.id'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/tentang',
    '/artikel',
    '/agenda',
    '/galeri',
    '/kontak',
    '/keanggotaan',
    '/faq',
    '/visi-misi',
    '/privasi',
  ]

  const lastModified = new Date()

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}