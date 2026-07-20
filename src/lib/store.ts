import { create } from 'zustand'

export type PageKey =
  | 'home'
  | 'tentang'
  | 'visi-misi'
  | 'struktur-pengurus'
  | 'artikel'
  | 'artikel-detail'
  | 'agenda'
  | 'galeri'
  | 'pendaftaran'
  | 'kontak'
  | 'faq'
  | 'privacy-policy'
  | 'sitemap'
  | 'login'
  | 'regulasi'
  | 'admin-dashboard'
  | 'admin-members'
  | 'admin-articles'
  | 'admin-regulasi'
  | 'admin-agenda'
  | 'admin-gallery'
  | 'admin-contacts'
  | 'admin-users'
  | 'admin-banners'
  | 'admin-seo'
  | 'admin-activity'
  | 'admin-backup'
  | 'admin-regulasi'
  | 'member-dashboard'
  | 'member-profile'
  | 'member-documents'
  | 'member-articles'
  | 'member-inbox'
  | 'member-agenda'

// ── URL mapping ──────────────────────────────────────────────
const PAGE_URLS: Record<PageKey, string> = {
  'home': '/',
  'tentang': '/tentang',
  'visi-misi': '/visi-misi',
  'struktur-pengurus': '/struktur-pengurus',
  'artikel': '/artikel',
  'artikel-detail': '/artikel/__slug__',
  'agenda': '/agenda',
  'galeri': '/galeri',
  'pendaftaran': '/pendaftaran',
  'kontak': '/kontak',
  'faq': '/faq',
  'privacy-policy': '/privacy-policy',
  'sitemap': '/sitemap',
  'login': '/login',
  'regulasi': '/regulasi',
  'admin-dashboard': '/dashboard',
  'admin-members': '/dashboard/anggota',
  'admin-articles': '/dashboard/artikel',
  'admin-regulasi': '/dashboard/regulasi',
  'admin-agenda': '/dashboard/agenda',
  'admin-gallery': '/dashboard/galeri',
  'admin-contacts': '/dashboard/kontak',
  'admin-users': '/dashboard/pengguna',
  'admin-banners': '/dashboard/banner',
  'admin-seo': '/dashboard/seo',
  'admin-activity': '/dashboard/aktivitas',
  'admin-backup': '/dashboard/backup',
  'admin-regulasi': '/dashboard/regulasi',
  'member-dashboard': '/dashboard',
  'member-profile': '/dashboard/profil',
  'member-documents': '/dashboard/dokumen',
  'member-articles': '/dashboard/artikel',
  'member-inbox': '/dashboard/pesan',
  'member-agenda': '/dashboard/agenda',
}

const URL_TO_PAGE: Record<string, PageKey> = {}
for (const [key, url] of Object.entries(PAGE_URLS)) {
  if (url !== '/artikel/__slug__' && !URL_TO_PAGE[url]) {
    // First wins — admin pages before member pages for /dashboard
    URL_TO_PAGE[url] = key as PageKey
  }
}

function syncUrl(page: PageKey, articleSlug?: string | null) {
  let url = PAGE_URLS[page] || '/'
  if (page === 'artikel-detail' && articleSlug) {
    url = `/artikel/${articleSlug}`
  }
  window.history.pushState({}, '', url)
  document.title = page === 'home' ? 'ALLIN' : `ALLIN - ${page.replace(/-/g, ' ')}`
}

export function initFromUrl(): { page: PageKey; articleSlug: string | null } {
  const pathname = window.location.pathname

  // /artikel/some-slug → article detail
  if (pathname.startsWith('/artikel/') && pathname !== '/artikel') {
    const slug = pathname.slice('/artikel/'.length)
    if (slug) {
      return { page: 'artikel-detail', articleSlug: slug }
    }
  }

  // Regular page
  const page = URL_TO_PAGE[pathname]
  if (page) {
    return { page, articleSlug: null }
  }

  return { page: 'home', articleSlug: null }
}

// ── Store ────────────────────────────────────────────────────
interface AppState {
  currentPage: PageKey
  selectedArticleSlug: string | null
  user: {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
  } | null
  authLoaded: boolean
  sidebarOpen: boolean
  navigate: (page: PageKey) => void
  navigateArticle: (slug: string) => void
  setSelectedArticle: (id: string | null) => void
  setUser: (user: AppState['user']) => void
  setAuthLoaded: (loaded: boolean) => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => {
  // Initialize from URL on server/default
  let initialState = { currentPage: 'home' as PageKey, selectedArticleSlug: null as string | null }
  if (typeof window !== 'undefined') {
    const parsed = initFromUrl()
    initialState = { currentPage: parsed.page, selectedArticleSlug: parsed.articleSlug }
  }

  return {
    ...initialState,
    user: null,
    authLoaded: false,
    sidebarOpen: false,
    navigate: (page) => {
      syncUrl(page)
      set({ currentPage: page, selectedArticleSlug: null, sidebarOpen: false })
    },
    navigateArticle: (slug) => {
      syncUrl('artikel-detail', slug)
      set({ currentPage: 'artikel-detail', selectedArticleSlug: slug })
    },
    setSelectedArticle: (id) => {
      // Keep for backward compat — just store the slug if article data available
      const state = get()
      if (id === null) {
        set({ selectedArticleSlug: null })
      }
      // If called with ID, we ignore it for URL purposes
    },
    setUser: (user) => set({ user }),
    setAuthLoaded: (loaded) => set({ authLoaded: loaded }),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
  }
})

export const PENGURUS_ROLES = ['KETUA', 'WAKIL_KETUA', 'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA'] as const
export const ALL_ROLES = ['SUPER_ADMIN', ...PENGURUS_ROLES, 'MEMBER'] as const

export const PENGURUS_DATA = [
  { name: 'Koespraptini Ria', role: 'KETUA', roleLabel: 'Ketua', email: 'sampitaria@gmail.com' },
  { name: 'Mekkadinah', role: 'WAKIL_KETUA', roleLabel: 'Wakil Ketua', email: 'mekkadinah@gmail.com' },
  { name: 'Alibeta Sembiring', role: 'SEKRETARIS', roleLabel: 'Sekretaris', email: 'alelbiwi@gmail.com' },
  { name: 'Jaswadi', role: 'WAKIL_SEKRETARIS', roleLabel: 'Wakil Sekretaris', email: 'anjas0875@gmail.com' },
  { name: 'Viviane Tazaq', role: 'BENDAHARA', roleLabel: 'Bendahara', email: 'vtanzaq@gmail.com' },
]

export const ARTICLE_CATEGORIES = ['Berita', 'Regulasi', 'Teknologi', 'Kegiatan', 'Seminar', 'Workshop', 'Opini'] as const
export const MEMBER_TYPES = ['Perusahaan', 'Profesi', 'Asosiasi', 'BUMN', 'Swasta', 'Perguruan Tinggi', 'Koperasi', 'Perorangan'] as const
export const MEMBER_STATUSES = ['MENUNGGU', 'DISETUJUI', 'DITOLAK'] as const