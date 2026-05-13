import React, { useState, useRef } from 'react'
import { useProfileStore } from '@/shared/stores'
import {
  Search,
  Filter,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  X,
  Sprout,
  Trash2,
} from 'lucide-react'
import { parcels as parcelsApi, analysis as analysisApi } from '@/shared/lib/api'
import type { Parcel, PaginatedResponse, MineralAnalysis } from '@/shared/lib/api'
import { useApi } from '@/shared/hooks/useApi'
import MineralBadge from '@/shared/components/MineralBadge'


const CROP_OPTIONS = [
  { value: 'all', label: 'ყველა კულტურა' },
  { value: 'wheat', label: 'ხორბალი' },
  { value: 'vine', label: 'ვენახი' },
  { value: 'corn', label: 'სიმინდი' },
  { value: 'hazelnut', label: 'თხილი' },
  { value: 'olive', label: 'ზეთისხილი' },
  { value: 'walnut', label: 'კაკალი' },
  { value: 'blueberry', label: 'მოცვი' },
  { value: 'almond', label: 'ნუში' },
  { value: 'tea', label: 'ჩაი' },
  { value: 'citrus', label: 'ციტრუსი' },
  { value: 'sunflower', label: 'მზესუმზირა' },
  { value: 'barley', label: 'ჭვავი' },
  { value: 'soybean', label: 'სოიო' },
  { value: 'rapeseed', label: 'კამელი' },
]

interface ImportResult {
  success: boolean
  message: string
  skipped?: number
  errors?: string[]
}

