/* ---------------------------------------------------------------------------
   AuroraBackground.

   Three slow-drifting candy blobs — mint,
   brand indigo and violet — blurred hard
   so they read as light on the cream
   ground rather than as shapes. Used
   behind a hero, it gives the page a
   sky without leaving the palette.
   Reduced motion gets a static frame.
--------------------------------------------------------------------------- */

import { cn } from '../../lib/cn'

export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div className={cn('aurora', className)} aria-hidden="true">
      <span className="aurora-blob aurora-blob-a" />
      <span className="aurora-blob aurora-blob-b" />
      <span className="aurora-blob aurora-blob-c" />
    </div>
  )
}
