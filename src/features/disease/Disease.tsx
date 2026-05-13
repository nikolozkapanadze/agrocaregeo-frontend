import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { disease, analysis, DiseaseParcel, DiseaseRisk } from '@/shared/lib/api'
import { Map } from 'lucide-react'
import { useProfileStore } from '@/shared/stores'
import { getCropStatusLabel } from '@/domain/crops'
import type { CategoryInfo } from '@/shared/api/services/crop-profile.service'

function getCropDisplayName(categories: CategoryInfo[], slug: string | null | undefined): string {
  if (!slug) return '—'
  for (const cat of categories) {
    const crop = cat.crops.find(c => c.key === slug)
    if (crop) return crop.display_name
  }
  return slug
}

function RiskBadge({ level, levelGe }: { level: string; levelGe: string }): React.ReactElement {
  const cls = level === 'high' ? 'badge badge-danger' : 'badge badge-warning'
  return <span className={cls}>{levelGe}</span>
}

function DiseaseCard({ d, categories }: { d: DiseaseParcel; categories: CategoryInfo[] }): React.ReactElement {
  const accentClass =
    d.max_level === 'high'   ? 'border-l-red-500' :
    d.max_level === 'medium' ? 'border-l-yellow-500' :
                               'border-l-green-600'
  const labelClass =
    d.max_level === 'high'   ? 'text-danger' :
    d.max_level === 'medium' ? 'text-warning' :
                               'text-success'
  const cropName = getCropDisplayName(categories, d.crop_type)

  return (
    <div className={`card border-l-4 ${accentClass} rounded-l-none p-4`}>
      {/* Parcel header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to={`/map?focus=${encodeURIComponent(d.parcel_nr)}`}
              className="font-bold text-accent hover:underline"
              title="რუკაზე ნახვა"
            >
              {d.parcel_nr}
            </Link>
            {cropName && cropName !== '—' && (
              <span className="rounded bg-bg-border px-1.5 py-0.5 text-[10px] text-text-secondary">
                {cropName}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-text-secondary">
            <span>{d.area_ha?.toFixed(1) ?? '-'} ჰა</span>
            <span>🌡 {d.wx_t?.toFixed(0) ?? '-'}°C</span>
            <span>🌧 {d.wx_rain?.toFixed(0) ?? '-'}mm/7დ</span>
            {d.crop_status && d.crop_status !== 'unknown' && (
              <span>ფენოლოგია: <strong className="text-text-primary">{getCropStatusLabel(d.crop_type, d.crop_status)}</strong></span>
            )}
            {d.ndvi != null && (
              <span>NDVI: <strong className="text-text-primary">{d.ndvi.toFixed(3)}</strong></span>
            )}
          </div>
        </div>
        <div className={`text-xs font-bold ${labelClass}`}>
          {d.max_level === 'high' ? 'მაღალი რისკი' : d.max_level === 'medium' ? 'საშუალო რისკი' : 'კარგი'}
        </div>
      </div>

      {/* Disease risks */}
      {d.max_level === 'none' && (
        <div className="mt-3 rounded border border-zone-ok/30 bg-zone-ok/10 px-3 py-2 text-sm font-medium text-zone-ok">
          ✅ დაავადების რისკი არ არის — ამინდის პირობები ხელსაყრელია
        </div>
      )}
      <div className="mt-3 flex flex-col gap-3">
        {d.risks.map((risk: DiseaseRisk) => (
          <div
            key={risk.key}
            className="rounded border border-bg-border bg-bg-primary p-3 text-xs"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base">{risk.emoji}</span>
              <span className="font-semibold text-text-primary">{risk.name_ge}</span>
              <RiskBadge level={risk.level} levelGe={risk.level_ge} />
              {risk.fore_warn && (
                <span className="rounded bg-zone-high/20 px-1.5 py-0.5 text-[10px] font-medium text-zone-high">
                  ⚠️ პროგნოზი საშიშია
                </span>
              )}
            </div>

            <p className="mt-1 text-text-secondary">{risk.info}</p>

            {/* Conditions pills */}
            <div className="mt-2 flex flex-wrap gap-1">
              {risk.conditions.map((cond, i) => (
                <span
                  key={i}
                  className="rounded bg-bg-card px-2 py-0.5 text-[10px] text-text-muted"
                >
                  {cond}
                </span>
              ))}
            </div>

            {/* Action box */}
            {risk.level === 'high' ? (
              <div className="mt-2 rounded border border-zone-critical/40 bg-zone-critical/10 px-3 py-2">
                <div className="font-semibold text-zone-critical">{risk.action}</div>
                <div className="mt-0.5 text-text-secondary">
                  ფუნგიციდი: <strong className="text-text-primary">{risk.fungicide}</strong>
                </div>
                <div className="mt-0.5 text-text-muted">
                  სულ: ~{(d.area_ha * 0.5).toFixed(1)} ლ ({d.area_ha.toFixed(1)}ჰა × 0.5ლ/ჰა)
                  · სამოქმედო ფანჯარა: {risk.window} დღე
                </div>
                <Link
                  to={`/spray?code=${d.parcel_nr}&fungicide=${encodeURIComponent(risk.fungicide)}&dose=0.5`}
                  className="inline-block mt-2 bg-[#238636] hover:bg-[#2ea043] text-white text-[11px] font-semibold px-3 py-1 rounded transition-colors"
                >
                  ✍️ ჩაიწერე შესხურება
                </Link>
              </div>
            ) : (
              <div className="mt-2 text-zone-high font-medium">
                👁 დააკვირდი — {risk.action}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

type FilterLevel = 'all' | 'high' | 'medium' | 'none'
type SortKey = 'risk' | 'code' | 'ndvi' | 'rain' | 'score'

export default function Disease(): React.ReactElement {
  const { activeProfile, categories } = useProfileStore()
  const profileId = activeProfile?.id
  const [data, setData] = useState<DiseaseParcel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recalculating, setRecalculating] = useState(false)
  const [recalcMsg, setRecalcMsg] = useState<string | null>(null)
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all')
  const [sortKey, setSortKey] = useState<SortKey>('risk')

  const loadData = () => {
    setLoading(true)
    setError(null)
    disease
      .report(profileId)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [profileId])

  const handleRecalculate = () => {
    setRecalculating(true)
    setRecalcMsg(null)
    analysis
      .recalculate()
      .then(() => {
        setRecalcMsg('გადათვლა დაიწყო — 30 წამში განახლდება მონაცემები')
        setTimeout(() => { loadData(); setRecalcMsg(null) }, 30000)
      })
      .catch((err: Error) => setRecalcMsg(`შეცდომა: ${err.message}`))
      .finally(() => setRecalculating(false))
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
        <span className="ml-3 text-text-secondary">დაავადებების ანალიზი იტვირთება...</span>
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

  const highCount = data.filter((p) => p.max_level === 'high').length
  const mediumCount = data.filter((p) => p.max_level === 'medium').length
  const goodCount = data.filter((p) => p.max_level === 'none').length

  // Filter
  const filtered = data.filter((p) => {
    if (filterLevel === 'all') return true
    return p.max_level === filterLevel
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'risk': {
        // high → medium → none, then by max risk score desc
        const levelOrder: Record<string, number> = { high: 0, medium: 1, none: 2 }
        const lo = (levelOrder[a.max_level] ?? 2) - (levelOrder[b.max_level] ?? 2)
        if (lo !== 0) return lo
        const aScore = a.risks.length ? Math.max(...a.risks.map(r => r.score)) : 0
        const bScore = b.risks.length ? Math.max(...b.risks.map(r => r.score)) : 0
        return bScore - aScore
      }
      case 'score': {
        const aScore = a.risks.length ? Math.max(...a.risks.map(r => r.score)) : 0
        const bScore = b.risks.length ? Math.max(...b.risks.map(r => r.score)) : 0
        return bScore - aScore
      }
      case 'code':
        return (a.parcel_nr || '').localeCompare(b.parcel_nr || '')
      case 'ndvi':
        return (a.ndvi ?? 1) - (b.ndvi ?? 1)
      case 'rain':
        return b.wx_rain - a.wx_rain
      default:
        return 0
    }
  })

  const filterBtn = (level: FilterLevel, label: string, activeColor: string) => (
    <button
      onClick={() => setFilterLevel(level)}
      className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
      style={filterLevel === level
        ? { background: activeColor, color: '#fff' }
        : { background: '#21262d', color: '#8b949e' }
      }
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Page title */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">დაავადებების რისკი</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            ბოლო 7 დღის ამინდი + სატელიტური მდგომარეობა + 5-დღიანი პროგნოზი
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/map"
            className="rounded-md bg-bg-card border border-bg-border px-4 py-2 text-sm font-semibold text-text-primary hover:bg-bg-border flex items-center gap-2"
          >
            <Map className="h-4 w-4" />
            რუკაზე ნახვა
          </Link>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {recalculating ? '⏳ გადათვლა...' : '🔄 გადათვლა'}
          </button>
        </div>
      </div>
      {recalcMsg && (
        <div className="rounded-md bg-bg-card px-4 py-2 text-sm text-text-secondary">
          {recalcMsg}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-zone-critical/10 p-3 text-center">
          <div className="text-2xl font-bold text-zone-critical">{highCount}</div>
          <div className="text-xs text-text-muted">🔴 მაღალი რისკი</div>
        </div>
        <div className="rounded-lg bg-zone-high/10 p-3 text-center">
          <div className="text-2xl font-bold text-zone-high">{mediumCount}</div>
          <div className="text-xs text-text-muted">🟡 საშუალო რისკი</div>
        </div>
        <div className="rounded-lg bg-zone-ok/10 p-3 text-center">
          <div className="text-2xl font-bold text-zone-ok">{goodCount}</div>
          <div className="text-xs text-text-muted">🟢 კარგი</div>
        </div>
        <div className="rounded-lg bg-bg-card p-3 text-center">
          <div className="text-2xl font-bold text-text-primary">{data.length}</div>
          <div className="text-xs text-text-muted">სულ ნაკვეთი</div>
        </div>
      </div>

      {/* Filter + Sort controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted">ფილტრი:</span>
          {filterBtn('all', 'ყველა', '#58a6ff')}
          {filterBtn('high', '🔴 მაღალი', '#d32f2f')}
          {filterBtn('medium', '🟡 საშუალო', '#f57c00')}
          {filterBtn('none', '🟢 კარგი', '#388e3c')}
        </div>

        <div className="h-4 w-px bg-bg-border" />

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted">დალაგება:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-bg-border bg-bg-card px-2 py-1.5 text-xs text-text-primary focus:outline-none"
          >
            <option value="risk">რისკის დონე</option>
            <option value="score">ქულა (მაღალი→დაბალი)</option>
            <option value="code">ნაკვეთის კოდი (A→Z)</option>
            <option value="ndvi">NDVI (დაბალი→მაღალი)</option>
            <option value="rain">წვიმა (მაღალი→დაბალი)</option>
          </select>
        </div>

        {filtered.length !== data.length && (
          <span className="text-xs text-text-muted">
            ნაჩვენებია {filtered.length} / {data.length}
          </span>
        )}
      </div>

      {/* Parcel cards */}
      {sorted.length === 0 ? (
        <div className="rounded-lg bg-bg-card p-8 text-center text-text-secondary">
          {data.length === 0 ? '✅ დაავადების მაღალი რისკი არ არის' : '⚠️ ფილტრი: შესაბამისი ნაკვეთი არ მოიძებნა'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((parcel, idx) => (
            <DiseaseCard key={`${parcel.parcel_nr}-${idx}`} d={parcel} categories={categories} />
          ))}
        </div>
      )}
    </div>
  )
}
