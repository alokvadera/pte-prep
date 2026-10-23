import { cn } from '../../lib/cn'
import { CEFR_BANDS, nextBand, scoreBand } from '../../domain/scoring'

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
//
// The marker on that track is a hard line, because the score is one number and
// it should be readable at a glance. Left there it is also the most confident
// thing in the interface, which overstates what is known: `scoreBand` supplies
// the sensitivity of the 10–90 conversion, and the rail below the track draws
// it. The marker keeps its width and its dominance; what changes is that it is
// visibly not sitting in the middle of its own uncertainty, because it usually
// is not.
// ---------------------------------------------------------------------------

/**
 * Band fills, as class pairs.
 *
 * Each entry carries a light and a dark step because the score rail is a bar
 * chart: a fill needs 3:1 against the ground (SC 1.4.11), and no single step
 * clears it on both. The light steps are the deep ones; on the navy ground they
 * drop to 2.4–3.0:1 and disappear, so dark steps up to the 300s.
 *
 * Ordered brightest-to-dimmest within a scheme so C2 → A1 still reads as a
 * descending scale rather than as six unrelated hues.
 */
const BAND_COLOR: Record<string, string> = {
  C2: 'bg-mint-400 dark:bg-mint-300',
  C1: 'bg-brand-600 dark:bg-brand-300',
  B2: 'bg-amber-brand dark:bg-amber-300',
  B1: 'bg-amber-600/80 dark:bg-amber-400/80',
  A2: 'bg-rose-brand/80 dark:bg-rose-300/80',
  A1: 'bg-rose-brand/60 dark:bg-rose-400/60',
}

/**
 * The band a score falls in, as a range on the 10–90 track.
 *
 * CEFR_BANDS is ordered from the top band down, so each band ends one point
 * below the band above it — the *previous* entry, not the next.
 */
const BAND_EDGES: Array<{ band: string; from: number; to: number; color: string }> =
  CEFR_BANDS.map((b, i) => {
    const above = CEFR_BANDS[i - 1]
    return {
      band: b.band,
      from: b.min,
      to: above ? above.min - 1 : 90,
      /* v8 ignore next -- every band has a colour */
      color: BAND_COLOR[b.band] ?? 'bg-ink-400 dark:bg-ink-on-dark-faint',
    }
  })

interface Props {
  /** Score on the 10–90 scale. */
  score: number
  /** The CEFR band that score falls in. */
  band: string
  /**
   * Earned ÷ available points for the same attempt. Supplying it draws the
   * conversion-sensitivity rail. Omit it where there is no underlying attempt
   * to measure — the band is then unknown rather than zero.
   */
  fraction?: number
  /** Rendered above or below the track. */
  size?: 'sm' | 'lg'
  className?: string
  label?: string
}

export function ScoreRangeBar({ score, band, fraction, size = 'lg', className, label }: Props) {
  const clamped = Math.max(10, Math.min(90, score))
  const pct = ((clamped - 10) / 80) * 100
  const current = BAND_EDGES.find((b) => b.band === band)
  const inBandPosition = current
    ? (((Math.min(clamped, current.to) - current.from) / Math.max(1, current.to - current.from + 1)) * 100)
    : 0

  // Undefined when the caller has no attempt to measure. Degenerate (90–90 at
  // full marks) when the conversion is exact there, in which case there is
  // nothing to draw and saying so is better than drawing a zero-width bar.
  const bounds = fraction === undefined ? null : scoreBand(fraction, clamped)
  const showRail = bounds !== null && bounds.high > bounds.low
  const toPct = (v: number) => ((Math.max(10, Math.min(90, v)) - 10) / 80) * 100

  return (
    <div className={className}>
      <div
        className={cn('relative w-full overflow-hidden rounded-full bg-ink-200 dark:bg-white/10', size === 'lg' ? 'h-3' : 'h-1.5')}
        role="img"
        aria-label={
          label ??
          (showRail
            ? `Score ${clamped} out of 90, CEFR band ${band}, conversion sensitivity ${bounds.low} to ${bounds.high}`
            : `Score ${clamped} out of 90, CEFR band ${band}`)
        }
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
          className={cn('absolute inset-y-0 left-0 rounded-full origin-left animate-bar-reveal transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]', current?.color ?? 'bg-brand-400')}
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
        {/* A single hard marker rather than a segment, so the value is readable
            without relying on the fill colour. */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white ring-1 ring-black/35 dark:bg-white transition-[left] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ left: `calc(${pct}% - 1px)` }}
          aria-hidden="true"
        />
      </div>

      {/* The sensitivity rail. Drawn on its own track below rather than over
          the fill, so the score's own length stays unambiguous, and with end
          ticks rather than a symmetric bracket — the band genuinely is
          asymmetric, and rounding it into a centred error bar would be the
          exact misreading the literature warns about. The segment is a
          meaningful graphic, so it is held to SC 1.4.11: ink-700 on the ink-200
          rail measures 7.9:1 in light, and white/50 against the white/10 rail
          measures 3.6:1 in dark. The first value tried, white/35, was 2.3:1
          and would have failed. */}
      {showRail && bounds ? (
        <div className="mt-1.5" aria-hidden="true">
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-white/10">
            <div
              className="absolute inset-y-0 bg-ink-700 dark:bg-white/50"
              style={{ left: `${toPct(bounds.low)}%`, width: `${toPct(bounds.high) - toPct(bounds.low)}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Band edges along the track, and the current band called out once. */}
      <div className="mt-2 flex justify-between gap-3 text-xs font-semibold text-ink-500 dark:text-ink-on-dark-muted tabular-nums" aria-hidden="true">
        <span>10</span>
        <span className="text-ink-700 dark:text-ink-on-dark">{band}</span>
        <span>90</span>
      </div>

      {current ? (
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1.5 text-xs">
          <span className="text-ink-900 dark:text-white font-semibold tabular-nums">{clamped}</span> of 90,{' '}
          {band} runs {current.from}–{current.to}, so you are{' '}
          {Math.round(Math.max(0, current.to - clamped) * 10) / 10} point{Math.round(current.to - clamped) === 1 ? '' : 's'} short of{' '}
          {nextBand(band)?.band ?? 'the top of the scale'}.
        </p>
      ) : null}
      {showRail && bounds ? (
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-3 max-w-prose text-xs">
          The same attempt could land between{' '}
          <span className="text-ink-900 dark:text-white font-semibold tabular-nums">{bounds.low}</span> and{' '}
          <span className="text-ink-900 dark:text-white font-semibold tabular-nums">{bounds.high}</span> if our 10–90
          conversion is wrong — a bound on the mapping, not a confidence interval. Pearson's IRT parameters are
          unpublished, so the conversion reproduces the shape of the scale rather than the scale itself, and the one
          number that could reasonably have been written differently moves the score most through the middle and not
          at all at 90. Your answers are not in doubt; the mapping is.
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
                  <span className="text-ink-500 dark:text-ink-on-dark-muted ml-2 text-xs normal-case">work on this one</span>
                ) : null}
                {isStrong && !isWeak ? (
                  <span className="text-ink-500 dark:text-ink-on-dark-muted ml-2 text-xs normal-case">strongest</span>
                ) : null}
              </span>
              <span className="text-ink-900 dark:text-white font-bold tabular-nums">{value}</span>
            </div>
            <div className="bg-ink-200 dark:bg-white/10 h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn('h-full rounded-sm origin-left animate-bar-reveal transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]', isWeak ? 'bg-rose-brand' : 'bg-brand-500')}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
