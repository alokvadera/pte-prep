import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   SectionDivider.

   A short gradient hairline that rests
   between sections — a breath, not a
   wall. The gradient travels along its
   length so a still page still has one
   slow thing happening in it.
--------------------------------------------------------------------------- */

export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn('section-divider', className)} aria-hidden="true">
      <span className="section-divider-line" />
    </div>
  )
}
