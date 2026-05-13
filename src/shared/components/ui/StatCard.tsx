import React, { forwardRef } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type TrendDirection = 'up' | 'down' | 'neutral'

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number
  label: string
  icon?: React.ReactNode
  trend?: {
    value: string | number
    direction: TrendDirection
    label?: string
  }
  variant?: 'default' | 'accent' | 'compact'
  valueColor?: string
}

const trendIcons: Record<TrendDirection, React.ReactNode> = {
  up: <TrendingUp className="h-3 w-3" />,
  down: <TrendingDown className="h-3 w-3" />,
  neutral: <Minus className="h-3 w-3" />,
}

const trendColors: Record<TrendDirection, string> = {
  up: 'text-accent',
  down: 'text-danger',
  neutral: 'text-text-muted',
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      value,
      label,
      icon,
      trend,
      variant = 'default',
      valueColor,
      className = '',
      ...props
    },
    ref
  ) => {
    if (variant === 'compact') {
      return (
        <div
          ref={ref}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/5 ${className}`}
          {...props}
        >
          {icon && <div className="text-accent">{icon}</div>}
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-lg font-bold font-mono tabular-nums"
                style={valueColor ? { color: valueColor } : undefined}
              >
                {value}
              </span>
              {trend && (
                <span className={`flex items-center gap-0.5 text-xs ${trendColors[trend.direction]}`}>
                  {trendIcons[trend.direction]}
                  {trend.value}
                </span>
              )}
            </div>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
          </div>
        </div>
      )
    }

    return (
      <div ref={ref} className={`stat-card ${className}`} {...props}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span
                className={variant === 'accent' ? 'stat-value-lg' : 'stat-value'}
                style={valueColor ? { color: valueColor } : undefined}
              >
                {value}
              </span>
              {trend && (
                <span className={`stat-trend ${trendColors[trend.direction]}`}>
                  {trendIcons[trend.direction]}
                  {trend.value}
                  {trend.label && <span className="text-text-muted ml-1">{trend.label}</span>}
                </span>
              )}
            </div>
            <p className="stat-label">{label}</p>
          </div>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              {icon}
            </div>
          )}
        </div>
      </div>
    )
  }
)

StatCard.displayName = 'StatCard'

export default StatCard
