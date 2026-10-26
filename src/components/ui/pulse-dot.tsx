import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   PulseDot.

   A live indicator — the dot that says
   "this is happening now". A soft ring
   expands from the core and fades, on an
   infinite cycle. Used for sync status and
   anything with a heartbeat. Two sizes:
   the inline chip dot and the standalone
   marker.
--------------------------------------------------------------------------- */

export function PulseDot({
  tone = 'mint',
  size = 'md',
  className,
}: {
  tone?: 'mint' | 'brand' | 'amber' | 'rose'
  size?: 'sm' | 'md'
  className?: string
}) {
  const CORE: Record<string, string> = {
    mint: 'bg-mint-500',
    brand: 'bg-brand-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  }
  const RING: Record<string, string> = {
    mint: 'ring-mint-500',
    brand: 'ring-brand-500',
    amber: 'ring-amber-500',
    rose: 'ring-rose-500',
  }

  return (
    <span className={cn('relative inline-flex', size === 'sm' ? 'size-2' : 'size-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'absolute inline-flex h-full w-full animate-ping-slow rounded-full ring-2',
          RING[tone],
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex rounded-full',
          size === 'sm' ? 'size-2' : 'size-2.5',
          CORE[tone],
        )}
      />
    </span>
  )
}
