import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   ScrollDownIndicator.

   A mouse outline with a wheel dot
   that travels down it — the oldest
   and still the clearest way to say
   "there is more below". Sits at the
   hero's bottom edge, centred, and
   is decorative: it carries no
   destination, so it is aria-hidden.
--------------------------------------------------------------------------- */

export function ScrollDownIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('scroll-down', className)} aria-hidden="true">
      <span className="scroll-down-mouse">
        <span className="scroll-down-wheel" />
      </span>
      <span className="scroll-down-label">scroll</span>
    </div>
  )
}
