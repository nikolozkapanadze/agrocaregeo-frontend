import React, { useEffect, useState } from 'react'
import { DollarSign } from 'lucide-react'
import { agronomic, EconomicsRow } from '@/shared/lib/api'
import { useProfileStore } from '@/shared/stores'

// ── MVP badge helpers ─────────────────────────────────────────────────────

interface MvpBadgeProps {
  mvp: number | null
}

function MvpBadge({ mvp }: MvpBadgeProps): React.ReactElement {
  if (mvp === null) {
    return (
      <span className="rounded px-2 py-0.5 text-[11px] font-semibold"
        style={{ background: '#8b949e22', color: '#8b949e' }}>
        უცნობი
      </span>
    )
  }
  if (mvp >= 2.0) {
    return (
      <span className="rounded px-2 py-0.5 text-[11px] font-semibold"
        style={{ background: '#388e3c22', color: '#388e3c' }}>
        ძლ.მომგ.
      </span>
    )
  }
  if (mvp >= 1.3) {
    return (
      <span className="rounded px-2 py-0.5 text-[11px] font-semibold"
        style={{ background: '#58a6ff22', color: '#58a6ff' }}>
        მომგ.
      </span>
    )
  }
  if (mvp >= 1.0) {
    return (
      <span className="rounded px-2 py-0.5 text-[11px] font-semibold"
        style={{ background: '#fbc02d22', color: '#fbc02d' }}>
        ოდნ.
      </span>
    )
  }
  return (
    <span className="rounded px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: '#d32f2f22', color: '#d32f2f' }}>
      ზარ.
    </span>
  )
}

function gelColor(value: number | null): string {
  if (value === null) return '#8b949e'
  if (value < 0) return '#d32f2f'
  return '#388e3c'
}

// ── main component ────────────────────────────────────────────────────────

export default function Economics(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [data, setData] = useState<EconomicsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    agronomic
      .economics(profileId)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [profileId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
        <span className="ml-3 text-text-secondary">ეკონომიკური ანალიზი იტვირთება...</span>
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
  const totalFertCost = data.reduce((s, r) => s + r.fert_cost_season_gel, 0)
  const totalRevenueGain = data.reduce((s, r) => s + r.yield_gain_revenue_gel, 0)
  const mvpValues = data.map((r) => r.mvp).filter((v): v is number => v !== null)
  const avgMvp = mvpValues.length > 0
    ? mvpValues.reduce((s, v) => s + v, 0) / mvpValues.length
    : null
  const profitableCount = data.filter((r) => r.mvp !== null && r.mvp >= 1.5).length

  // ── sorted by MVP descending (null last) ──
  const sorted = [...data].sort((a, b) => {
    if (a.mvp === null && b.mvp === null) return 0
    if (a.mvp === null) return 1
    if (b.mvp === null) return -1
    return b.mvp - a.mvp
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Page title */}
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-accent" />
        <div>
          <h1 className="text-xl font-bold text-text-primary">ეკონომიკური ანალიზი</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            სასუქის ხარჯი · MVP · ROI რჩევა · მარჟა
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-bg-card p-3 text-center">
          <div className="text-2xl font-bold text-zone-critical">
            {totalFertCost.toFixed(0)} ₾
          </div>
          <div className="text-xs text-text-muted">სასუქის ხარჯი სეზ.</div>
        </div>
        <div className="rounded-lg bg-bg-card p-3 text-center">
          <div className="text-2xl font-bold text-zone-ok">
            {totalRevenueGain.toFixed(0)} ₾
          </div>
          <div className="text-xs text-text-muted">მოსავლის მოგება</div>
        </div>
        <div className="rounded-lg bg-bg-card p-3 text-center">
          <div className="text-2xl font-bold text-accent">
            {avgMvp !== null ? avgMvp.toFixed(2) : '—'}
          </div>
          <div className="text-xs text-text-muted">საშ. MVP</div>
        </div>
        <div className="rounded-lg bg-zone-ok/10 p-3 text-center">
          <div className="text-2xl font-bold text-zone-ok">{profitableCount}</div>
          <div className="text-xs text-text-muted">MVP ≥ 1.5 ნაკვეთი</div>
        </div>
      </div>

      {/* Table or empty state */}
      {data.length === 0 ? (
        <div className="rounded-lg bg-bg-card p-8 text-center text-text-secondary">
          ეკონომიკური მონაცემი არ არის
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
                  N სეზ.
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  N ნიად.
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  MVP
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  ROI რჩევა
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  break-even
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  მარჟა/ჰა
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted">
                  მარჟა სულ
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => (
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
                    <div className="text-[11px] text-text-muted">{row.area_ha.toFixed(1)} ჰა</div>
                  </td>

                  {/* N სეზ. */}
                  <td className="px-3 py-3 text-text-secondary">
                    {row.n_applied_this_season_kg_ha.toFixed(0)} კგ/ჰა
                  </td>

                  {/* N ნიად. */}
                  <td
                    className="px-3 py-3 text-text-secondary"
                    title={row.soil_n_note}
                  >
                    <span className="cursor-help border-b border-dotted border-text-muted">
                      {row.n_from_soil_kg_ha.toFixed(0)} კგ/ჰა
                    </span>
                  </td>

                  {/* MVP */}
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <MvpBadge mvp={row.mvp} />
                      {row.mvp !== null && (
                        <span className="text-[11px] text-text-muted">
                          {row.mvp.toFixed(2)}x
                        </span>
                      )}
                    </div>
                  </td>

                  {/* ROI რჩევა */}
                  <td className="max-w-[200px] px-3 py-3 text-xs text-text-secondary">
                    {row.roi_advice}
                  </td>

                  {/* break-even */}
                  <td className="px-3 py-3 text-text-secondary">
                    {row.break_even_t_ha !== null
                      ? `${row.break_even_t_ha.toFixed(2)} ტ/ჰა`
                      : '—'}
                  </td>

                  {/* მარჟა/ჰა */}
                  <td
                    className="px-3 py-3 font-semibold"
                    style={{ color: gelColor(row.net_margin_gel_ha) }}
                  >
                    {row.net_margin_gel_ha !== null
                      ? `${row.net_margin_gel_ha.toFixed(0)} ₾`
                      : '—'}
                  </td>

                  {/* მარჟა სულ */}
                  <td
                    className="px-3 py-3 font-semibold"
                    style={{ color: gelColor(row.net_margin_gel_total) }}
                  >
                    {row.net_margin_gel_total !== null
                      ? `${row.net_margin_gel_total.toFixed(0)} ₾`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
