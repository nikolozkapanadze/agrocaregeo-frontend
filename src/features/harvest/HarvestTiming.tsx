import React, { useEffect, useState } from 'react'
import { Calendar, Moon } from 'lucide-react'
import { getMoonInfo } from '@/shared/lib/moon'
import { agronomic } from '@/shared/lib/api'
import { useProfileStore } from '@/shared/stores'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HarvestWindowDay {
  date: string
  score: number
  weather_score: number
  lunar_score: number
  quality: string
  issues: string[]
  moon_phase: string
  moon_age: number
  is_lunar_optimal: boolean
}

interface LunarRecommendation {
  best_days: string[]
  explanation: string
}

interface HarvestTimingRow {
  parcel_nr: string
  area_ha: number
  crop_status: string
  ndvi: number | null
  heading_reached: boolean
  heading_est_date: string | null
  gdd_post_heading: number
  gdd_remaining: number
  harvest_expected: string | null
  harvest_optimistic: string | null
  harvest_conservative: string | null
  lunar_optimal_dates: string[]
  lunar_optimal_count: number
  best_harvest_day: HarvestWindowDay | null
  good_harvest_days: number
  harvest_window: HarvestWindowDay[]
  advice: string
  lunar_recommendation: LunarRecommendation | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const GEO_MONTHS = [
    'იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ',
    'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ',
  ]
  return `${d.getDate()} ${GEO_MONTHS[d.getMonth()]}`
}

function shortDate(dateStr: string): string {
  return dateStr.slice(5) // MM-DD
}

function scoreColor(score: number): string {
  if (score >= 80) return '#388e3c'
  if (score >= 60) return '#fbc02d'
  if (score >= 40) return '#f57c00'
  return '#d32f2f'
}

function lunarScoreColor(score: number): string {
  if (score >= 90) return '#ffd700'  // Gold for Full Moon
  if (score >= 70) return '#c9a227'  // Dark gold
  return '#6e7681'
}

function getMoonEmoji(phaseName: string): string {
  if (phaseName.includes('სავსე')) return '🌕'
  if (phaseName.includes('კლებადი სავსე')) return '🌖'
  if (phaseName.includes('კლებადი')) return '🌘'
  if (phaseName.includes('მზარდი სავსე')) return '🌔'
  if (phaseName.includes('მზარდი')) return '🌒'
  if (phaseName.includes('მეოთხედი')) return '🌓'
  if (phaseName.includes('მთვარეობა')) return '🌑'
  return '🌙'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }): React.ReactElement {
  return (
    <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase bg-accent/15 text-accent">
      {status}
    </span>
  )
}

