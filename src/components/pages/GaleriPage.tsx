'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronRight, X, ImagePlus, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface GalleryItem {
  id: string
  title: string
  description: string | null
  imageUrl: string
  category: string | null
  createdAt: string
}

const gradients = [
  'from-allin-green to-allin-green-dark',
  'from-allin-green-light to-allin-green',
  'from-allin-green-dark to-allin-green',
  'from-allin-yellow to-allin-yellow-dark',
  'from-allin-yellow-light to-allin-green',
  'from-allin-green to-allin-yellow-light',
]

export default function GaleriPage() {
  const { navigate } = useAppStore()
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  const fetchGallery = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gallery?limit=100')
      const data = await res.json()
      if (!data.error) {
        const items: GalleryItem[] = data.gallery || []
        setGallery(items)
        const cats = [...new Set(items.map((g) => g.category).filter(Boolean) as string[])]
        setCategories(cats)
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGallery()
  }, [fetchGallery])

  const filtered = activeCategory === 'Semua' ? gallery : gallery.filter((g) => g.category === activeCategory)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Galeri</span>
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Galeri
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-lg max-w-2xl"
          >
            Dokumentasi kegiatan dan momen penting ALLIN
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Button
                variant={activeCategory === 'Semua' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('Semua')}
                className={activeCategory === 'Semua' ? 'bg-allin-green hover:bg-allin-green-dark text-white' : ''}
              >
                Semua
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={activeCategory === cat ? 'bg-allin-green hover:bg-allin-green-dark text-white' : ''}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ImagePlus className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Belum ada item di galeri.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="group cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', gradients[i % gradients.length])}>
                        <ImagePlus className="w-10 h-10 text-white/30" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex flex-col items-center justify-center p-4">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 mb-2" />
                      <h3 className="text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center line-clamp-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-white/70 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium mt-2 line-clamp-1">{item.title}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Dialog */}
      <AnimatePresence>
        {selectedItem && (
          <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden">
              <VisuallyHidden>
                <DialogTitle>{selectedItem.title}</DialogTitle>
              </VisuallyHidden>
              <div className="relative">
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={() => setSelectedItem(null)}
                >
                  <X className="w-5 h-5" />
                </Button>

                {/* Image */}
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {selectedItem.imageUrl ? (
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', gradients[0])}>
                      <ImagePlus className="w-20 h-20 text-white/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1">{selectedItem.title}</h3>
                  {selectedItem.description && (
                    <p className="text-muted-foreground text-sm">{selectedItem.description}</p>
                  )}
                  {selectedItem.category && (
                    <span className="inline-block mt-2 text-xs text-allin-green font-medium bg-allin-green/10 px-2 py-1 rounded">
                      {selectedItem.category}
                    </span>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}