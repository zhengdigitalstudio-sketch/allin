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
  | 'admin-dashboard'
  | 'admin-members'
  | 'admin-articles'
  | 'admin-agenda'
  | 'admin-gallery'
  | 'admin-contacts'
  | 'admin-users'
  | 'admin-banners'
  | 'admin-seo'
  | 'admin-activity'
  | 'admin-backup'
  | 'pengurus-dashboard'
  | 'pengurus-articles'
  | 'pengurus-profile'
  | 'member-dashboard'
  | 'member-profile'
  | 'member-documents'
  | 'member-articles'
  | 'member-inbox'
  | 'member-agenda'

interface AppState {
  currentPage: PageKey
  selectedArticleId: string | null
  user: {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
  } | null
  sidebarOpen: boolean
  navigate: (page: PageKey) => void
  setSelectedArticle: (id: string | null) => void
  setUser: (user: AppState['user']) => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'home',
  selectedArticleId: null,
  user: null,
  sidebarOpen: false,
  navigate: (page) => set({ currentPage: page, sidebarOpen: false }),
  setSelectedArticle: (id) => set({ selectedArticleId: id }),
  setUser: (user) => set({ user }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))

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