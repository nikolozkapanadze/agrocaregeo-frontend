import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMoonInfo, getMoonAge } from '@/shared/lib/moon'

const MONTHS_GEO = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
]
const WEEKDAYS_GEO = ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ']

const ACTIVITY_COLOR: Record<string, string> = {
  plant_above: 'bg-green-900/40 border-green-700/40 text-green-300',
  harvest:     'bg-yellow-900/40 border-yellow-700/40 text-yellow-300',
  plant_root:  'bg-orange-900/40 border-orange-700/40 text-orange-300',
  rest:        'bg-bg-border/40 border-bg-border text-text-muted',
  fertilize:   'bg-blue-900/40 border-blue-700/40 text-blue-300',
  prune:       'bg-purple-900/40 border-purple-700/40 text-purple-300',
}

const ACTIVITY_LABEL: Record<string, string> = {
  plant_above: 'ზემოთ დარგვა',
  harvest:     'კრეფა / მოსავალი',
  plant_root:  'ფესვი / ბოლქვი',
  rest:        'მოსვენება',
  fertilize:   'სასუქი',
  prune:       'გასხვლა',
}

interface DayInfo {
  date: Date
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  moonEmoji: string
  moonPhaseGeo: string
  illumination: number
  agriActivity: string
}

function buildCalendar(year: number, month: number): DayInfo[] {
  const today = new Date()
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const cells: DayInfo[] = []

  // Pad with previous month days
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrev - i)
    const m = getMoonInfo(d)
    cells.push({ date: d, day: d.getDate(), isCurrentMonth: false, isToday: false, moonEmoji: m.emoji, moonPhaseGeo: m.phaseNameGeo, illumination: m.illumination, agriActivity: m.agriActivity })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const m = getMoonInfo(date)
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
    cells.push({ date, day: d, isCurrentMonth: true, isToday, moonEmoji: m.emoji, moonPhaseGeo: m.phaseNameGeo, illumination: m.illumination, agriActivity: m.agriActivity })
  }

  // Pad with next month
  const remainder = cells.length % 7
  if (remainder > 0) {
    for (let d = 1; d <= 7 - remainder; d++) {
      const date = new Date(year, month + 1, d)
      const m = getMoonInfo(date)
      cells.push({ date, day: d, isCurrentMonth: false, isToday: false, moonEmoji: m.emoji, moonPhaseGeo: m.phaseNameGeo, illumination: m.illumination, agriActivity: m.agriActivity })
    }
  }

  return cells
}

