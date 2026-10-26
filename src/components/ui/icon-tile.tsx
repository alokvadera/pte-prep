import * as React from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   IconTile (from ReUI).

   The square container an icon sits in, providing a consistent affordance
   for feature cards, list rows, and empty states.
--------------------------------------------------------------------------- */

export interface IconTileProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'outline' | 'elevated' | 'soft' | 'solid' | 'frame'
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl'
  radius?: 'default' | 'full'
  children: React.ReactNode
}

const sizeClasses: Record<NonNullable<IconTileProps['size']>, string> = {
  xs: 'size-6 text-xs [&>svg]:size-3',
  sm: 'size-8 text-sm [&>svg]:size-3.5',
  default: 'size-10 text-base [&>svg]:size-4',
  lg: 'size-12 text-lg [&>svg]:size-5',
  xl: 'size-16 text-xl [&>svg]:size-6',
}

const variantClasses: Record<NonNullable<IconTileProps['variant']>, string> = {
  outline:
    'border border-ink-900/10 bg-transparent text-ink-900 dark:border-white/10 dark:text-ink-on-dark',
  elevated:
    'border border-ink-900/5 bg-ink-900/5 text-ink-900 shadow-xs dark:border-white/10 dark:bg-white/5 dark:text-ink-on-dark',
  soft: 'bg-brand-500/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-300',
  solid: 'bg-brand-600 text-white shadow-xs dark:bg-brand-500',
  frame: 'p-1 border border-ink-900/10 bg-ink-900/5 dark:border-white/10 dark:bg-white/5',
}

export function IconTile({
  variant = 'outline',
  size = 'default',
  radius = 'default',
  className,
  children,
  ...props
}: IconTileProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-medium transition-colors',
        radius === 'full' ? 'rounded-full' : 'rounded-lg',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
