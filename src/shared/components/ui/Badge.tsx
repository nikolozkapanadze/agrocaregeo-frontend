import React, { forwardRef } from 'react'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  children?: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'badge-sm',
  md: '',
  lg: 'badge-lg',
}

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-accent',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-sensor',
  neutral: 'bg-text-muted',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', size = 'md', dot = false, className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`badge ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} mr-1.5`}
            style={{ boxShadow: '0 0 6px currentColor' }}
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge
