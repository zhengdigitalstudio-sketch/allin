'use client'

import { useState, useEffect } from 'react'
import { Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PdfViewerProps {
  fileUrl: string
}

export default function PdfViewer({ fileUrl }: PdfViewerProps) {
  const [pdfLib, setPdfLib] = useState<{ Document: any; Page: any; pdfjs: any } | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load react-pdf dynamically (browser only!)
  useEffect(() => {
    let mounted = true
    
    import('react-pdf').then((module) => {
      if (!mounted) return
      
      const { Document, Page, pdfjs } = module
      
      // Set worker source
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
      
      setPdfLib({ Document, Page, pdfjs })
      console.log('✅ react-pdf loaded successfully')
    }).catch((err) => {
      console.error('❌ Failed to load react-pdf:', err)
      if (mounted) {
        setLoadError('Gagal memuat PDF viewer. Silakan refresh halaman.')
      }
    })

    return () => { mounted = false }
  }, [])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPdfLoading(false)
    setPageNumber(1)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error)
    setPdfLoading(false)
    setLoadError('Gagal memuat PDF. File mungkin corrupt atau tidak didukung.')
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1))
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, (numPages || 1)))
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
  const rotatePDF = () => setRotation(prev => (prev + 90) % 360)

  // Show loading while library loads
  if (!pdfLib && !loadError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-allin-green" />
          <p className="text-muted-foreground">Memuat PDF viewer...</p>
        </div>
      </div>
    )
  }

  // Show error if library failed to load
  if (loadError || !pdfLib) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <p className="text-red-500">{loadError || 'Gagal memuat PDF viewer'}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Halaman
          </Button>
        </div>
      </div>
    )
  }

  const { Document, Page } = pdfLib

  // Toolbar component
  function Toolbar() {
    return (
      <div className="bg-white rounded-t-xl border border-b-0 px-4 py-3 flex items-center justify-between gap-4">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="h-8 w-8"
          >
            ←
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
            →
          </Button>
        </div>

        {/* Zoom & Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="h-8 px-2"
          >
            -
          </Button>
          
          <span className="text-sm font-medium min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="h-8 px-2"
          >
            +
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={rotatePDF}
            className="h-8 px-2"
          >
            ↻
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toolbar />
      
      {/* PDF Content */}
      <div className="bg-white rounded-b-xl border overflow-auto">
        {pdfLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-allin-green" />
              <p className="text-muted-foreground">Memuat PDF...</p>
            </div>
          </div>
        )}

        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-allin-green" />
            </div>
          }
          options={{
            cMapUrl: '//unpkg.com/pdfjs-dist@' + pdfLib.pdfjs.version + '/cmaps/',
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
    </>
  )
}
