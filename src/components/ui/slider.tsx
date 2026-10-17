import { useId, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Slider.

   A labelled range input with a live value readout — the
   "what if" control on the score calculator and the text-size
   control in settings. The track is the native accent colour
   so it stays keyboard- and screen-reader-accessible; the
   candy styling is on the wrapper, not the thumb.
--------------------------------------------------------------------------- */

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  hint,
  className,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format?: (value: number) => string
  hint?: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('flex items-center justify-between gap-4 py-2.5', className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-ink-800 dark:text-ink-100 block text-sm font-medium cursor-pointer">
          {label}
        </label>
        {hint ? <span className="text-ink-500 dark:text-ink-on-dark-muted block text-xs">{hint}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="accent-brand-500 w-36 cursor-pointer sm:w-44"
        />
        <span className="text-ink-900 dark:text-white w-14 text-right font-mono text-sm font-bold tabular-nums">
          {format ? format(value) : value}
        </span>
      </div>
    </div>
  )
}
