import React from 'react'
import type { ZoneStats } from '@/shared/lib/api'

interface Props {
  stats: ZoneStats
  compact?: boolean
}

interface ZoneCardConfig {
  key: keyof Omit<ZoneStats, 'total'>
  label: string
  borderColor: string
  textColor: string
  bgColor: string
}

const zoneCards: ZoneCardConfig[] = [
  {
    key: 'critical',
    label: 'კრიტიკული',
    borderColor: 'border-l-[#d32f2f]',
    textColor: 'text-[#d32f2f]',
    bgColor: 'bg-red-950/20',
  },
  {
    key: 'high',
    label: 'მაღალი',
    borderColor: 'border-l-[#f57c00]',
    textColor: 'text-[#f57c00]',
    bgColor: 'bg-orange-950/20',
  },
  {
    key: 'medium',
    label: 'საშუალო',
    borderColor: 'border-l-[#fbc02d]',
    textColor: 'text-[#fbc02d]',
    bgColor: 'bg-yellow-950/20',
  },
  {
    key: 'ok',
    label: 'OK',
    borderColor: 'border-l-[#388e3c]',
    textColor: 'text-[#388e3c]',
    bgColor: 'bg-green-950/20',
  },
]

export default function ZoneStatsCards({ stats, compact = false }: Props): React.ReactElement {
  const total = stats.total || 1

  if (compact) {
    const dotColors: Record<string, string> = {
      critical: '#d32f2f', high: '#f57c00', medium: '#fbc02d', ok: '#388e3c',
    }
    return (
      <div className="flex items-center gap-2.5">
        {zoneCards.map((card) => {
          const count = stats[card.key] as number
          if (count === 0) return null
          return (
            <span key={card.key} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: dotColors[card.key] }} />
              <span className={`text-xs font-bold ${card.textColor}`}>{count}</span>
              <span className="text-[10px] text-text-muted">{card.label}</span>
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {zoneCards.map((card) => {
        const count = stats[card.key] as number
        const pct = Math.round((count / total) * 100)

        return (
          <div
            key={card.key}
            className={`card border-l-4 ${card.borderColor} ${card.bgColor} flex flex-col gap-1`}
          >
            <div className={`text-3xl font-bold ${card.textColor}`}>{count}</div>
            <div className="text-sm font-medium text-text-primary">{card.label}</div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-bg-border">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor:
                    card.key === 'critical'
                      ? '#d32f2f'
                      : card.key === 'high'
                        ? '#f57c00'
                        : card.key === 'medium'
                          ? '#fbc02d'
                          : '#388e3c',
                }}
              />
            </div>
            <div className="text-xs text-text-muted">{pct}% / {stats.total} ნაკვეთი</div>
          </div>
        )
      })}
    </div>
  )
}
