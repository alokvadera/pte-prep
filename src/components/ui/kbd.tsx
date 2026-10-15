import { cn } from '../../lib/cn'

/**
 * A keyboard-key chip, for the ⌘K palette hint and other
 * shortcut callouts. Rendered as <kbd> so assistive tech
 * reads it as a key, not as prose.
 */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'border-ink-300 bg-ink-100 text-ink-700 inline-flex h-5 min-w-5 items-center justify-center rounded-md border-b-2 px-1.5 font-mono text-[11px] font-bold dark:border-white/20 dark:bg-white/10 dark:text-ink-on-dark',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
