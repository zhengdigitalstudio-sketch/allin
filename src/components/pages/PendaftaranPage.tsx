'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, MEMBER_TYPES } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChevronRight,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  User,
  Building2,
  MapPin,
  FileText,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormData {
  fullName: string
  position: string
  email: string
  phone: string
  companyName: string
  institution: string
  address: string
  city: string
  province: string
  memberType: string
  reason: string
  agreeTerms: boolean
}

interface FormErrors {
  [key: string]: string
}

interface FilePreview {
  file: File | null
  preview: string | null
  uploading: boolean
  uploaded: string | null
}

export default function PendaftaranPage() {
  const { navigate } = useAppStore()
  const [form, setForm] = useState<FormData>({
    fullName: '',
    position: '',
    email: '',
    phone: '',
    companyName: '',
    institution: '',
    address: '',
    city: '',
    province: '',
    memberType: '',
    reason: '',
    agreeTerms: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [logoFile, setLogoFile] = useState<FilePreview>({ file: null, preview: null, uploading: false, uploaded: null })
  const [photoFile, setPhotoFile] = useState<FilePreview>({ file: null, preview: null, uploading: false, uploaded: null })
  const [documentFile, setDocumentFile] = useState<FilePreview>({ file: null, preview: null, uploading: false, uploaded: null })

  const logoRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const documentRef = useRef<HTMLInputElement>(null)

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.fullName.trim()) e.fullName = 'Nama lengkap wajib diisi'
    if (!form.email.trim()) e.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid'
    if (!form.phone.trim()) e.phone = 'Nomor HP wajib diisi'
    if (!form.memberType) e.memberType = 'Jenis anggota wajib dipilih'
    if (!form.agreeTerms) e.agreeTerms = 'Anda harus menyetujui syarat dan ketentuan'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<FilePreview>>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFile({ file, preview: URL.createObjectURL(file), uploading: true, uploaded: null })

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setFile({ file, preview: URL.createObjectURL(file), uploading: false, uploaded: data.url })
      } else {
        setFile({ file, preview: URL.createObjectURL(file), uploading: false, uploaded: null })
      }
    } catch {
      setFile({ file, preview: URL.createObjectURL(file), uploading: false, uploaded: null })
    }
  }

  const removeFile = (setFile: React.Dispatch<React.SetStateAction<FilePreview>>) => {
    setFile({ file: null, preview: null, uploading: false, uploaded: null })
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
          email: form.email,
          phone: form.phone,
          companyName: form.companyName || null,
          institution: form.institution || null,
          address: form.address || null,
          city: form.city || null,
          province: form.province || null,
          memberType: form.memberType,
          logo: logoFile.uploaded || null,
          photo: photoFile.uploaded || null,
          document: documentFile.uploaded || null,
          reason: form.reason || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
      } else {
        setSubmitError(data.error || 'Gagal mengirim pendaftaran. Silakan coba lagi.')
      }
    } catch {
      setSubmitError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 md:p-12 max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-20 h-20 rounded-full bg-allin-green/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-allin-green" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Pendaftaran Berhasil!</h2>
          <p className="text-muted-foreground mb-8">
            Terima kasih telah mendaftar sebagai anggota ALLIN. Pendaftaran Anda sedang dalam proses verifikasi oleh pengurus. Anda akan menerima konfirmasi melalui email.
          </p>
          <Button onClick={() => navigate('home')} className="bg-allin-green hover:bg-allin-green-dark text-white">
            Kembali ke Beranda
          </Button>
        </motion.div>
      </div>
    )
  }

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Beranda</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Pendaftaran Anggota</span>
          </nav>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Pendaftaran Anggota ALLIN
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-lg max-w-2xl"
          >
            Isi formulir berikut untuk mendaftar sebagai anggota ALLIN
          </motion.p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-8">
            {/* Data Pribadi */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-allin-green/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-allin-green" />
                  </div>
                  Data Pribadi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Nama Lengkap *</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className={cn(errors.fullName && 'border-destructive')}
                  />
                  {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <Label htmlFor="position">Jabatan</Label>
                  <Input
                    id="position"
                    value={form.position}
                    onChange={(e) => updateField('position', e.target.value)}
                    placeholder="Masukkan jabatan"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="email@perusahaan.com"
                      className={cn(errors.email && 'border-destructive')}
                    />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Nomor HP *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className={cn(errors.phone && 'border-destructive')}
                    />
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Perusahaan */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-allin-green/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-allin-green" />
                  </div>
                  Data Perusahaan / Instansi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Nama Perusahaan</Label>
                    <Input
                      id="companyName"
                      value={form.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                      placeholder="Nama perusahaan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="institution">Instansi</Label>
                    <Input
                      id="institution"
                      value={form.institution}
                      onChange={(e) => updateField('institution', e.target.value)}
                      placeholder="Nama instansi"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alamat */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-allin-green/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-allin-green" />
                  </div>
                  Alamat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Alamat Lengkap</Label>
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Jl. ..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Kota</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Kota"
                    />
                  </div>
                  <div>
                    <Label htmlFor="province">Provinsi</Label>
                    <Input
                      id="province"
                      value={form.province}
                      onChange={(e) => updateField('province', e.target.value)}
                      placeholder="Provinsi"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jenis Anggota */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-allin-green/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-allin-green" />
                  </div>
                  Jenis Anggota
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={form.memberType} onValueChange={(v) => updateField('memberType', v)}>
                  <SelectTrigger className={cn(errors.memberType && 'border-destructive')}>
                    <SelectValue placeholder="Pilih jenis anggota" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.memberType && <p className="text-xs text-destructive mt-1">{errors.memberType}</p>}
              </CardContent>
            </Card>

            {/* Upload */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-allin-green/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-allin-green" />
                  </div>
                  Upload Dokumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo */}
                <FileUploadField
                  label="Logo Perusahaan"
                  file={logoFile}
                  inputRef={logoRef}
                  onRemove={() => removeFile(setLogoFile)}
                  onChange={(e) => handleFileChange(e, setLogoFile)}
                />
                {/* Foto */}
                <FileUploadField
                  label="Foto"
                  file={photoFile}
                  inputRef={photoRef}
                  onRemove={() => removeFile(setPhotoFile)}
                  onChange={(e) => handleFileChange(e, setPhotoFile)}
                />
                {/* Dokumen */}
                <FileUploadField
                  label="Dokumen Pendukung"
                  file={documentFile}
                  inputRef={documentRef}
                  onRemove={() => removeFile(setDocumentFile)}
                  onChange={(e) => handleFileChange(e, setDocumentFile)}
                  accept=".pdf,.doc,.docx"
                />
              </CardContent>
            </Card>

            {/* Alasan */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-allin-green/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-allin-green" />
                  </div>
                  Alasan Bergabung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.reason}
                  onChange={(e) => updateField('reason', e.target.value)}
                  placeholder="Ceritakan alasan Anda ingin bergabung dengan ALLIN..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Error */}
            {submitError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
                {submitError}
              </div>
            )}

            {/* Terms & Submit */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreeTerms"
                  checked={form.agreeTerms}
                  onCheckedChange={(checked) => updateField('agreeTerms', !!checked)}
                  className={cn('mt-0.5', errors.agreeTerms && 'border-destructive')}
                />
                <Label htmlFor="agreeTerms" className="text-sm leading-relaxed cursor-pointer">
                  Saya menyetujui syarat dan ketentuan keanggotaan ALLIN serta menyatakan bahwa data yang saya isikan adalah benar. *
                </Label>
              </div>
              {errors.agreeTerms && <p className="text-xs text-destructive -mt-2">{errors.agreeTerms}</p>}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-allin-green hover:bg-allin-green-dark text-white font-bold py-6 text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengirim Pendaftaran...
                  </>
                ) : (
                  'Kirim Pendaftaran'
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FileUploadField({
  label,
  file,
  inputRef,
  onRemove,
  onChange,
  accept,
}: {
  label: string
  file: FilePreview
  inputRef: React.RefObject<HTMLInputElement | null>
  onRemove: () => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  accept?: string
}) {
  return (
    <div>
      <Label className="mb-2 block text-sm">{label}</Label>
      {file.preview ? (
        <div className="relative border rounded-xl p-3 flex items-center gap-3">
          {file.file?.type.startsWith('image/') ? (
            <img src={file.preview} alt={label} className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.file?.name}</p>
            {file.uploading && (
              <p className="text-xs text-allin-green flex items-center gap-1 mt-0.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Mengupload...
              </p>
            )}
            {file.uploaded && (
              <p className="text-xs text-allin-green flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Berhasil diupload
              </p>
            )}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="flex-shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:border-allin-green/50 hover:bg-allin-green/5 transition-colors cursor-pointer"
        >
          <Upload className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Klik untuk upload {label.toLowerCase()}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={onChange}
      />
    </div>
  )
}