export default function Parcels(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [cropFilter, setCropFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { data, loading, error, refetch } = useApi<PaginatedResponse<Parcel>>(
    () => parcelsApi.list(page, 20, zoneFilter === 'all' ? undefined : zoneFilter, activeProfile?.id),
    [page, zoneFilter, activeProfile?.id]
  )

  const { data: history, loading: histLoading } = useApi<MineralAnalysis[]>(
    () => (expandedId ? analysisApi.parcelHistory(expandedId) : Promise.resolve([])),
    [expandedId]
  )

  const handleDelete = async (id: string): Promise<void> => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id)
      return
    }
    setDeletingId(id)
    try {
      await parcelsApi.delete(id)
      setDeleteConfirmId(null)
      refetch()
    } catch (err: any) {
      alert(err.message || 'წაშლა ვერ მოხდა')
    } finally {
      setDeletingId(null)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const geojson = JSON.parse(text) as object
      const result = await parcelsApi.importGeoJSON(geojson, activeProfile?.id)
      const msgs: string[] = []
      if (result.imported > 0) {
        msgs.push(`იმპორტირებულია ${result.imported} ნაკვეთი`)
      } else {
        msgs.push('ფაილიდან ნაკვეთები ვერ იქნა იმპორტირებული')
      }
      if (result.skipped > 0) {
        msgs.push(`(${result.skipped} გამოტოვებულია)`)
      }
      setImportResult({
        success: result.imported > 0,
        message: msgs.join(' '),
        skipped: result.skipped,
        errors: result.errors,
      })
      refetch()
    } catch (err: any) {
      setImportResult({
        success: false,
        message: err.message || 'იმპორტი ვერ მოხდა',
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Filter parcels by search and crop
  const filteredItems = React.useMemo(() => {
    if (!data?.items) return []
    return data.items.filter((p) => {
      const matchesSearch = p.parcel_nr.toLowerCase().includes(search.toLowerCase())
      const matchesCrop = cropFilter === 'all' || p.crop_type === cropFilter
      return matchesSearch && matchesCrop
    })
  }, [data, search, cropFilter])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="ძებნა ნაკვეთის ნომრით ან კადასტრით..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Sprout className="h-4 w-4 text-text-muted" />
          <select
            value={cropFilter}
            onChange={(e) => {
              setCropFilter(e.target.value)
              setPage(1)
            }}
            className="input py-2"
          >
            {CROP_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <select
            value={zoneFilter}
            onChange={(e) => {
              setZoneFilter(e.target.value)
              setPage(1)
            }}
            className="input py-2"
          >
            <option value="all">ყველა ზონა</option>
            <option value="critical">კრიტიკული</option>
            <option value="high">მაღალი</option>
            <option value="medium">საშუალო</option>
            <option value="ok">ნორმა</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".geojson,.json"
            onChange={handleImport}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {importing ? 'იმპორტი...' : 'GeoJSON იმპორტი'}
          </button>
        </div>

        <button
          onClick={() => refetch()}
          disabled={loading}
          className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors"
          title="განახლება"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Active Filters */}
      {(cropFilter !== 'all' || zoneFilter !== 'all' || search) && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">აქტიური ფილტრები:</span>
          {cropFilter !== 'all' && (
            <span className="px-2 py-1 bg-accent/10 text-accent rounded">
              კულტურა: {CROP_OPTIONS.find(c => c.value === cropFilter)?.label}
            </span>
          )}
          {zoneFilter !== 'all' && (
            <span className="px-2 py-1 bg-accent/10 text-accent rounded capitalize">
              ზონა: {zoneFilter}
            </span>
          )}
          {search && (
            <span className="px-2 py-1 bg-accent/10 text-accent rounded">
              ძებნა: {search}
            </span>
          )}
          <button 
            onClick={() => {
              setCropFilter('all')
              setZoneFilter('all')
              setSearch('')
            }}
            className="text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {importResult && (
        <div
          className={`p-3 rounded-lg ${
            importResult.success
              ? 'bg-success/10 border border-success/30 text-success'
              : 'bg-danger/10 border border-danger/30 text-danger'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{importResult.message}</span>
            <button
              onClick={() => setImportResult(null)}
              className="ml-auto hover:opacity-70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {importResult.errors && importResult.errors.length > 0 && (
            <div className="mt-2 text-xs opacity-80 space-y-0.5 max-h-32 overflow-y-auto">
              {importResult.errors.slice(0, 5).map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
              {importResult.errors.length > 5 && (
                <div>• ... და კიდევ {importResult.errors.length - 5} შეცდომა</div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger">
          {error}
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-text-muted">
        ნაპოვნია {filteredItems.length} / {data?.total || 0} ნაკვეთი
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-primary border-b border-white/5">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-muted">ნაკვეთის №</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">ფართობი (ჰა)</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">კულტურა</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">ზონა</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">NDVI</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((parcel) => (
                <React.Fragment key={parcel.id}>
                  <tr
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() =>
                      setExpandedId(expandedId === parcel.id ? null : parcel.id)
                    }
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {parcel.parcel_nr}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {parcel.area_ha?.toFixed(2) || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 bg-white/5 rounded">
                        {CROP_OPTIONS.find(c => c.value === parcel.crop_type)?.label || parcel.crop_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {parcel.latest_zone ? (
                        <MineralBadge zone={parcel.latest_zone} />
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {parcel.latest_ndvi?.toFixed(2) || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(parcel.id) }}
                          disabled={deletingId === parcel.id}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all disabled:opacity-40 ${deleteConfirmId === parcel.id ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'text-white/30 hover:text-red-400 hover:bg-red-400/10 border border-transparent'}`}
                          title="ნაკვეთის წაშლა"
                        >
                          {deletingId === parcel.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          {deleteConfirmId === parcel.id ? 'დარწმუნებული?' : ''}
                        </button>
                        {expandedId === parcel.id ? (
                          <ChevronUp className="h-4 w-4 text-text-muted" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-text-muted" />
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === parcel.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 bg-bg-primary/50">
                        {histLoading ? (
                          <div className="flex items-center gap-2 text-text-muted">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>იტვირთება...</span>
                          </div>
                        ) : history && history.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-text-muted mb-2">
                              ანალიზის ისტორია
                            </p>
                            {history.slice(0, 5).map((h) => (
                              <div
                                key={h.id}
                                className="flex items-center gap-4 text-xs py-2 border-b border-white/5 last:border-0"
                              >
                                <span className="text-text-muted w-24">
                                  {new Date(h.run_date).toLocaleDateString('ka-GE')}
                                </span>
                                <span className="text-text-secondary">N: {h.n_status || '-'}</span>
                                <span className="text-text-secondary">P: {h.p_status || '-'}</span>
                                <span className="text-text-secondary">K: {h.k_status || '-'}</span>
                                <span className="text-text-secondary">Mg: {h.mg_status || '-'}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-text-muted">ისტორია არ არის</p>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-sm text-text-muted">
              გვერდი {page} / {data.pages} (სულ {data.total})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
