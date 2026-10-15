import { cn } from '../../lib/cn'

/** A hairline divider between stacked content. */
export function Separator({
  orientation = 'horizontal',
  className,
}: {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-ink-200 dark:bg-white/10',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  )
}
