'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, MEMBER_TYPES } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronRight,
  CheckCircle2,
  Loader2,
  FileText,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateRegistrationPdf } from '@/lib/generate-registration-pdf'

interface FormData {
  fullName: string
  position: string
  companyName: string
  address: string
  phone: string
  email: string
  memberType: string
  reason: string
  agreeTerms: boolean
}

interface FormErrors {
  [key: string]: string
}

export default function PendaftaranPage() {
  const { navigate } = useAppStore()
  const [form, setForm] = useState<FormData>({
    fullName: '',
    position: '',
    companyName: '',
    address: '',
    phone: '',
    email: '',
    memberType: '',
    reason: '',
    agreeTerms: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredId, setRegisteredId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.fullName.trim()) e.fullName = 'Nama wajib diisi'
    if (!form.email.trim()) e.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid'
    if (!form.phone.trim()) e.phone = 'Telepon wajib diisi'
    if (!form.memberType) e.memberType = 'Jenis usaha wajib dipilih'
    if (!form.agreeTerms) e.agreeTerms = 'Anda harus menyetujui'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          position: form.position || null,
          companyName: form.companyName || null,
          address: form.address || null,
          phone: form.phone,
          email: form.email,
          memberType: form.memberType,
          reason: form.reason || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        const result = data.member || data
        setRegisteredId(result.id || null)
        setSuccess(true)
        generateRegistrationPdf({
          fullName: form.fullName,
          position: form.position,
          companyName: form.companyName,
          address: form.address,
          phone: form.phone,
          email: form.email,
          memberType: form.memberType,
          registrationId: result.id,
          registeredAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        })
      } else {
        setSubmitError(data.error || 'Gagal mengirim pendaftaran.')
      }
    } catch {
      setSubmitError('Terjadi kesalahan jaringan.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 md:p-12 max-w-md w-full text-center shadow-xl"
        >
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Pendaftaran Berhasil!</h2>
          <p className="text-gray-500 mb-6">
            Terima kasih telah mendaftar sebagai anggota ALLIN. Data Anda telah tersimpan.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">Langkah Selanjutnya</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  1. Download formulir pendaftaran di bawah ini<br />
                  2. Cetak formulir pada kertas A4<br />
                  3. Tanda tangani formulir tersebut<br />
                  4. Tempel meterai Rp 10.000 pada kolom yang disediakan<br />
                  5. Kirimkan formulir ke sekretariat ALLIN
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              generateRegistrationPdf({
                fullName: form.fullName,
                position: form.position,
                companyName: form.companyName,
                address: form.address,
                phone: form.phone,
                email: form.email,
                memberType: form.memberType,
                registrationId: registeredId || undefined,
                registeredAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
              })
            }}
            className="flex items-center justify-center gap-2 w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors mb-3"
          >
            <Download className="w-5 h-5" />
            Download Formulir PDF
          </button>
          <Button onClick={() => navigate('home')} variant="outline" className="w-full">
            Kembali ke Beranda
          </Button>
        </motion.div>
      </div>
    )
  }

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  const fields: { num: number; label: string; field: keyof FormData; type: 'text' | 'email' | 'tel' | 'select'; placeholder: string; required?: boolean }[] = [
    { num: 1, label: 'Nama', field: 'fullName', type: 'text', placeholder: 'Nama lengkap', required: true },
    { num: 2, label: 'Jabatan', field: 'position', type: 'text', placeholder: 'Jabatan / posisi' },
    { num: 3, label: 'Nama Perusahaan', field: 'companyName', type: 'text', placeholder: 'Nama perusahaan / instansi' },
    { num: 4, label: 'Alamat', field: 'address', type: 'text', placeholder: 'Alamat lengkap' },
    { num: 5, label: 'Telepon', field: 'phone', type: 'tel', placeholder: '08xx / (021) xxx', required: true },
    { num: 6, label: 'Email', field: 'email', type: 'email', placeholder: 'email@perusahaan.com', required: true },
    { num: 7, label: 'Jenis Usaha', field: 'memberType', type: 'select', placeholder: 'Pilih jenis usaha', required: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <button onClick={() => navigate('home')} className="hover:text-gray-700 transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-700">Pendaftaran</span>
          </nav>

          <div className="text-center mb-2">
            <img src="/logo.png" alt="ALLIN" className="h-16 mx-auto mb-3" />
            <h1 className="text-sm md:text-base font-bold uppercase tracking-wide text-gray-800">
              ASOSIASI LINGKUNGAN INDUSTRI KETENAGALISTRIKAN NASIONAL (ALLIN)
            </h1>
          </div>
          <p className="text-center text-xs text-gray-500 mb-1">
            SEKRETARIAT : Ruko Sentra Menteng Blok MN 47 Bintaro Jaya Sektor 7
          </p>
          <p className="text-center text-xs text-gray-500">
            Tangerang Selatan - Banten 15224
          </p>

          <div className="border-t-2 border-gray-800 mt-4 pt-6">
            <h2 className="text-center text-2xl md:text-3xl font-bold uppercase tracking-wide text-gray-800">
              FORMULIR KEANGGOTAAN
            </h2>
            <p className="text-center text-sm text-gray-500 mt-2">
              Dengan ini saya bermaksud mendaftar sebagai anggota ALLIN dengan data sebagai berikut:
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6 md:p-10 space-y-5">

              {fields.map(({ num, label, field, type, placeholder, required }) => (
                <div key={num} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <Label className={cn('sm:w-40 shrink-0 text-sm font-medium text-gray-700', required && 'after:content-["*"] after:text-red-500 after:ml-0.5')}>
                    {num}. {label}
                  </Label>
                  {type === 'select' ? (
                    <div className="flex-1">
                      <select
                        value={form[field] as string}
                        onChange={(e) => updateField(field, e.target.value)}
                        className={cn(
                          'w-full h-10 rounded-lg border bg-white px-3 text-sm outline-none transition-colors',
                          errors[field] ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-100'
                        )}
                      >
                        <option value="">— Pilih Jenis Usaha —</option>
                        {MEMBER_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
                    </div>
                  ) : (
                    <div className="flex-1">
                      <Input
                        type={type}
                        value={form[field] as string}
                        onChange={(e) => updateField(field, e.target.value)}
                        placeholder={placeholder}
                        className={cn(errors[field] && 'border-red-400 focus:ring-2 focus:ring-red-200')}
                      />
                      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
                    </div>
                  )}
                </div>
              ))}

              {/* Alasan */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                <Label className="sm:w-40 shrink-0 text-sm font-medium text-gray-700 pt-2">8. Alasan</Label>
                <Textarea
                  value={form.reason}
                  onChange={(e) => updateField('reason', e.target.value)}
                  placeholder="Alasan ingin bergabung dengan ALLIN..."
                  rows={3}
                  className="flex-1"
                />
              </div>

              {/* Peraturan */}
              <div className="pt-4 mt-2 border-t-2 border-gray-800">
                <p className="text-sm font-bold text-gray-800 mb-3">
                  Dengan ini menyatakan bahwa kami :
                </p>
                <ol className="list-decimal list-inside space-y-2.5 text-sm text-gray-700 leading-relaxed">
                  <li>
                    Untuk dan atas nama Perusahaan/Perorangan* tersebut mengajukan permintaan menjadi anggota
                    Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN).
                  </li>
                  <li>
                    Menaati seluruh kewajiban sebagai anggota Asosiasi sesuai dengan ketentuan yang berlaku.
                  </li>
                  <li>
                    Menyetujui biaya pendaftaran atas nama Perusahaan sejumlah Rp. 10.000.000,-
                    (Sepuluh Juta Rupiah) dan iuran tahunan sejumlah Rp. 2.500.000,-
                    (Dua Juta Lima Ratus Ribu Rupiah).
                  </li>
                </ol>
              </div>

              {/* Error */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{submitError}</div>
              )}

              {/* Terms & Submit */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agreeTerms"
                    checked={form.agreeTerms}
                    onCheckedChange={(checked) => updateField('agreeTerms', !!checked)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="agreeTerms" className="text-sm leading-relaxed cursor-pointer text-gray-600">
                    Dengan menandatangani / mencentang ini, saya menyatakan setuju dan akan mengikuti
                    segala peraturan dan ketentuan yang berlaku di ALLIN. *
                  </Label>
                </div>
                {errors.agreeTerms && <p className="text-xs text-red-500 -mt-2">{errors.agreeTerms}</p>}

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-6 text-base"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim Pendaftaran...</>
                  ) : (
                    'Kirim Pendaftaran'
                  )}
                </Button>

                <p className="text-xs text-gray-400 text-center italic">
                  *Pilih salah satu dengan melingkari &mdash; Jika mendaftar sebagai perusahaan, jika sebagai perorangan cukup mengisi kolom nama
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}