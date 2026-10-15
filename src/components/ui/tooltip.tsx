import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Tooltip.

   A small label that appears on hover or keyboard focus. The wrapper is
   the positioning context; the label is absolutely centred above (or
   below) the trigger and fades in with a short rise, the same house
   curve the Reveal uses. Native `title` is deliberately not used — it
   cannot be styled and cannot be shown on focus.
--------------------------------------------------------------------------- */

export function Tooltip({
  label,
  side = 'top',
  className,
  children,
}: {
  label: ReactNode
  side?: 'top' | 'bottom'
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const timer = useRef<number | null>(null)

  const show = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(true), 250)
  }
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current)
    setOpen(false)
  }
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-xs font-semibold text-ink-900 shadow-card dark:border-white/10 dark:bg-ink-850 dark:text-ink-50',
            side === 'top'
              ? 'bottom-full left-1/2 mb-2 -translate-x-1/2 -translate-y-1'
              : 'top-full left-1/2 mt-2 -translate-x-1/2 translate-y-1',
            'animate-tooltip-in',
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  )
}
