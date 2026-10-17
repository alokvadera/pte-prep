import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Sparkline.

   A tiny trend line for inside a stat card — no axes,
   no labels, just the shape of the last few values.
   Auto-scales to its own min/max so a 40→50 climb
   reads the same as a 70→80 one.
--------------------------------------------------------------------------- */

export function Sparkline({
  points,
  width = 120,
  height = 36,
  tone = 'brand',
  className,
}: {
  points: number[]
  width?: number
  height?: number
  tone?: 'brand' | 'mint' | 'amber' | 'rose'
  className?: string
}) {
  const cleanPoints = points.filter(Number.isFinite)
  if (cleanPoints.length < 2) {
    return <div className={cn('rounded bg-ink-100 dark:bg-white/8', className)} style={{ width, height }} aria-hidden="true" />
  }

  const min = Math.min(...cleanPoints)
  const max = Math.max(...cleanPoints)
  const span = max - min || 1
  const pad = 3
  const stepX = (width - pad * 2) / (cleanPoints.length - 1)
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2)
  const x = (i: number) => pad + i * stepX

  const line = cleanPoints.map((p, i) => `${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(' ')
  const area = `${pad},${height - pad} ${line} ${x(cleanPoints.length - 1).toFixed(1)},${height - pad}`

  const STROKE: Record<string, string> = {
    brand: 'stroke-brand-500 fill-brand-500',
    mint: 'stroke-mint-500 fill-mint-500',
    amber: 'stroke-amber-500 fill-amber-500',
    rose: 'stroke-rose-500 fill-rose-500',
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`Trend across ${cleanPoints.length} values, from ${min} to ${max}`}
      className={className}
    >
      <polygon points={area} className={cn('fill-current opacity-10', STROKE[tone])} />
      <polyline
        points={line}
        fill="none"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        className={cn('stroke-current animate-draw-line', STROKE[tone])}
      />
      <circle cx={x(cleanPoints.length - 1)} cy={y(cleanPoints[cleanPoints.length - 1]!)} r={2.5} className={cn('fill-current animate-draw-dot', STROKE[tone])} />
    </svg>
  )
}