export default function MoonCalendar(): React.ReactElement {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<DayInfo | null>(null)

  const todayMoon = getMoonInfo(today)
  const cells = buildCalendar(year, month)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // Find moon phase change days for legend indicators
  function isMajorPhase(day: DayInfo): string | null {
    const age = getMoonAge(day.date)
    if (age < 1 || age > 28.53) return '🌑'
    if (age >= 6.88 && age < 8.38) return '🌓'
    if (age >= 13.77 && age < 15.77) return '🌕'
    if (age >= 21.15 && age < 23.15) return '🌗'
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">მთვარის კალენდარი</h1>
        <p className="text-sm text-text-secondary">სასოფლო-სამეურნეო მთვარის ფაზები და რეკომენდაციები</p>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-3">
          <span className="text-4xl">{todayMoon.emoji}</span>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">დღეს</p>
            <p className="text-base font-bold text-text-primary">{todayMoon.phaseNameGeo}</p>
            <p className="text-xs text-text-secondary">{todayMoon.phaseName}</p>
          </div>
        </div>
        <div className="card flex flex-col gap-1">
          <p className="text-xs text-text-muted uppercase tracking-wider">განათება</p>
          <p className="text-2xl font-bold text-text-primary">{todayMoon.illumination}%</p>
          <div className="h-1.5 rounded-full bg-bg-border overflow-hidden">
            <div className="h-full rounded-full bg-yellow-400" style={{ width: `${todayMoon.illumination}%` }} />
          </div>
        </div>
        <div className="card flex flex-col gap-1">
          <p className="text-xs text-text-muted uppercase tracking-wider">სავსე მთვარემდე</p>
          <p className="text-2xl font-bold text-yellow-400">{Math.round(todayMoon.daysUntilFull)} დღე</p>
          <p className="text-xs text-text-secondary">🌕 {todayMoon.illumination < 50 ? 'იზრდება' : 'მახლობელია'}</p>
        </div>
        <div className="card flex flex-col gap-1">
          <p className="text-xs text-text-muted uppercase tracking-wider">ახალ მთვარემდე</p>
          <p className="text-2xl font-bold text-text-primary">{Math.round(todayMoon.daysUntilNew)} დღე</p>
          <p className="text-xs text-text-secondary">🌑 ციკლის განახლება</p>
        </div>
      </div>

      {/* Today's agri advice */}
      <div className={`card border ${ACTIVITY_COLOR[todayMoon.agriActivity]}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 opacity-70">
          {ACTIVITY_LABEL[todayMoon.agriActivity]} — დღევანდელი რეკომენდაცია
        </p>
        <p className="text-sm font-medium">{todayMoon.agriAdvice}</p>
      </div>

      {/* Calendar */}
      <div className="card p-0 overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between border-b border-bg-border px-4 py-3">
          <button onClick={prevMonth} className="btn-secondary p-1.5">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-bold text-text-primary">
            {MONTHS_GEO[month]} {year}
          </h2>
          <button onClick={nextMonth} className="btn-secondary p-1.5">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-bg-border">
          {WEEKDAYS_GEO.map(wd => (
            <div key={wd} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const major = isMajorPhase(cell)
            const isSelected = selected?.date.toDateString() === cell.date.toDateString()
            return (
              <button
                key={i}
                onClick={() => setSelected(isSelected ? null : cell)}
                className={`
                  relative flex flex-col items-center gap-0.5 py-2 px-1 border-b border-r border-bg-border/50
                  text-center transition-colors hover:bg-bg-border/30 min-h-[64px]
                  ${!cell.isCurrentMonth ? 'opacity-30' : ''}
                  ${cell.isToday ? 'bg-accent/10' : ''}
                  ${isSelected ? 'bg-accent/20 ring-1 ring-inset ring-accent/50' : ''}
                `}
              >
                {cell.isToday && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-accent" />
                )}
                <span className={`text-xs font-semibold ${cell.isToday ? 'text-accent' : 'text-text-primary'}`}>
                  {cell.day}
                </span>
                <span className="text-xl leading-none">{major ?? cell.moonEmoji}</span>
                <span className="text-[8px] text-text-muted leading-tight hidden sm:block">
                  {cell.illumination}%
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className={`card border ${ACTIVITY_COLOR[selected.agriActivity]}`}>
          <div className="flex items-start gap-4">
            <span className="text-4xl">{selected.moonEmoji}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-text-primary">
                {selected.date.toLocaleDateString('ka-GE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-base font-semibold mt-0.5">{selected.moonPhaseGeo}</p>
              <p className="text-xs mt-2 leading-relaxed">{getMoonInfo(selected.date).agriAdvice}</p>
              <p className="text-xs mt-1 opacity-70">
                განათება: {selected.illumination}% · {ACTIVITY_LABEL[selected.agriActivity]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">ლეგენდა</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(ACTIVITY_LABEL).map(([key, label]) => (
            <div key={key} className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${ACTIVITY_COLOR[key]}`}>
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs text-text-muted">
          <span>🌑 მთვარეობა</span>
          <span>🌓 პირველი მეოთხედი</span>
          <span>🌕 სავსე მთვარე</span>
          <span>🌗 ბოლო მეოთხედი</span>
        </div>
      </div>
    </div>
  )
}
