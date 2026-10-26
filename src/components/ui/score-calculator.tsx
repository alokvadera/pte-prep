import { useMemo, useState } from 'react'
import { Crosshair } from 'lucide-react'
import { Slider } from './slider'
import { RadialProgress } from './radial-progress'
import { Callout } from './primitives'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   ScoreCalculator.

   The "what do I need" widget: four skill
   sliders and a target, with the estimated
   overall and the single skill that is
   furthest from the target — the honest
   answer to "where do I improve". The overall
   is a straight mean of the four skills, which
   is an approximation of Pearson's weighting,
   and the widget says so on its face.
--------------------------------------------------------------------------- */

const SKILLS = ['speaking', 'writing', 'reading', 'listening'] as const
type Skill = (typeof SKILLS)[number]

const SKILL_LABEL: Record<Skill, string> = {
  speaking: 'Speaking',
  writing: 'Writing',
  reading: 'Reading',
  listening: 'Listening',
}

export function ScoreCalculator({
  className,
  hideEyebrow = false,
}: {
  className?: string
  hideEyebrow?: boolean
}) {
  const [skills, setSkills] = useState<Record<Skill, number>>({
    speaking: 58,
    writing: 58,
    reading: 58,
    listening: 58,
  })
  const [target, setTarget] = useState(65)

  const { overall, gap, weakest, pointsNeededOnWeakest, canClearOnWeakestAlone } = useMemo(() => {
    const values = SKILLS.map((s) => skills[s])
    const currentSum = values.reduce((a, b) => a + b, 0)
    const overall = Math.round(currentSum / values.length)
    const gap = target - overall
    const weakest = SKILLS.reduce((a, b) => (skills[a] <= skills[b] ? a : b))
    const otherThreeSum = currentSum - skills[weakest]
    const neededOnWeakest = 4 * target - otherThreeSum
    const canClearOnWeakestAlone = neededOnWeakest <= 90
    const pointsNeededOnWeakest = Math.max(0, Math.min(90, neededOnWeakest) - skills[weakest])
    return { overall, gap, weakest, pointsNeededOnWeakest, canClearOnWeakestAlone }
  }, [skills, target])

  const reachable = gap <= 5 && gap > 0

  return (
    <div className={cn('card-solid p-5 sm:p-6', className)}>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          {!hideEyebrow && <p className="section-eyebrow">What-if</p>}
          <h3 className="font-display text-ink-900 text-lg font-extrabold text-balance dark:text-ink-50">
            Score calculator
          </h3>
          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-sm leading-relaxed">
            Drag your current skill scores and the target. The ring is the estimated overall; the
            gap is what is left to close.
          </p>
        </div>
        <RadialProgress
          value={overall}
          label="Estimated overall"
          tone={overall >= target ? 'mint' : overall >= target - 5 ? 'brand' : 'amber'}
          size={128}
        />
      </div>

      <div className="mt-4">
        {SKILLS.map((s) => (
          <Slider
            key={s}
            label={SKILL_LABEL[s]}
            value={skills[s]}
            min={10}
            max={90}
            onChange={(v) => setSkills((prev) => ({ ...prev, [s]: v }))}
          />
        ))}
        <div className="border-ink-100 dark:border-white/10 mt-2 border-t" />
        <Slider
          label="Target score"
          value={target}
          min={10}
          max={90}
          onChange={setTarget}
          hint={
            <span className="inline-flex items-center gap-1.5">
              <Crosshair className="size-3" /> Admissions & visa benchmarks live on the scoring
              guide
            </span>
          }
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold">
            Gap to target
          </p>
          <p
            className={cn(
              'font-display mt-1 text-2xl font-extrabold tabular-nums',
              gap <= 0 ? 'text-mint-700 dark:text-mint-300' : 'text-amber-600 dark:text-amber-400',
            )}
          >
            {gap <= 0 ? `+${Math.abs(gap)}` : `−${gap}`}
          </p>
          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-0.5 text-[11px]">
            {gap <= 0 ? 'Estimated to clear the target' : 'points to gain'}
          </p>
        </div>
        <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-white/10 dark:bg-white/5 sm:col-span-2">
          <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold">
            Focus first
          </p>
          <p className="text-ink-900 mt-1 text-base font-bold dark:text-white">
            {SKILL_LABEL[weakest]}
            <span className="text-ink-500 dark:text-ink-on-dark-muted ml-2 font-mono text-xs font-semibold">
              {skills[weakest]}/90
            </span>
          </p>
          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-0.5 text-[11px]">
            Your lowest skill lifts the overall fastest — gaining 4 points across skills adds 1
            point to the overall average.
          </p>
        </div>
      </div>

      {gap <= 0 ? (
        <Callout tone="mint" label="Target met" className="mt-4">
          Your current skill scores meet or exceed your target of {target}. Keep practising under
          timed conditions to maintain consistency.
        </Callout>
      ) : reachable ? (
        <Callout tone="mint" label="Within reach" className="mt-4">
          A gap of {gap} overall points requires gaining {gap * 4} total skill points — for example,
          gaining{' '}
          {canClearOnWeakestAlone
            ? `${pointsNeededOnWeakest} points on ${SKILL_LABEL[weakest]}`
            : `an average of ${gap} points across each skill`}{' '}
          would clear the target on this estimate.
        </Callout>
      ) : (
        <Callout tone="amber" label="A longer climb" className="mt-4">
          The target is {gap} points above your estimated overall. Focus on high-weight item types
          in {SKILL_LABEL[weakest]} and plan in 5-point milestones.
        </Callout>
      )}

      <p className="text-ink-500 dark:text-ink-on-dark-muted mt-4 text-[11px]">
        Estimate only. The real test weights integrated items across skills, so treat this as a
        planning aid, not a prediction.
      </p>
    </div>
  )
}
