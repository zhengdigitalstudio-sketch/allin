'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, type PageKey } from '@/lib/store'
import { Skeleton } from '@/components/ui/skeleton'

import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { DashboardLayout } from './DashboardLayout'
import { ErrorBoundary } from './ErrorBoundary'

const PageLoading = () => (
  <div className="space-y-6 p-4">
    <Skeleton className="h-8 w-64" />
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
    </div>
    <Skeleton className="h-80 rounded-xl" />
  </div>
)

import HomePage from '@/components/pages/HomePage'
import TentangPage from '@/components/pages/TentangPage'
import VisiMisiPage from '@/components/pages/VisiMisiPage'
import StrukturPengurusPage from '@/components/pages/StrukturPengurusPage'
import ArtikelPage from '@/components/pages/ArtikelPage'
import ArtikelDetailPage from '@/components/pages/ArtikelDetailPage'
import AgendaPage from '@/components/pages/AgendaPage'
import GaleriPage from '@/components/pages/GaleriPage'
import PendaftaranPage from '@/components/pages/PendaftaranPage'
import KontakPage from '@/components/pages/KontakPage'
import FAQPage from '@/components/pages/FAQPage'
import PrivacyPolicyPage from '@/components/pages/PrivacyPolicyPage'
import SitemapPage from '@/components/pages/SitemapPage'
import LoginPage from '@/components/pages/LoginPage'

const dyn = (importFn: () => Promise<{ [key: string]: React.ComponentType }>) =>
  dynamic(importFn, { ssr: false, loading: () => <PageLoading /> })

const AdminDashboardPage = dyn(
  () => import('@/components/dashboard/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)
const AdminUsersPage = dyn(
  () => import('@/components/dashboard/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminArticlesPage = dyn(
  () => import('@/components/dashboard/AdminArticlesPage').then((m) => ({ default: m.AdminArticlesPage })),
)
const AdminMembersPage = dyn(
  () => import('@/components/dashboard/AdminMembersPage').then((m) => ({ default: m.AdminMembersPage })),
)
const AdminAgendaPage = dyn(
  () => import('@/components/dashboard/AdminAgendaPage').then((m) => ({ default: m.AdminAgendaPage })),
)
const AdminGalleryPage = dyn(
  () => import('@/components/dashboard/AdminGalleryPage').then((m) => ({ default: m.AdminGalleryPage })),
)
const AdminContactsPage = dyn(
  () => import('@/components/dashboard/AdminContactsPage').then((m) => ({ default: m.AdminContactsPage })),
)
const AdminBannersPage = dyn(
  () => import('@/components/dashboard/AdminBannersPage').then((m) => ({ default: m.AdminBannersPage })),
)
const AdminSeoPage = dyn(
  () => import('@/components/dashboard/AdminSeoPage').then((m) => ({ default: m.AdminSeoPage })),
)
const AdminActivityPage = dyn(
  () => import('@/components/dashboard/AdminActivityPage').then((m) => ({ default: m.AdminActivityPage })),
)
const AdminBackupPage = dyn(
  () => import('@/components/dashboard/AdminBackupPage').then((m) => ({ default: m.AdminBackupPage })),
)
const PengurusDashboardPage = dyn(
  () => import('@/components/dashboard/PengurusDashboardPage').then((m) => ({ default: m.PengurusDashboardPage })),
)
const PengurusArticlesPage = dyn(
  () => import('@/components/dashboard/PengurusArticlesPage').then((m) => ({ default: m.PengurusArticlesPage })),
)
const PengurusProfilePage = dyn(
  () => import('@/components/dashboard/PengurusProfilePage').then((m) => ({ default: m.PengurusProfilePage })),
)
const MemberDashboardPage = dyn(
  () => import('@/components/dashboard/MemberDashboardPage').then((m) => ({ default: m.MemberDashboardPage })),
)
const MemberProfilePage = dyn(
  () => import('@/components/dashboard/MemberProfilePage').then((m) => ({ default: m.MemberProfilePage })),
)
const MemberDocumentsPage = dyn(
  () => import('@/components/dashboard/MemberDocumentsPage').then((m) => ({ default: m.MemberDocumentsPage })),
)
const MemberArticlesPage = dyn(
  () => import('@/components/dashboard/MemberArticlesPage').then((m) => ({ default: m.MemberArticlesPage })),
)
const MemberInboxPage = dyn(
  () => import('@/components/dashboard/MemberInboxPage').then((m) => ({ default: m.MemberInboxPage })),
)
const MemberAgendaPage = dyn(
  () => import('@/components/dashboard/MemberAgendaPage').then((m) => ({ default: m.MemberAgendaPage })),
)


const pageComponents: Record<PageKey, React.ComponentType> = {
  home: HomePage,
  tentang: TentangPage,
  'visi-misi': VisiMisiPage,
  'struktur-pengurus': StrukturPengurusPage,
  artikel: ArtikelPage,
  'artikel-detail': ArtikelDetailPage,
  agenda: AgendaPage,
  galeri: GaleriPage,
  pendaftaran: PendaftaranPage,
  kontak: KontakPage,
  faq: FAQPage,
  'privacy-policy': PrivacyPolicyPage,
  sitemap: SitemapPage,
  login: LoginPage,
  'admin-dashboard': AdminDashboardPage,
  'admin-members': AdminMembersPage,
  'admin-articles': AdminArticlesPage,
  'admin-agenda': AdminAgendaPage,
  'admin-gallery': AdminGalleryPage,
  'admin-contacts': AdminContactsPage,
  'admin-users': AdminUsersPage,
  'admin-banners': AdminBannersPage,
  'admin-seo': AdminSeoPage,
  'admin-activity': AdminActivityPage,
  'admin-backup': AdminBackupPage,
  'pengurus-dashboard': PengurusDashboardPage,
  'pengurus-articles': PengurusArticlesPage,
  'pengurus-profile': PengurusProfilePage,
  'member-dashboard': MemberDashboardPage,
  'member-profile': MemberProfilePage,
  'member-documents': MemberDocumentsPage,
  'member-articles': MemberArticlesPage,
  'member-inbox': MemberInboxPage,
  'member-agenda': MemberAgendaPage,
}

function isDashboardPage(page: PageKey): boolean {
  return (
    page.startsWith('admin-') ||
    page.startsWith('pengurus-') ||
    page.startsWith('member-')
  )
}

export function AppRouter() {
  const currentPage = useAppStore((state) => state.currentPage)
  const PageComponent = pageComponents[currentPage]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [currentPage])

  const pageElement = (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PageComponent />
        </motion.div>
      </AnimatePresence>
    </ErrorBoundary>
  )

  if (currentPage === 'login') {
    return pageElement
  }

  if (isDashboardPage(currentPage)) {
    return <DashboardLayout>{pageElement}</DashboardLayout>
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1 overflow-x-hidden">{pageElement}</main>
      <Footer />
    </div>
  )
}