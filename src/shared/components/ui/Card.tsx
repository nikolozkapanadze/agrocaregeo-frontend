import React, { forwardRef } from 'react'

type CardVariant = 'default' | 'accent' | 'blue' | 'danger' | 'warning' | 'flat' | 'interactive'
type CardSize = 'sm' | 'md' | 'lg' | 'xl' | 'none'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  size?: CardSize
  as?: 'div' | 'section' | 'article'
  children?: React.ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  default: 'card',
  accent: 'card card-accent',
  blue: 'card card-blue',
  danger: 'card card-danger',
  warning: 'card card-warning',
  flat: 'card-flat p-5',
  interactive: 'card card-interactive',
}

const sizeClasses: Record<CardSize, string> = {
  sm: 'card-sm',
  md: '', // default padding
  lg: 'card-lg',
  xl: 'card-xl',
  none: '!p-0',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      as: Component = 'div',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'

// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, icon, action, className = '', children, ...props }, ref) => {
    if (children) {
      return (
        <div ref={ref} className={`flex items-center justify-between mb-4 ${className}`} {...props}>
          {children}
        </div>
      )
    }

    return (
      <div ref={ref} className={`flex items-center justify-between mb-4 ${className}`} {...props}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
              {icon}
            </div>
          )}
          <div>
            {title && <h3 className="font-semibold text-text-primary">{title}</h3>}
            {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

// Card Content
export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

// Card Footer
export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`mt-4 pt-4 border-t border-white/5 ${className}`} {...props}>
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'

export default Card
