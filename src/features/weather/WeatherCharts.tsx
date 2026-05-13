import React, { useState, useEffect } from 'react'
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
import { parcels as parcelsApi, WeatherParcelRow } from '@/shared/lib/api'
import type { Parcel, PaginatedResponse } from '@/shared/lib/api'
import { useProfileStore } from '@/shared/stores'

// Georgian month abbreviations
const GEO_MONTHS = [
  'იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ',
  'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ',
]

function fmtDate(s: string): string {
  const d = new Date(s)
  return `${d.getDate()} ${GEO_MONTHS[d.getMonth()]}`
}

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
  // Sort ascending
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
    const conf_lo =
      uncertainty != null && row.t_avg != null ? row.t_avg - uncertainty : null
    const conf_band = uncertainty != null ? uncertainty * 2 : null

    const disease_risk_norm =
      row.disease_risk != null ? row.disease_risk / 3 : null

    return {
      ...row,
      t_band_hist,
      t_min_hist,
      t_band_fore,
      t_min_fore,
      t_avg_hist,
      t_avg_fore,
      precip_hist,
      precip_fore,
      cum_gdd: cumGdd,
      conf_lo,
      conf_band,
      disease_risk_norm,
    }
  })
}

const chartTooltipStyle = {
  contentStyle: {
    background: '#161b22',
    border: '1px solid #21262d',
    borderRadius: 8,
  },
  labelStyle: { color: '#e6edf3' },
  itemStyle: { color: '#8b949e' },
}

function tempFormatter(v: unknown): string {
  if (v == null) return '—'
  return `${Number(v).toFixed(1)}°C`
}

function mmFormatter(v: unknown): string {
  if (v == null) return '—'
  return `${Number(v).toFixed(1)} mm`
}

function gddFormatter(v: unknown): string {
  if (v == null) return '—'
  return `${Number(v).toFixed(0)} GDD`
}

function riskFormatter(v: unknown): string {
  if (v == null) return '—'
  return Number(v).toFixed(2)
}

const axisTickStyle = { fill: '#8b949e', fontSize: 11 }

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
      <div className="text-sm font-semibold text-[#e6edf3] mb-3">{title}</div>
      {children}
    </div>
  )
}

