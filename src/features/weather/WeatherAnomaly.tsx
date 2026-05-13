import React, { useState, useEffect } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { BarChart2 } from 'lucide-react'
import { API_BASE } from '@/shared/lib/api'
import { useProfileStore } from '@/shared/stores'

// ─── types ───────────────────────────────────────────────────────────────────

interface Parcel {
  id: string
  parcel_nr: string
  area_ha: number | null
}

interface MonthlyAnomaly {
  month: number
  precip_actual_mm: number
  precip_normal_mm: number
  precip_anomaly_pct: number
  precip_label: 'wet' | 'dry' | 'normal'
  t_actual_c: number
  t_normal_c: number
  t_anomaly_c: number
  t_label: 'warm' | 'cold' | 'normal'
}

interface WeatherAnomalyResponse {
  parcel_id: string
  season_start: string
  monthly_anomalies: MonthlyAnomaly[]
  season_precip_mm: number
  season_normal_mm: number
  season_anomaly_pct: number
  calibration_note: string
}

// ─── constants ───────────────────────────────────────────────────────────────

const GEO_MONTHS = [
  'იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ',
  'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ',
]

// ─── helpers ─────────────────────────────────────────────────────────────────

async function fetchApi<T>(path: string): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token ?? ''}` },
  })
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

function fmtNum(v: number | null | undefined, dec = 1, unit = ''): string {
  if (v == null) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(dec)}${unit}`
}

function precipBarColor(label: 'wet' | 'dry' | 'normal'): string {
  if (label === 'wet') return '#2196f3'
  if (label === 'dry') return '#ff8f00'
  return '#8b949e'
}

function tempAnomalyColor(anomaly: number): string {
  return anomaly >= 0 ? '#f44336' : '#2196f3'
}

function labelBadgeStyle(label: 'wet' | 'dry' | 'normal' | 'warm' | 'cold'): React.CSSProperties {
  const map: Record<string, { background: string; color: string }> = {
    wet:    { background: '#2196f333', color: '#2196f3' },
    dry:    { background: '#ff8f0033', color: '#ff8f00' },
    normal: { background: '#8b949e22', color: '#8b949e' },
    warm:   { background: '#f4433633', color: '#f44336' },
    cold:   { background: '#2196f333', color: '#2196f3' },
  }
  return map[label] ?? map['normal']
}

function labelText(label: string): string {
  const map: Record<string, string> = {
    wet: 'სველი', dry: 'მშრალი', normal: 'ნორმ.',
    warm: 'თბილი', cold: 'ცივი',
  }
  return map[label] ?? label
}

function anomalySign(pct: number): string {
  if (pct > 15) return '+'
  if (pct < -15) return '-'
  return '~'
}

// ─── sub-components ──────────────────────────────────────────────────────────

const chartTooltipStyle = {
  contentStyle: { background: '#161b22', border: '1px solid #21262d', borderRadius: 8 },
  labelStyle: { color: '#e6edf3' },
  itemStyle: { color: '#8b949e' },
}

const axisTickStyle = { fill: '#8b949e', fontSize: 11 }

