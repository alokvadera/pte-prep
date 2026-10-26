import * as React from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Alert (from shadcn/ui).

   Accessible notification callout with semantic variants, icons,
   title, and description.
--------------------------------------------------------------------------- */

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'destructive'
}

const ALERT_VARIANTS: Record<NonNullable<AlertProps['variant']>, string> = {
  default:
    'border-ink-200 bg-white text-ink-900 dark:border-white/10 dark:bg-ink-850 dark:text-ink-100',
  info: 'border-brand-500/30 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:border-brand-400/25 dark:text-brand-300',
  success:
    'border-mint-500/30 bg-mint-50 text-mint-700 dark:bg-mint-500/10 dark:border-mint-400/25 dark:text-mint-300',
  warning:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:border-amber-400/25 dark:text-amber-300',
  destructive:
    'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:bg-rose-500/10 dark:border-rose-400/25 dark:text-rose-300',
}

export function Alert({ variant = 'default', className, children, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-2xl border p-4 shadow-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-5',
        ALERT_VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function AlertTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4
      className={cn('mb-1 font-display text-sm font-bold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h4>
  )
}

export function AlertDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div className={cn('text-xs leading-relaxed opacity-90', className)} {...props}>
      {children}
    </div>
  )
}