function GddProgressBar({
  postHeading,
  remaining,
}: {
  postHeading: number
  remaining: number
}): React.ReactElement {
  const total = postHeading + remaining
  const pct = total > 0 ? Math.min(100, (postHeading / total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
        <span>GDD პროგრესი</span>
        <span className="text-text-primary font-medium">
          {Math.round(postHeading)} / {Math.round(total)} GDD
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-bg-primary overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: '#388e3c' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
        <span>heading</span>
        <span>{Math.round(remaining)} GDD დარჩენილი</span>
      </div>
    </div>
  )
}

function WindowBars({ window: days }: { window: HarvestWindowDay[] }): React.ReactElement {
  if (days.length === 0) {
    return <p className="text-xs text-text-muted">ფანჯრის მონაცემი არ არის</p>
  }

  const barMaxHeight = 32 // px

  return (
    <div>
      <p className="text-[10px] text-text-muted mb-1.5 uppercase tracking-wide">
        10-დღ. ფანჯარა (ამინდი + მთვარე)
      </p>
      <div className="flex items-end gap-0.5">
        {days.slice(0, 10).map((day, idx) => {
          const h = Math.max(4, Math.round((day.score / 100) * barMaxHeight))
          const color = day.is_lunar_optimal ? lunarScoreColor(day.lunar_score) : scoreColor(day.score)
          const isOptimal = day.is_lunar_optimal
          
          return (
            <div
              key={idx}
              className="flex flex-col items-center gap-0.5 flex-1 min-w-0"
              title={`${day.date}: ${day.score}/100 (ამინდ: ${day.weather_score}, მთვარე: ${day.lunar_score})${day.issues.length ? '\n' + day.issues.join(', ') : ''}\n${day.moon_phase}`}
            >
              <div
                className={`w-full rounded-sm ${isOptimal ? 'ring-1 ring-yellow-400' : ''}`}
                style={{ height: `${h}px`, backgroundColor: color, minWidth: '6px' }}
              />
              <span className="text-[8px] text-text-muted leading-tight truncate w-full text-center">
                {shortDate(day.date)}
              </span>
              {isOptimal && (
                <span className="text-[6px]">{getMoonEmoji(day.moon_phase)}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LunarOptimalDates({ dates }: { dates: string[] }): React.ReactElement | null {
  if (dates.length === 0) return null

  return (
    <div className="rounded border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
      <div className="flex items-center gap-2 mb-1.5">
        <Moon className="h-3.5 w-3.5 text-yellow-500" />
        <span className="text-[10px] font-semibold text-yellow-600 uppercase tracking-wide">
          მთვარის კალენდარი — საუკეთესო დღეები
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {dates.map((dateStr, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-700"
          >
            <span>🌕</span>
            {formatDate(dateStr)}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-text-muted mt-1.5">
        სავსე მთვარის პერიოდი მკისთვის ოპტიმალურია — მარცვალი ნაკლებ ტენიანობას შეიცავს
      </p>
    </div>
  )
}

function HarvestCard({ row }: { row: HarvestTimingRow }): React.ReactElement {
  const borderColor = row.heading_reached ? '#388e3c' : '#8b949e'

  return (
    <div
      style={{ borderLeft: `4px solid ${borderColor}` }}
      className="rounded-lg bg-bg-card p-4 shadow flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-text-primary text-sm">{row.parcel_nr}</span>
            {row.parcel_nr !== row.parcel_nr && (
              <span className="text-xs text-text-muted">({row.parcel_nr})</span>
            )}
            <StatusBadge status={row.crop_status} />
          </div>
          <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-text-secondary">
            <span>
              ფართ: <strong className="text-text-primary">{row.area_ha.toFixed(1)} ჰა</strong>
            </span>
            {row.ndvi !== null && (
              <span>
                NDVI: <strong className="text-text-primary">{row.ndvi.toFixed(3)}</strong>
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          {row.heading_reached ? (
            <span className="text-[11px] font-semibold text-zone-ok">✅ heading</span>
          ) : (
            <span className="text-[11px] font-semibold text-text-muted">⏳ heading-მდე</span>
          )}
        </div>
      </div>

      {/* GDD Progress */}
      <GddProgressBar
        postHeading={row.gdd_post_heading}
        remaining={row.gdd_remaining}
      />

      {/* Harvest dates — realistic July targeting */}
      <div className="rounded border border-bg-border bg-bg-primary px-3 py-2 text-xs">
        <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">
          მკის თარიღები (ივლისი)
        </p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">🏃 ადრე</span>
            <span className="text-text-primary">{formatDate(row.harvest_optimistic)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">📅 სავარ.</span>
            <span className="font-bold text-accent">{formatDate(row.harvest_expected)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">🐢 გვიან</span>
            <span className="text-text-primary">{formatDate(row.harvest_conservative)}</span>
          </div>
        </div>
      </div>

      {/* Lunar optimal dates */}
      {row.lunar_optimal_dates.length > 0 && (
        <LunarOptimalDates dates={row.lunar_optimal_dates} />
      )}

      {/* Best harvest day highlight */}
      {row.best_harvest_day && row.best_harvest_day.score >= 70 && (
        <div className="rounded border border-green-500/30 bg-green-500/10 px-3 py-2">
          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-1">
            საუკეთესო დღე მკისთვის
          </p>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-text-primary">
              {formatDate(row.best_harvest_day.date)}
            </span>
            <span className="text-xs text-text-secondary">
              {getMoonEmoji(row.best_harvest_day.moon_phase)} {row.best_harvest_day.moon_phase}
            </span>
            <span 
              className="ml-auto rounded px-2 py-0.5 text-xs font-semibold"
              style={{
                background: row.best_harvest_day.score >= 80 ? '#388e3c22' : '#fbc02d22',
                color: row.best_harvest_day.score >= 80 ? '#388e3c' : '#fbc02d',
              }}
            >
              {row.best_harvest_day.score}/100
            </span>
          </div>
        </div>
      )}

      {/* 10-day window mini bars */}
      <WindowBars window={row.harvest_window} />

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-bg-border pt-2">
        <p className="text-[11px] text-text-muted leading-snug max-w-[calc(100%-80px)]">
          {row.advice}
        </p>
        <span
          className="shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold"
          style={{
            background: row.good_harvest_days >= 5 ? '#388e3c22' : '#f57c0022',
            color: row.good_harvest_days >= 5 ? '#388e3c' : '#f57c00',
          }}
        >
          🌤️ {row.good_harvest_days} კარგი დღე
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HarvestTiming(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [data, setData] = useState<HarvestTimingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    agronomic.harvestTiming(profileId)
      .then((rows) => {
        // Sort by gdd_remaining ascending — closest to harvest first
        const sorted = [...rows].sort((a, b) => a.gdd_remaining - b.gdd_remaining)
        setData(sorted)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [profileId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
        <span className="ml-3 text-text-secondary">მკის მონაცემები იტვირთება...</span>
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

  // ── Summary stats ──
  const headingParcels = data.filter((r) => r.heading_reached)
  const avgGddRemaining =
    headingParcels.length > 0
      ? headingParcels.reduce((s, r) => s + r.gdd_remaining, 0) / headingParcels.length
      : null

  const earliestHarvest = headingParcels
    .map((r) => r.harvest_expected)
    .filter((d): d is string => d !== null)
    .sort()[0] ?? null

  // Count parcels with lunar optimal dates
  const parcelsWithLunarOptimal = data.filter((r) => r.lunar_optimal_count > 0).length
  
  // FIX: Get current moon phase using getMoonInfo()
  const todayMoon = getMoonInfo(new Date())

  return (
    <div className="flex flex-col gap-4">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-accent shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-text-primary">მკის დრო</h1>
            <p className="mt-0.5 text-sm text-text-secondary">
              GDD-ზე დაყრდნობილი მკის პროგნოზი (550 GDD heading-დან) + მთვარის კალენდარი
            </p>
          </div>
        </div>
        {/* FIX: Show current moon phase from getMoonInfo() */}
        <div className="flex items-center gap-2 text-right">
          <span className="text-2xl">{todayMoon.emoji}</span>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-text-primary">{todayMoon.phaseNameGeo}</p>
            <p className="text-[10px] text-text-muted">{todayMoon.illumination}% განათება</p>
          </div>
        </div>
      </div>

      {/* Info banner - FIX: Use getMoonInfo() agriAdvice for dynamic lunar guidance */}
      <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
        <div className="flex items-start gap-2">
          <Moon className="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">მთვარის კალენდრის რეკომენდაცია:</strong> სავსე მთვარის 
              პერიოდში (🌕) მარცვალი ნაკლებ ტენიანობას შეიცავს და საუკეთესოა შენახვისთვის. 
              სავარაუდო მკის თარიღები გათვლილია ივლისის პერიოდისთვის, რაც ტიპიურია 
              საქართველოს პირობებში.
            </p>
            {/* FIX: Show current lunar phase advice from getMoonInfo() */}
            <p className="text-xs text-yellow-600 mt-2 pt-2 border-t border-accent/10">
              🌙 ამ ეტაპზე ({todayMoon.phaseNameGeo}): {todayMoon.agriAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-zone-ok/10 p-3 text-center">
          <div className="text-2xl font-bold text-zone-ok">{headingParcels.length}</div>
          <div className="text-xs text-text-muted">✅ heading-ს მიღწეული</div>
        </div>
        <div className="rounded-lg bg-bg-card p-3 text-center">
          <div className="text-2xl font-bold text-text-primary">
            {avgGddRemaining !== null ? Math.round(avgGddRemaining) : '—'}
          </div>
          <div className="text-xs text-text-muted">საშ. GDD დარჩენილი</div>
        </div>
        <div className="rounded-lg bg-accent/10 p-3 text-center">
          <div className="text-2xl font-bold text-accent">
            {earliestHarvest ? formatDate(earliestHarvest) : '—'}
          </div>
          <div className="text-xs text-text-muted">🗓 ადრეული მკა</div>
        </div>
        <div className="rounded-lg bg-yellow-500/10 p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{parcelsWithLunarOptimal}</div>
          <div className="text-xs text-text-muted">🌕 მთვარის ოპტიმალური</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm" style={{ background: '#ffd700' }}></span>
          სავსე მთვარე (ოპტიმალური)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm" style={{ background: '#388e3c' }}></span>
          კარგი ამინდი
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm" style={{ background: '#fbc02d' }}></span>
          მისაღები
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm" style={{ background: '#d32f2f' }}></span>
          ცუდი
        </span>
      </div>

      {/* Parcel cards */}
      {data.length === 0 ? (
        <div className="rounded-lg bg-bg-card p-8 text-center text-text-secondary">
          მკის მონაცემი არ არის
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.map((row, idx) => (
            <HarvestCard key={`${row.parcel_nr}-${idx}`} row={row} />
          ))}
        </div>
      )}
    </div>
  )
}
