import React from 'react'
import { Link } from 'react-router-dom'
import { getMoonInfo } from '@/shared/lib/moon'

const ACTIVITY_COLOR: Record<string, string> = {
  plant_above: 'text-green-400',
  harvest:     'text-yellow-400',
  plant_root:  'text-orange-400',
  rest:        'text-text-muted',
  fertilize:   'text-blue-400',
  prune:       'text-purple-400',
}

interface MoonWidgetProps {
  compact?: boolean
}

export default function MoonWidget({ compact = false }: MoonWidgetProps): React.ReactElement {
  const today = new Date()
  const moon = getMoonInfo(today)

  // Build a 7-day mini preview
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    return { date: d, moon: getMoonInfo(d) }
  })

  if (compact) {
    return (
      <div className="rounded-xl bg-bg-card/60 backdrop-blur-sm border border-bg-border/50 p-3">
        <Link to="/moon-calendar" className="flex items-center gap-3 group">
          <div className="text-3xl leading-none select-none group-hover:scale-110 transition-transform">{moon.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text-primary">{moon.phaseNameGeo}</p>
              <span className="text-xs text-text-muted">{moon.illumination}%</span>
            </div>
            <p className={`text-xs ${ACTIVITY_COLOR[moon.agriActivity]} truncate`}>
              {moon.agriAdvice}
            </p>
          </div>
        </Link>
        
        {/* 5-day mini strip */}
        <div className="grid grid-cols-5 gap-1 mt-2">
          {week.slice(0, 5).map(({ date, moon: m }, i) => {
            const isToday = i === 0
            const label = date.toLocaleDateString('ka-GE', { weekday: 'short' }).slice(0, 2)
            return (
              <div
                key={i}
                className={`flex flex-col items-center gap-0.5 rounded py-1 text-center ${
                  isToday ? 'bg-accent/15 border border-accent/30' : 'bg-bg-primary/50'
                }`}
              >
                <span className="text-[9px] text-text-muted uppercase">{label}</span>
                <span className="text-sm leading-none">{m.emoji}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-bg-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">მთვარის კალენდარი</h2>
        <Link to="/moon-calendar" className="text-xs text-accent hover:underline">
          სრული კალენდარი →
        </Link>
      </div>

      <div className="p-4">
        {/* Today's moon */}
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl leading-none select-none">{moon.emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-text-primary">{moon.phaseNameGeo}</p>
            <p className="text-xs text-text-secondary">{moon.phaseName}</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-xs text-text-muted">
                განათება: <span className="text-text-secondary font-medium">{moon.illumination}%</span>
              </span>
              <span className="text-xs text-text-muted">
                ასაკი: <span className="text-text-secondary font-medium">{moon.age.toFixed(1)} დღე</span>
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
              <span>სავსე: <span className="text-yellow-400 font-medium">{Math.round(moon.daysUntilFull)}დ</span></span>
              <span>ახალი: <span className="text-text-secondary font-medium">{Math.round(moon.daysUntilNew)}დ</span></span>
            </div>
          </div>
        </div>

        {/* Agricultural advice */}
        <div className="rounded-md bg-bg-primary border border-bg-border px-3 py-2 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
            სასოფლო-სამ. რეკომენდაცია
          </p>
          <p className={`text-xs font-medium ${ACTIVITY_COLOR[moon.agriActivity]}`}>
            {moon.agriAdvice}
          </p>
        </div>

        {/* 7-day mini strip */}
        <div className="grid grid-cols-7 gap-1">
          {week.map(({ date, moon: m }, i) => {
            const isToday = i === 0
            const label = date.toLocaleDateString('ka-GE', { weekday: 'short' }).slice(0, 2)
            const day = date.getDate()
            return (
              <div
                key={i}
                className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 px-0.5 text-center ${
                  isToday ? 'bg-accent/15 border border-accent/30' : ''
                }`}
              >
                <span className="text-[9px] text-text-muted uppercase">{label}</span>
                <span className="text-base leading-none">{m.emoji}</span>
                <span className={`text-[10px] font-medium ${isToday ? 'text-accent' : 'text-text-secondary'}`}>
                  {day}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
