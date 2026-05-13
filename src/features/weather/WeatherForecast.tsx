import React, { useState, useEffect, useMemo } from 'react'
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { useApi } from '@/shared/hooks/useApi'
import { API_BASE, parcels as parcelsApi, satellite as satelliteApi } from '@/shared/lib/api'
import { useProfileStore } from '@/shared/stores'
import type { WxRow, WeatherParcelRow, Parcel, PaginatedResponse, SatelliteHistoryRow } from '@/shared/lib/api'

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, dec = 1, fallback = '—'): string {
  return v != null ? v.toFixed(dec) : fallback
}

function estimateCloudPct(solar: number | null): number {
  if (solar == null) return 50
  const clearSky = 28
  return Math.round(Math.max(0, Math.min(100, (1 - solar / clearSky) * 100)))
}

function cloudIcon(pct: number | null, solar?: number | null): string {
  const effective = pct ?? estimateCloudPct(solar ?? null)
  if (effective < 20) return '☀️'
  if (effective < 50) return '🌤️'
  if (effective < 80) return '⛅'
  return '☁️'
}

function precipColor(mm: number | null): string {
  if (!mm || mm === 0) return '#21262d'
  if (mm < 2) return '#1565c0'
  if (mm < 8) return '#1976d2'
  if (mm < 20) return '#2196f3'
  return '#42a5f5'
}

function tempColor(t: number | null): string {
  if (t == null) return '#8b949e'
  if (t < 0) return '#90caf9'
  if (t < 10) return '#64b5f6'
  if (t < 20) return '#388e3c'
  if (t < 30) return '#f57c00'
  return '#d32f2f'
}

function solarBar(mj: number | null): number {
  if (!mj) return 0
  return Math.min(100, Math.round((mj / 30) * 100))
}

const GEO_DAYS = ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ']
function dayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return GEO_DAYS[d.getDay()]
}

