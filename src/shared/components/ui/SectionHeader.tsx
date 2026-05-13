import React, { forwardRef } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  link?: string
  linkLabel?: string
  variant?: 'default' | 'large' | 'compact'
}

export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  (
    {
      title,
      subtitle,
      icon,
      action,
      link,
      linkLabel = 'View all',
      variant = 'default',
      className = '',
      ...props
    },
    ref
  ) => {
    const titleSizes = {
      compact: 'text-xs',
      default: 'text-sm',
      large: 'text-base',
    }

    return (
      <div ref={ref} className={`flex items-center justify-between mb-4 ${className}`} {...props}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-accent">{icon}</span>}
          <div>
            <h3
              className={`font-semibold text-text-secondary uppercase tracking-widest font-display ${titleSizes[variant]}`}
            >
              {title}
            </h3>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
        {link && !action && (
          <Link
            to={link}
            className="group flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
          >
            {linkLabel}
            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    )
  }
)

SectionHeader.displayName = 'SectionHeader'

export default SectionHeader
