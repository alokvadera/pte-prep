import { cn } from '../../lib/cn'
import { CEFR_BANDS, nextBand } from '../../domain/scoring'

// ---------------------------------------------------------------------------
// Score as a range against its band, not as an arc.
//
// A donut of a single value encodes one number with arc length and angle,
// which Nielsen Norman Group identifies as ineffective for magnitude, and which
// fails the two common accessibility tests at once: it is unreadable without
// colour, and its centre hole shrinks as the value grows, so the one number it
// is trying to show is least legible when the value is high.
//
// A range bar is linear, so length carries magnitude directly, and it can show
// the thing a candidate actually needs — not "you scored 61" but "61 is just
// into B2, and B2 runs to 75" — with the band boundaries drawn on the track.
// ---------------------------------------------------------------------------

const BAND_COLOR: Record<string, string> = {
  C2: 'bg-mint-400',
  C1: 'bg-brand-400',
  B2: 'bg-amber-brand',
  B1: 'bg-amber-600/70',
  A2: 'bg-rose-brand/70',
  A1: 'bg-rose-brand/50',
}

/**
 * The band a score falls in, as a range on the 10–90 track.
 *
 * CEFR_BANDS is ordered from the top band down, so each band ends one point
 * below the band above it — the *previous* entry, not the next.
 */
export const BAND_EDGES: Array<{ band: string; from: number; to: number; color: string }> =
  CEFR_BANDS.map((b, i) => {
    const above = CEFR_BANDS[i - 1]
    return {
      band: b.band,
      from: b.min,
      to: above ? above.min - 1 : 90,
      color: BAND_COLOR[b.band] ?? 'bg-ink-400',
    }
  })

interface Props {
  /** Score on the 10–90 scale. */
  score: number
  /** The CEFR band that score falls in. */
  band: string
  /** Rendered above or below the track. */
  size?: 'sm' | 'lg'
  className?: string
  label?: string
}

export function ScoreRangeBar({ score, band, size = 'lg', className, label }: Props) {
  const clamped = Math.max(10, Math.min(90, score))
  const pct = ((clamped - 10) / 80) * 100
  const current = BAND_EDGES.find((b) => b.band === band)
  const inBandPosition = current
    ? (((Math.min(clamped, current.to) - current.from) / Math.max(1, current.to - current.from + 1)) * 100)
    : 0

  return (
    <div className={className}>
      <div
        className={cn('relative w-full overflow-hidden rounded-full bg-ink-200 dark:bg-white/10', size === 'lg' ? 'h-3' : 'h-1.5')}
        role="img"
        aria-label={label ?? `Score ${clamped} out of 90, CEFR band ${band}`}
      >
        {/* The bands themselves, so the boundary is visible without reading. */}
        {BAND_EDGES.map((b) => (
          <div
            key={b.band}
            className={cn('absolute inset-y-0 opacity-25', b.color)}
            style={{ left: `${((b.from - 10) / 80) * 100}%`, width: `${((b.to - b.from + 1) / 80) * 100}%` }}
            aria-hidden="true"
          />
        ))}
        {/* The score, as a linear fill. */}
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full', current?.color ?? 'bg-brand-400')}
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
        {/* A single hard marker rather than a segment, so the value is readable
            without relying on the fill colour. */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.35)] dark:bg-white"
          style={{ left: `calc(${pct}% - 1px)` }}
          aria-hidden="true"
        />
      </div>

      {/* Band edges along the track, and the current band called out once. */}
      <div className="mt-2 flex justify-between gap-3 text-xs font-semibold text-ink-500 dark:text-ink-400 tabular-nums" aria-hidden="true">
        <span>10</span>
        <span className="text-ink-700 dark:text-ink-300">{band}</span>
        <span>90</span>
      </div>

      {current ? (
        <p className="text-ink-500 dark:text-ink-400 mt-1.5 text-xs">
          <span className="text-ink-900 dark:text-white font-semibold tabular-nums">{clamped}</span> of 90 ·{' '}
          {band} runs {current.from}–{current.to}, so you are{' '}
          {Math.round(Math.max(0, current.to - clamped) * 10) / 10} point{Math.round(current.to - clamped) === 1 ? '' : 's'} short of{' '}
          {nextBand(band)?.band ?? 'the top of the scale'}.{''}
        </p>
      ) : null}
      {/* The in-band position, exposed to assistive tech without relying on the
          visual marker. */}
      <span className="sr-only">
        {Math.round(inBandPosition)} per cent of the way through the {band} band.
      </span>
    </div>
  )
}

/** Four sub-scores, compared on one shared scale so the bars are comparable. */
export function SkillBars({
  skills,
  strongest,
  weakest,
}: {
  skills: Array<{ skill: string; value: number }>
  strongest?: string
  weakest?: string
}) {
  return (
    <ul className="space-y-3">
      {skills.map(({ skill, value }) => {
        const pct = Math.max(1.5, (value / 90) * 100)
        const isWeak = skill === weakest
        const isStrong = skill === strongest
        return (
          <li key={skill}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink-700 dark:text-ink-200 font-medium">
                <span className="capitalize">{skill}</span>
                {isWeak ? (
                  <span className="text-ink-500 dark:text-ink-400 ml-2 text-xs normal-case">work on this one</span>
                ) : null}
                {isStrong && !isWeak ? (
                  <span className="text-ink-500 dark:text-ink-400 ml-2 text-xs normal-case">strongest</span>
                ) : null}
              </span>
              <span className="text-ink-900 dark:text-white font-bold tabular-nums">{value}</span>
            </div>
            <div className="bg-ink-200 dark:bg-white/10 h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn('h-full rounded-sm', isWeak ? 'bg-rose-brand' : 'bg-brand-500')}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