const GEO_MONTHS = [
  'იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ',
  'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ',
]
function dateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} ${GEO_MONTHS[d.getMonth()]}`
}

// ─── forecast types ──────────────────────────────────────────────────────────

interface AggDay {
  date: string
  t_max: number | null
  t_min: number | null
  t_avg: number | null
  precip_mm: number | null
  solar: number | null
  rh_pct: number | null
  cloud_cover_pct: number | null
  wind_ms: number | null
  heat_stress: boolean
  frost_risk: boolean
  disease_risk: number | null
  gdd: number | null
}

// ─── chart helpers ───────────────────────────────────────────────────────────

const DAYS_OPTIONS = [14, 30, 60] as const
type DaysBack = typeof DAYS_OPTIONS[number]

interface ProcessedRow extends WeatherParcelRow {
  t_band_hist: number | null
  t_min_hist: number | null
  t_band_fore: number | null
  t_min_fore: number | null
  t_avg_hist: number | null
  t_avg_fore: number | null
  precip_hist: number | null
  precip_fore: number | null
  cum_gdd: number
  conf_lo: number | null
  conf_band: number | null
  disease_risk_norm: number | null
}

function processRows(rows: WeatherParcelRow[]): ProcessedRow[] {
  const sorted = [...rows].sort((a, b) => a.wx_date.localeCompare(b.wx_date))
  let cumGdd = 0
  let fcount = 0
  return sorted.map((row) => {
    cumGdd += row.gdd ?? 0
    const isFore = row.is_forecast
    const hasTBand = row.t_max != null && row.t_min != null
    const t_band_hist = !isFore && hasTBand ? row.t_max! - row.t_min! : null
    const t_min_hist = !isFore ? row.t_min : null
    const t_band_fore = isFore && hasTBand ? row.t_max! - row.t_min! : null
    const t_min_fore = isFore ? row.t_min : null
    const t_avg_hist = !isFore ? row.t_avg : null
    const t_avg_fore = isFore ? row.t_avg : null
    const precip_hist = !isFore ? row.precip_mm : null
    const precip_fore = isFore ? row.precip_mm : null
    if (isFore) fcount++
    const uncertainty = isFore ? Math.min(1.5 + fcount * 0.2, 4) : null
    const conf_lo = uncertainty != null && row.t_avg != null ? row.t_avg - uncertainty : null
    const conf_band = uncertainty != null ? uncertainty * 2 : null
    const disease_risk_norm = row.disease_risk != null ? row.disease_risk / 3 : null
    return {
      ...row, t_band_hist, t_min_hist, t_band_fore, t_min_fore,
      t_avg_hist, t_avg_fore, precip_hist, precip_fore,
      cum_gdd: cumGdd, conf_lo, conf_band, disease_risk_norm,
    }
  })
}

const chartTooltipStyle = {
  contentStyle: { background: 'var(--agro-card)', border: '1px solid var(--agro-border)', borderRadius: 8 },
  labelStyle: { color: '#f1f5f9' },
  itemStyle: { color: '#94a3b8' },
}
const axisTickStyle = { fill: '#94a3b8', fontSize: 11 }

function ChartCard({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="bg-bg-card border border-white/10 rounded-xl p-4">
      <div className="text-sm font-semibold text-text-primary mb-3">{title}</div>
      {children}
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function WeatherForecast(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [view, setView] = useState<'forecast' | 'charts'>('forecast')

  // ── forecast state ──
  const [rows, setRows] = useState<WxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedParcel, setSelectedParcel] = useState<string>('all')
  const [days, setDays] = useState(10)

  // ── charts state ──
  const [chartParcelId, setChartParcelId] = useState<string>('')
  const [daysBack, setDaysBack] = useState<DaysBack>(30)
  const [wxData, setWxData] = useState<ProcessedRow[]>([])
  const [wxLoading, setWxLoading] = useState(false)
  const [wxError, setWxError] = useState<string | null>(null)

  // ── satellite NDVI history ──
  const [satHistory, setSatHistory] = useState<SatelliteHistoryRow[]>([])
  const [satLoading, setSatLoading] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  // ── forecast data ──
  useEffect(() => {
    if (view !== 'forecast') return
    setLoading(true)
    const token = localStorage.getItem('token')
    const profileParam = profileId ? `&profile_id=${profileId}` : ''
    fetch(`${API_BASE}/weather?days=${days}${profileParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: WxRow[]) => { setRows(data); setError(null) })
      .catch(() => setError('ამინდის მონაცემები ვერ ჩაიტვირთა'))
      .finally(() => setLoading(false))
  }, [days, view, profileId])

  // ── parcel list (for charts) ──
  const { data: parcelsData, loading: parcelsLoading } = useApi<PaginatedResponse<Parcel>>(
    () => parcelsApi.list(1, 200, undefined, profileId), [profileId]
  )
  const parcelList: Parcel[] = parcelsData?.items ?? []

  useEffect(() => {
    if (parcelList.length > 0 && !chartParcelId) {
      setChartParcelId(parcelList[0].id)
    }
  }, [parcelList, chartParcelId])

  // ── charts data ──
  useEffect(() => {
    if (view !== 'charts' || !chartParcelId) return
    const token = localStorage.getItem('token')
    const controller = new AbortController()
    setWxLoading(true)
    setWxError(null)
    setWxData([])
    fetch(`${API_BASE}/weather/${chartParcelId}?days_back=${daysBack}`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Request failed' }))
          throw new Error(err.detail || 'Request failed')
        }
        return res.json() as Promise<WeatherParcelRow[]>
      })
      .then((r) => { setWxData(processRows(r)); setWxLoading(false) })
      .catch((e) => {
        if (e instanceof Error && e.name === 'AbortError') return
        setWxError(e instanceof Error ? e.message : 'Unknown error')
        setWxLoading(false)
      })
    return () => controller.abort()
  }, [chartParcelId, daysBack, view])

  // ── satellite NDVI history fetch ──
  useEffect(() => {
    if (view !== 'charts' || !chartParcelId) return
    setSatLoading(true)
    setSatHistory([])
    satelliteApi.history(chartParcelId, 180)
      .then(r => { setSatHistory(r); setSatLoading(false) })
      .catch(() => setSatLoading(false))
  }, [chartParcelId, view])

  // ── forecast computed ──
  const parcels = useMemo(() => {
    const seen = new Map<string, string>()
    rows.forEach(r => seen.set(r.parcel_id, r.parcel_nr))
    return Array.from(seen.entries()).map(([id, nr]) => ({ id, nr }))
  }, [rows])

  const dates = useMemo(() => {
    const s = new Set(rows.map(r => r.wx_date))
    return Array.from(s).sort()
  }, [rows])

  const filtered = useMemo(() => {
    if (selectedParcel === 'all') return rows
    return rows.filter(r => r.parcel_id === selectedParcel)
  }, [rows, selectedParcel])

  const byDate = useMemo((): AggDay[] => {
    return dates.map(d => {
      const dayRows = filtered.filter(r => r.wx_date === d)
      const avg = (key: keyof WxRow): number | null => {
        const vals = dayRows.map(r => r[key] as number | null).filter((v): v is number => v != null)
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      }
      return {
        date: d,
        t_max: avg('t_max'), t_min: avg('t_min'), t_avg: avg('t_avg'),
        precip_mm: avg('precip_mm'), solar: avg('solar'), rh_pct: avg('rh_pct'),
        cloud_cover_pct: avg('cloud_cover_pct') ?? (
          dayRows.length ? dayRows.reduce((s, r) => s + estimateCloudPct(r.solar), 0) / dayRows.length : null
        ),
        wind_ms: avg('wind_ms'),
        heat_stress: dayRows.some(r => r.heat_stress),
        frost_risk: dayRows.some(r => r.frost_risk),
        disease_risk: avg('disease_risk'), gdd: avg('gdd'),
      }
    })
  }, [filtered, dates])

  const selectedChartParcel = parcelList.find(p => p.id === chartParcelId)

  return (
    <div className="space-y-6">
      {/* Header + tab toggle */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">ამინდი</h1>
          <p className="text-text-secondary mt-1">პროგნოზი / ანალიზი / გრაფიკები</p>
        </div>
        <div className="flex gap-1 bg-bg-card border border-white/10 rounded-lg p-1" role="tablist">
          {([['forecast', 'პროგნოზი'], ['charts', 'გრაფიკები']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              role="tab"
              aria-selected={view === v}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === v
                  ? 'bg-accent text-base-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── FORECAST VIEW ── */}
      {view === 'forecast' && (
        <>
          {/* Controls */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={selectedParcel}
              onChange={e => setSelectedParcel(e.target.value)}
              aria-label="Select parcel"
              className="bg-bg-card border border-white/10 text-text-primary text-sm rounded-lg px-3 py-2"
            >
              <option value="all">ყველა ნაკვეთი</option>
              {parcels.map(p => (
                <option key={p.id} value={p.id}>{p.nr}</option>
              ))}
            </select>
            {[7, 10, 14].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  days === d
                    ? 'bg-accent text-base-primary'
                    : 'bg-bg-card border border-white/10 text-text-secondary hover:text-text-primary'
                }`}
              >
                {d} დღე
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-danger/20 border border-danger/50 text-danger px-4 py-3 rounded-lg" role="alert">
              {error} - გაუშვით ამინდის ჩამოტვირთვა პირველ ნაკვეთზე.
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-text-secondary">ამინდის მონაცემები იტვირთება...</div>
            </div>
          )}

          {byDate.length === 0 && !loading && (
            <div className="bg-bg-card border border-white/10 rounded-xl p-12 text-center">
              <div className="text-5xl mb-4" aria-hidden="true">&#9728;</div>
              <div className="text-text-secondary">პროგნოზი არ არის. გაუშვით ამინდის სინქრონიზაცია.</div>
            </div>
          )}

          {byDate.length > 0 && (
            <>
              {/* Day cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                {byDate.map(d => (
                  <div key={d.date} className="bg-bg-card border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                    <div className="text-center">
                      <div className="text-accent font-bold text-sm">{dayLabel(d.date)}</div>
                      <div className="text-text-secondary text-xs">{dateLabel(d.date)}</div>
                    </div>
                    <div className="text-2xl text-center" aria-label={`Cloud coverage: ${d.cloud_cover_pct ?? 'unknown'}%`}>{cloudIcon(d.cloud_cover_pct, d.solar)}</div>
                    <div className="text-center">
                      <span className="font-bold text-sm" style={{ color: tempColor(d.t_max) }}>{fmt(d.t_max, 0)}&#176;</span>
                      <span className="text-text-secondary text-xs mx-1">/</span>
                      <span className="text-xs text-text-secondary">{fmt(d.t_min, 0)}&#176;</span>
                    </div>
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-sensor text-xs" aria-hidden="true">&#128167;</span>
                      <span className="text-xs text-text-primary">{fmt(d.precip_mm, 1)} mm</span>
                    </div>
                    <div className="flex gap-1 justify-center flex-wrap">
                      {d.heat_stress && <span className="text-xs bg-warning/20 text-warning px-1 rounded" title="Heat stress">&#128293;</span>}
                      {d.frost_risk && <span className="text-xs bg-sensor/20 text-sensor px-1 rounded" title="Frost risk">&#10052;</span>}
                      {d.disease_risk != null && d.disease_risk >= 2 && (
                        <span className="text-xs bg-warning/20 text-warning px-1 rounded" title="Disease risk">&#129440;</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bg-card border border-white/10 rounded-xl p-5">
                  <h3 className="text-text-primary font-semibold mb-4">&#127777; ტემპერატურა (&#176;C)</h3>
                  <div className="space-y-2">
                    {byDate.map(d => (
                      <div key={d.date} className="flex items-center gap-3">
                        <div className="w-14 text-xs text-text-secondary text-right">{dateLabel(d.date)}</div>
                        <div className="flex-1 relative h-6 flex items-center">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full h-2 bg-base-elevated rounded-full" />
                          </div>
                          {d.t_min != null && d.t_max != null && (() => {
                            const range = 50
                            const offset = 10
                            const left = Math.max(0, ((d.t_min + offset) / range) * 100)
                            const width = Math.max(2, ((d.t_max - d.t_min) / range) * 100)
                            return (
                              <div className="absolute inset-0 flex items-center">
                                <div className="relative w-full h-2">
                                  <div className="absolute h-2 rounded-full" style={{ left: `${left}%`, width: `${width}%`, backgroundColor: tempColor(d.t_avg) }} />
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                        <div className="w-20 text-xs text-right">
                          <span style={{ color: tempColor(d.t_max) }}>{fmt(d.t_max, 0)}&#176;</span>
                          <span className="text-text-muted"> / {fmt(d.t_min, 0)}&#176;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-bg-card border border-white/10 rounded-xl p-5">
                  <h3 className="text-text-primary font-semibold mb-4">&#128167; ნალექი (mm)</h3>
                  <div className="space-y-2">
                    {(() => {
                      const maxP = byDate.length > 0 ? Math.max(...byDate.map(d => d.precip_mm ?? 0), 1) : 1
                      return byDate.map(d => (
                        <div key={d.date} className="flex items-center gap-3">
                          <div className="w-14 text-xs text-text-secondary text-right">{dateLabel(d.date)}</div>
                          <div className="flex-1 h-6 flex items-center">
                            <div className="w-full h-4 bg-base-elevated rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${((d.precip_mm ?? 0) / maxP) * 100}%`, backgroundColor: precipColor(d.precip_mm) }} />
                            </div>
                          </div>
                          <div className="w-14 text-xs text-sensor text-right">{fmt(d.precip_mm, 1)} mm</div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>

                <div className="bg-bg-card border border-white/10 rounded-xl p-5">
                  <h3 className="text-text-primary font-semibold mb-4">&#9728; მზის რადიაცია (MJ/m&#178;)</h3>
                  <div className="space-y-2">
                    {byDate.map(d => (
                      <div key={d.date} className="flex items-center gap-3">
                        <div className="w-14 text-xs text-text-secondary text-right">{dateLabel(d.date)}</div>
                        <div className="flex-1 h-6 flex items-center">
                          <div className="w-full h-4 bg-base-elevated rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${solarBar(d.solar)}%`, background: 'linear-gradient(90deg, #f57c00, #ffd54f)' }} />
                          </div>
                        </div>
                        <div className="w-14 text-xs text-warning text-right">{fmt(d.solar, 1)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-bg-card border border-white/10 rounded-xl p-5">
                  <h3 className="text-text-primary font-semibold mb-4">&#9729; ღრუბლიანობა (%)</h3>
                  <div className="space-y-2">
                    {byDate.map(d => (
                      <div key={d.date} className="flex items-center gap-3">
                        <div className="w-14 text-xs text-text-secondary text-right">{dateLabel(d.date)}</div>
                        <div className="flex-1 h-6 flex items-center">
                          <div className="w-full h-4 bg-base-elevated rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all bg-text-secondary" style={{ width: `${d.cloud_cover_pct ?? estimateCloudPct(d.solar)}%` }} />
                          </div>
                        </div>
                        <div className="w-14 text-xs text-text-secondary text-right">
                          {cloudIcon(d.cloud_cover_pct, d.solar)} {fmt(d.cloud_cover_pct ?? estimateCloudPct(d.solar), 0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'სულ ნალექი', value: fmt(byDate.reduce((s, d) => s + (d.precip_mm ?? 0), 0), 1), unit: 'mm', color: '#0ea5e9', icon: '&#128167;' },
                  { label: 'საშუალო ტ&#176;', value: fmt(byDate.reduce((s, d) => s + (d.t_avg ?? 0), 0) / (byDate.length || 1), 1), unit: '&#176;C', color: '#f57c00', icon: '&#127777;' },
                  { label: 'სულ GDD', value: fmt(byDate.reduce((s, d) => s + (d.gdd ?? 0), 0), 0), unit: 'GDD', color: '#22c55e', icon: '&#127793;' },
                  { label: 'საშუალო ღრ.', value: fmt(byDate.reduce((s, d) => s + (d.cloud_cover_pct ?? estimateCloudPct(d.solar)), 0) / (byDate.length || 1), 0), unit: '%', color: '#94a3b8', icon: '&#9729;' },
                ].map(c => (
                  <div key={c.label} className="bg-bg-card border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-1" aria-hidden="true" dangerouslySetInnerHTML={{ __html: c.icon }} />
                    <div className="text-text-secondary text-xs mb-1">{c.label}</div>
                    <div className="font-bold text-xl" style={{ color: c.color }}>
                      {c.value} <span className="text-sm font-normal text-text-secondary" dangerouslySetInnerHTML={{ __html: c.unit }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Per-parcel comparison table */}
              {selectedParcel === 'all' && parcels.length > 1 && (
                <div className="bg-bg-card border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10">
                    <h3 className="text-text-primary font-semibold">ნაკვეთების შედარება ({days} დღე)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          {['ნაკვეთი', 'ნალექი (mm)', 'ტ&#176; საშ.', 'ღრუბ.', 'GDD', 'მავნებლები'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-text-secondary font-medium" dangerouslySetInnerHTML={{ __html: h }} />
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parcels.map(p => {
                          const pRows = rows.filter(r => r.parcel_id === p.id)
                          const sumPrecip = pRows.reduce((s, r) => s + (r.precip_mm ?? 0), 0)
                          const avgT = pRows.length ? pRows.reduce((s, r) => s + (r.t_avg ?? 0), 0) / pRows.length : null
                          const avgCloud = pRows.length ? pRows.reduce((s, r) => s + (r.cloud_cover_pct ?? estimateCloudPct(r.solar)), 0) / pRows.length : null
                          const sumGdd = pRows.reduce((s, r) => s + (r.gdd ?? 0), 0)
                          const maxRisk = Math.max(...pRows.map(r => r.disease_risk ?? 0))
                          return (
                            <tr key={p.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 text-text-primary font-medium">{p.nr}</td>
                              <td className="px-4 py-3 text-sensor">{fmt(sumPrecip, 1)}</td>
                              <td className="px-4 py-3" style={{ color: tempColor(avgT) }}>{fmt(avgT, 1)}&#176;</td>
                              <td className="px-4 py-3 text-text-secondary">
                                {cloudIcon(avgCloud, pRows.length ? pRows.reduce((s, r) => s + (r.solar ?? 0), 0) / pRows.length : null)} {fmt(avgCloud, 0)}%
                              </td>
                              <td className="px-4 py-3 text-success">{fmt(sumGdd, 0)}</td>
                              <td className="px-4 py-3">
                                {maxRisk >= 2
                                  ? <span className="text-warning text-xs bg-warning/20 px-2 py-0.5 rounded">&#129440; {maxRisk}/3</span>
                                  : <span className="text-success text-xs">&#10003; დაბალი</span>
                                }
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* -- CHARTS VIEW -- */}
      {view === 'charts' && (
        <>
          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label htmlFor="chart-parcel-select" className="text-xs text-text-secondary">ნაკვეთი</label>
              {parcelsLoading ? (
                <div className="h-9 w-48 rounded-lg bg-bg-card border border-white/10 animate-pulse" />
              ) : (
                <select
                  id="chart-parcel-select"
                  value={chartParcelId}
                  onChange={e => setChartParcelId(e.target.value)}
                  className="bg-bg-card border border-white/10 text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {parcelList.length === 0 && <option value="">ნაკვეთი არ მოიძებნა</option>}
                  {parcelList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.parcel_nr || p.parcel_nr} ({p.area_ha?.toFixed(1)} ჰა)
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-secondary">პერიოდი</span>
              <div className="flex gap-1" role="group" aria-label="Select period">
                {DAYS_OPTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDaysBack(d)}
                    aria-pressed={daysBack === d}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      daysBack === d
                        ? 'bg-accent border-accent text-base-primary font-semibold'
                        : 'bg-bg-card border-white/10 text-text-secondary hover:text-text-primary hover:border-accent'
                    }`}
                  >
                    {d}დ
                  </button>
                ))}
              </div>
            </div>
            {selectedChartParcel && (
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-card border border-white/10 rounded-lg">
                <span className="text-xs text-text-secondary">კულტურა:</span>
                <span className="text-xs text-text-primary font-medium">{selectedChartParcel.crop_type || '-'}</span>
                {selectedChartParcel.latest_zone && (
                  <>
                    <span className="text-xs text-text-muted">|</span>
                    <span className="text-xs text-text-secondary">ზონა:</span>
                    <span className="text-xs text-text-primary font-medium capitalize">{selectedChartParcel.latest_zone}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {wxLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3 text-text-secondary">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
                <span className="text-sm">მონაცემები იტვირთება...</span>
              </div>
            </div>
          )}

          {wxError && !wxLoading && (
            <div className="rounded-xl border border-danger/50 bg-danger/20 p-4 text-sm text-danger" role="alert">
              შეცდომა: {wxError}
            </div>
          )}

          {!chartParcelId && !parcelsLoading && (
            <div className="flex items-center justify-center py-16 text-text-muted text-sm">
              აირჩიეთ ნაკვეთი ამინდის ჩარტების სანახავად
            </div>
          )}

          {!wxLoading && !wxError && chartParcelId && wxData.length === 0 && (
            <div className="flex items-center justify-center py-16 text-text-muted text-sm">
              ამინდის მონაცემები ვერ მოიძებნა არჩეული ნაკვეთისთვის
            </div>
          )}

          {!wxLoading && !wxError && wxData.length > 0 && (
            <div className="space-y-3">
              {/* Chart 1 - Temperature */}
              <ChartCard title="&#127777; ტემპერატურა (&#176;C)">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={wxData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="wx_date" tickFormatter={dateLabel} interval={4} tick={axisTickStyle} />
                    <YAxis label={{ value: '°C', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 11 }} tick={axisTickStyle} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={chartTooltipStyle.contentStyle} labelStyle={chartTooltipStyle.labelStyle} itemStyle={chartTooltipStyle.itemStyle}
                      formatter={(v: unknown) => v == null ? '—' : `${Number(v).toFixed(1)}°C`} labelFormatter={dateLabel} />
                    <ReferenceLine x={today} stroke="#fbc02d" strokeDasharray="5 5" label={{ value: 'დღეს', position: 'top', fill: '#fbc02d', fontSize: 10 }} />
                    <Area type="monotone" dataKey="t_min_hist" stackId="hist" stroke="none" fill="transparent" legendType="none" isAnimationActive={false} connectNulls={false} />
                    <Area type="monotone" dataKey="t_band_hist" stackId="hist" stroke="none" fill="rgba(33,150,243,0.2)" name="t min-max (ისტ.)" isAnimationActive={false} connectNulls={false} />
                    <Area type="monotone" dataKey="conf_lo" stackId="fore" stroke="none" fill="transparent" legendType="none" isAnimationActive={false} connectNulls={false} />
                    <Area type="monotone" dataKey="conf_band" stackId="fore" stroke="none" fill="rgba(211,47,47,0.15)" legendType="none" isAnimationActive={false} connectNulls={false} />
                    <Line type="monotone" dataKey="t_avg_hist" stroke="#2196f3" strokeWidth={2} dot={false} name="t_avg (ისტ.)" isAnimationActive={false} connectNulls={false} />
                    <Line type="monotone" dataKey="t_avg_fore" stroke="#ef5350" strokeWidth={2} strokeDasharray="6 3" dot={false} name="პროგნოზი" isAnimationActive={false} connectNulls={false} />
                    <Legend wrapperStyle={{ color: '#8b949e', fontSize: 12 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Chart 2 - Precipitation vs ETo */}
              <ChartCard title="&#128167; ნალექი vs ETo (mm)">
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={wxData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="wx_date" tickFormatter={dateLabel} interval={4} tick={axisTickStyle} />
                    <YAxis label={{ value: 'mm', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 11 }} tick={axisTickStyle} domain={[0, 'auto']} />
                    <Tooltip contentStyle={chartTooltipStyle.contentStyle} labelStyle={chartTooltipStyle.labelStyle} itemStyle={chartTooltipStyle.itemStyle}
                      formatter={(v: unknown) => v == null ? '—' : `${Number(v).toFixed(1)} mm`} labelFormatter={dateLabel} />
                    <ReferenceLine x={today} stroke="#fbc02d" strokeDasharray="5 5" label={{ value: 'დღეს', position: 'top', fill: '#fbc02d', fontSize: 10 }} />
                    <Bar dataKey="precip_hist" fill="#1976d2" name="ნალექი (ისტ.)" maxBarSize={14} isAnimationActive={false} />
                    <Bar dataKey="precip_fore" fill="#ef9a9a" name="ნალ. პრ." maxBarSize={14} isAnimationActive={false} />
                    <Line type="monotone" dataKey="eto_mm" stroke="#ff8f00" strokeWidth={2} strokeDasharray="4 3" dot={false} name="ETo" isAnimationActive={false} connectNulls={false} />
                    <Legend wrapperStyle={{ color: '#8b949e', fontSize: 12 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Chart 3 - GDD + Disease Risk */}
              <ChartCard title="&#127793; GDD + დაავადების რისკი">
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={wxData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="wx_date" tickFormatter={dateLabel} interval={4} tick={axisTickStyle} />
                    <YAxis yAxisId="gdd" label={{ value: 'კუმ. GDD', angle: -90, position: 'insideLeft', fill: '#4caf50', fontSize: 11 }} tick={{ fill: '#4caf50', fontSize: 11 }} />
                    <YAxis yAxisId="risk" orientation="right" domain={[0, 1]} label={{ value: 'რისკი 0-1', angle: 90, position: 'insideRight', fill: '#ef5350', fontSize: 11 }} tick={{ fill: '#ef5350', fontSize: 11 }} />
                    <Tooltip contentStyle={chartTooltipStyle.contentStyle} labelStyle={chartTooltipStyle.labelStyle} itemStyle={chartTooltipStyle.itemStyle}
                      formatter={(v: unknown, name: string) => {
                        if (name === 'კუმ. GDD') return v == null ? '—' : `${Number(v).toFixed(0)} GDD`
                        return v == null ? '—' : Number(v).toFixed(2)
                      }}
                      labelFormatter={dateLabel}
                    />
                    <Area yAxisId="gdd" type="monotone" dataKey="cum_gdd" stroke="#4caf50" fill="rgba(76,175,80,0.2)" strokeWidth={2} dot={false} name="კუმ. GDD" isAnimationActive={false} connectNulls />
                    <Bar yAxisId="risk" dataKey="disease_risk_norm" fill="rgba(239,83,80,0.7)" maxBarSize={10} name="დაავ. რისკი" isAnimationActive={false} />
                    <Legend wrapperStyle={{ color: '#8b949e', fontSize: 12 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Chart 4 - NDVI / NDRE trend */}
              {satLoading && (
                <div className="flex items-center justify-center py-8 text-text-secondary text-sm">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-accent mr-2" />
                  სატელიტური მონაცემები იტვირთება...
                </div>
              )}
              {!satLoading && satHistory.length > 0 && (
                <ChartCard title="&#128752; NDVI / NDRE ტრენდი (სატელიტი)">
                  <div className="flex gap-4 mb-2 text-xs text-text-secondary">
                    {satHistory.map(r => (
                      <span key={r.obs_date} className="flex items-center gap-1">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: r.stress_level === 'critical' ? '#d32f2f' : r.stress_level === 'high' ? '#f57c00' : r.stress_level === 'medium' ? '#fbc02d' : '#388e3c' }}
                        />
                        {r.obs_date.slice(5)} {r.crop_status}
                      </span>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={satHistory} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                      <XAxis dataKey="obs_date" tickFormatter={dateLabel} tick={axisTickStyle} />
                      <YAxis domain={[0, 1]} tick={axisTickStyle} label={{ value: 'Index', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={chartTooltipStyle.contentStyle}
                        labelStyle={chartTooltipStyle.labelStyle}
                        itemStyle={chartTooltipStyle.itemStyle}
                        formatter={(v: unknown) => v == null ? '—' : Number(v).toFixed(4)}
                        labelFormatter={dateLabel}
                      />
                      <ReferenceLine y={0.35} stroke="#f57c00" strokeDasharray="4 2" label={{ value: 'N კრიტ.', position: 'right', fill: '#f57c00', fontSize: 9 }} />
                      <ReferenceLine y={0.15} stroke="#d32f2f" strokeDasharray="4 2" label={{ value: 'სტრესი', position: 'right', fill: '#d32f2f', fontSize: 9 }} />
                      <Line type="monotone" dataKey="ndvi" stroke="#4caf50" strokeWidth={2.5} dot={{ r: 4, fill: '#4caf50' }} name="NDVI" isAnimationActive={false} connectNulls />
                      <Line type="monotone" dataKey="ndre" stroke="#2196f3" strokeWidth={2} dot={{ r: 3, fill: '#2196f3' }} name="NDRE (N)" isAnimationActive={false} connectNulls strokeDasharray="5 3" />
                      <Line type="monotone" dataKey="ndwi" stroke="#42a5f5" strokeWidth={1.5} dot={{ r: 2, fill: '#42a5f5' }} name="NDWI (ტენ.)" isAnimationActive={false} connectNulls strokeDasharray="3 3" />
                      <Legend wrapperStyle={{ color: '#8b949e', fontSize: 12 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted">
                    {satHistory.map(r => (
                      <span key={r.obs_date}>
                        {r.obs_date}: NDVI=<b className="text-text-secondary">{r.ndvi?.toFixed(3) ?? '-'}</b>
                        {r.cloud_pct != null && <span className="ml-1 text-text-muted">&#9729;{r.cloud_pct.toFixed(0)}%</span>}
                      </span>
                    ))}
                  </div>
                </ChartCard>
              )}
              {!satLoading && satHistory.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-bg-card p-4 text-sm text-text-muted text-center">
                  &#128752; სატელიტური ისტორია არ მოიძებნა - გაუშვით სატელიტის სინქრონიზაცია
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
