import React, { useState, useEffect } from 'react'
import { Wind } from 'lucide-react'
import { agronomic } from '@/shared/lib/api'
import { useProfileStore } from '@/shared/stores'

// ─── types ───────────────────────────────────────────────────────────────────

interface SprayWindowDay {
  wx_date: string
  is_forecast: boolean
  score: number
  level: 'optimal' | 'acceptable' | 'marginal' | 'no_spray'
  advice: string
  inversion_risk: boolean
  conditions: {
    wind_ms: number
    t_avg: number
    rh_pct: number
    vpd_kpa: number
    precip_mm: number
  }
  notes: string[]
  parcel_count: number
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const GEO_DAYS = ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ']
const GEO_MONTHS = [
  'იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ',
  'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ',
]

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return GEO_DAYS[d.getDay()]
}

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} ${GEO_MONTHS[d.getMonth()]}`
}

interface LevelStyle {
  border: string
  bg: string
  scoreText: string
  labelText: string
  legendDot: string
}

const LEVEL_STYLES: Record<SprayWindowDay['level'], LevelStyle> = {
  optimal: {
    border: '#388e3c',
    bg: '#388e3c15',
    scoreText: '#388e3c',
    labelText: 'ოპტიმალური',
    legendDot: '#388e3c',
  },
  acceptable: {
    border: '#1976d2',
    bg: '#1976d215',
    scoreText: '#1976d2',
    labelText: 'მისაღები',
    legendDot: '#1976d2',
  },
  marginal: {
    border: '#fbc02d',
    bg: '#fbc02d15',
    scoreText: '#fbc02d',
    labelText: 'მარგინალური',
    legendDot: '#fbc02d',
  },
  no_spray: {
    border: '#d32f2f',
    bg: '#d32f2f15',
    scoreText: '#d32f2f',
    labelText: 'ნუ ასხამ',
    legendDot: '#d32f2f',
  },
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface DayCardProps {
  day: SprayWindowDay
}

function DayCard({ day }: DayCardProps): React.ReactElement {
  const style = LEVEL_STYLES[day.level]
  const { conditions, notes } = day

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 border"
      style={{ borderColor: style.border, backgroundColor: style.bg }}
    >
      {/* Date + day of week */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[#e6edf3] font-semibold text-sm">{dateLabel(day.wx_date)}</div>
          <div className="text-[#8b949e] text-xs">{dayLabel(day.wx_date)}</div>
        </div>
        {day.is_forecast && (
          <span className="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded">
            პრ.
          </span>
        )}
      </div>

      {/* Big score */}
      <div className="text-center">
        <div
          className="text-4xl font-bold leading-none"
          style={{ color: style.scoreText }}
        >
          {day.score}
        </div>
        <div className="text-xs mt-1 font-medium" style={{ color: style.scoreText }}>
          {style.labelText}
        </div>
      </div>

      {/* Inversion risk badge */}
      {day.inversion_risk && (
        <div className="flex justify-center">
          <span className="text-xs bg-orange-900/40 text-orange-400 border border-orange-800/60 px-2 py-0.5 rounded-full">
            ⚠️ ინვ. რისკი
          </span>
        </div>
      )}

      {/* Condition pills */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        <span className="text-[11px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded-full">
          💨 {conditions.wind_ms.toFixed(1)}m/s
        </span>
        <span className="text-[11px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded-full">
          🌡️ {conditions.t_avg.toFixed(1)}°C
        </span>
        <span className="text-[11px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded-full">
          💧 {conditions.rh_pct.toFixed(0)}%
        </span>
        <span className="text-[11px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded-full">
          🌧️ {conditions.precip_mm.toFixed(1)}mm
        </span>
      </div>

      {/* Advice */}
      {day.advice && (
        <div className="text-xs text-[#8b949e] text-center leading-relaxed border-t border-[#21262d] pt-2">
          {day.advice}
        </div>
      )}

      {/* Notes list (first 3) */}
      {notes.length > 0 && (
        <ul className="space-y-0.5 border-t border-[#21262d] pt-2">
          {notes.slice(0, 3).map((note, i) => (
            <li key={i} className="text-[10px] text-[#6e7681] flex items-start gap-1">
              <span className="mt-0.5 shrink-0">·</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function SprayWindows(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [days, setDays] = useState<SprayWindowDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    agronomic.sprayWindows(profileId)
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.wx_date.localeCompare(b.wx_date))
        setDays(sorted)
      })
      .catch(() => setError('სპრეის ფანჯრების მონაცემები ვერ ჩაიტვირთა'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[#e6edf3]">
          <Wind className="h-6 w-6 text-[#58a6ff]" />
          სპრეის ფანჯრები
        </h1>
        <p className="mt-1 text-[#8b949e]">
          10-დღიანი სპრეის კალენდარი — ქარი, ტემპ., ტენი, წვიმა, VPD
        </p>
      </div>

      {/* Score legend */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
        <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-3">
          ქულის განმარტება
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { range: '80–100', label: 'ოპტიმალური', sub: 'ასხამეთ ახლავე', level: 'optimal' },
              { range: '60–79', label: 'მისაღები', sub: 'მცირე შეზღუდვები', level: 'acceptable' },
              { range: '40–59', label: 'მარგინალური', sub: 'მოიცადეთ თუ შეიძლება', level: 'marginal' },
              { range: '0–39', label: 'ნუ ასხამ', sub: 'არ ასხათ', level: 'no_spray' },
            ] as const
          ).map((item) => {
            const s = LEVEL_STYLES[item.level]
            return (
              <div
                key={item.level}
                className="flex items-start gap-2 rounded-lg p-3 border"
                style={{ borderColor: s.border, backgroundColor: s.bg }}
              >
                <span
                  className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: s.legendDot }}
                />
                <div>
                  <div className="text-xs font-bold" style={{ color: s.scoreText }}>
                    {item.range}
                  </div>
                  <div className="text-xs font-medium text-[#e6edf3]">{item.label}</div>
                  <div className="text-[10px] text-[#6e7681]">{item.sub}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 text-[#8b949e]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#21262d] border-t-[#58a6ff]" />
            <span className="text-sm">სპრეის ფანჯრები იტვირთება...</span>
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
      {!loading && !error && days.length === 0 && (
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">💨</div>
          <div className="text-[#8b949e]">სპრეის ფანჯრების მონაცემი არ არის. გაუშვით ამინდის სინქრონიზაცია.</div>
        </div>
      )}

      {/* Calendar grid */}
      {!loading && !error && days.length > 0 && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                { level: 'optimal', label: 'ოპტიმალური' },
                { level: 'acceptable', label: 'მისაღები' },
                { level: 'marginal', label: 'მარგინალური' },
                { level: 'no_spray', label: 'ნუ ასხამ' },
              ] as const
            ).map(({ level, label }) => {
              const count = days.filter((d) => d.level === level).length
              const s = LEVEL_STYLES[level]
              return (
                <div
                  key={level}
                  className="bg-[#161b22] border border-[#21262d] rounded-xl px-4 py-3 text-center"
                >
                  <div className="text-2xl font-bold" style={{ color: s.scoreText }}>
                    {count}
                  </div>
                  <div className="text-xs text-[#8b949e] mt-0.5">{label}</div>
                </div>
              )
            })}
          </div>

          {/* Day cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {days.map((day) => (
              <DayCard key={day.wx_date} day={day} />
            ))}
          </div>

          {/* VPD detail table */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#21262d]">
              <h3 className="text-[#e6edf3] font-semibold text-sm">დეტალური პირობები</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    {['თარიღი', 'ქულა', 'ქარი m/s', 'ტ° C', 'ტენი %', 'VPD kPa', 'წვიმა mm', 'ნაკვ.'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs text-[#8b949e] font-medium whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day, idx) => {
                    const s = LEVEL_STYLES[day.level]
                    return (
                      <tr
                        key={day.wx_date}
                        className={`border-b border-[#21262d]/60 hover:bg-[#21262d]/50 transition-colors ${
                          idx % 2 === 1 ? 'bg-[#0d1117]/30' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 text-[#e6edf3] font-medium whitespace-nowrap">
                          {dateLabel(day.wx_date)}{' '}
                          <span className="text-[#8b949e] font-normal text-xs">
                            {dayLabel(day.wx_date)}
                          </span>
                          {day.is_forecast && (
                            <span className="ml-1 text-[10px] text-[#6e7681]">↑</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="font-bold"
                            style={{ color: s.scoreText }}
                          >
                            {day.score}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[#e6edf3]">
                          {day.conditions.wind_ms.toFixed(1)}
                        </td>
                        <td className="px-4 py-2.5 text-[#e6edf3]">
                          {day.conditions.t_avg.toFixed(1)}
                        </td>
                        <td className="px-4 py-2.5 text-[#e6edf3]">
                          {day.conditions.rh_pct.toFixed(0)}
                        </td>
                        <td className="px-4 py-2.5 text-[#e6edf3]">
                          {day.conditions.vpd_kpa.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-[#42a5f5]">
                          {day.conditions.precip_mm.toFixed(1)}
                        </td>
                        <td className="px-4 py-2.5 text-[#8b949e] text-xs">
                          {day.parcel_count}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
