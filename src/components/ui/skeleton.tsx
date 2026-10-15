import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Skeleton.

   A placeholder for content that is about to arrive — the
   loading state for cards, rows and stat blocks. The pulse
   is the house one (soft, 2s), and the shape mirrors the
   card language: rounded, never razor.
--------------------------------------------------------------------------- */

export function Skeleton({
  className,
  variant = 'rect',
}: {
  className?: string
  variant?: 'rect' | 'circle' | 'text'
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-skeleton-pulse bg-ink-100 dark:bg-white/8',
        variant === 'circle' && 'shrink-0 rounded-full',
        variant === 'text' && 'h-3.5 rounded-md',
        variant === 'rect' && 'rounded-xl',
        className,
      )}
    />
  )
}

/** A whole card-shaped placeholder, for async panels. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card-solid space-y-3 p-5', className)}>
      <Skeleton variant="text" className="w-1/3" />
      <Skeleton variant="text" className="w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
