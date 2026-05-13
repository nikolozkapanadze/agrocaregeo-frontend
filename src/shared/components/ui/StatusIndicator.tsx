import React, { forwardRef } from 'react'

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType
  label?: string
  pulse?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusColors: Record<StatusType, { bg: string; text: string; glow: string }> = {
  success: {
    bg: 'bg-accent',
    text: 'text-accent',
    glow: 'rgba(34,197,94,0.4)',
  },
  warning: {
    bg: 'bg-warning',
    text: 'text-warning',
    glow: 'rgba(245,158,11,0.4)',
  },
  danger: {
    bg: 'bg-danger',
    text: 'text-danger',
    glow: 'rgba(239,68,68,0.4)',
  },
  info: {
    bg: 'bg-sensor',
    text: 'text-sensor',
    glow: 'rgba(14,165,233,0.4)',
  },
  neutral: {
    bg: 'bg-text-muted',
    text: 'text-text-muted',
    glow: 'rgba(71,85,105,0.4)',
  },
}

const sizeClasses: Record<string, { dot: string; text: string }> = {
  sm: { dot: 'w-1.5 h-1.5', text: 'text-xs' },
  md: { dot: 'w-2 h-2', text: 'text-sm' },
  lg: { dot: 'w-2.5 h-2.5', text: 'text-sm' },
}

export const StatusIndicator = forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ status, label, pulse = true, size = 'md', className = '', ...props }, ref) => {
    const colors = statusColors[status]
    const sizes = sizeClasses[size]

    return (
      <div ref={ref} className={`flex items-center gap-2 ${className}`} {...props}>
        <span
          className={`relative inline-flex rounded-full ${colors.bg} ${sizes.dot}`}
          style={{ boxShadow: `0 0 8px ${colors.glow}` }}
        >
          {pulse && (
            <span
              className={`absolute inset-0 rounded-full animate-ping ${colors.bg}`}
              style={{ animationDuration: '1.5s', opacity: 0.4 }}
            />
          )}
        </span>
        {label && <span className={`${sizes.text} ${colors.text} font-medium`}>{label}</span>}
      </div>
    )
  }
)

StatusIndicator.displayName = 'StatusIndicator'

export default StatusIndicator
