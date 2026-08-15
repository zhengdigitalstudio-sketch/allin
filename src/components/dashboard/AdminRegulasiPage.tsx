'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Upload, Plus, Search, Filter, Download, Trash2, Edit3,
  Globe, Lock, X, Check, ExternalLink,
  FileDown, RefreshCw, Loader2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Regulasi {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  publicId: string;
  status: string;
  isForMemberOnly: boolean;
  downloadCount: number;
  authorId: string;
  author: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

// Categories
const CATEGORIES = ['Umum', 'Lingkungan', 'K3', 'Teknologi', 'Hukum', 'Keuangan', 'SDM'];

// Cloudinary Config - UNSIGNED PRESET ONLY
const CLOUDINARY = {
  cloudName: 'czpvpb9j',
  uploadPreset: 'regulasi_pdf_upload',
  uploadUrl: 'https://api.cloudinary.com/v1_1/czpvpb9j/raw/upload'
};

// Format file size
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date
function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default function AdminRegulasiPage() {
  // State
  const [regulasiList, setRegulasiList] = useState<Regulasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRegulasi, setEditingRegulasi] = useState<Regulasi | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Umum',
    isForMemberOnly: false,
    status: 'PUBLISHED',
  });
  
  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [cloudinaryData, setCloudinaryData] = useState<{
    url: string;
    publicId: string;
    fileName: string;
    fileSize: number;
  } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Mounted state (to avoid hydration issues)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    console.log('✅ [v11-CLEAN] AdminRegulasiPage mounted');
  }, []);

  // Fetch regulasi list
  const fetchRegulasi = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter !== 'Semua') params.append('category', categoryFilter);
      
      const response = await fetch(`/api/regulasi?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setRegulasiList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching regulasi:', error);
      toast.error('Gagal memuat data regulasi');
      setRegulasiList([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter]);

  // Initial fetch
  useEffect(() => {
    fetchRegulasi();
  }, [fetchRegulasi]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Umum',
      isForMemberOnly: false,
      status: 'PUBLISHED',
    });
    setSelectedFile(null);
    setCloudinaryData(null);
    setUploadProgress(0);
    setUploading(false);
    setDebugInfo('');
    setEditingRegulasi(null);
  };

  // Handle create/edit dialog open
  const handleOpenDialog = (regulasi?: Regulasi) => {
    if (regulasi && typeof regulasi === 'object') {
      setEditingRegulasi(regulasi);
      setFormData({
        title: regulasi.title || '',
        description: regulasi.description || '',
        category: regulasi.category || 'Umum',
        isForMemberOnly: !!regulasi.isForMemberOnly,
        status: regulasi.status || 'PUBLISHED',
      });
      setSelectedFile(null);
      setCloudinaryData(null);
    } else {
      resetForm();
    }
    setShowCreateDialog(true);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Hanya file PDF yang diterima');
      return;
    }

    // Vercel limit: 4.5MB, Cloudinary free: 10MB - kita pakai 5MB aman
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (aman untuk Vercel + Cloudinary)
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`❌ File terlalu besar! ${(file.size / 1024 / 1024).toFixed(1)}MB > 5MB limit`, {
        duration: 5000,
        description: 'Kompres PDF atau gunakan file lebih kecil'
      });
      return;
    }

    // Warning jika file > 3MB (dekat limit)
    if (file.size > 3 * 1024 * 1024) {
      toast.warning(`⚠️ File cukup besar: ${(file.size / 1024 / 1024).toFixed(1)}MB`, {
        duration: 3000,
      });
    }

    setSelectedFile(file);
    setCloudinaryData(null);
    toast.success(`✅ File dipilih: ${file.name} (${formatFileSize(file.size)})`);
  };

  // ============================================
  // 🚀 UPLOAD TO CLOUDINARY - DIRECT CLIENT UPLOAD!
  // ============================================
  // File dikirim LANGSUNG: Browser → Cloudinary (TIDAK lewat Vercel!)
  // Jadi tidak kena limit 4.5MB Vercel! Max 10MB (Cloudinary free tier)
  const uploadToCloudinary = async (): Promise<{
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
} | null> => {
  if (!selectedFile) return null;

  try {
    setUploading(true);
    setUploadProgress(10);
    setDebugInfo('📤 Starting DIRECT upload to Cloudinary...');

    // Create FormData for DIRECT upload to Cloudinary
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_preset', CLOUDINARY.uploadPreset);
    formData.append('resource_type', 'raw'); // PDF as raw file
    // NOTE: type=upload tidak diizinkan untuk unsigned upload!
    // File akan public jika upload preset di Cloudinary dikonfigurasi sebagai "Unsigned"

    console.log('📤 [DIRECT-UPLOAD] Uploading directly to Cloudinary:');
    console.log('   - URL:', CLOUDINARY.uploadUrl);
    console.log('   - File:', selectedFile.name, `(${(selectedFile.size/1024/1024).toFixed(2)}MB)`);
    console.log('   - Route: Browser → Cloudinary (NO Vercel!)');

    setUploadProgress(20);
    setDebugInfo(`📤 Mengupload ${selectedFile.name} langsung ke Cloudinary...`);

    // DIRECT upload to Cloudinary - NO Vercel proxy!
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 min timeout

    const response = await fetch(CLOUDINARY.uploadUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    
    // Parse response
    let result: any;
    let responseText = '';
    try {
      responseText = await response.text();
      result = JSON.parse(responseText);
    } catch (parseError) {
      if (responseText.includes('Entity too large') || responseText.includes('too large')) {
        throw new Error(`File terlalu besar! Maksimal 10MB.`);
      } else {
        throw new Error(`Response tidak valid (HTTP ${response.status})`);
      }
    }
    
    setUploadProgress(80);

    // Check for errors
    if (!response.ok || result.error) {
      const errorMsg = result.error?.message || result.error || `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    setUploadProgress(100);
    setDebugInfo('✅ Upload langsung ke Cloudinary berhasil!');

    // Return Cloudinary data
    return {
      url: result.secure_url || result.url,
      publicId: result.public_id || '',
      fileName: result.original_filename || selectedFile.name,
      fileSize: result.bytes || selectedFile.size,
    };

  } catch (error: any) {
    console.error('❌ [DIRECT-UPLOAD] Upload error:', error);
    setDebugInfo(`❌ ${error.message}`);
    throw error;
  } finally {
    setUploading(false);
  }
};
  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.title.trim()) {
      toast.error('Judul wajib diisi');
      return;
    }

    let finalCloudinaryData = cloudinaryData;

    // Upload file if needed
    if ((!editingRegulasi || selectedFile) && !finalCloudinaryData && selectedFile) {
      try {
        toast.info('⏳ Sedang upload file...');
        finalCloudinaryData = await uploadToCloudinary();
      } catch (uploadError: unknown) {
        const err = uploadError as Error;
        toast.error(`❌ Upload Gagal: ${err.message}`, { duration: 5000 });
        return;
      }
      
      if (!finalCloudinaryData) {
        toast.error('Upload file gagal');
        return;
      }
      
      setCloudinaryData(finalCloudinaryData);
      toast.success('✅ File berhasil diupload!');
    }

    // For edit without new file
    if (editingRegulasi && !finalCloudinaryData && !selectedFile) {
      finalCloudinaryData = {
        url: editingRegulasi.fileUrl || '',
        publicId: editingRegulasi.publicId || '',
        fileName: editingRegulasi.fileName || '',
        fileSize: editingRegulasi.fileSize || 0,
      };
    }

    if (!editingRegulasi && !finalCloudinaryData) {
      toast.error('File PDF wajib diunggah');
      return;
    }

    setSubmitting(true);

    try {
      const jsonData = {
        title: formData.title.trim(),
        description: formData.description || '',
        category: formData.category || 'Umum',
        isForMemberOnly: formData.isForMemberOnly,
        status: formData.status,
        ...(finalCloudinaryData ? {
          fileName: finalCloudinaryData.fileName,
          fileUrl: finalCloudinaryData.url,
          publicId: finalCloudinaryData.publicId,
          fileSize: finalCloudinaryData.fileSize,
          mimeType: 'application/pdf',
        } : {}),
      };

      const url = editingRegulasi 
        ? `/api/regulasi/${editingRegulasi.id}`
        : '/api/regulasi';
      
      const method = editingRegulasi ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      toast.success(editingRegulasi ? '✅ Regulasi diperbarui!' : '✅ Regulasi ditambahkan!');
      
      setShowCreateDialog(false);
      resetForm();
      fetchRegulasi();

    } catch (error: unknown) {
      const err = error as Error;
      console.error('Submit error:', err);
      toast.error(err.message || 'Gagal menyimpan regulasi');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (regulasi: Regulasi) => {
    if (!confirm(`Hapus "${regulasi.title}"?`)) return;

    try {
      const response = await fetch(`/api/regulasi/${regulasi.id}`, { method: 'DELETE' });
      
      if (!response.ok) throw new Error('Gagal menghapus');
      
      toast.success('🗑️ Regulasi dihapus');
      fetchRegulasi();
    } catch (error) {
      toast.error('Gagal menghapus regulasi');
    }
  };

  // Handle download
  const handleDownload = async (regulasi: Regulasi) => {
    try {
      const response = await fetch(`/api/regulasi/${regulasi.id}?download=true`);
      const data = await response.json();
      
      if (data.url) {
        window.open(data.url, '_blank');
        
        // Increment local count
        setRegulasiList(prev => prev.map(r => 
          r.id === regulasi.id 
            ? { ...r, downloadCount: (r.downloadCount || 0) + 1 }
            : r
        ));
      }
    } catch (error) {
      toast.error('Gagal mendapatkan link download');
    }
  };

  // Toggle visibility
  const toggleVisibility = async (regulasi: Regulasi) => {
    try {
      const response = await fetch(`/api/regulasi/${regulasi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isForMemberOnly: !regulasi.isForMemberOnly 
        }),
      });
      
      if (response.ok) {
        toast.success(regulasi.isForMemberOnly ? '🔓 Dibuka untuk publik' : '🔒 Diubah ke member only');
        fetchRegulasi();
      }
    } catch (error) {
      toast.error('Gagal mengubah visibilitas');
    }
  };

  // Filtered list
  const filteredRegulasi = regulasiList.filter(r => {
    const matchesSearch = !searchTerm || 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Version indicator */}
      {isMounted && (
        <div className="text-xs font-mono bg-green-100 text-green-800 px-3 py-1 rounded inline-block">
          ✅ v11-CLEAN | Mode: UNSIGNED PRESET
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            Kelola Regulasi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload dan kelola dokumen regulasi (PDF via Cloudinary)
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Regulasi
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari regulasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="Semua">Semua Kategori</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : filteredRegulasi.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Belum ada regulasi</p>
            <button
              onClick={() => handleOpenDialog()}
              className="mt-3 text-blue-600 hover:text-blue-700 underline"
            >
              Tambah regulasi pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Informasi
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">
                    Kategori
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">
                    Ukuran
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">
                    Visibilitas
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">
                    Download
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRegulasi.map((regulasi) => (
                  <tr key={regulasi.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-red-100 p-2 rounded-lg mt-0.5">
                          <FileText className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{regulasi.title}</p>
                          <p className="text-sm text-gray-500 truncate">{regulasi.fileName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            oleh {regulasi.author?.name || 'Unknown'} · {formatDate(regulasi.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        {regulasi.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{formatFileSize(regulasi.fileSize)}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <button
                        onClick={() => toggleVisibility(regulasi)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                          regulasi.isForMemberOnly
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {regulasi.isForMemberOnly ? (
                          <><Lock className="w-3 h-3" /> Member Only</>
                        ) : (
                          <><Globe className="w-3 h-3" /> Publik</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Download className="w-4 h-4" />
                        {regulasi.downloadCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(regulasi)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDialog(regulasi)}
                          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(regulasi)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowCreateDialog(false); resetForm(); }}
            />
            
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-auto overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 sticky top-0 z-10">
                {isMounted && (
                  <div className="bg-yellow-400 text-black rounded-lg px-3 py-1 mb-2 text-center text-xs font-bold">
                    ⚡ v11-CLEAN | UNSIGNED MODE
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    {editingRegulasi ? 'Edit Regulasi' : 'Tambah Regulasi Baru'}
                  </h2>
                  <button
                    onClick={() => { setShowCreateDialog(false); resetForm(); }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Judul Regulasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Masukkan judul regulasi..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Category & Status Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="PUBLISHED">Diterbitkan</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    File PDF {!editingRegulasi && <span className="text-red-500">*</span>}
                  </label>
                  
                  <div className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                    uploading ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400'
                  }`}>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload-v11"
                      disabled={uploading}
                    />
                    
                    {uploading ? (
                      <div className="text-center py-6 space-y-3">
                        <Loader2 className="w-10 h-10 text-blue-600 mx-auto animate-spin" />
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-800">{debugInfo || 'Uploading...'}</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : debugInfo && debugInfo.startsWith('❌') ? (
                      <div className="text-center py-4 space-y-3">
                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-red-800">Upload Gagal</p>
                          <p className="text-xs text-red-600 mt-1 whitespace-pre-wrap">{debugInfo}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setDebugInfo(''); setUploadProgress(0); }}
                          className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    ) : cloudinaryData && cloudinaryData.url ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                          <Check className="w-5 h-5 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-900 truncate">{cloudinaryData.fileName}</p>
                            <p className="text-xs text-green-700">{formatFileSize(cloudinaryData.fileSize)} • Uploaded ✓</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setCloudinaryData(null); setSelectedFile(null); }}
                            className="p-1 text-green-600 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : !selectedFile ? (
                      <label htmlFor="pdf-upload-v11" className="cursor-pointer block text-center py-6">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Klik untuk upload PDF</p>
                        <p className="text-xs text-gray-400 mt-1">Maksimal 20MB • Unsigned Preset ☁️</p>
                      </label>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <FileText className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)} • Siap upload</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibilitas</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isForMemberOnly: false })}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        !formData.isForMemberOnly
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Globe className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Publik</p>
                        <p className="text-xs opacity-70">Bisa diakses semua orang</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isForMemberOnly: true })}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.isForMemberOnly
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Lock className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Member Only</p>
                        <p className="text-xs opacity-70">Hanya untuk member</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => { setShowCreateDialog(false); resetForm(); }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                    ) : editingRegulasi ? (
                      <><Check className="w-4 h-4" /> Perbarui</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Upload ke Cloudinary</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
