import { cn } from '../../lib/cn'

/**
 * The spinner used while async data loads. Brand ring with a
 * rotating arc — the same mark the site already used inline,
 * codified so every loading state matches.
 */
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'border-brand-500/25 border-t-brand-500 inline-block animate-spin rounded-full border-2',
        size === 'sm' && 'size-4',
        size === 'md' && 'size-7',
        size === 'lg' && 'size-10',
        className,
      )}
    />
  )
}
