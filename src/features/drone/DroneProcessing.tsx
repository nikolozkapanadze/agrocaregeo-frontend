import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Upload,
  Link,
  FileImage,
  Calendar,
  Settings,
  Activity,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Map,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react'
import { MapContainer, LayersControl } from 'react-leaflet'
import { BasemapTileLayer } from '@/shared/components/map/BasemapTileLayer'
import 'leaflet/dist/leaflet.css'
import { API_BASE } from '@/shared/lib/api'
import { DroneTileLayer } from './components/DroneTileLayer'
import { BASEMAPS } from '@/shared/lib/map/basemaps'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Types
interface BandMapping {
  Blue: number
  Green: number
  Red: number
  RedEdge: number
  NIR: number
}

interface UploadProgress {
  fileIndex: number
  totalFiles: number
  chunkIndex: number
  totalChunks: number
  uploadedBytes: number
  totalBytes: number
  speed: number // MB/s
}

interface Flight {
  id: string
  flight_date: string
  filename: string
  file_size_mb?: number
  source: 'upload' | 'gdrive'
  status: 'pending' | 'uploaded' | 'processing' | 'done' | 'error'
  progress: number
  processing_step?: string | null
  upload_progress?: number | null
  resolution_m?: number
  parcels_count?: number
  error_message?: string
  gsd_cm?: number
  forward_overlap_pct?: number
  side_overlap_pct?: number
  rms_error_cm?: number
}

interface ParcelStats {
  parcel_id: string
  parcel_nr: string
  area_ha?: number
  ndvi: {
    mean: number
    min: number
    max: number
    std?: number
    p10?: number
    p90?: number
  }
  ndre: { mean: number }
  ndwi: { mean: number }
  pixel_count?: number
  preview_url?: string
}

const DEFAULT_BAND_MAPPING: BandMapping = {
  Blue: 1,
  Green: 2,
  Red: 3,
  RedEdge: 4,
  NIR: 5,
}

const BAND_PRESETS: { label: string; mapping: BandMapping }[] = [
  {
    label: 'MicaSense RedEdge-MX',
    mapping: { Blue: 1, Green: 2, Red: 3, RedEdge: 5, NIR: 4 },
  },
  {
    label: 'Parrot Sequoia',
    mapping: { Blue: 1, Green: 2, Red: 3, RedEdge: 4, NIR: 5 },
  },
  {
    label: 'Sentinel-2 style',
    mapping: { Blue: 1, Green: 2, Red: 3, RedEdge: 4, NIR: 5 },
  },
  {
    label: 'Sentera 6X',
    mapping: { Blue: 1, Green: 2, Red: 3, RedEdge: 5, NIR: 4 },
  },
]

const COLORS = {
  ndvi: '#22c55e',
  ndre: '#0ea5e9',
  ndwi: '#f59e0b',
  evi: '#8b5cf6',
}

