// Client-side head/meta tag manager for SPA routing
// Updates document title, meta description, and OG tags per page

const PAGE_META: Record<string, { description: string; ogType?: string }> = {
  'home': {
    description: 'ALLIN adalah organisasi asosiasi terbuka yang menaungi para pelaku industri ketenagalistrikan di Indonesia.',
  },
  'tentang': {
    description: 'Kenali lebih dekat Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN) dan perannya dalam industri kelistrikan Indonesia.',
  },
  'visi-misi': {
    description: 'Visi dan misi ALLIN dalam mewujudkan industri ketenagalistrikan nasional yang berdaya saing dan berkelanjutan.',
  },
  'struktur-pengurus': {
    description: 'Struktur pengurus ALLIN - para pemimpin yang menggerakkan organisasi ketenagalistrikan nasional.',
  },
  'artikel': {
    description: 'Baca artikel terbaru seputar industri ketenagalistrikan, energi terbarukan, dan regulasi dari ALLIN.',
  },
  'agenda': {
    description: 'Jadwal kegiatan, seminar, workshop, dan acara ALLIN yang akan datang.',
  },
  'galeri': {
    description: 'Galeri foto kegiatan dan dokumentasi acara ALLIN.',
  },
  'pendaftaran': {
    description: 'Daftarkan diri Anda sebagai anggota ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional.',
  },
  'kontak': {
    description: 'Hubungi ALLIN untuk informasi lebih lanjut mengenai keanggotaan, kerjasama, dan kegiatan.',
  },
  'faq': {
    description: 'Pertanyaan yang sering diajukan seputar ALLIN dan keanggotaan.',
  },
}

function setMeta(attr: string, key: string, value: string) {
  if (typeof document === 'undefined') return
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (el) {
    el.setAttribute('content', value)
  } else {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.setAttribute('content', value)
    document.head.appendChild(el)
  }
}

export function updatePageMeta(page: string, articleData?: { title: string; excerpt: string | null }) {
  if (typeof document === 'undefined') return

  const meta = PAGE_META[page]
  const description = articleData?.excerpt || meta?.description || 'ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional'

  setMeta('name', 'description', description)
  setMeta('property', 'og:title', document.title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', window.location.href)
  setMeta('property', 'og:type', articleData ? 'article' : 'website')
  setMeta('name', 'twitter:title', document.title)
  setMeta('name', 'twitter:description', description)

  // Update canonical
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (canonical) {
    canonical.href = window.location.href
  }
}