import React, { forwardRef } from 'react'

type ProgressVariant = 'accent' | 'danger' | 'warning' | 'info' | 'gradient'

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: ProgressVariant
  showLabel?: boolean
  labelFormat?: (value: number, max: number) => string
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

const variantClasses: Record<ProgressVariant, string> = {
  accent: 'progress-bar-fill-accent',
  danger: 'progress-bar-fill-danger',
  warning: 'progress-bar-fill-warning',
  info: 'bg-sensor shadow-glow-blue-sm',
  gradient: 'bg-gradient-to-r from-accent via-sensor to-accent',
}

const sizeClasses: Record<string, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      variant = 'accent',
      showLabel = false,
      labelFormat,
      size = 'md',
      animated = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const label = labelFormat ? labelFormat(value, max) : `${Math.round(percentage)}%`

    return (
      <div ref={ref} className={className} {...props}>
        {showLabel && (
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-text-secondary font-medium">{label}</span>
          </div>
        )}
        <div className={`progress-bar ${sizeClasses[size]}`}>
          <div
            className={`progress-bar-fill ${variantClasses[variant]} ${animated ? 'animate-pulse' : ''}`}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'

export default ProgressBar
