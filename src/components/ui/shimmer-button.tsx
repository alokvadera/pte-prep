import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   ShimmerButton.

   A wrapper for the page's primary
   action: every few seconds a band
   of light travels across it, so the
   one button that matters catches the
   eye without moving or blinking. The
   sweep pauses between passes — a
   light that never stopped would
   nag.

   The child keeps its own markup and
   behaviour; this only borrows its
   box for the sweep.
--------------------------------------------------------------------------- */

export function ShimmerButton({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn('shimmer-button', className)}>
      {children}
      <span className="shimmer-button-sweep" aria-hidden="true" />
    </span>
  )
}
