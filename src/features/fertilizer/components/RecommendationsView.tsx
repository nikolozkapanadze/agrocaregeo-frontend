import React from 'react'
import { Link } from 'react-router-dom'
import { RecCard } from './RecCard'
import { getLunarFertilizerAdvisory, getMoonTiming } from '@/domain/recommendations'
import type { Recommendation } from '@/shared/lib/api'
import type { MoonInfo } from '@/shared/lib/moon'
import type { FilterPriority, SortKey } from '../hooks/useRecommendations'

interface RecommendationsViewProps {
  // Data
  data: Recommendation[]
  moonInfo: MoonInfo
  filteredData: Recommendation[]
  sortedData: Recommendation[]
  
  // States
  loading: boolean
  error: string | null
  recalculating: boolean
  recalcMsg: string | null
  emptyMessage: string | null
  
  // Filters
  filterPriority: FilterPriority
  sortKey: SortKey
  onFilterChange: (p: FilterPriority) => void
  onSortChange: (k: SortKey) => void
  
  // Stats
  stats: {
    total: number
    critical: number
    high: number
    ok: number
  }
  
  // Actions
  onRecalculate: () => void
}

export function RecommendationsView({
  data,
  moonInfo,
  filteredData,
  sortedData,
  loading,
  error,
  recalculating,
  recalcMsg,
  emptyMessage,
  filterPriority,
  sortKey,
  onFilterChange,
  onSortChange,
  stats,
  onRecalculate,
}: RecommendationsViewProps): React.ReactElement {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
        <span className="ml-3 text-text-secondary">სასუქების რეკომენდაციები იტვირთება...</span>
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

  const lunarAdvisory = getLunarFertilizerAdvisory(moonInfo.agriActivity)
  const foliarTiming = getMoonTiming(moonInfo.agriActivity, 'foliar')
  const soilTiming = getMoonTiming(moonInfo.agriActivity, 'soil')

  return (
    <div className="flex flex-col gap-4">
      {/* Page title */}
      <Header
        onRecalculate={onRecalculate}
        recalculating={recalculating}
      />
      
      {recalcMsg && (
        <div className="rounded-md bg-bg-card px-4 py-2 text-sm text-text-secondary">{recalcMsg}</div>
      )}

      {/* Summary stats */}
      <StatsPanel stats={stats} />

      {/* Moon phase banner */}
      <MoonPhaseBanner
        moonInfo={moonInfo}
        lunarAdvisory={lunarAdvisory}
        foliarTiming={foliarTiming}
        soilTiming={soilTiming}
      />

      {/* Filter + Sort controls */}
      <FilterSortControls
        filterPriority={filterPriority}
        sortKey={sortKey}
        onFilterChange={onFilterChange}
        onSortChange={onSortChange}
        filteredCount={filteredData.length}
        totalCount={data.length}
      />

      {/* Missing crop_status banner */}
      {data.length > 0 && data.some((r) => !r.crop_status) && (
        <div className="rounded-lg border border-zone-high/30 bg-zone-high/10 px-4 py-3 text-sm text-zone-high">
          ⚠️ ამ კულტურის ფენოლოგიური მონაცემები შეიძლება არასწორად გამოჩნდეს. გთხოვთ დაგვიკავშირდეთ მხარდაჭერის გუნდს.
        </div>
      )}

      {/* Parcel cards */}
      {sortedData.length === 0 ? (
        <EmptyState hasData={data.length > 0} emptyMessage={emptyMessage} />
      ) : (
        <div className="flex flex-col gap-3">
          {sortedData.map((rec, idx) => (
            <RecCard key={`${rec.parcel_nr}-${idx}`} rec={rec} moonActivity={moonInfo.agriActivity} />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function Header({
  onRecalculate,
  recalculating,
}: {
  onRecalculate: () => void
  recalculating: boolean
}): React.ReactElement {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-text-primary">სასუქის რეკომენდაციები</h1>
        <p className="mt-0.5 text-sm text-text-secondary">მინერალური ანალიზი + ფენოლოგია + ამინდის პროგნოზი</p>
        <p className="mt-1 text-xs text-text-muted">
          🔬{' '}
          <Link to="/scientific" className="text-accent hover:underline">
            NDRE-ზე დაფუძნებული სამეცნიერო ანალიზი
          </Link>{' '}
          — სატელიტი (50%) + ნიადაგი (30%) + ამინდი (20%)
        </p>
      </div>
      <button
        onClick={onRecalculate}
        disabled={recalculating}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {recalculating ? '⏳ გადათვლა...' : '🔄 გადათვლა'}
      </button>
    </div>
  )
}

function StatsPanel({
  stats,
}: {
  stats: { total: number; critical: number; high: number; ok: number }
}): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatBox value={stats.total} label="სულ ნაკვეთი" variant="default" />
      <StatBox value={stats.critical} label="🔴 გადაუდებელი" variant="critical" />
      <StatBox value={stats.high} label="🟡 მაღალი" variant="high" />
      <StatBox value={stats.ok} label="🟢 ნორმალური" variant="ok" />
    </div>
  )
}

function StatBox({
  value,
  label,
  variant,
}: {
  value: number
  label: string
  variant: 'default' | 'critical' | 'high' | 'ok'
}): React.ReactElement {
  const variantClasses = {
    default: 'bg-bg-card',
    critical: 'bg-zone-critical/10',
    high: 'bg-zone-high/10',
    ok: 'bg-zone-ok/10',
  }

  const valueClasses = {
    default: 'text-text-primary',
    critical: 'text-zone-critical',
    high: 'text-zone-high',
    ok: 'text-zone-ok',
  }

  return (
    <div className={`rounded-lg p-3 text-center ${variantClasses[variant]}`}>
      <div className={`text-2xl font-bold ${valueClasses[variant]}`}>{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}

function MoonPhaseBanner({
  moonInfo,
  lunarAdvisory,
  foliarTiming,
  soilTiming,
}: {
  moonInfo: MoonInfo
  lunarAdvisory: ReturnType<typeof getLunarFertilizerAdvisory>
  foliarTiming: ReturnType<typeof getMoonTiming>
  soilTiming: ReturnType<typeof getMoonTiming>
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-card px-4 py-3 space-y-2">
      {/* Top row: phase info + calendar link */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl leading-none">{moonInfo.emoji}</span>
          <div>
            <p className="text-xs font-semibold text-text-primary">{moonInfo.phaseNameGeo}</p>
            <p className="text-[10px] text-text-muted">
              განათება {moonInfo.illumination}% · {moonInfo.age.toFixed(1)} დღე
            </p>
          </div>
        </div>
        <div className="h-8 w-px bg-bg-border hidden sm:block" />
        <div className="flex flex-wrap gap-3 text-xs flex-1 min-w-0">
          <span>
            <span className="text-text-muted">ფოთლოვანი (N): </span>
            <span className={`${foliarTiming.color} font-medium`}>{foliarTiming.label}</span>
          </span>
          <span>
            <span className="text-text-muted">ნიადაგის (P/K/Mg): </span>
            <span className={`${soilTiming.color} font-medium`}>{soilTiming.label}</span>
          </span>
        </div>
        <Link to="/moon-calendar" className="shrink-0 text-xs text-accent hover:underline">
          კალენდარი →
        </Link>
      </div>
      {/* Lunar fertilizer advisory */}
      <div className="flex items-start gap-2 rounded-md bg-bg-secondary px-3 py-2">
        <span className="text-base leading-none mt-0.5">{lunarAdvisory.favorable ? '🌿' : '⏳'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-text-secondary mb-0.5">
            მთვარის კალენდარი — სასუქის შეტანის რეკომენდაცია
          </p>
          <p className={`${lunarAdvisory.color} text-[11px] leading-relaxed`}>{lunarAdvisory.message}</p>
          <p className="mt-0.5 text-[10px] text-text-muted">{moonInfo.agriAdvice}</p>
        </div>
      </div>
    </div>
  )
}

function FilterSortControls({
  filterPriority,
  sortKey,
  onFilterChange,
  onSortChange,
  filteredCount,
  totalCount,
}: {
  filterPriority: FilterPriority
  sortKey: SortKey
  onFilterChange: (p: FilterPriority) => void
  onSortChange: (k: SortKey) => void
  filteredCount: number
  totalCount: number
}): React.ReactElement {
  const FilterBtn = ({ p, label, activeColor }: { p: FilterPriority; label: string; activeColor: string }) => (
    <button
      onClick={() => onFilterChange(p)}
      className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
      style={
        filterPriority === p
          ? { background: activeColor, color: '#fff' }
          : { background: '#21262d', color: '#8b949e' }
      }
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-muted">ფილტრი:</span>
        <FilterBtn p="all" label="ყველა" activeColor="#58a6ff" />
        <FilterBtn p={1} label="🔴 გადაუდებელი" activeColor="#d32f2f" />
        <FilterBtn p={2} label="🟡 მაღალი" activeColor="#f57c00" />
        <FilterBtn p={3} label="🟢 ნორმალური" activeColor="#388e3c" />
      </div>

      <div className="h-4 w-px bg-bg-border" />

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-muted">დალაგება:</span>
        <select
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="rounded-md border border-bg-border bg-bg-card px-2 py-1.5 text-xs text-text-primary focus:outline-none"
        >
          <option value="priority">გადაუდებლობა (🔴→🟢)</option>
          <option value="code">ნაკვეთის კოდი (A→Z)</option>
          <option value="ndvi">NDVI (დაბალი→მაღალი)</option>
          <option value="n_remaining">N საჭიროება (მაღალი→დაბალი)</option>
          <option value="area">ფართობი (მაღალი→დაბალი)</option>
        </select>
      </div>

      {filteredCount !== totalCount && (
        <span className="text-xs text-text-muted">
          ნაჩვენებია {filteredCount} / {totalCount}
        </span>
      )}
    </div>
  )
}

function EmptyState({ hasData, emptyMessage }: { hasData: boolean; emptyMessage: string | null }): React.ReactElement {
  if (hasData) {
    return (
      <div className="rounded-lg bg-bg-card p-8 text-center text-text-secondary">
        ⚠️ ფილტრი: შესაბამისი ნაკვეთი არ მოიძებნა
      </div>
    )
  }
  if (emptyMessage) {
    return (
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-8 text-center">
        <p className="text-sm font-medium text-accent">⏳ {emptyMessage}</p>
        <p className="mt-2 text-xs text-text-muted">
          VRA ზონების მონაცემები ხელმისაწვდომია რუკის განყოფილებაში.
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-lg bg-bg-card p-8 text-center text-text-secondary">
      ✅ ყველა ნაკვეთი ნორმალურ მდგომარეობაშია
    </div>
  )
}