export default function WeatherCharts(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [selectedParcelId, setSelectedParcelId] = useState<string>('')
  const [daysBack, setDaysBack] = useState<DaysBack>(30)
  const [wxData, setWxData] = useState<ProcessedRow[]>([])
  const [wxLoading, setWxLoading] = useState(false)
  const [wxError, setWxError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  // Load parcels
  const {
    data: parcelsData,
    loading: parcelsLoading,
    error: parcelsError,
  } = useApi<PaginatedResponse<Parcel>>(() => parcelsApi.list(1, 200, undefined, profileId), [profileId])

  const parcelList: Parcel[] = parcelsData?.items ?? []

  // Reset parcel selection on profile change
  useEffect(() => {
    setSelectedParcelId('')
  }, [profileId])

  // Auto-select first parcel
  useEffect(() => {
    if (parcelList.length > 0 && !selectedParcelId) {
      setSelectedParcelId(parcelList[0].id)
    }
  }, [parcelList, selectedParcelId])

  // Fetch weather data when parcel or days change
  useEffect(() => {
    if (!selectedParcelId) return

    const token = localStorage.getItem('token')
    const controller = new AbortController()

    setWxLoading(true)
    setWxError(null)
    setWxData([])

    fetch(
      `/api/v1/weather/${selectedParcelId}?days_back=${daysBack}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      }
    )
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Request failed' }))
          throw new Error(err.detail || 'Request failed')
        }
        return res.json() as Promise<WeatherParcelRow[]>
      })
      .then((rows) => {
        setWxData(processRows(rows))
        setWxLoading(false)
      })
      .catch((e) => {
        if (e instanceof Error && e.name === 'AbortError') return
        setWxError(e instanceof Error ? e.message : 'Unknown error')
        setWxLoading(false)
      })

    return () => controller.abort()
  }, [selectedParcelId, daysBack])

  const selectedParcel = parcelList.find((p) => p.id === selectedParcelId)

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">🌦️ ამინდის ანალიზი</h1>
        <p className="text-sm text-[#8b949e]">
          ტემპერატურა · ნალექი · GDD · დაავადების რისკი
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Parcel dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#8b949e]">ნაკვეთი</label>
          {parcelsLoading ? (
            <div className="h-9 w-48 rounded-lg bg-[#161b22] border border-[#21262d] animate-pulse" />
          ) : parcelsError ? (
            <span className="text-xs text-red-400">შეცდომა: {parcelsError}</span>
          ) : (
            <select
              value={selectedParcelId}
              onChange={(e) => setSelectedParcelId(e.target.value)}
              className="bg-[#161b22] border border-[#21262d] text-[#e6edf3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#58a6ff]"
            >
              {parcelList.length === 0 && (
                <option value="">ნაკვეთი არ მოიძებნა</option>
              )}
              {parcelList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parcel_nr || p.parcel_nr} ({p.area_ha?.toFixed(1)} ჰა)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Days-back buttons */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#8b949e]">პერიოდი</label>
          <div className="flex gap-1">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDaysBack(d)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  daysBack === d
                    ? 'bg-[#58a6ff] border-[#58a6ff] text-white font-semibold'
                    : 'bg-[#161b22] border-[#21262d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#58a6ff]'
                }`}
              >
                {d}დ
              </button>
            ))}
          </div>
        </div>

        {/* Parcel info badge */}
        {selectedParcel && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border border-[#21262d] rounded-lg">
            <span className="text-xs text-[#8b949e]">კულტურა:</span>
            <span className="text-xs text-[#e6edf3] font-medium">
              {selectedParcel.crop_type || '—'}
            </span>
            {selectedParcel.latest_zone && (
              <>
                <span className="text-xs text-[#6e7681]">|</span>
                <span className="text-xs text-[#8b949e]">ზონა:</span>
                <span className="text-xs text-[#e6edf3] font-medium capitalize">
                  {selectedParcel.latest_zone}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {wxLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3 text-[#8b949e]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#21262d] border-t-[#58a6ff]" />
            <span className="text-sm">მონაცემები იტვირთება...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {wxError && !wxLoading && (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 p-4 text-sm text-red-400">
          შეცდომა: {wxError}
        </div>
      )}

      {/* Empty state — no parcel selected */}
      {!selectedParcelId && !parcelsLoading && (
        <div className="flex items-center justify-center py-16 text-[#6e7681] text-sm">
          აირჩიეთ ნაკვეთი ამინდის ჩარტების სანახავად
        </div>
      )}

      {/* Empty state — no data */}
      {!wxLoading && !wxError && selectedParcelId && wxData.length === 0 && (
        <div className="flex items-center justify-center py-16 text-[#6e7681] text-sm">
          ამინდის მონაცემები ვერ მოიძებნა არჩეული ნაკვეთისთვის
        </div>
      )}

      {/* Charts */}
      {!wxLoading && !wxError && wxData.length > 0 && (
        <div className="space-y-3">
          {/* Chart 1 — Temperature */}
          <ChartCard title="🌡️ ტემპერატურა (°C)">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart
                data={wxData}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="wx_date"
                  tickFormatter={fmtDate}
                  interval={4}
                  tick={axisTickStyle}
                />
                <YAxis
                  label={{
                    value: '°C',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#8b949e',
                    fontSize: 11,
                  }}
                  tick={axisTickStyle}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle.contentStyle}
                  labelStyle={chartTooltipStyle.labelStyle}
                  itemStyle={chartTooltipStyle.itemStyle}
                  formatter={tempFormatter}
                  labelFormatter={fmtDate}
                />
                <ReferenceLine
                  x={today}
                  stroke="#fbc02d"
                  strokeDasharray="5 5"
                  label={{
                    value: 'დღეს',
                    position: 'top',
                    fill: '#fbc02d',
                    fontSize: 10,
                  }}
                />
                {/* Historical t-band */}
                <Area
                  type="monotone"
                  dataKey="t_min_hist"
                  stackId="hist"
                  stroke="none"
                  fill="transparent"
                  legendType="none"
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="t_band_hist"
                  stackId="hist"
                  stroke="none"
                  fill="rgba(33,150,243,0.2)"
                  name="t min-max (ისტ.)"
                  isAnimationActive={false}
                  connectNulls={false}
                />
                {/* Forecast confidence band */}
                <Area
                  type="monotone"
                  dataKey="conf_lo"
                  stackId="fore"
                  stroke="none"
                  fill="transparent"
                  legendType="none"
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="conf_band"
                  stackId="fore"
                  stroke="none"
                  fill="rgba(211,47,47,0.15)"
                  legendType="none"
                  isAnimationActive={false}
                  connectNulls={false}
                />
                {/* Historical t_avg */}
                <Line
                  type="monotone"
                  dataKey="t_avg_hist"
                  stroke="#2196f3"
                  strokeWidth={2}
                  dot={false}
                  name="t_avg (ისტ.)"
                  isAnimationActive={false}
                  connectNulls={false}
                />
                {/* Forecast t_avg */}
                <Line
                  type="monotone"
                  dataKey="t_avg_fore"
                  stroke="#ef5350"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  name="პროგნოზი"
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Legend wrapperStyle={{ color: '#8b949e', fontSize: 12 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 2 — Precipitation vs ETo */}
          <ChartCard title="💧 ნალექი vs ETo (mm)">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart
                data={wxData}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="wx_date"
                  tickFormatter={fmtDate}
                  interval={4}
                  tick={axisTickStyle}
                />
                <YAxis
                  label={{
                    value: 'mm',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#8b949e',
                    fontSize: 11,
                  }}
                  tick={axisTickStyle}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle.contentStyle}
                  labelStyle={chartTooltipStyle.labelStyle}
                  itemStyle={chartTooltipStyle.itemStyle}
                  formatter={mmFormatter}
                  labelFormatter={fmtDate}
                />
                <ReferenceLine
                  x={today}
                  stroke="#fbc02d"
                  strokeDasharray="5 5"
                  label={{
                    value: 'დღეს',
                    position: 'top',
                    fill: '#fbc02d',
                    fontSize: 10,
                  }}
                />
                <Bar
                  dataKey="precip_hist"
                  fill="#1976d2"
                  name="ნალექი (ისტ.)"
                  maxBarSize={14}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="precip_fore"
                  fill="#ef9a9a"
                  name="ნალ. პრ."
                  maxBarSize={14}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="eto_mm"
                  stroke="#ff8f00"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                  name="ETo"
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Legend wrapperStyle={{ color: '#8b949e', fontSize: 12 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 3 — GDD + Disease Risk */}
          <ChartCard title="🌱 GDD + დაავადების რისკი">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart
                data={wxData}
                margin={{ top: 8, right: 40, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="wx_date"
                  tickFormatter={fmtDate}
                  interval={4}
                  tick={axisTickStyle}
                />
                <YAxis
                  yAxisId="gdd"
                  label={{
                    value: 'კუმ. GDD',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#4caf50',
                    fontSize: 11,
                  }}
                  tick={{ fill: '#4caf50', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="risk"
                  orientation="right"
                  domain={[0, 1]}
                  label={{
                    value: 'რისკი 0-1',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#ef5350',
                    fontSize: 11,
                  }}
                  tick={{ fill: '#ef5350', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle.contentStyle}
                  labelStyle={chartTooltipStyle.labelStyle}
                  itemStyle={chartTooltipStyle.itemStyle}
                  formatter={(v: unknown, name: string) => {
                    if (name === 'კუმ. GDD') return gddFormatter(v)
                    return riskFormatter(v)
                  }}
                  labelFormatter={fmtDate}
                />
                <Area
                  yAxisId="gdd"
                  type="monotone"
                  dataKey="cum_gdd"
                  stroke="#4caf50"
                  fill="rgba(76,175,80,0.2)"
                  strokeWidth={2}
                  dot={false}
                  name="კუმ. GDD"
                  isAnimationActive={false}
                  connectNulls
                />
                <Bar
                  yAxisId="risk"
                  dataKey="disease_risk_norm"
                  fill="rgba(239,83,80,0.7)"
                  maxBarSize={10}
                  name="დაავ. რისკი"
                  isAnimationActive={false}
                />
                <Legend wrapperStyle={{ color: '#8b949e', fontSize: 12 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  )
}
