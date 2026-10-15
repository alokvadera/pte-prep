import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   GrainOverlay.

   A whisper of film grain across the
   whole page — the texture that makes
   flat colour fields feel printed
   rather than rendered. It is a
   repeating SVG turbulence tile at
   very low opacity: heavy enough to
   break up flatness, light enough
   that no text suffers for it.

   Fixed, pointer-transparent, and
   painted under the toast and dialog
   layers.
--------------------------------------------------------------------------- */

export function GrainOverlay({ className }: { className?: string }) {
  return <div className={cn('grain-overlay', className)} aria-hidden="true" />
}
