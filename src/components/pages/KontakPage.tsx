'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function KontakPage() {
  const { navigate } = useAppStore()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nama wajib diisi'
    if (!form.email.trim()) e.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid'
    if (!form.message.trim()) e.message = 'Pesan wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject || null,
          message: form.message,
        }),
      })
      if (res.ok) {
        setSuccess(true)
      }
    } catch {
      // silent fail
    } finally {
      setSubmitting(false)
    }
  }

  const contactInfo = [
    { icon: Mail, label: 'Email', value: 'info@allin.or.id', href: 'mailto:info@allin.or.id' },
    { icon: Phone, label: 'Telepon', value: '+62 21 1234 5678', href: 'tel:+622112345678' },
    { icon: MapPin, label: 'Alamat', value: 'Jakarta, Indonesia', href: null },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Kontak</span>
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Hubungi Kami
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-lg max-w-2xl"
          >
            Kami siap membantu Anda. Silakan hubungi kami melalui formulir atau informasi kontak berikut.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-allin-green/5 border border-allin-green/20 rounded-2xl p-8 text-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-allin-green mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Pesan Terkirim!</h3>
                  <p className="text-muted-foreground mb-6">
                    Terima kasih telah menghubungi kami. Tim kami akan segera merespons pesan Anda.
                  </p>
                  <Button
                    onClick={() => {
                      setSuccess(false)
                      setForm({ name: '', email: '', subject: '', message: '' })
                    }}
                    variant="outline"
                    className="border-allin-green text-allin-green"
                  >
                    Kirim Pesan Lain
                  </Button>
                </motion.div>
              ) : (
                <div className="bg-background border shadow-sm rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-bold mb-6">Kirim Pesan</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nama *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Nama lengkap"
                        className={cn(errors.name && 'border-destructive')}
                      />
                      {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="email@domain.com"
                        className={cn(errors.email && 'border-destructive')}
                      />
                      {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <Label htmlFor="subject">Subjek</Label>
                      <Input
                        id="subject"
                        value={form.subject}
                        onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                        placeholder="Subjek pesan"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Pesan *</Label>
                      <Textarea
                        id="message"
                        value={form.message}
                        onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                        placeholder="Tulis pesan Anda..."
                        rows={5}
                        className={cn(errors.message && 'border-destructive')}
                      />
                      {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full bg-allin-green hover:bg-allin-green-dark text-white font-bold"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Kirim Pesan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-4">
              {contactInfo.map((info, i) => (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  {info.href ? (
                    <a href={info.href}>
                      <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-allin-green/10 flex items-center justify-center flex-shrink-0">
                            <info.icon className="w-5 h-5 text-allin-green" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{info.label}</p>
                            <p className="font-medium text-sm mt-0.5">{info.value}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  ) : (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-allin-green/10 flex items-center justify-center flex-shrink-0">
                          <info.icon className="w-5 h-5 text-allin-green" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{info.label}</p>
                          <p className="font-medium text-sm mt-0.5">{info.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ))}

              {/* Map Placeholder */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-48 gradient-green relative flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Peta Lokasi</p>
                    <p className="text-xs">Jakarta, Indonesia</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}