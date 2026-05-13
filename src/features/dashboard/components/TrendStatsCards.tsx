import React from 'react'
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react'
import type { TrendSummary } from '@/shared/lib/api'

interface Props {
  summary: TrendSummary | null
  loading?: boolean
  compact?: boolean
}

interface TrendCard {
  key: 'improving' | 'stable' | 'declining' | 'unknown'
  label: string
  labelGe: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
}

const trendCards: TrendCard[] = [
  {
    key: 'improving',
    label: 'იზრდება',
    labelGe: 'ვეგეტაცია იზრდება',
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-950/30',
    borderColor: 'border-green-500/30',
  },
  {
    key: 'stable',
    label: 'სტაბილური',
    labelGe: 'სტაბილური მდგომარეობა',
    icon: Minus,
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/30',
    borderColor: 'border-blue-500/30',
  },
  {
    key: 'declining',
    label: 'ქვეითება',
    labelGe: 'ვეგეტაცია ქვეითდება',
    icon: TrendingDown,
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/30',
    borderColor: 'border-orange-500/30',
  },
  {
    key: 'unknown',
    label: 'უცნობი',
    labelGe: 'მონაცემები არ არის',
    icon: HelpCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-950/30',
    borderColor: 'border-gray-500/30',
  },
]

export default function TrendStatsCards({ summary, loading, compact = false }: Props): React.ReactElement {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-24 rounded-lg" />
        ))}
      </div>
    )
  }

  const total = summary?.total_parcels || 1
  const counts = summary?.summary || { improving: 0, stable: 0, declining: 0, unknown: 0 }

  if (compact) {
    const trendSymbols: Record<string, string> = {
      improving: '↑', stable: '→', declining: '↓', unknown: '?',
    }
    return (
      <div className="flex items-center gap-2.5">
        {trendCards.map((card) => {
          const count = counts[card.key]
          if (count === 0) return null
          return (
            <span key={card.key} className="flex items-center gap-0.5">
              <span className={`text-[10px] font-bold ${card.color}`}>{trendSymbols[card.key]}{count}</span>
              <span className="text-[9px] text-text-muted">{card.label}</span>
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {trendCards.map((card) => {
        const count = counts[card.key]
        const pct = Math.round((count / total) * 100)
        const Icon = card.icon

        return (
          <div
            key={card.key}
            className={`card border ${card.borderColor} ${card.bgColor} flex flex-col gap-2`}
          >
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${card.color}`}>{count}</div>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">{card.labelGe}</div>
              <div className="text-xs text-text-muted">{card.label}</div>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-bg-border">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor:
                    card.key === 'improving'
                      ? '#4ade80'
                      : card.key === 'stable'
                        ? '#60a5fa'
                        : card.key === 'declining'
                          ? '#fb923c'
                          : '#9ca3af',
                }}
              />
            </div>
            <div className="text-xs text-text-muted">{pct}% / {total} ნაკვეთი</div>
          </div>
        )
      })}
    </div>
  )
}
