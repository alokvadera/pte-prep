import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Stepper.

   A horizontal progress line for a fixed sequence — the
   "Ready in three steps" strip on Home, or a multi-page
   setup flow. Each step is a numbered candy square; a
   finished step carries a check, the current step is
   filled brand, and the connector between steps fills
   behind the completed ones.
--------------------------------------------------------------------------- */

export function Stepper({
  steps,
  current,
  className,
}: {
  steps: string[]
  /** Zero-based index of the active step. */
  current: number
  className?: string
}) {
  return (
    <ol className={cn('flex items-start', className)}>
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        const last = i === steps.length - 1
        return (
          <li key={label} className={cn('flex items-start', !last && 'flex-1')}>
            <div className="flex flex-col items-center gap-2">
              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'num-marker grid size-8 shrink-0 place-items-center rounded-xl text-sm',
                  done && 'num-marker-mint',
                  active && 'num-marker scale-110 shadow-[0_4px_0_rgb(45_42_94/0.15)]',
                  !done && !active && 'num-marker-quiet',
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  'max-w-24 text-center text-xs font-semibold',
                  active
                    ? 'text-ink-900 dark:text-white'
                    : done
                      ? 'text-mint-700 dark:text-mint-300'
                      : 'text-ink-500 dark:text-ink-on-dark-muted',
                )}
              >
                {label}
              </span>
            </div>
            {!last ? (
              <span
                aria-hidden="true"
                className={cn(
                  'mx-2 mt-4 h-0.5 flex-1 rounded-full transition-colors duration-500',
                  done ? 'bg-mint-500' : 'bg-ink-200 dark:bg-white/10',
                )}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
