import React, { useEffect, useState } from 'react'
import { Sprout } from 'lucide-react'
import { agronomic, YieldForecastRow } from '@/shared/lib/api'
import { useProfileStore } from '@/shared/stores'

// ── helpers ───────────────────────────────────────────────────────────────

const CONFIDENCE_COLOR: Record<YieldForecastRow['confidence'], string> = {
  high:   '#388e3c',
  medium: '#fbc02d',
  low:    '#d32f2f',
}

const CONFIDENCE_BG: Record<YieldForecastRow['confidence'], string> = {
  high:   '#388e3c22',
  medium: '#fbc02d22',
  low:    '#d32f2f22',
}

function factorColor(value: number): string {
  if (value >= 0.8) return '#388e3c'
  if (value >= 0.5) return '#fbc02d'
  return '#d32f2f'
}

function FactorBar({ value }: { value: number }): React.ReactElement {
  const color = factorColor(value)
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-1" title={`${pct}%`}>
      <div className="h-2 w-10 overflow-hidden rounded-full bg-bg-border">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px]" style={{ color }}>
        {value.toFixed(2)}
      </span>
    </div>
  )
}

type SortDir = 'asc' | 'desc'

// ── main component ────────────────────────────────────────────────────────

export default function YieldForecast(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [data, setData] = useState<YieldForecastRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    setLoading(true)
    agronomic
      .yieldForecast(profileId)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [profileId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
        <span className="ml-3 text-text-secondary">მოსავლიანობის პროგნოზი იტვირთება...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-zone-critical/40 bg-zone-critical/10 p-4 text-sm text-zone-critical">
        შეცდომა: {error}
      </div>
    )
  }

  // ── computed stats ──
  const avgYield =
    data.length > 0
      ? data.reduce((s, r) => s + r.yield_t_ha, 0) / data.length
      : 0
  const totalTonnes = data.reduce((s, r) => s + r.yield_total_t, 0)
  const highConfCount = data.filter((r) => r.confidence === 'high').length

  // ── sorted rows ──
  const sorted = [...data].sort((a, b) =>
    sortDir === 'desc' ? b.yield_t_ha - a.yield_t_ha : a.yield_t_ha - b.yield_t_ha
  )

  function toggleSort(): void {
    setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Page title */}
      <div className="flex items-center gap-2">
        <Sprout className="h-5 w-5 text-accent" />
        <div>
          <h1 className="text-xl font-bold text-text-primary">მოსავლიანობის პროგნოზი</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            სატელიტური ინდექსები + ამინდი + მინერალური მდგომარეობა
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-bg-card p-3 text-center">
          <div className="text-2xl font-bold text-text-primary">{data.length}</div>
          <div className="text-xs text-text-muted">სულ ნაკვეთი</div>
        </div>
        <div className="rounded-lg bg-bg-card p-3 text-center">
          <div className="text-2xl font-bold text-accent">{avgYield.toFixed(2)}</div>
          <div className="text-xs text-text-muted">საშ. მოსავალი ტ/ჰა</div>
        </div>
        <div className="rounded-lg bg-bg-card p-3 text-center">
          <div className="text-2xl font-bold text-text-primary">{totalTonnes.toFixed(1)}</div>
          <div className="text-xs text-text-muted">სულ ტონა</div>
        </div>
        <div className="rounded-lg bg-zone-ok/10 p-3 text-center">
          <div className="text-2xl font-bold text-zone-ok">{highConfCount}</div>
          <div className="text-xs text-text-muted">მაღალი სიზუსტე</div>
        </div>
      </div>

      {/* Table or empty state */}
      {data.length === 0 ? (
        <div className="rounded-lg bg-bg-card p-8 text-center text-text-secondary">
          მოსავლიანობის მონაცემი არ არის
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-bg-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-card">
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  ნაკვეთი
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  ფართობი
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  სარწყავი
                </th>
                <th
                  className="cursor-pointer select-none px-3 py-3 text-left text-xs font-semibold text-text-muted hover:text-text-primary"
                  onClick={toggleSort}
                >
                  მოსავალი {sortDir === 'desc' ? '▼' : '▲'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  სულ
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  შემოსავალი
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  ფაქტორები
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  განმარტება
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => {
                const confColor = CONFIDENCE_COLOR[row.confidence]
                const confBg = CONFIDENCE_BG[row.confidence]
                const shortExp =
                  row.explanation.length > 60
                    ? row.explanation.slice(0, 60) + '…'
                    : row.explanation

                return (
                  <tr
                    key={`${row.parcel_nr}-${idx}`}
                    className="border-b border-bg-border transition-colors hover:bg-bg-card/60"
                  >
                    {/* ნაკვეთი */}
                    <td className="px-3 py-3">
                      <div className="font-semibold text-text-primary">{row.parcel_nr}</div>
                      {row.parcel_nr !== row.parcel_nr && (
                        <div className="text-[11px] text-text-muted">{row.parcel_nr}</div>
                      )}
                    </td>

                    {/* ფართობი */}
                    <td className="px-3 py-3 text-text-secondary">
                      {row.area_ha.toFixed(1)} ჰა
                    </td>

                    {/* სარწყავი (confidence badge) */}
                    <td className="px-3 py-3">
                      <span
                        className="rounded px-2 py-0.5 text-[11px] font-semibold"
                        style={{ background: confBg, color: confColor }}
                      >
                        {row.confidence_ge}
                      </span>
                    </td>

                    {/* მოსავალი */}
                    <td className="px-3 py-3 font-semibold text-text-primary">
                      {row.yield_t_ha.toFixed(2)} ტ/ჰა
                    </td>

                    {/* სულ */}
                    <td className="px-3 py-3 text-text-secondary">
                      {row.yield_total_t.toFixed(1)} ტ
                    </td>

                    {/* შემოსავალი */}
                    <td className="px-3 py-3 text-text-secondary">
                      {row.revenue_gel != null
                        ? `${row.revenue_gel.toFixed(0)} ₾`
                        : '—'}
                    </td>

                    {/* ფაქტორები */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-text-muted">
                          <span className="w-10">NDVI</span>
                          <FactorBar value={row.factors.f_ndvi} />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-text-muted">
                          <span className="w-10">წყალი</span>
                          <FactorBar value={row.factors.f_water} />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-text-muted">
                          <span className="w-10">GDD</span>
                          <FactorBar value={row.factors.f_gdd} />
                        </div>
                      </div>
                    </td>

                    {/* განმარტება */}
                    <td
                      className="max-w-xs px-3 py-3 text-xs text-text-secondary"
                      title={row.explanation}
                    >
                      {shortExp}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
