'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ChevronRight,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecipientOption {
  key: string
  label: string
  email: string
}

export default function KontakPage() {
  const { navigate } = useAppStore()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', recipientKey: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [recipients, setRecipients] = useState<RecipientOption[]>([])

  useEffect(() => {
    fetch('/api/contacts/options')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.recipients)) {
          setRecipients(data.recipients)
        }
      })
      .catch(() => {})
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nama wajib diisi'
    if (!form.email.trim()) e.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid'
    if (!form.message.trim()) e.message = 'Pesan wajib diisi'
    if (recipients.length > 0 && !form.recipientKey) e.recipientKey = 'Pilih tujuan pesan'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const recipient = recipients.find((r) => r.key === form.recipientKey)
    const toEmail = recipient?.email || ''

    // Build email body
    const bodyLines = [
      `Dari: ${form.name} (${form.email})`,
      '',
      form.message,
    ]
    const bodyText = bodyLines.join('\n')

    // Build subject
    const subjectText = form.subject
      ? `[ALLIN] ${form.subject}`
      : '[ALLIN] Pesan dari Website'

    // Build mailto: URL
    const params = new URLSearchParams()
    params.set('subject', subjectText)
    params.set('body', bodyText)
    const mailtoUrl = `mailto:${toEmail}?${params.toString()}`

    // Open email client
    window.location.href = mailtoUrl

    setSuccess(true)
  }

  const contactInfo = [
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
            Pilih pengurus yang ingin dihubungi, lalu kirim pesan langsung melalui email Anda.
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
                  <h3 className="text-xl font-bold mb-2">Email App Terbuka!</h3>
                  <p className="text-muted-foreground mb-6">
                    Pesan sudah otomatis terisi di email Anda. Tinggal klik <strong>Kirim</strong> di aplikasi email untuk mengirim.
                  </p>
                  <Button
                    onClick={() => {
                      setSuccess(false)
                      setForm({ name: '', email: '', subject: '', message: '', recipientKey: '' })
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
                    {/* Recipient Selector */}
                    {recipients.length > 0 && (
                      <div>
                        <Label>Tujuan Pesan *</Label>
                        <Select
                          value={form.recipientKey}
                          onValueChange={(v) => setForm((p) => ({ ...p, recipientKey: v }))}
                        >
                          <SelectTrigger className={cn(errors.recipientKey && 'border-destructive')}>
                            <SelectValue placeholder="Pilih pengurus..." />
                          </SelectTrigger>
                          <SelectContent>
                            {recipients.map((r) => (
                              <SelectItem key={r.key} value={r.key}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.recipientKey && <p className="text-xs text-destructive mt-1">{errors.recipientKey}</p>}
                      </div>
                    )}
                    <div>
                      <Label htmlFor="name">Nama Anda *</Label>
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
                      <Label htmlFor="email">Email Anda *</Label>
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
                      className="w-full bg-allin-green hover:bg-allin-green-dark text-white font-bold"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Pesan
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Klik &quot;Kirim Pesan&quot; akan membuka aplikasi email Anda dengan pesan yang sudah terisi.
                    </p>
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