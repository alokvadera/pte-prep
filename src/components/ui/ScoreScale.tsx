import { cn } from '../../lib/cn'

/**
 * The 10 to 90 scale.
 *
 * The one recurring graphic in the product, and the only place a colour other
 * than ink is allowed to mean something on its own: the marker is the mark red
 * because a mark is what it is. It is a data graphic, so it carries a text
 * alternative rather than relying on sight.
 *
 * Ticks sit every ten points. A landmark (50 and 65 are the two most commonly
 * required scores, 79 and 90 the next) is drawn longer and labelled; the rest
 * are unlabelled so the axis stays quiet.
 */
const LANDMARKS = new Set([10, 30, 50, 65, 79, 90])

function pct(value: number) {
  const clamped = Math.min(90, Math.max(10, value))
  return ((clamped - 10) / 80) * 100
}

export function ScoreScale({
  value,
  label = 'Score',
  className,
  showValue = true,
}: {
  /** Marker position on the 10 to 90 scale. */
  value: number
  label?: string
  className?: string
  showValue?: boolean
}) {
  const ticks = [10, 20, 30, 40, 50, 60, 65, 70, 79, 80, 90]
  const landmarks = ticks.filter((t) => LANDMARKS.has(t))
  const marker = pct(value)

  return (
    <div className={cn('w-full', className)}>
      <div
        className="relative h-14"
        role="img"
        aria-label={`${label} ${value} on the PTE 10 to 90 scale`}
      >
        <div className="bg-ink-200 dark:bg-white/15 absolute inset-x-0 bottom-0 h-px" />
        <div
          className="bg-ink-900 dark:bg-ink-50 absolute bottom-0 left-0 h-[3px] transition-[width] duration-500 ease-out"
          style={{ width: `${marker}%` }}
        />
        {ticks.map((t) => (
          <span
            key={t}
            aria-hidden="true"
            className={cn(
              'bg-ink-300 dark:bg-white/25 absolute bottom-0 w-px',
              LANDMARKS.has(t) ? 'h-3' : 'h-1.5',
            )}
            style={{ left: `${pct(t)}%` }}
          />
        ))}
        {showValue ? (
          <span
            aria-hidden="true"
            className="absolute bottom-[3px] flex -translate-x-1/2 flex-col items-center transition-[left] duration-500 ease-out"
            style={{ left: `${marker}%` }}
          >
            <span className="figure text-mark-600 dark:text-mark-400 text-2xl leading-none">
              {value}
            </span>
            <span className="bg-mark-600 dark:bg-mark-400 mt-1 h-6 w-px" />
          </span>
        ) : null}
      </div>
      <div className="relative mt-1.5 h-4">
        {landmarks.map((t) => (
          <span
            key={t}
            aria-hidden="true"
            className="text-ink-500 dark:text-ink-on-dark-muted absolute -translate-x-1/2 font-mono text-xs"
            style={{ left: `${pct(t)}%` }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
