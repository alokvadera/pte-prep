import { CountUp } from './motion'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   RadialProgress.

   The score ring: a candy circle whose fill is the
   score on the 10–90 scale. The track is the ink
   wash, the fill is the tone, and the number rolls
   up in the centre with CountUp. Built as plain SVG
   so it costs nothing and animates with the same
   draw-in the other charts use.
--------------------------------------------------------------------------- */

export function RadialProgress({
  value,
  max = 90,
  min = 10,
  size = 120,
  stroke = 10,
  tone = 'brand',
  label,
  className,
}: {
  value: number
  max?: number
  min?: number
  size?: number
  stroke?: number
  tone?: 'brand' | 'mint' | 'amber' | 'rose'
  label?: string
  className?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0
  const offset = circumference * (1 - pct)

  const FILL: Record<string, string> = {
    brand: 'stroke-brand-500',
    mint: 'stroke-mint-500',
    amber: 'stroke-amber-500',
    rose: 'stroke-rose-500',
  }

  return (
    <div
      className={cn('relative inline-grid place-items-center', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={label ?? 'Progress'}
      style={{ width: size, height: size }}
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
          className={cn(FILL[tone], 'transition-[stroke-dashoffset,stroke] duration-500 ease-out')}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-display text-2xl font-extrabold text-ink-900 tabular-nums dark:text-white">
            <CountUp value={value} duration={900} />
          </p>
          {label ? (
            <p className="text-ink-500 dark:text-ink-on-dark-muted text-[10px] font-bold uppercase tracking-wider">
              {label}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
