import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts'
import {
  Satellite,
  RefreshCw,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Cloud,
} from 'lucide-react'
import { API_BASE } from '@/shared/lib/api'
import { useProfileStore } from '@/shared/stores'

interface TimeSeriesData {
  date: string
  ndvi: number | null
  ndre: number | null
  ndwi: number | null
  cloud_pct: number | null
  stress_level: string | null
}

interface Parcel {
  id: string
  parcel_nr: string | null
  area_ha: number | null
}

interface SyncStatus {
  last_sync: {
    id: string | null
    started_at: string | null
    finished_at: string | null
    status: string | null
    scenes_added: number
  }
  total_scenes: number
  latest_observation_date: string | null
  next_scheduled_run: string
}

interface SummaryData {
  has_data: boolean
  latest_date?: string
  ndvi?: number
  ndre?: number
  ndwi?: number
  cloud_pct?: number
  stress_level?: string
  trend?: 'improving' | 'declining' | 'stable'
  trend_change?: number
}

const COLORS = {
  ndvi: '#22c55e',    // Green
  ndre: '#0ea5e9',    // Blue
  ndwi: '#f59e0b',    // Orange
  critical: '#ef4444', // Red
  warning: '#eab308',  // Yellow
  ok: '#22c55e',       // Green
}

