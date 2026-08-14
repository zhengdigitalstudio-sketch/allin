'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Upload, Plus, Search, Filter, Download, Trash2, Edit3,
  Globe, Lock, X, Check, ExternalLink,
  FileDown, RefreshCw, Loader2, AlertCircle, Cloud
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
  // 🚨🚨🚨 VERSION v8-CACHE-BUST (2026-08-14 08:02) 🚨🚨🚨
  // CACHE BUSTER: Jika ini tidak muncul, browser masih cache!
  const CACHE_BUST = 'v8-' + Date.now();
  console.log('%c✅ [v8-CACHE-BUST] NEW CODE LOADED!', 'background: #00ff00; color: black; font-size: 20px; padding: 10px;');
  console.log('%c⏰ Timestamp:', 'font-weight: bold;', new Date().toISOString());
  console.log('%c🔑 Cache Buster:', 'font-weight: bold;', CACHE_BUST);
  
  // Visible version state for UI
  const [codeVersion, setCodeVersion] = useState<string>(`v8-${new Date().toLocaleTimeString('id-ID')}`);
  
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
  
  // Direct upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [cloudinaryData, setCloudinaryData] = useState<{
    url: string;
    publicId: string;
    fileName: string;
    fileSize: number;
  } | null>(null);
  
  // Debug/Status message state ✅ DITAMBAHKAN!
  const [debugInfo, setDebugInfo] = useState<string>('');

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
    setDebugInfo(''); // ✅ Reset debug info
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

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Hanya file PDF yang diterima');
      return;
    }

    // Validate file size (20MB max)
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Ukuran file terlalu besar. Maksimal 20MB (file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    setSelectedFile(file);
    setCloudinaryData(null);
    toast.success(`File dipilih: ${file.name} (${formatFileSize(file.size)})`);
  };

  // ============================================
  // 🚀 CLIENT-SIDE DIRECT UPLOAD (for large files >4.5MB)
  // Uses UNSIGNED UPLOAD PRESET - no signature needed!
  // Bypasses Vercel's 4.5MB limit!
  // ============================================
  const uploadDirectToCloudinary = async (): Promise<{
    url: string;
    publicId: string;
    fileName: string;
    fileSize: number;
  } | null> => {
    if (!selectedFile) return null;

    try {
      setUploading(true);
      setUploadProgress(5);
      setDebugInfo('☁️ Memulai upload ke Cloudinary...');

      // 🚨🚨🚨 ALERT v8 - PASTIKAN KODE BARU! 🚨🚨🚨
      const alertMsg = `
╔════════════════════════════════════════╗
║  ✅ v8-CACHE-BUST CODE RUNNING! ✅      ║
╠════════════════════════════════════════╣
║  Time: ${new Date().toLocaleTimeString('id-ID')}          ║
║  File: ${selectedFile.name.slice(0, 20)}...           ║
║                                        ║
║  SENDING TO CLOUDINARY:                ║
║  • file (PDF)                          ║
║  • upload_preset: regulasi_pdf_upload  ║
║                                        ║
║  NOT SENDING:                          ║
║  ❌ NO signature                       ║
║  ❌ NO timestamp                       ║
║  ❌ NO folder                          ║
║  ❌ NO public_id                       ║
╚════════════════════════════════════════╝
      `;
      alert(alertMsg);

      // ===========================================
      // 🆕 v6-FIXED: Minimal Unsigned Upload ONLY
      // ===========================================
      const CLOUD_NAME = 'czpvpb9j';
      const UPLOAD_PRESET = 'regulasi_pdf_upload';
      
      setUploadProgress(10);
      
      // Create FormData - ONLY these 2 fields!
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', UPLOAD_PRESET);
      
      // 🔍 DEBUG: Log ALL FormData entries to prove we only send unsigned params
      console.log('📤 [v6-FIXED] FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`   - ${key}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value);
      }
      console.log('   ✅ Total fields:', [...formData.entries()].length, '(should be exactly 2!)');
      
      setDebugInfo(`📤 Mengupload ${selectedFile.name}...`);

      // Upload with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 min

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
        {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      
      const result = await response.json();
      console.log('📥 [FRESH] Response:', response.status, result);

      if (!response.ok) {
        throw new Error(result.error?.message || `HTTP ${response.status}`);
      }

      setUploadProgress(100);
      setDebugInfo('✅ Upload berhasil!');

      return {
        url: result.secure_url,
        publicId: result.public_id || '',
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      };

    } catch (error: any) {
      console.error('❌ [FRESH] Error:', error);
      setDebugInfo(`❌ ${error.message}`);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // ✅ SERVER PROXY UPLOAD (File → Server → Cloudinary) - untuk file kecil (<4.5MB)
  const uploadViaProxy = async (): Promise<{
    url: string;
    publicId: string;
    fileName: string;
    fileSize: number;
  } | null> => {
    if (!selectedFile) return null;

    try {
      setUploading(true);
      setUploadProgress(5);
      setDebugInfo('📤 Mempersiapkan file...');

      const formData = new FormData();
      formData.append('file', selectedFile);

      setUploadProgress(15);
      setDebugInfo('☁️ Mengirim ke server...');

      // Timeout 60 detik untuk seluruh proses
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      // Progress simulation - lebih realistis
      let progress = 15;
      const progressInterval = setInterval(() => {
        if (progress < 80) {
          progress += Math.random() * 10; // Random increment
          setUploadProgress(Math.min(progress, 80));
        }
      }, 1500);

      console.log('🚀 Starting upload to /api/regulasi/upload-proxy...');
      
      const startTime = Date.now();
      
      const response = await fetch('/api/regulasi/upload-proxy', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`⏱️ Response received in ${elapsed}s`);

      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      
      setUploadProgress(85);
      setDebugInfo(`📥 Menerima respons (${elapsed}s)...`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Error ${response.status}`;
        let fullErrorMsg = errorMsg;
        
        try {
          const errJson = JSON.parse(errorText);
          errorMsg = errJson.error || errJson.details || errorMsg;
          
          // Build detailed message with suggestion
          fullErrorMsg = errorMsg;
          if (errJson.details && errJson.details !== errJson.error) {
            fullErrorMsg = errJson.details;
          }
          if (errJson.suggestion) {
            fullErrorMsg += `\n\n💡 ${errJson.suggestion}`;
          }
          if (errJson.debug) {
            console.error('🔍 Debug info:', errJson.debug);
            if (errJson.debug.fileSizeMB) {
              fullErrorMsg += `\n📊 File: ${errJson.debug.fileSizeMB}MB`;
            }
          }
          
          // Special handling
          if (errorMsg.includes('timeout') || response.status === 504) {
            setDebugInfo(`⏰ Upload timeout! Cloudinary lambat.\n\n${fullErrorMsg}`);
            throw new Error('Upload timeout. Cloudinary tidak merespons.');
          }
          
          if (response.status === 401 || errorMsg.includes('Unknown api') || errorMsg.includes('API key')) {
            setDebugInfo(`❌ API Key Error!\n\n${fullErrorMsg}`);
            throw new Error(`Cloudinary API Error: ${fullErrorMsg}`);
          }
        } catch (e) {
          if (e instanceof Error && e.message.includes('timeout')) throw e;
          if (e instanceof Error && e.message.includes('API Error')) throw e;
        }
        
        setDebugInfo(`❌ ${fullErrorMsg}`);
        throw new Error(fullErrorMsg);
      }

      // Parse success response
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('Respons server tidak valid');
      }

      setUploadProgress(100);

      if (!result.url) {
        throw new Error('URL tidak diterima dari server');
      }

      setDebugInfo(`✅ Upload berhasil! (${elapsed}s)`);
      console.log('✅ Upload result:', result);

      return {
        url: result.url,
        publicId: result.publicId || '',
        fileName: result.fileName || selectedFile.name,
        fileSize: result.fileSize || selectedFile.size,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Upload error:', err);
      
      if (err.name === 'AbortError') {
        setDebugInfo('⏰ Upload dibatalkan (timeout 60 detik)');
        throw new Error('Upload terlalu lama (>60 detik). File mungkin terlalu besar atau koneksi lambat.');
      }
      
      setDebugInfo(prev => prev || `❌ ${err.message}`);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // ============================================
  // ✅ SERVER PROXY UPLOAD (File → Server → Cloudinary) - untuk file kecil (<4.5MB)
  // ============================================
  const uploadViaProxy = async (): Promise<{
    url: string;
    publicId: string;
    fileName: string;
    fileSize: number;
  } | null> => {
    if (!selectedFile) return null;

    try {
      setUploading(true);
      setUploadProgress(10);
      setDebugInfo('📤 Mengirim file ke server...');

      const proxyFormData = new FormData();
      proxyFormData.append('file', selectedFile);

      // Progress simulation
      let progress = 10;
      const progressInterval = setInterval(() => {
        if (progress < 80) {
          progress += 5;
          setUploadProgress(progress);
        }
      }, 500);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const startTime = Date.now();
      
      console.log('📤 Starting SERVER PROXY upload to /api/regulasi/upload-proxy');
      
      const uploadResponse = await fetch('/api/regulasi/upload-proxy', {
        method: 'POST',
        body: proxyFormData,
        signal: controller.signal,
      });

      clearInterval(progressInterval);
      clearTimeout(timeoutId);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`⏱️ Proxy upload completed in ${elapsed}s`);

      setUploadProgress(85);
      setDebugInfo(`📥 Menerima respons server (${elapsed}s)...`);

      if (!uploadResponse.ok) {
        let errorMsg = `HTTP ${uploadResponse.status}`;
        let suggestion = '';
        
        try {
          const errResult = await uploadResponse.json();
          errorMsg = errResult.error || errorMsg;
          suggestion = errResult.suggestion || '';
          
          setDebugInfo(`❌ Upload gagal:\n${errorMsg}\n\n${suggestion}`);
        } catch {
          setDebugInfo(`❌ Upload gagal: HTTP ${uploadResponse.status}`);
        }

        throw new Error(errorMsg);
      }

      // Parse success response
      let result;
      try {
        result = await uploadResponse.json();
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!result.success || !result.url) {
        throw new Error(result.error || 'No URL in response');
      }

      setUploadProgress(100);
      setDebugInfo(`✅ Upload berhasil! (${elapsed}s)`);

      console.log('✅ Proxy upload result:', result);

      return {
        url: result.url,
        publicId: result.publicId || '',
        fileName: result.fileName || selectedFile.name,
        fileSize: result.fileSize || selectedFile.size,
      };

    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Proxy upload error:', err);
      
      if (err.name === 'AbortError') {
        setDebugInfo('⏰ Upload timeout (>60 detik)');
        throw new Error('Upload terlalu lama. Coba lagi.');
      }
      
      setDebugInfo(prev => prev || `❌ ${err.message}`);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.title.trim()) {
      toast.error('Title wajib diisi');
      return;
    }

    let finalCloudinaryData = cloudinaryData;

    // Need to upload file if not already uploaded
    if ((!editingRegulasi || selectedFile) && !finalCloudinaryData && selectedFile) {
      const fileSizeMB = selectedFile.size / 1024 / 1024;
      const VERCEL_LIMIT_MB = 4.5; // Vercel serverless function limit
      
      // Choose upload method based on file size
      const useDirectUpload = fileSizeMB >= VERCEL_LIMIT_MB;
      
      if (useDirectUpload) {
        toast.info(`📤 File besar (${fileSizeMB.toFixed(1)}MB) - upload langsung ke Cloudinary...`);
      } else {
        toast.info('⏳ Sedang upload file...');
      }
      
      try {
        if (useDirectUpload) {
          // 🚀 Direct to Cloudinary (bypasses Vercel 4.5MB limit)
          setDebugInfo(`🚀 Mode: Direct Upload (${fileSizeMB.toFixed(1)}MB > ${VERCEL_LIMIT_MB}MB limit)`);
          finalCloudinaryData = await uploadDirectToCloudinary();
        } else {
          // ☁️ Via Server Proxy (for smaller files)
          setDebugInfo(`☁️ Mode: Server Proxy (${fileSizeMB.toFixed(1)}MB < ${VERCEL_LIMIT_MB}MB)`);
          finalCloudinaryData = await uploadViaProxy();
        }
      } catch (uploadError: unknown) {
        const err = uploadError as Error;
        console.error('❌ Upload failed:', err);
        
        // Show detailed error toast
        toast.error(`❌ Upload Gagal: ${err.message}`, {
          duration: 5000,
        });
        
        // Debug info sudah otomatis set oleh uploadViaProxy
        return; // Stop, don't continue to save
      }
      
      if (!finalCloudinaryData) {
        toast.error('Upload file gagal. Silakan coba lagi.');
        return;
      }
      
      setCloudinaryData(finalCloudinaryData);
      toast.success('✅ File berhasil diupload!');
    }

    // For edit without new file, keep existing data
    if (editingRegulasi && !finalCloudinaryData && !selectedFile) {
      finalCloudinaryData = {
        url: editingRegulasi.fileUrl || '',
        publicId: editingRegulasi.publicId || '',
        fileName: editingRegulasi.fileName || '',
        fileSize: editingRegulasi.fileSize || 0,
      };
    }

    // If still no cloudinary data for new record, fail
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
        isForMemberOnly: !!formData.isForMemberOnly,
        status: formData.status || 'PUBLISHED',
        ...(finalCloudinaryData || {}),
      };

      const url = editingRegulasi ? `/api/regulasi/${editingRegulasi.id}` : '/api/regulasi';
      const method = editingRegulasi ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Server response tidak valid`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan regulasi');
      }

      toast.success(editingRegulasi ? 'Regulasi berhasil diperbarui' : 'Regulasi berhasil dibuat!');
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
    if (!regulasi || !regulasi.id) return;
    
    if (!confirm(`Yakin ingin menghapus "${regulasi.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/regulasi/${regulasi.id}`, { method: 'DELETE' });
      
      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus');
      
      toast.success('Regulasi berhasil dihapus');
      fetchRegulasi();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Delete error:', err);
      toast.error(err.message || 'Gagal menghapus regulasi');
    }
  };

  // Handle download
  const handleDownload = (regulasi: Regulasi) => {
    if (!regulasi || !regulasi.fileUrl) return;
    
    window.open(regulasi.fileUrl, '_blank');
    toast.success(`Mengunduh ${regulasi.fileName}`);
    
    // Update local count optimistically
    setRegulasiList(prev => prev.map(r => 
      r.id === regulasi.id 
        ? { ...r, downloadCount: (r.downloadCount || 0) + 1 }
        : r
    ));
  };

  // Toggle visibility
  const toggleVisibility = async (regulasi: Regulasi) => {
    if (!regulasi || !regulasi.id) return;

    try {
      const response = await fetch(`/api/regulasi/${regulasi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: regulasi.title || '',
          description: regulasi.description || '',
          category: regulasi.category || 'Umum',
          isForMemberOnly: !regulasi.isForMemberOnly,
          status: regulasi.status || 'PUBLISHED',
        }),
      });

      if (!response.ok) throw new Error('Gagal mengubah visibilitas');

      toast.success(`Visibilitas diubah menjadi ${!regulasi.isForMemberOnly ? 'Member Only' : 'Publik'}`);
      fetchRegulasi();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Toggle error:', err);
      toast.error(err.message || 'Gagal mengubah visibilitas');
    }
  };

  return (
    <div className="space-y-6">
      {/* 🚨 HIDDEN VERSION STAMP - Check Elements tab to verify! */}
      <div 
        data-version="v8-CACHE-BUST" 
        data-timestamp={new Date().toISOString()}
        data-mode="UNSIGNED-PRESET-ONLY"
        style={{ display: 'none' }}
        id="regulasi-version-stamp"
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            Kelola Regulasi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload dan kelola dokumen reguasi (PDF via Cloudinary)
          </p>
          
          {/* Visible version indicator for debugging */}
          <p className="text-xs font-mono bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded mt-2 inline-block">
            ⚡ v8-CACHE-BUST | {codeVersion} | Mode: UNSIGNED
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tambah Regulasi
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <Upload className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 text-sm">☁️ Cloudinary Direct Upload</h3>
            <p className="text-xs text-green-700 mt-1">
              File upload langsung ke Cloudinary • Bypass Vercel limit • Maksimal 20MB per file
            </p>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Active</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari judul, deskripsi, atau nama file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="Semua">Semua Kategori</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchRegulasi}
          className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && regulasiList.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : !regulasiList || regulasiList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Belum ada regulasi</p>
            <p className="text-sm mt-1">Klik &quot;Tambah Regulasi&quot; untuk membuat yang pertama</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Judul / File
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Kategori
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Ukuran
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Visibilitas
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Download
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regulasi.map((regulasi) => (
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
        
        {!loading && regulasiList && regulasiList.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Menampilkan <strong>{regulasiList.length}</strong> regulasi
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            />
            
            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-auto overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 sticky top-0 z-10">
                {/* 🚨🚨🚨 VERSION MARKER v8 - HARUS TERLIHAT! 🚨🚨🚨 */}
                <div className="bg-yellow-400 text-black rounded-lg px-3 py-2 mb-2 text-center border-2 border-yellow-600 animate-pulse">
                  <span className="text-sm font-black">
                    ⚡ v8-CACHE-BUST ({codeVersion}) ⚡
                  </span>
                  <br/>
                  <span className="text-xs font-bold">
                    ✅ UNSIGNED MODE | NO SIGNATURE!
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    {editingRegulasi ? 'Edit Regulasi' : 'Tambah Regulasi Baru'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
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
                    placeholder="Deskripsi singkat tentang regulasi ini..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Category & Status Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Kategori
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
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
                      id="pdf-upload-direct"
                      disabled={uploading}
                    />
                    
                    {uploading ? (
                      <div className="text-center py-6 space-y-3">
                        {/* Spinner */}
                        <Loader2 className="w-10 h-10 text-blue-600 mx-auto animate-spin" />
                        
                        {/* Status Message */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-800" id="upload-status">
                            {debugInfo || 'Mengupload file...'}
                          </p>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Progress</span>
                            <span className="font-semibold text-blue-600">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Cancel hint */}
                        <p className="text-xs text-gray-400">
                          Mohon tunggu, proses upload...
                        </p>
                      </div>
                    ) : debugInfo && debugInfo.startsWith('❌') ? (
                      /* ERROR DISPLAY */
                      <div className="text-center py-4 space-y-3">
                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                        
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-red-800">
                            Upload Gagal
                          </p>
                          <p className="text-xs text-red-600 mt-1 whitespace-pre-wrap">
                            {debugInfo}
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setDebugInfo('');
                            setUploadProgress(0);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    ) : cloudinaryData && cloudinaryData.url ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-900 truncate">
                              {cloudinaryData.fileName}
                            </p>
                            <p className="text-xs text-green-700">
                              {formatFileSize(cloudinaryData.fileSize)} • Uploaded ✓
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCloudinaryData(null);
                              setSelectedFile(null);
                            }}
                            className="p-1 text-green-600 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <label htmlFor="pdf-upload-direct" className="cursor-pointer block text-center">
                          <p className="text-xs text-green-600 hover:text-green-700 underline">
                            Ganti file lain...
                          </p>
                        </label>
                      </div>
                    ) : !selectedFile ? (
                      <label htmlFor="pdf-upload-direct" className="cursor-pointer block text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Klik untuk upload PDF langsung ke Cloudinary
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Maksimal 20MB • Bypass Vercel limit ☁️
                        </p>
                      </label>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <FileText className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(selectedFile.size)} • Siap upload
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-blue-600 text-center">
                          Klik &quot;Upload Regulasi&quot; untuk upload ke Cloudinary
                        </p>
                      </div>
                    )}
                  </div>

                  {editingRegulasi && !cloudinaryData && !selectedFile && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <FileDown className="w-4 h-4" />
                      <span>File saat ini: {editingRegulasi.fileName} ({formatFileSize(editingRegulasi.fileSize)})</span>
                    </div>
                  )}
                </div>

                {/* Visibility Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibilitas
                  </label>
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
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
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
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : editingRegulasi ? (
                      <>
                        <Check className="w-4 h-4" />
                        Perbarui
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload ke Cloudinary
                      </>
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