function ChartCard({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
      <div className="text-sm font-semibold text-[#e6edf3] mb-3">{title}</div>
      {children}
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function WeatherAnomaly(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [parcelList, setParcelList] = useState<Parcel[]>([])
  const [parcelsLoading, setParcelsLoading] = useState(true)

  const [selectedParcelId, setSelectedParcelId] = useState<string>('')

  const [anomaly, setAnomaly] = useState<WeatherAnomalyResponse | null>(null)
  const [anomalyLoading, setAnomalyLoading] = useState(false)
  const [anomalyError, setAnomalyError] = useState<string | null>(null)

  // Load parcel list when profile changes
  useEffect(() => {
    setParcelsLoading(true)
    setSelectedParcelId('')
    const url = profileId
      ? `/parcels?per_page=200&profile_id=${profileId}`
      : '/parcels?per_page=200'
    fetchApi<{ items: Parcel[] }>(url)
      .then(data => {
        setParcelList(data.items)
        if (data.items.length > 0) {
          setSelectedParcelId(data.items[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setParcelsLoading(false))
  }, [profileId])

  // Load anomaly data when parcel changes
  useEffect(() => {
    if (!selectedParcelId) return

    const controller = new AbortController()
    setAnomalyLoading(true)
    setAnomalyError(null)
    setAnomaly(null)

    const token = localStorage.getItem('token')
    fetch(`${API_BASE}/weather/anomaly/${selectedParcelId}`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
      signal: controller.signal,
    })
      .then(async res => {
        if (res.status === 401) { window.location.href = '/login'; throw new Error('Unauthorized') }
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json() as Promise<WeatherAnomalyResponse>
      })
      .then(data => {
        setAnomaly(data)
        setAnomalyLoading(false)
      })
      .catch(e => {
        if (e instanceof Error && e.name === 'AbortError') return
        setAnomalyError('კლიმ. ანომალიის მონაცემები ვერ ჩაიტვირთა')
        setAnomalyLoading(false)
      })

    return () => controller.abort()
  }, [selectedParcelId])

  // Prepare chart data with Georgian month labels
  const chartData = (anomaly?.monthly_anomalies ?? []).map(m => ({
    ...m,
    monthLabel: GEO_MONTHS[m.month - 1] ?? String(m.month),
  }))

  const seasonAnomalyPct = anomaly?.season_anomaly_pct ?? 0
  const seasonAnomalyColor =
    seasonAnomalyPct > 15 ? '#2196f3' : seasonAnomalyPct < -15 ? '#ff8f00' : '#8b949e'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-[#58a6ff]" />
            კლიმ. ანომალია
          </h1>
          <p className="text-[#8b949e] mt-1">ნალექი · ტემპერატურა · ნორმასთან შედარება</p>
        </div>
      </div>

      {/* Parcel selector */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#8b949e]">ნაკვეთი</label>
          {parcelsLoading ? (
            <div className="h-9 w-52 rounded-lg bg-[#161b22] border border-[#21262d] animate-pulse" />
          ) : (
            <select
              value={selectedParcelId}
              onChange={e => setSelectedParcelId(e.target.value)}
              className="bg-[#161b22] border border-[#21262d] text-[#e6edf3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#58a6ff]"
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
      </div>

      {/* No parcel */}
      {!selectedParcelId && !parcelsLoading && (
        <div className="flex items-center justify-center py-20 text-[#6e7681] text-sm">
          ნაკვეთი არ არის არჩეული
        </div>
      )}

      {/* Loading */}
      {anomalyLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3 text-[#8b949e]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#21262d] border-t-[#58a6ff]" />
            <span className="text-sm">მონაცემები იტვირთება...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {anomalyError && !anomalyLoading && (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 p-4 text-sm text-red-400">
          {anomalyError}
        </div>
      )}

      {/* Empty */}
      {!anomalyLoading && !anomalyError && selectedParcelId && !anomaly && (
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🌧️</div>
          <div className="text-[#8b949e] text-sm">ანომალიის მონაცემები ვერ მოიძებნა.</div>
        </div>
      )}

      {/* Content */}
      {!anomalyLoading && !anomalyError && anomaly && (
        <>
          {/* Season summary card */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="text-xs text-[#8b949e] mb-2 uppercase tracking-widest">სეზონის შეჯამება · {anomaly.season_start}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-[#6e7681] text-xs mb-1">სეზ. ნალექი</div>
                <div className="text-[#2196f3] font-bold text-lg">{anomaly.season_precip_mm.toFixed(0)} <span className="text-xs font-normal text-[#8b949e]">მმ</span></div>
              </div>
              <div className="text-center">
                <div className="text-[#6e7681] text-xs mb-1">ნორმა</div>
                <div className="text-[#8b949e] font-bold text-lg">{anomaly.season_normal_mm.toFixed(0)} <span className="text-xs font-normal">მმ</span></div>
              </div>
              <div className="text-center">
                <div className="text-[#6e7681] text-xs mb-1">ანომ. %</div>
                <div className="font-bold text-lg" style={{ color: seasonAnomalyColor }}>
                  {anomalySign(seasonAnomalyPct)}{Math.abs(seasonAnomalyPct).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-[#6e7681] text-xs mb-1">სტატუსი</div>
                <div
                  className="inline-block px-2 py-0.5 rounded text-sm font-medium"
                  style={{
                    background: seasonAnomalyPct > 15 ? '#2196f333' : seasonAnomalyPct < -15 ? '#ff8f0033' : '#8b949e22',
                    color: seasonAnomalyColor,
                  }}
                >
                  {seasonAnomalyPct > 15 ? 'სველი' : seasonAnomalyPct < -15 ? 'მშრალი' : 'ნორმ.'}
                </div>
              </div>
            </div>
          </div>

          {/* Charts — side by side on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chart 1 — Precipitation anomaly */}
            <ChartCard title="ნალექი (მმ)">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="monthLabel" tick={axisTickStyle} />
                  <YAxis
                    tick={axisTickStyle}
                    label={{ value: 'მმ', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle.contentStyle}
                    labelStyle={chartTooltipStyle.labelStyle}
                    itemStyle={chartTooltipStyle.itemStyle}
                    formatter={(v: unknown) => v == null ? '—' : `${Number(v).toFixed(1)} მმ`}
                  />
                  <Legend wrapperStyle={{ color: '#8b949e', fontSize: 12 }} />
                  <Bar dataKey="precip_actual_mm" name="ფაქტ. ნალექი" maxBarSize={28} isAnimationActive={false}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={precipBarColor(entry.precip_label)} />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="precip_normal_mm"
                    stroke="#8b949e"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    dot={false}
                    name="ნორმა"
                    isAnimationActive={false}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Chart 2 — Temperature anomaly */}
            <ChartCard title="ტემპ. ანომალია (°C)">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="monthLabel" tick={axisTickStyle} />
                  <YAxis
                    tick={axisTickStyle}
                    label={{ value: '°C', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle.contentStyle}
                    labelStyle={chartTooltipStyle.labelStyle}
                    itemStyle={chartTooltipStyle.itemStyle}
                    formatter={(v: unknown) => v == null ? '—' : `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)}°C`}
                  />
                  <Legend wrapperStyle={{ color: '#8b949e', fontSize: 12 }} />
                  <Bar dataKey="t_anomaly_c" name="ტ° ანომ." maxBarSize={28} isAnimationActive={false}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={tempAnomalyColor(entry.t_anomaly_c)} />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="t_normal_c"
                    stroke="#8b949e"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    dot={false}
                    name="ნორმ. ტ°"
                    isAnimationActive={false}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Summary table */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#21262d]">
              <h3 className="text-[#e6edf3] font-semibold text-sm">თვიური ანომალია — დეტალები</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    <th className="px-4 py-3 text-left text-[#8b949e] font-medium">თვე</th>
                    <th className="px-4 py-3 text-right text-[#8b949e] font-medium">ნალ. ფაქტ.</th>
                    <th className="px-4 py-3 text-right text-[#8b949e] font-medium">ნალ. ნორმ.</th>
                    <th className="px-4 py-3 text-right text-[#8b949e] font-medium">ანომ.%</th>
                    <th className="px-4 py-3 text-center text-[#8b949e] font-medium">ნალ.</th>
                    <th className="px-4 py-3 text-right text-[#8b949e] font-medium">ტ° ფაქტ.</th>
                    <th className="px-4 py-3 text-right text-[#8b949e] font-medium">ტ° ნორმ.</th>
                    <th className="px-4 py-3 text-right text-[#8b949e] font-medium">ტ° ანომ.</th>
                    <th className="px-4 py-3 text-center text-[#8b949e] font-medium">ტ°</th>
                  </tr>
                </thead>
                <tbody>
                  {anomaly.monthly_anomalies.map((m, i) => (
                    <tr key={i} className="border-b border-[#21262d] hover:bg-[#21262d]/50 transition-colors">
                      <td className="px-4 py-2.5 text-[#e6edf3] font-semibold">
                        {GEO_MONTHS[m.month - 1]}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#2196f3]">{m.precip_actual_mm.toFixed(1)} მმ</td>
                      <td className="px-4 py-2.5 text-right text-[#8b949e]">{m.precip_normal_mm.toFixed(1)} მმ</td>
                      <td className="px-4 py-2.5 text-right" style={{ color: precipBarColor(m.precip_label) }}>
                        {fmtNum(m.precip_anomaly_pct, 1, '%')}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium" style={labelBadgeStyle(m.precip_label)}>
                          {labelText(m.precip_label)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#e6edf3]">{m.t_actual_c.toFixed(1)}°C</td>
                      <td className="px-4 py-2.5 text-right text-[#8b949e]">{m.t_normal_c.toFixed(1)}°C</td>
                      <td className="px-4 py-2.5 text-right" style={{ color: tempAnomalyColor(m.t_anomaly_c) }}>
                        {fmtNum(m.t_anomaly_c, 1, '°C')}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium" style={labelBadgeStyle(m.t_label)}>
                          {labelText(m.t_label)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calibration note */}
          {anomaly.calibration_note && (
            <p className="text-xs text-[#6e7681] px-1">
              {anomaly.calibration_note}
            </p>
          )}
        </>
      )}
    </div>
  )
}
