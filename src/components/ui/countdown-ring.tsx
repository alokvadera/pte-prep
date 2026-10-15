import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   CountdownRing.

   A small ring that drains as a clock
   runs — the at-a-glance urgency
   indicator for a timed section. The
   track is the ink wash, the drain is
   the tone (brand → amber → rose as
   time runs short), and the fraction is
   the remaining share of the budget.
   Purely presentational: the caller owns
   the clock, this only shapes it.
--------------------------------------------------------------------------- */

export function CountdownRing({
  ratio,
  size = 34,
  stroke = 3.5,
  critical = false,
  warning = false,
  className,
}: {
  /** 0 (empty) to 1 (full) of the budget remaining. */
  ratio: number
  size?: number
  stroke?: number
  critical?: boolean
  warning?: boolean
  className?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const p = Math.min(1, Math.max(0, ratio))
  const offset = circumference * (1 - p)

  return (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-ink-200 dark:stroke-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            'transition-[stroke-dashoffset,stroke] duration-1000 ease-linear',
            critical ? 'stroke-rose-500' : warning ? 'stroke-amber-500' : 'stroke-brand-500',
          )}
        />
      </svg>
    </span>
  )
}
