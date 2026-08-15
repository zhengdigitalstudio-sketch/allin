'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  Calendar,
  HardDrive,
  Eye,
  ArrowLeft,
  FileText,
  Loader2,
  Maximize2,
  X,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// Types
interface Regulasi {
  id: string
  title: string
  description: string | null
  category: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  publicId: string
  status: string
  isForMemberOnly: boolean
  downloadCount: number
  author: { name: string } | null
  createdAt: string
  updatedAt: string
}

// Get category color
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Umum': 'bg-blue-100 text-blue-700 border-blue-200',
    'Lingkungan': 'bg-green-100 text-green-700 border-green-200',
    'K3': 'bg-orange-100 text-orange-700 border-orange-200',
    'Teknologi': 'bg-purple-100 text-purple-700 border-purple-200',
    'Hukum': 'bg-red-100 text-red-700 border-red-200',
    'Keuangan': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'SDM': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  }
  return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200'
}

// Format file size
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function RegulasiDetailPage() {
  const { navigate } = useAppStore()
  
  const [regulasi, setRegulasi] = useState<Regulasi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Get ID from URL params
  useEffect(() => {
    const pathname = window.location.pathname
    const parts = pathname.split('/')
    const id = parts[parts.length - 1]
    
    if (id && id !== 'regulasi') {
      fetchRegulasi(id)
    }
  }, [])
  
  const fetchRegulasi = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/regulasi/${id}`)
      if (!res.ok) throw new Error('Gagal mengambil data')
      
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setRegulasi(data)
    } catch (err) {
      console.error('Error fetching regulasi:', err)
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-allin-green" />
              <p className="text-muted-foreground">Memuat dokumen...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !regulasi) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate('regulasi')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Regulasi
          </Button>
          
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Dokumen Tidak Ditemukan</h3>
            <p className="text-muted-foreground mb-6">{error || 'Regulasi tidak ditemukan'}</p>
            <Button onClick={() => navigate('regulasi')}>
              Lihat Daftar Regulasi
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen bg-background",
      isFullscreen && "fixed inset-0 z-50 bg-white"
    )}>
      {/* Header */}
      {!isFullscreen && (
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <button onClick={() => navigate('home')} className="hover:text-allin-green transition-colors">
                Beranda
              </button>
              <ChevronRight className="w-4 h-4" />
              <button onClick={() => navigate('regulasi')} className="hover:text-allin-green transition-colors">
                Regulasi
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {regulasi.title}
              </span>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {regulasi.title}
                </h1>
                
                {regulasi.description && (
                  <p className="text-muted-foreground mb-3">
                    {regulasi.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Badge variant="outline" className={getCategoryColor(regulasi.category)}>
                    {regulasi.category}
                  </Badge>
                  
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(regulasi.createdAt), 'dd MMM yyyy', { locale: localeId })}
                  </span>
                  
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <HardDrive className="w-4 h-4" />
                    {formatFileSize(regulasi.fileSize)}
                  </span>
                  
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    {regulasi.downloadCount} dilihat
                  </span>

                  {regulasi.isForMemberOnly && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                      Member Only
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  className="gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  Fullscreen
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* PDF Viewer - SIMPLE IFRAME */}
      <main className={cn(
        "bg-gray-100",
        isFullscreen ? "h-screen" : "min-h-[calc(100vh-280px)]"
      )}>
        <div className={cn(
          "container mx-auto",
          isFullscreen ? "h-full p-2" : "px-4 py-6"
        )}>
          {/* Toolbar for fullscreen mode */}
          {isFullscreen && (
            <div className="bg-white rounded-t-xl border border-b-0 px-4 py-2 flex items-center justify-between">
              <h2 className="font-semibold truncate">{regulasi.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Tutup
              </Button>
            </div>
          )}

          {/* PDF Viewer - Multiple Fallback Strategy */}
          <div className={cn(
            "bg-white rounded-xl border overflow-hidden relative",
            isFullscreen ? "h-[calc(100vh-50px)]" : "h-[75vh]"
          )}>
            {/* Primary: Direct Open Button (Most Reliable!) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-10">
              <div className="text-center space-y-6 p-8">
                <div className="w-24 h-24 mx-auto bg-allin-green/10 rounded-full flex items-center justify-center">
                  <FileText className="w-12 h-12 text-allin-green" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {regulasi.title}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {formatFileSize(regulasi.fileSize)} • {regulasi.fileName}
                  </p>
                </div>

                <div className="space-y-3 w-full max-w-md">
                  <Button 
                    size="lg"
                    onClick={() => window.open(regulasi.fileUrl, '_blank')}
                    className="w-full bg-allin-green hover:bg-allin-green-dark text-white font-semibold py-4 text-lg gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    📖 Baca PDF Sekarang
                  </Button>
                  
                  <p className="text-xs text-gray-400">
                    PDF akan terbuka di tab baru
                  </p>
                </div>
              </div>
            </div>

            {/* Hidden iframe for preloading (optional) */}
            <iframe
              src={regulasi.fileUrl}
              className="w-full h-full opacity-0 pointer-events-none"
              title={`PDF preload: ${regulasi.title}`}
              style={{ border: 'none', position: 'absolute', zIndex: 0 }}
              onLoad={(e) => {
                console.log('PDF loaded successfully');
                // If iframe loads, we could show it instead of button
              }}
            />
          </div>

          {/* Footer Info */}
          {!isFullscreen && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Dokumen ini disediakan oleh ALLIN untuk dibaca langsung di browser.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
