'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { Menu, Home, LogOut, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { DashboardSidebar } from './DashboardSidebar'

const PAGE_NAMES: Record<string, string> = {
  'admin-dashboard': 'Dashboard Admin',
  'admin-users': 'Manajemen User',
  'admin-articles': 'Manajemen Artikel',
  'admin-members': 'Manajemen Member',
  'admin-agenda': 'Manajemen Agenda',
  'admin-gallery': 'Manajemen Galeri',
  'admin-contacts': 'Kontak Masuk',
  'admin-banners': 'Banner',
  'admin-seo': 'SEO',
  'admin-activity': 'Activity Log',
  'admin-backup': 'Backup',
  'member-dashboard': 'Dashboard Member',
  'member-profile': 'Profil',
  'member-documents': 'Dokumen',
  'member-articles': 'Artikel',
  'member-agenda': 'Agenda Internal',
  'member-inbox': 'Pesan',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getRoleBadgeClasses(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'KETUA':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'WAKIL_KETUA':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'SEKRETARIS':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'WAKIL_SEKRETARIS':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'BENDAHARA':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'MEMBER':
      return 'bg-gray-100 text-gray-600 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    KETUA: 'Ketua',
    WAKIL_KETUA: 'Wakil Ketua',
    SEKRETARIS: 'Sekretaris',
    WAKIL_SEKRETARIS: 'Wakil Sekretaris',
    BENDAHARA: 'Bendahara',
    MEMBER: 'Member',
  }
  return map[role] || role
}

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentPage, navigate, user, authLoaded } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Show loading state while auth check is in progress
  // This prevents the blank dashboard page on direct URL visit / refresh
  if (!authLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-allin-green" />
          <p className="text-sm text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  // After auth check completes, if user is still null → redirect to login
  if (!user) {
    return <LoginRedirect />
  }

  const userName = user.name
  const userRole = user.role

  const pageName = PAGE_NAMES[currentPage] || 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col h-screen sticky top-0">
        <DashboardSidebar role={userRole} userName={userName} userRole={userRole} />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Menu Dashboard</SheetTitle>
            <div className="h-full">
              <DashboardSidebar role={userRole} userName={userName} userRole={userRole} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-md">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 rounded-full hover:bg-allin-green/10"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Buka menu</span>
          </Button>

          {/* Breadcrumb / Page Title */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold truncate">{pageName}</h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action Buttons */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-allin-green gap-1.5 text-xs"
            onClick={() => navigate('home')}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Website</span>
          </Button>

          {/* User Info (mobile & desktop) */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('hidden sm:inline-flex text-[10px] px-1.5 py-0 border font-medium', getRoleBadgeClasses(userRole))}
            >
              {getRoleLabel(userRole)}
            </Badge>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-allin-green text-white text-xs font-bold">
              {getInitials(userName || 'U')}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <ScrollArea className="flex-1">
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </ScrollArea>
      </div>
    </div>
  )
}

/**
 * Helper component that redirects to /login when auth check completed but no user.
 * Uses an effect to push the URL change via the store's navigate() so the SPA
 * picks it up without a full page reload.
 */
function LoginRedirect() {
  const navigate = useAppStore((s) => s.navigate)
  useEffect(() => {
    navigate('login')
  }, [navigate])
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-allin-green" />
        <p className="text-sm text-muted-foreground">Mengalihkan ke halaman login...</p>
      </div>
    </div>
  )
}