export default function DroneProcessing(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'upload' | 'gdrive' | 'folder'>('upload')
  const [flights, setFlights] = useState<Flight[]>([])
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null)
  const [parcelStats, setParcelStats] = useState<ParcelStats[]>([])
  
  // Comparison state
  const [compareFlight, setCompareFlight] = useState<string | null>(null)
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [comparing, setComparing] = useState(false)
  
  // Upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [flightDate, setFlightDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [bandMapping, setBandMapping] = useState<BandMapping>(DEFAULT_BAND_MAPPING)
  const [showBandMapping, setShowBandMapping] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Folder/ZIP upload state
  const [folderFile, setFolderFile] = useState<File | null>(null)
  const [folderUploading, setFolderUploading] = useState(false)
  const [folderUploadProgress, setFolderUploadProgress] = useState<UploadProgress | null>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  
  // Google Drive state
  const [gdriveUrl, setGdriveUrl] = useState('')
  const [gdriveSubmitting, setGdriveSubmitting] = useState(false)
  
  const token = localStorage.getItem('token')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch flights list
  const fetchFlights = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/drone/flights`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch flights')
      const data = await res.json()
      setFlights(data)
    } catch (e) {
      console.error('Error fetching flights:', e)
    }
  }, [token])

  useEffect(() => {
    fetchFlights()
    const interval = setInterval(fetchFlights, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [fetchFlights])

  // Fetch parcel stats when flight selected
  useEffect(() => {
    if (!selectedFlight) {
      setParcelStats([])
      return
    }
    
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/drone/results/${selectedFlight}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setParcelStats(data)
      } catch (e) {
        console.error('Error fetching stats:', e)
      }
    }
    
    fetchStats()
  }, [selectedFlight, token])

  // Process trigger handler
  const handleProcess = async (flightId: string) => {
    try {
      const res = await fetch(`${API_BASE}/drone/process/${flightId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'Processing failed')
      }
      alert('დამუშავება დაიწყო!')
      await fetchFlights()
    } catch (e) {
      console.error('Process error:', e)
      alert('დამუშავება ვერ დაიწყო: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  // Comparison handler
  const handleCompare = async (flightBId: string) => {
    if (!selectedFlight || selectedFlight === flightBId) return
    setComparing(true)
    try {
      const res = await fetch(`${API_BASE}/drone/compare/${selectedFlight}/${flightBId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Comparison failed')
      const data = await res.json()
      setComparisonData(data)
      setCompareFlight(flightBId)
    } catch (e) {
      console.error('Comparison error:', e)
      alert('შედარება ვერ მოხერხდა')
    } finally {
      setComparing(false)
    }
  }

  // Handle file selection (supports multiple files)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const valid = files.filter(f => f.name.toLowerCase().endsWith('.tif') || f.name.toLowerCase().endsWith('.tiff'))
    if (valid.length !== files.length) {
      alert('Only GeoTIFF files (.tif, .tiff) are allowed')
    }
    setUploadFiles(valid)
  }

  // Chunked upload — supports multiple files, sequentially uploaded
  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      alert('Please select a file')
      return
    }

    setUploading(true)
    let lastFlightId: string | null = null

    for (let fileIdx = 0; fileIdx < uploadFiles.length; fileIdx++) {
      const file = uploadFiles[fileIdx]
      const fileSize = file.size
      const totalChunks = Math.ceil(fileSize / CHUNK_SIZE)

      // Show progress bar immediately (before any network call)
      setUploadProgress({
        fileIndex: fileIdx,
        totalFiles: uploadFiles.length,
        chunkIndex: 0,
        totalChunks,
        uploadedBytes: 0,
        totalBytes: fileSize,
        speed: 0,
      })

      try {
        // Initialize upload
        const initRes = await fetch(`${API_BASE}/drone/upload/init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${token}`,
          },
          body: new URLSearchParams({
            filename: file.name,
            file_size: fileSize.toString(),
            flight_date: flightDate,
            total_chunks: totalChunks.toString(),
          }),
        })

        if (!initRes.ok) throw new Error('Failed to initialize upload')
        const { upload_id, flight_id } = await initRes.json()

        // Upload chunks
        const startTime = Date.now()
        let uploadedBytes = 0

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE
          const end = Math.min(start + CHUNK_SIZE, fileSize)
          const chunk = file.slice(start, end)

          const chunkForm = new FormData()
          chunkForm.append('chunk', chunk)

          const chunkRes = await fetch(
            `${API_BASE}/drone/upload/chunk/${upload_id}?chunk_index=${i}`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: chunkForm,
            }
          )

          if (!chunkRes.ok) {
            let detail = `HTTP ${chunkRes.status}`
            try {
              const err = await chunkRes.json()
              if (err.detail) detail = err.detail
            } catch {}
            throw new Error(`Chunk ${i} failed: ${detail}`)
          }

          uploadedBytes += chunk.size
          const elapsed = (Date.now() - startTime) / 1000
          const speed = elapsed > 0 ? uploadedBytes / elapsed / (1024 * 1024) : 0

          setUploadProgress({
            fileIndex: fileIdx,
            totalFiles: uploadFiles.length,
            chunkIndex: i + 1,
            totalChunks,
            uploadedBytes,
            totalBytes: fileSize,
            speed,
          })
        }

        // Finalize upload (assembles chunks)
        const finalizeRes = await fetch(
          `${API_BASE}/drone/upload/finalize/${upload_id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Bearer ${token}`,
            },
            body: new URLSearchParams({
              band_mapping: JSON.stringify(bandMapping),
            }),
          }
        )

        if (!finalizeRes.ok) {
          const error = await finalizeRes.json()
          throw new Error(error.detail || 'Failed to finalize upload')
        }

        // Auto-trigger processing — no manual button press needed
        await fetch(`${API_BASE}/drone/process/${flight_id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })

        lastFlightId = flight_id

      } catch (e) {
        alert(`Upload failed for ${file.name}: ` + (e instanceof Error ? e.message : 'Unknown error'))
      }
    }

    setUploading(false)
    setUploadProgress(null)
    setUploadFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (lastFlightId) setSelectedFlight(lastFlightId)
    await fetchFlights()
  }

  // Google Drive submit
  const handleGdriveSubmit = async () => {
    if (!gdriveUrl.trim()) {
      alert('Please enter a Google Drive URL')
      return
    }
    
    setGdriveSubmitting(true)
    
    try {
      const res = await fetch(`${API_BASE}/drone/gdrive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({
          gdrive_url: gdriveUrl,
          flight_date: flightDate,
          band_mapping: JSON.stringify(bandMapping),
        }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'Failed to process Google Drive link')
      }
      
      const data = await res.json()
      alert('Google Drive download started! Processing will begin after download.')
      setGdriveUrl('')
      setSelectedFlight(data.flight_id)
      
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    } finally {
      setGdriveSubmitting(false)
    }
  }

  // Folder/ZIP file selection
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const ext = file.name.toLowerCase()
      if (!ext.endsWith('.zip')) {
        alert('Only ZIP files are allowed for folder upload')
        return
      }
      setFolderFile(file)
    }
  }

  // Folder/ZIP upload — chunked upload, band auto-detection from filenames
  const handleFolderUpload = async () => {
    if (!folderFile) {
      alert('Please select a ZIP file')
      return
    }

    setFolderUploading(true)
    const fileSize = folderFile.size
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE)

    setFolderUploadProgress({
      fileIndex: 0, totalFiles: 1,
      chunkIndex: 0, totalChunks,
      uploadedBytes: 0, totalBytes: fileSize, speed: 0,
    })

    try {
      const initRes = await fetch(`${API_BASE}/drone/upload/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Bearer ${token}` },
        body: new URLSearchParams({
          filename: folderFile.name,
          file_size: fileSize.toString(),
          flight_date: flightDate,
          total_chunks: totalChunks.toString(),
        }),
      })
      if (!initRes.ok) throw new Error('Failed to initialize upload')
      const { upload_id, flight_id } = await initRes.json()

      const startTime = Date.now()
      let uploadedBytes = 0

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, fileSize)
        const chunk = folderFile.slice(start, end)
        const chunkForm = new FormData()
        chunkForm.append('chunk', chunk)
        const chunkRes = await fetch(
          `${API_BASE}/drone/upload/chunk/${upload_id}?chunk_index=${i}`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: chunkForm }
        )
        if (!chunkRes.ok) {
          let detail = `HTTP ${chunkRes.status}`
          try { const err = await chunkRes.json(); if (err.detail) detail = err.detail } catch {}
          throw new Error(`Chunk ${i} failed: ${detail}`)
        }
        uploadedBytes += chunk.size
        const elapsed = (Date.now() - startTime) / 1000
        const speed = elapsed > 0 ? uploadedBytes / elapsed / (1024 * 1024) : 0
        setFolderUploadProgress({
          fileIndex: 0, totalFiles: 1,
          chunkIndex: i + 1, totalChunks,
          uploadedBytes, totalBytes: fileSize, speed,
        })
      }

      // Finalize — band_mapping empty, auto-detected from filenames inside ZIP
      const finalizeRes = await fetch(`${API_BASE}/drone/upload/finalize/${upload_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Bearer ${token}` },
        body: new URLSearchParams({ band_mapping: '{}' }),
      })
      if (!finalizeRes.ok) {
        const error = await finalizeRes.json()
        throw new Error(error.detail || 'Failed to finalize upload')
      }

      // Auto-trigger processing
      await fetch(`${API_BASE}/drone/process/${flight_id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      setSelectedFlight(flight_id)
      setFolderFile(null)
      if (folderInputRef.current) folderInputRef.current.value = ''
      await fetchFlights()

    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    } finally {
      setFolderUploading(false)
      setFolderUploadProgress(null)
    }
  }

  // Format bytes to MB/GB
  const formatSize = (bytes?: number) => {
    if (!bytes) return '-'
    const mb = bytes / (1024 * 1024)
    if (mb < 1024) return `${mb.toFixed(1)} MB`
    return `${(mb / 1024).toFixed(2)} GB`
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-accent'
      case 'uploaded': return 'text-blue-400'
      case 'processing': return 'text-sensor'
      case 'error': return 'text-danger'
      default: return 'text-text-muted'
    }
  }

  // Translate processing step to Georgian
  const getStepLabel = (step?: string | null) => {
    if (!step) return ''
    const labels: Record<string, string> = {
      'reading_metadata': 'მეტადატის კითხვა',
      'processing_tiles': 'ტილების დამუშავება',
      'generating_previews': 'პრევიუების გენერაცია',
      'zonal_stats': 'ზონალური სტატისტიკა',
      'extracting': 'ZIP-ის გაშლა',
      'initializing': 'ინიციალიზაცია',
      'error': 'შეცდომა',
    }
    return labels[step] || step
  }

  // Chart data preparation
  const chartData = parcelStats.map(s => ({
    name: s.parcel_nr || s.parcel_nr,
    ndvi: s.ndvi?.mean ?? 0,
    ndviMin: s.ndvi?.min ?? 0,
    ndviMax: s.ndvi?.max ?? 0,
    ndre: s.ndre?.mean ?? 0,
    ndwi: s.ndwi?.mean ?? 0,
  }))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Layers className="h-6 w-6 text-accent" />
          დრონის სპექტრული ანალიზი
        </h1>
        <p className="text-text-secondary mt-1">
          მულტისპექტრული GeoTIFF ფაილების დამუშავება და ინდექსების გამოთვლა
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel - Upload */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="card p-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-accent text-base-primary'
                    : 'text-text-secondary hover:bg-white/5'
                }`}
              >
                <Upload className="h-4 w-4" />
                ფაილის ატვირთვა
              </button>
              <button
                onClick={() => setActiveTab('folder')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'folder'
                    ? 'bg-accent text-base-primary'
                    : 'text-text-secondary hover:bg-white/5'
                }`}
              >
                <Layers className="h-4 w-4" />
                Pix4D/Agisoft
              </button>
              <button
                onClick={() => setActiveTab('gdrive')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'gdrive'
                    ? 'bg-accent text-base-primary'
                    : 'text-text-secondary hover:bg-white/5'
                }`}
              >
                <Link className="h-4 w-4" />
                Google Drive
              </button>
            </div>
          </div>

          {/* Upload Form */}
          <div className="card space-y-4">
            {activeTab === 'upload' ? (
              <>
                <div>
                  <label className="label">GeoTIFF ფაილი</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      uploadFiles.length > 0
                        ? 'border-accent bg-accent/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".tif,.tiff"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <FileImage className={`h-8 w-8 mx-auto mb-2 ${uploadFiles.length > 0 ? 'text-accent' : 'text-text-muted'}`} />
                    {uploadFiles.length > 0 ? (
                      <div className="space-y-1 max-h-28 overflow-y-auto text-left">
                        {uploadFiles.map((f, i) => (
                          <p key={i} className="text-sm text-text-primary truncate">
                            {f.name} <span className="text-text-muted">({formatSize(f.size)})</span>
                          </p>
                        ))}
                      </div>
                    ) : (
                      <>
                        <p className="text-text-secondary">აირჩიეთ ან ჩააგდეთ GeoTIFF</p>
                        <p className="text-text-muted text-xs mt-1">.tif, .tiff — რამდენიმე ფაილი მხარდაჭერილია</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress — visible as soon as uploading starts */}
                {uploading && (
                  <div className="space-y-2">
                    {uploadProgress && uploadProgress.totalFiles > 1 && (
                      <p className="text-xs text-text-secondary truncate">
                        ფაილი {uploadProgress.fileIndex + 1} / {uploadProgress.totalFiles}:{' '}
                        {uploadFiles[uploadProgress.fileIndex]?.name}
                      </p>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">
                        {uploadProgress
                          ? `ჩანთა ${uploadProgress.chunkIndex} / ${uploadProgress.totalChunks}`
                          : 'ინიციალიზაცია...'}
                      </span>
                      <span className="text-accent font-mono">
                        {uploadProgress && uploadProgress.speed > 0
                          ? `${uploadProgress.speed.toFixed(1)} MB/s`
                          : ''}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{
                          width: uploadProgress
                            ? `${(uploadProgress.uploadedBytes / uploadProgress.totalBytes) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <p className="text-xs text-text-muted text-center">
                      {uploadProgress
                        ? `${formatSize(uploadProgress.uploadedBytes)} / ${formatSize(uploadProgress.totalBytes)}`
                        : 'იწყება...'}
                    </p>
                  </div>
                )}
              </>
            ) : activeTab === 'folder' ? (
              <>
                <div>
                  <label className="label">Pix4D / Agisoft ZIP</label>
                  <div
                    onClick={() => folderInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      folderFile
                        ? 'border-accent bg-accent/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <input
                      ref={folderInputRef}
                      type="file"
                      accept=".zip"
                      onChange={handleFolderSelect}
                      className="hidden"
                    />
                    <Layers className={`h-8 w-8 mx-auto mb-2 ${folderFile ? 'text-accent' : 'text-text-muted'}`} />
                    {folderFile ? (
                      <>
                        <p className="text-text-primary font-medium">{folderFile.name}</p>
                        <p className="text-text-secondary text-sm">{formatSize(folderFile.size)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-text-secondary">აირჩიეთ ან ჩააგდეთ ZIP</p>
                        <p className="text-text-muted text-xs mt-1">
                          Pix4D ან Agisoft output folder-ის ZIP (.zip)
                        </p>
                        <p className="text-text-muted text-xs">
                          ავტომატურად ამოიცნობს ბენდებს
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {folderUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">
                        {folderUploadProgress
                          ? `ჩანთა ${folderUploadProgress.chunkIndex} / ${folderUploadProgress.totalChunks}`
                          : 'ინიციალიზაცია...'}
                      </span>
                      <span className="text-accent font-mono">
                        {folderUploadProgress && folderUploadProgress.speed > 0
                          ? `${folderUploadProgress.speed.toFixed(1)} MB/s`
                          : ''}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{
                          width: folderUploadProgress
                            ? `${(folderUploadProgress.uploadedBytes / folderUploadProgress.totalBytes) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <p className="text-xs text-text-muted text-center">
                      {folderUploadProgress
                        ? `${formatSize(folderUploadProgress.uploadedBytes)} / ${formatSize(folderUploadProgress.totalBytes)}`
                        : 'იწყება...'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="label">Google Drive ლინკი</label>
                <input
                  type="text"
                  value={gdriveUrl}
                  onChange={(e) => setGdriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="input"
                />
                <p className="text-xs text-text-muted mt-1">
                  ფაილი უნდა იყოს public ან shareable
                </p>
              </div>
            )}

            {/* Common Fields */}
            <div>
              <label className="label flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                გადაფრენის თარიღი
              </label>
              <input
                type="date"
                value={flightDate}
                onChange={(e) => setFlightDate(e.target.value)}
                className="input"
              />
            </div>

            {/* Band Mapping */}
            <div>
              <button
                onClick={() => setShowBandMapping(!showBandMapping)}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <Settings className="h-4 w-4" />
                ბენდების მიბმა
                {showBandMapping ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {showBandMapping && (
                <div className="mt-3 space-y-3">
                  {/* Preset buttons */}
                  <div className="flex flex-wrap gap-2">
                    {BAND_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setBandMapping(preset.mapping)}
                        className="px-2 py-1 text-xs rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-lg">
                    {Object.entries(bandMapping).map(([band, value]) => (
                      <div key={band}>
                        <label className="text-xs text-text-muted">{band}</label>
                        <select
                          value={value}
                          onChange={(e) => setBandMapping(prev => ({
                            ...prev,
                            [band]: parseInt(e.target.value)
                          }))}
                          className="select mt-1"
                        >
                          {[1,2,3,4,5,6,7,8].map(n => (
                            <option key={n} value={n}>Band {n}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            {activeTab === 'upload' ? (
              <button
                onClick={handleUpload}
                disabled={uploading || uploadFiles.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    იტვირთება...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    ატვირთვა და დამუშავება
                  </>
                )}
              </button>
            ) : activeTab === 'folder' ? (
              <button
                onClick={handleFolderUpload}
                disabled={folderUploading || !folderFile}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {folderUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    ZIP იტვირთება...
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4" />
                    ატვირთვა და ავტო-დეტექცია
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleGdriveSubmit}
                disabled={gdriveSubmitting || !gdriveUrl.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {gdriveSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    მიმდინარეობს...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4" />
                    დამუშავების დაწყება
                  </>
                )}
              </button>
            )}
          </div>

          {/* Flights List */}
          <div className="card">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              გადაფრენების ისტორია
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {flights.map((flight) => (
                <div
                  key={flight.id}
                  onClick={() => setSelectedFlight(flight.id === selectedFlight ? null : flight.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedFlight === flight.id
                      ? 'bg-accent/20 border border-accent/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {new Date(flight.flight_date).toLocaleDateString('ka-GE')}
                      </p>
                      <p className="text-xs text-text-muted truncate max-w-[150px]">
                        {flight.filename}
                      </p>
                      {flight.status === 'pending' && flight.upload_progress != null && flight.upload_progress < 100 && (
                        <p className="text-[10px] text-blue-400 mt-0.5">
                          ატვირთვა: {flight.upload_progress}%
                        </p>
                      )}
                      {flight.status === 'processing' && flight.processing_step && (
                        <p className="text-[10px] text-sensor mt-0.5">
                          {getStepLabel(flight.processing_step)} — {flight.progress}%
                        </p>
                      )}
                      {flight.gsd_cm && (
                        <p className="text-[10px] text-accent mt-0.5">
                          GSD: {flight.gsd_cm.toFixed(1)}cm | {flight.parcels_count ?? 0} ნაკვეთი
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-medium ${getStatusColor(flight.status)} flex-shrink-0 ml-2`}>
                      {flight.status === 'done' ? '✓' :
                       flight.status === 'error' ? '✗' : ''}
                    </span>
                  </div>
                  {flight.status === 'pending' && flight.upload_progress != null && flight.upload_progress < 100 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] text-blue-400">ატვირთვა: {flight.upload_progress}%</p>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 transition-all"
                          style={{ width: `${flight.upload_progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {(flight.status === 'uploaded' || flight.status === 'processing') && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] text-sensor">
                        {flight.status === 'processing' && flight.processing_step
                          ? `${getStepLabel(flight.processing_step)} — ${flight.progress}%`
                          : 'ფაილი მუშავდება...'}
                      </p>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sensor transition-all"
                          style={{ width: `${flight.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {flight.status === 'done' && (
                    <p className="mt-1.5 text-[10px] text-accent">დამუშავებულია ✓</p>
                  )}
                </div>
              ))}
              {flights.length === 0 && (
                <p className="text-text-muted text-sm text-center py-4">
                  გადაფრენები არ მოიძებნა
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-2 space-y-4">
          {selectedFlight ? (
            <>
              {/* Results Header */}
              <div className="card flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    შედეგები: {flights.find(f => f.id === selectedFlight)?.filename}
                  </h2>
                  <p className="text-sm text-text-muted">
                    ნაკვეთების რაოდენობა: {parcelStats.length}
                  </p>
                </div>
                {flights.find(f => f.id === selectedFlight)?.status === 'done' && (
                  <span className="badge badge-success flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    დასრულებული
                  </span>
                )}
              </div>

              {/* Uploaded — Ready to Process */}
              {flights.find(f => f.id === selectedFlight)?.status === 'uploaded' && (
                <div className="card bg-blue-500/10 border-blue-500/30 flex items-center gap-4 p-6">
                  <Upload className="h-8 w-8 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">ატვირთულია — მზადაა დამუშავებისთვის</p>
                    <p className="text-sm text-text-secondary">დააჭირეთ ღილაკს დამუშავების დასაწყებად</p>
                  </div>
                  <button
                    onClick={() => handleProcess(selectedFlight)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    დამუშავების დაწყება
                  </button>
                </div>
              )}

              {/* Processing */}
              {flights.find(f => f.id === selectedFlight)?.status === 'processing' && (
                <div className="card flex items-center gap-4 p-6">
                  <RefreshCw className="h-8 w-8 text-sensor animate-spin" />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">
                      {getStepLabel(flights.find(f => f.id === selectedFlight)?.processing_step) || 'დამუშავება მიმდინარეობს...'}
                    </p>
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sensor transition-all"
                        style={{ width: `${flights.find(f => f.id === selectedFlight)?.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {flights.find(f => f.id === selectedFlight)?.progress}% დასრულებული
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {flights.find(f => f.id === selectedFlight)?.status === 'error' && (
                <div className="card bg-danger/10 border-danger/30 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-danger">დამუშავება ვერ მოხერხდა</p>
                    <p className="text-sm text-danger/80">
                      {flights.find(f => f.id === selectedFlight)?.error_message}
                    </p>
                  </div>
                </div>
              )}

              {/* Charts */}
              {parcelStats.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    ინდექსების შედარება
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#475569"
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis domain={[-0.5, 1]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0d1117', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="ndvi" name="NDVI" fill={COLORS.ndvi} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="ndre" name="NDRE" fill={COLORS.ndre} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="ndwi" name="NDWI" fill={COLORS.ndwi} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Fusion Preview */}
              {flights.find(f => f.id === selectedFlight)?.status === 'done' && (
                <div className="card">
                  <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-accent" />
                    RGB + NDVI Fusion
                  </h3>
                  <img
                    src={`${API_BASE}/drone/outputs/${selectedFlight}/fusion.jpg`}
                    alt="Fusion preview"
                    className="w-full rounded-lg"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}

              {/* Spectral Index Map */}
              {flights.find(f => f.id === selectedFlight)?.status === 'done' && (
                <div className="card">
                  <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Map className="h-4 w-4 text-accent" />
                    ინდექსების რუკა
                  </h3>
                  <div className="rounded-lg overflow-hidden border border-white/10" style={{ height: '400px' }}>
                    <MapContainer
                      center={[41.63, 46.12]}
                      zoom={12}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="OpenStreetMap">
                          <BasemapTileLayer basemap={BASEMAPS.osm} />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Satellite (Google)">
                          <BasemapTileLayer basemap={BASEMAPS.google} />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Satellite (Esri)">
                          <BasemapTileLayer basemap={BASEMAPS.esri} />
                        </LayersControl.BaseLayer>
                        {BASEMAPS.mapbox.url && (
                          <LayersControl.BaseLayer name="Satellite (Mapbox)">
                            <BasemapTileLayer basemap={BASEMAPS.mapbox} />
                          </LayersControl.BaseLayer>
                        )}
                        <LayersControl.Overlay checked name="NDVI">
                          <DroneTileLayer
                            flightId={selectedFlight}
                            index="ndvi"
                            apiBase={API_BASE}
                            token={localStorage.getItem('token') || ''}
                          />
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="NDRE">
                          <DroneTileLayer
                            flightId={selectedFlight}
                            index="ndre"
                            apiBase={API_BASE}
                            token={localStorage.getItem('token') || ''}
                          />
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="NDWI">
                          <DroneTileLayer
                            flightId={selectedFlight}
                            index="ndwi"
                            apiBase={API_BASE}
                            token={localStorage.getItem('token') || ''}
                          />
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="EVI">
                          <DroneTileLayer
                            flightId={selectedFlight}
                            index="evi"
                            apiBase={API_BASE}
                            token={localStorage.getItem('token') || ''}
                          />
                        </LayersControl.Overlay>
                      </LayersControl>
                    </MapContainer>
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    აირჩიეთ ინდექსი ფენების მენიუდან (მარჯვნივ). ფაილის CRS და საფარი შეიძლება არ ემთხვეოდეს რუკის ცენტრს — გადაადგილეთ რუკა ფრენის ადგილზე.
                  </p>
                </div>
              )}

              {/* Comparison */}
              {flights.length > 1 && (
                <div className="card">
                  <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    დროის მწკრივის შედარება
                  </h3>
                  <div className="flex gap-2 items-center">
                    <select
                      value={compareFlight || ''}
                      onChange={(e) => e.target.value && handleCompare(e.target.value)}
                      className="select flex-1"
                    >
                      <option value="">აირჩიეთ გადაფრენა შესადარებლად...</option>
                      {flights
                        .filter(f => f.id !== selectedFlight && f.status === 'done')
                        .map(f => (
                          <option key={f.id} value={f.id}>
                            {new Date(f.flight_date).toLocaleDateString('ka-GE')} — {f.filename}
                          </option>
                        ))}
                    </select>
                    {comparing && <RefreshCw className="h-4 w-4 animate-spin text-accent" />}
                  </div>
                  
                  {comparisonData && compareFlight && (
                    <div className="mt-4 space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-accent">{comparisonData.summary.total_parcels}</p>
                          <p className="text-xs text-text-muted">ნაკვეთი</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-emerald-400">{comparisonData.summary.improving}</p>
                          <p className="text-xs text-text-muted">გაუმჯობესებული</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-yellow-400">{comparisonData.summary.stable}</p>
                          <p className="text-xs text-text-muted">სტაბილური</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-red-400">{comparisonData.summary.declining}</p>
                          <p className="text-xs text-text-muted">გაუარესებული</p>
                        </div>
                      </div>
                      
                      {/* Heatmap */}
                      {comparisonData.heatmap_url && (
                        <div>
                          <p className="text-sm text-text-muted mb-2">NDVI Delta Heatmap</p>
                          <img
                            src={`${API_BASE}${comparisonData.heatmap_url}`}
                            alt="Delta heatmap"
                            className="w-full rounded-lg border border-white/10"
                          />
                          <p className="text-xs text-text-muted mt-1">
                            მწვანე = გაუმჯობესება, წითელი = გაუარესება, რუხი = მონაცემები არ არის
                          </p>
                        </div>
                      )}
                      
                      {/* Delta Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left py-2 px-2 text-text-muted">ნაკვეთი</th>
                              <th className="text-right py-2 px-2 text-text-muted">NDVI მანამდე</th>
                              <th className="text-right py-2 px-2 text-text-muted">NDVI ახლა</th>
                              <th className="text-right py-2 px-2 text-text-muted">ცვლილება</th>
                              <th className="text-center py-2 px-2 text-text-muted">ტრენდი</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonData.parcel_deltas.map((d: any) => (
                              <tr key={d.parcel_id} className="border-b border-white/5">
                                <td className="py-2 px-2 text-text-primary">{d.parcel_nr || d.parcel_nr}</td>
                                <td className="py-2 px-2 text-right font-mono">{d.ndvi_before?.toFixed(3)}</td>
                                <td className="py-2 px-2 text-right font-mono">{d.ndvi_after?.toFixed(3)}</td>
                                <td className="py-2 px-2 text-right font-mono font-bold"
                                  style={{ color: d.delta > 0 ? '#34d399' : d.delta < 0 ? '#f87171' : '#94a3b8' }}>
                                  {d.delta > 0 ? '+' : ''}{d.delta?.toFixed(3)}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    d.trend === 'improving' ? 'bg-emerald-500/20 text-emerald-400' :
                                    d.trend === 'declining' ? 'bg-red-500/20 text-red-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {d.trend === 'improving' ? '↑ გაუმჯობესება' :
                                     d.trend === 'declining' ? '↓ გაუარესება' : '→ სტაბილური'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Table */}
              {parcelStats.length > 0 && (
                <div className="card overflow-x-auto">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Map className="h-4 w-4 text-accent" />
                    ნაკვეთების დეტალები
                  </h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-3 text-text-muted font-medium">ნაკვეთი</th>
                        <th className="text-right py-2 px-3 text-text-muted font-medium">ფართობი</th>
                        <th className="text-right py-2 px-3 text-text-muted font-medium">NDVI</th>
                        <th className="text-right py-2 px-3 text-text-muted font-medium">NDRE</th>
                        <th className="text-right py-2 px-3 text-text-muted font-medium">NDWI</th>
                        <th className="text-center py-2 px-3 text-text-muted font-medium">სტატუსი</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcelStats.map((stat) => {
                        const ndvi = stat.ndvi?.mean ?? 0
                        const status = ndvi < 0.2 ? 'critical' : ndvi < 0.4 ? 'warning' : 'ok'
                        return (
                          <tr key={stat.parcel_id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-2 px-3">
                              <div>
                                <p className="text-text-primary font-medium">{stat.parcel_nr || stat.parcel_nr}</p>
                                <p className="text-xs text-text-muted">{stat.pixel_count?.toLocaleString()} პიქსელი</p>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right text-text-secondary">
                              {stat.area_ha ? `${stat.area_ha.toFixed(2)} ჰა` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className={`font-mono font-bold ${
                                ndvi < 0.2 ? 'text-zone-critical' :
                                ndvi < 0.4 ? 'text-zone-medium' :
                                'text-accent'
                              }`}>
                                {ndvi.toFixed(3)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-sensor">
                              {stat.ndre?.mean?.toFixed(3) || '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono" style={{ color: COLORS.ndwi }}>
                              {stat.ndwi?.mean?.toFixed(3) || '-'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                status === 'ok' ? 'bg-accent/20 text-accent' :
                                status === 'warning' ? 'bg-zone-medium/20 text-zone-medium' :
                                'bg-zone-critical/20 text-zone-critical'
                              }`}>
                                {status === 'ok' ? 'ნორმაში' :
                                 status === 'warning' ? 'საშუალო' : 'კრიტიკული'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center h-96 text-center">
              <Layers className="h-16 w-16 text-text-muted mb-4" />
              <p className="text-text-secondary text-lg">აირჩიეთ გადაფრენა შედეგების სანახავად</p>
              <p className="text-text-muted text-sm mt-2">
                ატვირთეთ ახალი GeoTIFF ფაილი ან აირჩიეთ არსებული გადაფრენა მარცხენა პანელიდან
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Constants
const CHUNK_SIZE = 50 * 1024 * 1024 // 50MB
