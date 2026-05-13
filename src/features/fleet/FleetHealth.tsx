import React, { useEffect, useState } from 'react'
import { useProfileStore } from '@/shared/stores'
import { Globe2 } from 'lucide-react'
import { API_BASE } from '@/shared/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type ParcelStatus = 'ok' | 'warning' | 'stale' | 'no_data'

interface FleetParcel {
  parcel_id: string
  parcel_nr: string
  area_ha: number
  last_obs_date: string | null
  days_stale: number
  total_obs: number
  interpolated: number
  real_pct: number
  status: ParcelStatus
}

interface FleetHealthResponse {
  summary: {
    total_parcels: number
    ok: number
    warning: number
    stale_or_no_data: number
    coverage_pct: number
  }
  parcels: FleetParcel[]
}

type FilterMode = 'all' | ParcelStatus

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchData<T>(path: string): Promise<T> {
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

function staleDayClass(days: number): string {
  if (days <= 10) return 'text-zone-ok'
  if (days <= 20) return 'text-zone-medium'
  return 'text-zone-critical'
}

function staleBarColor(days: number): string {
  if (days <= 10) return '#388e3c'
  if (days <= 20) return '#fbc02d'
  return '#d32f2f'
}

function statusIcon(status: ParcelStatus): string {
  switch (status) {
    case 'ok':
      return '✅'
    case 'warning':
      return '⚠️'
    case 'stale':
    case 'no_data':
      return '❌'
  }
}

function statusLabel(status: ParcelStatus): string {
  switch (status) {
    case 'ok':
      return 'OK'
    case 'warning':
      return 'გაფრთხილ.'
    case 'stale':
      return 'მოძველ.'
    case 'no_data':
      return 'მონ. არ არ.'
  }
}

function interpPct(realPct: number): number {
  return Math.round(100 - realPct)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StalenessBar({ days }: { days: number }): React.ReactElement {
  const pct = Math.min(100, (days / 30) * 100)
  return (
    <div className="w-full h-1.5 rounded-full bg-bg-primary overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: staleBarColor(days) }}
      />
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
        active
          ? 'bg-accent border-accent text-white'
          : 'bg-bg-card border-bg-border text-text-secondary hover:text-text-primary hover:border-accent/40'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FleetHealth(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [data, setData] = useState<FleetHealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')

  useEffect(() => {
    setLoading(true)
    const path = profileId
      ? `/satellite/fleet-health?profile_id=${profileId}`
      : '/satellite/fleet-health'
    fetchData<FleetHealthResponse>(path)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [profileId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
        <span className="ml-3 text-text-secondary">სატელიტური მონაცემები იტვირთება...</span>
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

  if (!data) {
    return (
      <div className="rounded-lg bg-bg-card p-8 text-center text-text-secondary">
        სატელიტური მონაცემი არ მოიძებნა
      </div>
    )
  }

  const { summary, parcels } = data

  // ── Filter parcels ──
  const filtered: FleetParcel[] = filter === 'all'
    ? parcels
    : parcels.filter((p) => {
        if (filter === 'stale') return p.status === 'stale' || p.status === 'no_data'
        return p.status === filter
      })

  // Sort stale/no_data first, then warning, then ok; within each group sort by days_stale desc
  const sorted = [...filtered].sort((a, b) => {
    const priority: Record<ParcelStatus, number> = { no_data: 0, stale: 1, warning: 2, ok: 3 }
    const pd = priority[a.status] - priority[b.status]
    if (pd !== 0) return pd
    return b.days_stale - a.days_stale
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <Globe2 className="h-6 w-6 text-accent shrink-0" />
        <div>
          <h1 className="text-xl font-bold text-text-primary">სატელიტური მონიტ.</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            სატელიტური მონაცემების სიახლის მდგომარეობა
          </p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg bg-bg-card p-3 text-center">
          <div className="text-2xl font-bold text-text-primary">{summary.total_parcels}</div>
          <div className="text-xs text-text-muted">სულ ნაკვეთი</div>
        </div>
        <div className="rounded-lg bg-zone-ok/10 p-3 text-center">
          <div className="text-2xl font-bold text-zone-ok">{summary.ok}</div>
          <div className="text-xs text-text-muted">✅ OK</div>
        </div>
        <div className="rounded-lg bg-zone-medium/10 p-3 text-center">
          <div className="text-2xl font-bold text-zone-medium">{summary.warning}</div>
          <div className="text-xs text-text-muted">⚠️ გაფრთხილება</div>
        </div>
        <div className="rounded-lg bg-zone-critical/10 p-3 text-center">
          <div className="text-2xl font-bold text-zone-critical">{summary.stale_or_no_data}</div>
          <div className="text-xs text-text-muted">❌ მოძველ./არ არ.</div>
        </div>
        <div className="rounded-lg bg-accent/10 p-3 text-center col-span-2 sm:col-span-1">
          <div className="text-2xl font-bold text-accent">{summary.coverage_pct.toFixed(0)}%</div>
          <div className="text-xs text-text-muted">გაფარ. %</div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-bg-primary overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${summary.coverage_pct}%`, backgroundColor: '#58a6ff' }}
            />
          </div>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          ყველა ({parcels.length})
        </FilterButton>
        <FilterButton active={filter === 'ok'} onClick={() => setFilter('ok')}>
          ✅ OK ({summary.ok})
        </FilterButton>
        <FilterButton active={filter === 'warning'} onClick={() => setFilter('warning')}>
          ⚠️ გაფრთხილება ({summary.warning})
        </FilterButton>
        <FilterButton active={filter === 'stale'} onClick={() => setFilter('stale')}>
          ❌ მოძველ. ({summary.stale_or_no_data})
        </FilterButton>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="rounded-lg bg-bg-card p-8 text-center text-text-secondary">
          სატელიტური მონაცემი არ მოიძებნა
        </div>
      ) : (
        <div className="rounded-lg bg-bg-card overflow-hidden border border-bg-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">
                    ნაკვეთი
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">
                    ბოლო დაკვ.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">
                    დღეები
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">
                    დაკვ. რ.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">
                    ინტ. %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">
                    სტ.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide w-28">
                    სიახლე
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((parcel) => {
                  const intPct = interpPct(parcel.real_pct)
                  return (
                    <tr
                      key={parcel.parcel_id}
                      className="border-b border-bg-border hover:bg-bg-border/30 transition-colors"
                    >
                      {/* Parcel name */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-text-primary">{parcel.parcel_nr}</span>
                        <br />
                        <span className="text-[11px] text-text-muted">
                          {parcel.area_ha.toFixed(1)} ჰა
                        </span>
                      </td>

                      {/* Last obs date */}
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {parcel.last_obs_date ?? '—'}
                      </td>

                      {/* Days stale — colored */}
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold text-sm ${staleDayClass(parcel.days_stale)}`}
                        >
                          {parcel.days_stale}
                        </span>
                        <span className="text-text-muted text-xs ml-0.5">დ</span>
                      </td>

                      {/* Total observations */}
                      <td className="px-4 py-3 text-text-secondary text-sm">
                        {parcel.total_obs}
                      </td>

                      {/* Interpolation % — yellow if >30% */}
                      <td className="px-4 py-3">
                        <span
                          className="text-sm font-medium"
                          style={{ color: intPct > 30 ? '#fbc02d' : '#8b949e' }}
                        >
                          {intPct}%
                        </span>
                      </td>

                      {/* Status icon */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold"
                          style={{
                            background:
                              parcel.status === 'ok'
                                ? '#388e3c22'
                                : parcel.status === 'warning'
                                ? '#fbc02d22'
                                : '#d32f2f22',
                            color:
                              parcel.status === 'ok'
                                ? '#388e3c'
                                : parcel.status === 'warning'
                                ? '#fbc02d'
                                : '#d32f2f',
                          }}
                        >
                          {statusIcon(parcel.status)} {statusLabel(parcel.status)}
                        </span>
                      </td>

                      {/* Staleness bar */}
                      <td className="px-4 py-3 w-28">
                        <StalenessBar days={parcel.days_stale} />
                        <div className="text-[10px] text-text-muted mt-0.5 text-right">
                          {Math.min(parcel.days_stale, 30)}/30 დ
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
