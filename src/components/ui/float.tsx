import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Float.

   A slow, weightless bob on its own
   ease — for the one small thing on the
   page that is allowed to be alive
   without being looked at. The travel
   and duration are set per use; the
   rhythm is deliberately slower than a
   heartbeat so it reads as drifting,
   not as pulsing.
--------------------------------------------------------------------------- */

export function Float({
  children,
  className,
  y = 10,
  duration = 6,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  /** Peak travel above and below centre, in CSS pixels. */
  y?: number
  duration?: number
  delay?: number
}) {
  return (
    <div
      className={cn('float', className)}
      style={
        {
          '--float-y': `${y}px`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}ms`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
