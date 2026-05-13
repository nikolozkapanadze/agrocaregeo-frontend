import React, { useState, useEffect, useMemo } from 'react'
import { Droplets, ChevronDown, ChevronRight } from 'lucide-react'
import { agronomic } from '@/shared/lib/api'
import { useProfileStore } from '@/shared/stores'

// ─── types ────────────────────────────────────────────────────────────────────

interface DailyBalanceRow {
  date: string
  eto_mm: number
  etc_mm: number
  kc: number
  precip_mm: number
  precip_eff_mm: number
  deficit_mm: number
  cum_deficit_mm: number
}

interface IrrigationRow {
  parcel_nr: string
  area_ha: number
  crop_status: string
  has_irrigation: boolean
  texture_class: string
  advice: string
  depletion_mm: number
  taw_mm: number
  raw_mm: number
  kc: number
  root_depth_m: number
  irrigation_need: boolean
  recommended_mm: number
  etc_total_mm: number
  precip_eff_mm: number
  daily_balance: DailyBalanceRow[]
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, dec = 1, fallback = '—'): string {
  return v != null ? v.toFixed(dec) : fallback
}

function depletionColor(depletion: number, raw: number): string {
  if (raw <= 0) return '#8b949e'
  const pct = depletion / raw
  if (pct < 0.5) return '#388e3c'
  if (pct <= 1) return '#fbc02d'
  return '#d32f2f'
}

function depletionBarPct(depletion: number, raw: number): number {
  if (raw <= 0) return 0
  return Math.min(100, Math.round((depletion / raw) * 100))
}

const GEO_MONTHS = [
  'იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ',
  'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ',
]

function shortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} ${GEO_MONTHS[d.getMonth()]}`
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: React.ReactNode
  label: string
  value: string
  unit: string
  highlight?: boolean
}

function SummaryCard({ icon, label, value, unit, highlight }: SummaryCardProps): React.ReactElement {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-text-secondary text-xs mb-1">{label}</div>
      <div
        className="font-bold text-xl"
        style={{ color: highlight ? '#d32f2f' : '#58a6ff' }}
      >
        {value}{' '}
        <span className="text-sm font-normal text-text-secondary">{unit}</span>
      </div>
    </div>
  )
}

interface ExpandedRowProps {
  balance: DailyBalanceRow[]
}

function ExpandedRow({ balance }: ExpandedRowProps): React.ReactElement {
  if (balance.length === 0) {
    return (
      <div className="px-4 py-3 text-xs text-[#6e7681]">ყოველდღიური ბალანსი არ არის</div>
    )
  }
  return (
    <div className="overflow-x-auto bg-bg-primary border-t border-white/[0.08]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.08]">
            {['თარიღი', 'ETo mm', 'ETc mm', 'Kc', 'წვიმა mm', 'ეფ. წვ.', 'დეფიციტი', 'კუმ. დეფ.'].map(
              (h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-[#6e7681] font-medium whitespace-nowrap"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {balance.map((row) => (
            <tr key={row.date} className="border-b border-white/[0.05] hover:bg-white/[0.03]">
              <td className="px-3 py-1.5 text-text-secondary whitespace-nowrap">
                {shortDate(row.date)}
              </td>
              <td className="px-3 py-1.5 text-text-primary">{fmt(row.eto_mm)}</td>
              <td className="px-3 py-1.5 text-text-primary">{fmt(row.etc_mm)}</td>
              <td className="px-3 py-1.5 text-text-secondary">{fmt(row.kc, 2)}</td>
              <td className="px-3 py-1.5 text-[#42a5f5]">{fmt(row.precip_mm)}</td>
              <td className="px-3 py-1.5 text-[#1976d2]">{fmt(row.precip_eff_mm)}</td>
              <td
                className="px-3 py-1.5 font-medium"
                style={{ color: row.deficit_mm < 0 ? '#d32f2f' : '#388e3c' }}
              >
                {fmt(row.deficit_mm)}
              </td>
              <td
                className="px-3 py-1.5 font-medium"
                style={{ color: row.cum_deficit_mm < 0 ? '#d32f2f' : '#388e3c' }}
              >
                {fmt(row.cum_deficit_mm)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function IrrigationSchedule(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [rows, setRows] = useState<IrrigationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<'depletion_mm' | 'recommended_mm'>('depletion_mm')

  useEffect(() => {
    setLoading(true)
    setError(null)
    agronomic.irrigation(profileId)
      .then((data) => setRows(data))
      .catch(() => setError('სარწყავი გრაფიკის მონაცემები ვერ ჩაიტვირთა'))
      .finally(() => setLoading(false))
  }, [profileId])

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => b[sortKey] - a[sortKey])
  }, [rows, sortKey])

  const needCount = rows.filter((r) => r.irrigation_need).length

  const totalWaterM3 = rows.reduce(
    (sum, r) => sum + (r.irrigation_need ? r.recommended_mm * r.area_ha * 10 : 0),
    0
  )

  const avgDepletionPct = useMemo(() => {
    const valid = rows.filter((r) => r.raw_mm > 0)
    if (valid.length === 0) return 0
    const avg = valid.reduce((s, r) => s + (r.depletion_mm / r.raw_mm) * 100, 0) / valid.length
    return Math.round(avg)
  }, [rows])

  function toggleRow(code: string): void {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <Droplets className="h-6 w-6 text-[#58a6ff]" />
          სარწყავი გრაფიკი
        </h1>
        <p className="mt-1 text-text-secondary">FAO-56 ნიადაგის წყლის ბალანსი</p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 text-text-secondary">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#58a6ff]" />
            <span className="text-sm">სარწყავი მონაცემები იტვირთება...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && rows.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">💧</div>
          <div className="text-text-secondary">სარწყავი მონაცემი არ არის</div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && rows.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              icon="🚿"
              label="სარწყავი ნაკვეთები"
              value={String(needCount)}
              unit={`/ ${rows.length}`}
              highlight={needCount > 0}
            />
            <SummaryCard
              icon="💧"
              label="სულ საჭირო წყალი"
              value={totalWaterM3.toFixed(0)}
              unit="m³"
            />
            <SummaryCard
              icon="📉"
              label="საშ. ამოწვნა RAW-დან"
              value={String(avgDepletionPct)}
              unit="%"
              highlight={avgDepletionPct > 80}
            />
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-text-secondary">დალაგება:</span>
            {(
              [
                { key: 'depletion_mm', label: 'ამოწვნა ↓' },
                { key: 'recommended_mm', label: 'დოზა ↓' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  sortKey === key
                    ? 'bg-accent border-accent text-bg-primary'
                    : 'bg-bg-card border-white/[0.08] text-text-secondary hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Main table */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium w-8" />
                    <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium whitespace-nowrap">
                      ნაკვეთი
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium whitespace-nowrap">
                      ფაზა
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium whitespace-nowrap">
                      ნიადაგი
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-text-secondary font-medium">
                      Kc
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium whitespace-nowrap">
                      ამოწ. mm
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-text-secondary font-medium whitespace-nowrap">
                      RAW
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-text-secondary font-medium whitespace-nowrap">
                      სარწყ.?
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-text-secondary font-medium whitespace-nowrap">
                      დოზა mm
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium">
                      რჩევა
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-text-secondary font-medium">
                      ☁️/💧
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, idx) => {
                    const isExpanded = expandedRows.has(row.parcel_nr)
                    const dColor = depletionColor(row.depletion_mm, row.raw_mm)
                    const dPct = depletionBarPct(row.depletion_mm, row.raw_mm)
                    const truncatedAdvice =
                      row.advice.length > 50
                        ? `${row.advice.slice(0, 50)}…`
                        : row.advice

                    return (
                      <React.Fragment key={row.parcel_nr}>
                        <tr
                          className={`border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors cursor-pointer ${
                            idx % 2 === 1 ? 'bg-bg-primary/20' : ''
                          }`}
                          onClick={() => toggleRow(row.parcel_nr)}
                        >
                          {/* Expand toggle */}
                          <td className="px-4 py-3 text-[#6e7681]">
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </td>

                          {/* Parcel */}
                          <td className="px-4 py-3 text-text-primary font-medium whitespace-nowrap">
                            {row.parcel_nr}
                            <span className="ml-1 text-xs text-[#6e7681]">
                              {row.area_ha.toFixed(1)} ჰა
                            </span>
                          </td>

                          {/* Crop status */}
                          <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                            {row.crop_status || '—'}
                          </td>

                          {/* Texture */}
                          <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                            {row.texture_class || '—'}
                          </td>

                          {/* Kc */}
                          <td className="px-4 py-3 text-center text-text-secondary text-xs">
                            {fmt(row.kc, 2)}
                          </td>

                          {/* Depletion with bar */}
                          <td className="px-4 py-3 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-white/[0.08] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${dPct}%`,
                                    backgroundColor: dColor,
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs font-medium whitespace-nowrap"
                                style={{ color: dColor }}
                              >
                                {fmt(row.depletion_mm, 1)}
                              </span>
                            </div>
                          </td>

                          {/* RAW */}
                          <td className="px-4 py-3 text-center text-xs text-text-secondary">
                            {fmt(row.raw_mm, 1)}
                          </td>

                          {/* Irrigation need */}
                          <td className="px-4 py-3 text-center">
                            {row.irrigation_need ? (
                              <span className="text-xs bg-red-900/30 text-red-400 border border-red-800/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                ✅ სჭ.
                              </span>
                            ) : (
                              <span className="text-xs bg-green-900/20 text-[#388e3c] border border-green-900/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                                ❌ არ სჭ.
                              </span>
                            )}
                          </td>

                          {/* Recommended dose */}
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-sm ${
                                row.recommended_mm > 0
                                  ? 'font-bold text-[#58a6ff]'
                                  : 'text-[#6e7681]'
                              }`}
                            >
                              {row.recommended_mm > 0 ? fmt(row.recommended_mm, 1) : '—'}
                            </span>
                          </td>

                          {/* Advice */}
                          <td
                            className="px-4 py-3 text-xs text-text-secondary max-w-[200px]"
                            title={row.advice}
                          >
                            {truncatedAdvice || '—'}
                          </td>

                          {/* Has irrigation icon */}
                          <td className="px-4 py-3 text-center text-base">
                            {row.has_irrigation ? '💧' : '🌧️'}
                          </td>
                        </tr>

                        {/* Expanded daily balance */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={11} className="p-0">
                              <ExpandedRow balance={row.daily_balance} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend note */}
          <div className="flex flex-wrap gap-4 text-xs text-[#6e7681]">
            <span>
              <span
                className="inline-block w-3 h-1.5 rounded-full mr-1"
                style={{ backgroundColor: '#388e3c', verticalAlign: 'middle' }}
              />
              ამოწვნა &lt;50% RAW — კარგი
            </span>
            <span>
              <span
                className="inline-block w-3 h-1.5 rounded-full mr-1"
                style={{ backgroundColor: '#fbc02d', verticalAlign: 'middle' }}
              />
              50–100% RAW — ყურადღება
            </span>
            <span>
              <span
                className="inline-block w-3 h-1.5 rounded-full mr-1"
                style={{ backgroundColor: '#d32f2f', verticalAlign: 'middle' }}
              />
              &gt;100% RAW — სარწყავია
            </span>
            <span className="ml-auto">
              💧 = სარწყავი სისტემა · 🌧️ = წვიმაზეა დამოკიდებული · დააჭირეთ მწკრივს დეტალებისთვის
            </span>
          </div>
        </>
      )}
    </div>
  )
}
