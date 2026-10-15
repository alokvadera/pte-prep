import React, { createContext, useContext } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Timeline (from ReUI).

   Compound chronological roadmap component following the ReUI specification.
   Composes: Timeline, TimelineItem, TimelineHeader, TimelineDate,
   TimelineTitle, TimelineIndicator, TimelineSeparator, TimelineContent.
--------------------------------------------------------------------------- */

interface TimelineContextValue {
  orientation: 'vertical' | 'horizontal'
}

const TimelineContext = createContext<TimelineContextValue>({ orientation: 'vertical' })

export interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  orientation?: 'vertical' | 'horizontal'
}

export function Timeline({
  orientation = 'vertical',
  className,
  children,
  ...props
}: TimelineProps) {
  return (
    <TimelineContext.Provider value={{ orientation }}>
      <ol
        className={cn(
          'relative flex',
          orientation === 'vertical' ? 'flex-col gap-6' : 'flex-row gap-8 items-start',
          className,
        )}
        {...props}
      >
        {children}
      </ol>
    </TimelineContext.Provider>
  )
}

export interface TimelineItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  step: number
}

export function TimelineItem({ step: _step, className, children, ...props }: TimelineItemProps) {
  const { orientation } = useContext(TimelineContext)
  return (
    <li
      className={cn(
        'group relative flex',
        orientation === 'vertical' ? 'flex-row gap-4' : 'flex-col items-center gap-2',
        className,
      )}
      {...props}
    >
      {children}
    </li>
  )
}

export function TimelineIndicator({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-brand-500 bg-white font-mono text-xs font-bold text-brand-600 shadow-sm dark:bg-ink-850 dark:text-brand-300 dark:border-brand-400',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function TimelineSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { orientation } = useContext(TimelineContext)
  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-ink-200 dark:bg-white/15',
        orientation === 'vertical'
          ? 'absolute left-3.5 top-7 bottom-0 w-0.5 -translate-x-1/2 group-last:hidden'
          : 'absolute top-3.5 left-7 right-0 h-0.5 group-last:hidden',
        className,
      )}
      {...props}
    />
  )
}

export function TimelineHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)} {...props}>
      {children}
    </div>
  )
}

export function TimelineDate({ className, children, ...props }: React.HTMLAttributes<HTMLTimeElement>) {
  return (
    <time className={cn('font-mono text-xs text-ink-500 dark:text-ink-on-dark-muted', className)} {...props}>
      {children}
    </time>
  )
}

export function TimelineTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4 className={cn('font-display text-sm font-bold text-ink-900 dark:text-ink-50', className)} {...props}>
      {children}
    </h4>
  )
}

export function TimelineContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-xs leading-relaxed text-ink-600 dark:text-ink-300', className)} {...props}>
      {children}
    </div>
  )
}
