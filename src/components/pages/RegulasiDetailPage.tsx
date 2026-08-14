'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Document, Page, pdfjs } from 'react-pdf'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Expand,
  Download,
  Calendar,
  HardDrive,
  Eye,
  ArrowLeft,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// Set worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

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
  
  // Get regulasi ID from URL or store
  const [regulasi, setRegulasi] = useState<Regulasi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // PDF Viewer state
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(true)
  
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

  // PDF load handlers
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPdfLoading(false)
    setPageNumber(1)
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error)
    setPdfLoading(false)
    setError('Gagal memuat PDF. Silakan coba lagi nanti.')
  }

  // Navigation functions
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1))
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, (numPages || 1)))
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
  const rotatePDF = () => setRotation(prev => (prev + 90) % 360)
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  // Handle download with count increment
  const handleDownload = async () => {
    if (!regulasi) return
    
    try {
      await fetch(`/api/regulasi/${regulasi.id}/download`, { method: 'POST' })
      window.open(regulasi.fileUrl, '_blank')
    } catch (err) {
      console.error('Download error:', err)
      window.open(regulasi.fileUrl, '_blank')
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
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* PDF Viewer */}
      <main className={cn(
        "bg-gray-100",
        isFullscreen ? "h-screen" : "min-h-[calc(100vh-280px)]"
      )}>
        <div className={cn(
          "container mx-auto",
          isFullscreen ? "h-full p-4" : "px-4 py-6"
        )}>
          {/* PDF Toolbar */}
          <div className={cn(
            "bg-white rounded-t-xl border border-b-0 px-4 py-3 flex items-center justify-between gap-4",
            isFullscreen && "rounded-xl border-b"
          )}>
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="text-sm font-medium min-w-[80px] text-center">
                Halaman {pageNumber} dari {numPages || '-'}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={pageNumber >= (numPages || 1)}
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Zoom & Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="h-8 w-8"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              <span className="text-sm font-medium min-w-[50px] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={zoomIn}
                disabled={scale >= 3.0}
                className="h-8 w-8"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                variant="outline"
                size="icon"
                onClick={rotatePDF}
                className="h-8 w-8"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>

              {isFullscreen && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFullscreen(false)}
                  className="h-8 w-8"
                  title="Close Fullscreen"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* PDF Content */}
          <div className={cn(
            "bg-white rounded-b-xl border overflow-auto",
            isFullscreen ? "mt-2 rounded-xl h-[calc(100%-60px)]" : ""
          )}>
            {pdfLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-allin-green" />
                  <p className="text-muted-foreground">Memuat PDF...</p>
                </div>
              </div>
            )}

            <Document
              file={regulasi.fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-allin-green" />
                </div>
              }
              options={{
                cMapUrl: '//unpkg.com/pdfjs-dist@' + pdfjs.version + '/cmaps/',
                cMapPacked: true,
              }}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotation={rotation}
                className="mx-auto"
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-allin-green" />
                  </div>
                }
              />
            </Document>
          </div>

          {/* Footer Info */}
          {!isFullscreen && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Dokumen ini disediakan oleh ALLIN. Jika mengalami masalah saat membaca, 
                silakan{' '}
                <button 
                  onClick={handleDownload}
                  className="text-allin-green hover:underline font-medium"
                >
                  download PDF
                </button>{' '}
                untuk dibaca offline.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