export default function NdviSeries(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [searchParams, setSearchParams] = useSearchParams()
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [selectedParcel, setSelectedParcel] = useState<string>(
    searchParams.get('parcel_id') || ''
  )
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([])
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Date range - default to last 90 days
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })

  const token = localStorage.getItem('token')

  const selectedParcelRef = useRef(selectedParcel)
  selectedParcelRef.current = selectedParcel

  // Fetch parcels list
  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const url = profileId
          ? `${API_BASE}/parcels?profile_id=${profileId}`
          : `${API_BASE}/parcels`
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch parcels')
        const data = await res.json()
        setParcels(data.items || [])
        if (!selectedParcelRef.current && data.items?.length > 0) {
          setSelectedParcel(data.items[0].id)
        }
      } catch (e) {
        console.error('Error fetching parcels:', e)
      }
    }
    fetchParcels()
  }, [token, profileId])

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/satellite/sync/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch sync status')
      const data = await res.json()
      setSyncStatus(data)
    } catch (e) {
      console.error('Error fetching sync status:', e)
    }
  }

  useEffect(() => {
    fetchSyncStatus()
    const interval = setInterval(fetchSyncStatus, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [token])

  // Fetch time series data
  const fetchTimeSeries = async () => {
    if (!selectedParcel) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Fetch time series
      const tsRes = await fetch(
        `${API_BASE}/satellite/ndvi?parcel_id=${selectedParcel}&date_from=${dateFrom}&date_to=${dateTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!tsRes.ok) throw new Error('Failed to fetch time series')
      const tsData = await tsRes.json()
      setTimeSeries(tsData)
      
      // Fetch summary
      const sumRes = await fetch(
        `${API_BASE}/satellite/summary?parcel_id=${selectedParcel}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!sumRes.ok) throw new Error('Failed to fetch summary')
      const sumData = await sumRes.json()
      setSummary(sumData)
      
      // Update URL
      setSearchParams({ parcel_id: selectedParcel })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimeSeries()
  }, [selectedParcel, dateFrom, dateTo, token])

  // Trigger sync
  const triggerSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`${API_BASE}/satellite/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to trigger sync')
      const data = await res.json()
      alert(`Sync started: ${data.message}`)
    } catch (e) {
      alert('Failed to trigger sync: ' + (e instanceof Error ? e.message : 'Unknown error'))
    } finally {
      setSyncing(false)
    }
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' })
  }

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-bg-card border border-bg-border rounded-lg p-3 shadow-xl">
          <p className="text-text-primary font-medium mb-2">{formatDate(label)}</p>
          {data.ndvi !== null && (
            <p className="text-sm" style={{ color: COLORS.ndvi }}>
              NDVI: {data.ndvi.toFixed(3)}
            </p>
          )}
          {data.ndre !== null && (
            <p className="text-sm" style={{ color: COLORS.ndre }}>
              NDRE: {data.ndre.toFixed(3)}
            </p>
          )}
          {data.ndwi !== null && (
            <p className="text-sm" style={{ color: COLORS.ndwi }}>
              NDWI: {data.ndwi.toFixed(3)}
            </p>
          )}
          {data.cloud_pct !== null && (
            <p className="text-xs text-text-muted mt-1">
              <Cloud className="inline h-3 w-3 mr-1" />
              Cloud: {data.cloud_pct.toFixed(1)}%
            </p>
          )}
          {data.stress_level && (
            <p className={`text-xs mt-1 ${
              data.stress_level === 'healthy' ? 'text-accent' :
              data.stress_level === 'moderate' ? 'text-zone-medium' :
              data.stress_level === 'stressed' ? 'text-zone-high' :
              'text-zone-critical'
            }`}>
              Status: {data.stress_level}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Get color based on NDVI value
  const getNdviColor = (value: number | null) => {
    if (value === null) return COLORS.warning
    if (value < 0.2) return COLORS.critical
    if (value < 0.4) return COLORS.warning
    return COLORS.ok
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Satellite className="h-6 w-6 text-accent" />
            სატელიტური მონიტორინგი
          </h1>
          <p className="text-text-secondary mt-1">
            NDVI / NDRE / NDWI დინამიკა Sentinel-2 სატელიტებიდან
          </p>
        </div>
        
        {/* Sync Status */}
        {syncStatus && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              {syncStatus.last_sync?.status === 'running' ? (
                <RefreshCw className="h-4 w-4 text-accent animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-accent" />
              )}
              <span className="text-text-secondary">
                ბოლო სინქ: {syncStatus.last_sync?.finished_at 
                  ? new Date(syncStatus.last_sync.finished_at).toLocaleDateString('ka-GE')
                  : 'არასოდეს'}
              </span>
            </div>
            <button
              onClick={triggerSync}
              disabled={syncing || syncStatus.last_sync?.status === 'running'}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              სინქრონიზაცია
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="card flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="label">ნაკვეთი</label>
          <select
            value={selectedParcel}
            onChange={(e) => setSelectedParcel(e.target.value)}
            className="select"
          >
            {parcels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.parcel_nr || p.parcel_nr} {p.area_ha ? `(${p.area_ha.toFixed(2)} ჰა)` : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="label">დაწყება</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        
        <div>
          <label className="label">დასრულება</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary?.has_data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card card-gradient-border">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">NDVI</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold data-value" style={{ color: getNdviColor(summary.ndvi || 0) }}>
                {summary.ndvi?.toFixed(3) || '-'}
              </span>
              {summary.trend && (
                <span className={`text-xs flex items-center ${
                  summary.trend === 'improving' ? 'text-accent' :
                  summary.trend === 'declining' ? 'text-danger' :
                  'text-text-muted'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-0.5 ${summary.trend === 'declining' ? 'rotate-180' : ''}`} />
                  {summary.trend === 'improving' ? 'იზრდება' :
                   summary.trend === 'declining' ? 'იკლებს' : 'სტაბილური'}
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {summary.latest_date ? new Date(summary.latest_date).toLocaleDateString('ka-GE') : ''}
            </p>
          </div>
          
          <div className="card">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">NDRE</p>
            <p className="text-2xl font-bold data-value" style={{ color: COLORS.ndre }}>
              {summary.ndre?.toFixed(3) || '-'}
            </p>
            <p className="text-xs text-text-muted mt-1">Red Edge Index</p>
          </div>
          
          <div className="card">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">NDWI</p>
            <p className="text-2xl font-bold data-value" style={{ color: COLORS.ndwi }}>
              {summary.ndwi?.toFixed(3) || '-'}
            </p>
            <p className="text-xs text-text-muted mt-1">Water Stress</p>
          </div>
          
          <div className="card">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">სტატუსი</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                summary.stress_level === 'healthy' ? 'bg-accent' :
                summary.stress_level === 'moderate' ? 'bg-zone-medium' :
                summary.stress_level === 'stressed' ? 'bg-zone-high' :
                'bg-zone-critical'
              }`} />
              <span className="text-lg font-medium capitalize">
                {summary.stress_level === 'healthy' ? 'ნორმაში' :
                 summary.stress_level === 'moderate' ? 'საშუალო' :
                 summary.stress_level === 'stressed' ? 'სტრესი' :
                 summary.stress_level === 'critical' ? 'კრიტიკული' :
                 'უცნობი'}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Cloud: {summary.cloud_pct?.toFixed(1) || '-'}%
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-xl border-2 border-white/10 border-t-accent shadow-glow" />
            <span className="text-sm text-text-muted font-mono">მონაცემების ჩატვირთვა...</span>
          </div>
        </div>
      )}

      {/* Limited data warning */}
      {!loading && timeSeries.length > 0 && timeSeries.length < 5 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30 text-warning">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">შეზღუდული მონაცემები</p>
            <p className="text-sm text-warning/80">
              მხოლოდ {timeSeries.length} სატელიტური გადაღებაა ხელმისაწვდომი არჩეული პერიოდისთვის. 
              გთხოვთ გაზარდოთ თარიღის დიაპაზონი ან დააჭიროთ &quot;სინქრონიზაცია&quot; მეტი მონაცემის ჩასატვირთად.
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {!loading && timeSeries.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">ვეგეტაციის ინდექსების დინამიკა</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.ndvi }} />
                <span className="text-text-secondary">NDVI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.ndre }} />
                <span className="text-text-secondary">NDRE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.ndwi }} />
                <span className="text-text-secondary">NDWI</span>
              </div>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                />
                <YAxis 
                  domain={[-0.2, 1]} 
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* NDVI threshold lines */}
                <ReferenceLine y={0.2} stroke={COLORS.critical} strokeDasharray="3 3" opacity={0.5} />
                <ReferenceLine y={0.4} stroke={COLORS.warning} strokeDasharray="3 3" opacity={0.5} />
                <ReferenceLine y={0.6} stroke={COLORS.ok} strokeDasharray="3 3" opacity={0.3} />
                
                <Line
                  type="monotone"
                  dataKey="ndvi"
                  stroke={COLORS.ndvi}
                  strokeWidth={3}
                  dot={{ fill: COLORS.ndvi, strokeWidth: 2, stroke: '#080c10', r: 5 }}
                  activeDot={{ r: 7, strokeWidth: 3, stroke: '#080c10' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="ndre"
                  stroke={COLORS.ndre}
                  strokeWidth={3}
                  dot={{ fill: COLORS.ndre, strokeWidth: 2, stroke: '#080c10', r: 5 }}
                  activeDot={{ r: 7, strokeWidth: 3, stroke: '#080c10' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="ndwi"
                  stroke={COLORS.ndwi}
                  strokeWidth={3}
                  dot={{ fill: COLORS.ndwi, strokeWidth: 2, stroke: '#080c10', r: 5 }}
                  activeDot={{ r: 7, strokeWidth: 3, stroke: '#080c10' }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Data Table for sparse data */}
          {timeSeries.length < 10 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-3 text-text-muted font-medium">თარიღი</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium" style={{ color: COLORS.ndvi }}>NDVI</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium" style={{ color: COLORS.ndre }}>NDRE</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium" style={{ color: COLORS.ndwi }}>NDWI</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium">Cloud %</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">სტატუსი</th>
                  </tr>
                </thead>
                <tbody>
                  {timeSeries.map((row, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 px-3 text-text-primary font-mono">{formatDate(row.date)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold" style={{ color: getNdviColor(row.ndvi) }}>
                        {row.ndvi?.toFixed(4) || '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono" style={{ color: COLORS.ndre }}>
                        {row.ndre?.toFixed(4) || '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono" style={{ color: COLORS.ndwi }}>
                        {row.ndwi?.toFixed(4) || '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-text-secondary">
                        {row.cloud_pct?.toFixed(1) || '-'}%
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          row.stress_level === 'healthy' ? 'bg-accent/20 text-accent' :
                          row.stress_level === 'moderate' ? 'bg-zone-medium/20 text-zone-medium' :
                          row.stress_level === 'stressed' ? 'bg-zone-high/20 text-zone-high' :
                          row.stress_level === 'critical' ? 'bg-zone-critical/20 text-zone-critical' :
                          'bg-text-muted/20 text-text-muted'
                        }`}>
                          {row.stress_level === 'healthy' ? 'ნორმაში' :
                           row.stress_level === 'moderate' ? 'საშუალო' :
                           row.stress_level === 'stressed' ? 'სტრესი' :
                           row.stress_level === 'critical' ? 'კრიტიკული' : 'უცნობი'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend / Info */}
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-text-muted mb-1">NDVI დიაპაზონები:</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded bg-zone-critical" />
                <span className="text-text-secondary">&lt;0.2 კრიტიკული</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded bg-zone-medium" />
                <span className="text-text-secondary">0.2-0.4 სტრესი</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded bg-accent" />
                <span className="text-text-secondary">&gt;0.4 ნორმაში</span>
              </div>
            </div>
            
            <div>
              <p className="text-text-muted mb-1">მონაცემები:</p>
              <p className="text-text-secondary">
                ჩანაწერები: <span className="text-text-primary font-mono">{timeSeries.length}</span>
              </p>
              <p className="text-text-secondary">
                პერიოდი: <span className="text-text-primary">{formatDate(dateFrom)} - {formatDate(dateTo)}</span>
              </p>
            </div>
            
            <div>
              <p className="text-text-muted mb-1">წყარო:</p>
              <p className="text-text-secondary">Sentinel-2 L2A</p>
              <p className="text-text-secondary">Max cloud: 80% (standard) / 95% (extended)</p>
              <p className="text-text-secondary">10-20m resolution</p>
            </div>
          </div>
        </div>
      )}

      {/* No data */}
      {!loading && timeSeries.length === 0 && selectedParcel && (
        <div className="card flex flex-col items-center justify-center h-64 text-center">
          <Satellite className="h-12 w-12 text-text-muted mb-3" />
          <p className="text-text-secondary">სატელიტური მონაცემები არ მოიძებნა</p>
          <p className="text-xs text-text-muted mt-1">
            დააჭირეთ "სინქრონიზაცია" მონაცემების ჩასატვირთად
          </p>
        </div>
      )}
    </div>
  )
}
