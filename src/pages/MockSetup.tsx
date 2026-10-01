import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_BLUEPRINT, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { buildFullMock, buildSectionMock } from '../domain/assemble'
import type { MockMode, QuestionType, SectionId } from '../domain/types'
import { capacityByType } from '../content/bank'
import { Seo } from '../seo/Seo'
import { Badge, PageHeading } from '../components/ui/primitives'
import { useTest } from '../store/useTest'
import { useSettings } from '../store/useSettings'
import { formatClock } from '../lib/format'
import { cn } from '../lib/cn'

type Length = 'full' | 'half' | 'quick'

/**
 * WCAG 2.2 SC 2.2.1: a time limit set by the content must be turn-off-able,
 * adjustable, or extendable. A practice mock is not an essential limit, so
 * offering all three is the honest reading rather than relying on the
 * exception.
 */
type TimingId = 'standard' | 'extended' | 'long' | 'untimed'

const TIMINGS: Record<TimingId, { label: string; detail: string; scale: number; untimed?: boolean }> = {
  standard: {
    label: 'Official timing',
    detail: `Current section ranges: ${SECTION_META['speaking-writing'].weightNote}, ${SECTION_META.reading.weightNote}, and ${SECTION_META.listening.weightNote}.`,
    scale: 1,
  },
  extended: {
    label: 'Extended',
    detail: 'Half as much time again on every section. Recommended if you are new to the format.',
    scale: 1.5,
  },
  long: {
    label: 'Extended ×2',
    detail: 'Double time on every section.',
    scale: 2,
  },
  untimed: {
    label: 'Untimed',
    detail: 'No clock. The timer bar is replaced with a question counter.',
    scale: 0,
    untimed: true,
  },
}

const DEFAULT_SEED = 20260101

const LENGTHS: Record<Length, { label: string; description: string; scale: number }> = {
  full: { label: 'Full mock', description: 'All three sections and all question types', scale: 1 },
  half: { label: 'Half mock', description: 'A representative subset of every section', scale: 0.5 },
  quick: { label: 'Quick check', description: 'Around 25 items, about 40 minutes', scale: 0.3 },
}

export default function MockSetup() {
  const navigate = useNavigate()
  const start = useTest((s) => s.start)
  const activeMock = useTest((s) => s.mock)
  const activeStatus = useTest((s) => s.status)
  const { settings, set } = useSettings()
  const [length, setLength] = useState<Length>('full')
  const [mode, setMode] = useState<MockMode>('exam')
  // A fixed initial seed keeps the prerendered HTML and the hydrated output identical.
  // A fresh seed is generated on demand by the shuffle control below.
  const [seed, setSeed] = useState(DEFAULT_SEED)
  const [singleSection, setSingleSection] = useState<SectionId | null>(null)
  const [timing, setTiming] = useState<TimingId>('standard')

  const capacity = useMemo(() => capacityByType(), [])

  const counts = useMemo(() => {
    if (singleSection) return { ...MOCK_BLUEPRINT }
    const scale = LENGTHS[length].scale
    const out: Partial<Record<QuestionType, number>> = {}
    for (const [type, n] of Object.entries(MOCK_BLUEPRINT)) {
      const key = type as QuestionType
      const scaled = Math.max(1, Math.round(n * scale))
      out[key] = Math.min(scaled, capacity[key] ?? scaled)
    }
    // Reading types share one passage each, so a short mock must not over-request.
    const readingTypes = [
      'fill-in-blanks-dropdown',
      'fill-in-blanks-table',
      'multiple-choice-multiple',
      'multiple-choice-single',
      'reorder-paragraphs',
    ] as const
    const readTotal = readingTypes.reduce((s, t) => s + (out[t] ?? 0), 0)
    const readCap = capacity['fill-in-blanks-dropdown'] ?? 6
    if (readTotal > readCap * 2) {
      const excess = readTotal - readCap * 2
      for (const t of readingTypes) out[t] = Math.max(1, (out[t] ?? 1) - Math.floor(excess / 3))
    }
    return out
  }, [length, singleSection, capacity])

  const preview = useMemo(() => {
    const t = TIMINGS[timing]
    const mock = singleSection
      ? buildSectionMock(seed, singleSection, counts, { timeScale: t.scale, untimed: t.untimed })
      : buildFullMock(seed, { counts, timeScale: t.scale, untimed: t.untimed })
    const scored = mock.sections.flatMap((s) => s.itemIds).filter((id) => (mock.items[id]?.maxPoints ?? 0) > 0)
    return { mock, scoredCount: scored.length, minutes: Math.round(mock.totalSeconds / 60) }
  }, [seed, counts, singleSection, timing])

  const begin = () => {
    start(preview.mock, mode)
    navigate('/test')
  }

  return (
    <>
      <Seo />

      <div className="page-shell-app">
        <PageHeading
          eyebrow="Mock test setup"
          title="Build a test around your day."
          description="Choose the length, conditions and timing that suit your session. Questions and answer order are shuffled from your seed."
        />

        {activeMock && activeStatus !== 'finished' ? (
          <div className="card-solid border-brand-500/40 mt-8 flex flex-wrap items-center justify-between gap-4 border p-5">
            <div>
              <p className="text-ink-900 dark:text-white text-sm font-bold">You have a test in progress</p>
              <p className="text-ink-500 dark:text-ink-400 mt-0.5 text-xs">{activeMock.title}</p>
            </div>
            <button type="button" className="btn-primary" onClick={() => navigate('/test')}>
              Resume
            </button>
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <fieldset>
              <legend className="label">Length</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(LENGTHS) as Length[]).map((key) => {
                  const opt = LENGTHS[key]
                  const active = !singleSection && length === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setLength(key)
                        setSingleSection(null)
                      }}
                      className={cn('choice-card', active ? 'choice-active' : 'choice-idle')}
                      aria-pressed={active}
                    >
                      <p className="text-ink-900 dark:text-white text-sm font-bold">{opt.label}</p>
                      <p className="text-ink-500 dark:text-ink-400 mt-1 text-xs leading-relaxed">{opt.description}</p>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="label">Single section</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setSingleSection(null)}
                  className={cn('choice-card', singleSection === null ? 'choice-active' : 'choice-idle')}
                  aria-pressed={singleSection === null}
                >
                  <p className="text-ink-900 dark:text-white text-sm font-bold">All three</p>
                  <p className="text-ink-500 dark:text-ink-400 mt-1 text-xs">Full test order</p>
                </button>
                {(['speaking-writing', 'reading', 'listening'] as const).map((key) => {
                  const meta = SECTION_META[key]
                  const active = singleSection === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSingleSection(key)}
                      className={cn('choice-card', active ? 'choice-active' : 'choice-idle')}
                      aria-pressed={active}
                    >
                      <p className="text-ink-900 dark:text-white text-sm font-bold">{meta.longTitle}</p>
                      <p className="text-ink-500 dark:text-ink-400 mt-1 text-xs">{meta.weightNote}</p>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="label">Mode</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { id: 'exam' as MockMode, title: 'Exam conditions', body: 'Full screen runner, section clock, no transcripts and no tips. Answers reveal only at the end.' },
                    { id: 'practice' as MockMode, title: 'Practice', body: 'Shows transcripts, item tips and replay buttons, so you can learn as you go.' },
                  ] as const
                ).map((opt) => {
                  const active = mode === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setMode(opt.id)
                        set('defaultMode', opt.id === 'exam' ? 'full' : settings.defaultMode)
                      }}
                      className={cn('choice-card', active ? 'choice-active' : 'choice-idle')}
                      aria-pressed={active}
                    >
                      <p className="text-ink-900 dark:text-white text-sm font-bold">{opt.title}</p>
                      <p className="text-ink-500 dark:text-ink-400 mt-1 text-xs leading-relaxed">{opt.body}</p>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="label">Time allowed</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(TIMINGS) as TimingId[]).map((id) => {
                  const opt = TIMINGS[id]
                  const active = timing === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTiming(id)}
                      className={cn('choice-card', active ? 'choice-active' : 'choice-idle')}
                      aria-pressed={active}
                    >
                      <p className="text-ink-900 dark:text-white text-sm font-bold">{opt.label}</p>
                      <p className="text-ink-500 dark:text-ink-400 mt-1 text-xs leading-relaxed">{opt.detail}</p>
                    </button>
                  )
                })}
              </div>
              <p className="text-ink-500 dark:text-ink-400 mt-3 text-xs leading-relaxed">
                A two-hour mock is genuinely hard. The official timing is the default because that is what you will face,
                but an untimed run is a better way to learn the question types and a longer clock is a better way to
                practise pacing. You can also add five minutes mid-section.
              </p>
            </fieldset>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl bg-ink-900 p-5 text-white shadow-card">
              <p className="font-mono text-micro text-[#9bc9ff]">TEST PREVIEW</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-balance">This run</h2>

              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Scored items" value={String(preview.scoredCount)} />
                <Row label="Total points" value={String(preview.mock.totalPoints)} />
                <Row label="Time allowed" value={formatClock(preview.mock.totalSeconds)} />
                <div className="flex flex-col gap-1 border-t border-white/10 pt-2.5">
                  <dt className="text-xs text-[#aeb9c6]">Sections</dt>
                  <dd className="text-xs font-semibold leading-relaxed text-white">
                    {preview.mock.sections.map((s) => SECTION_META[s.id].longTitle).join(' → ')}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold text-[#aeb9c6]">
                  Question types included
                </p>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {preview.mock.sections
                    .flatMap((s) => s.itemIds)
                    .map((id) => preview.mock.items[id]?.type)
                    .filter((t): t is NonNullable<typeof t> => Boolean(t))
                    .filter((t, i, arr) => arr.indexOf(t) === i)
                    .map((t) => (
                      <li key={t}>
                        <Badge tone="neutral" className="bg-white/8 text-[#c3ccd6]">{QUESTION_META[t].short}</Badge>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <label className="mb-1.5 block text-xs font-semibold text-[#aeb9c6]" htmlFor="seed">
                  Test seed
                </label>
                <div className="flex min-w-0 gap-2">
                  <input
                    id="seed"
                    type="number"
                    className="field min-w-0 flex-1 tabular-nums"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value) || 0)}
                  />
                  <button
                    type="button"
                    className="btn-secondary shrink-0"
                    onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))}
                  >
                    Shuffle
                  </button>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#aeb9c6]">
                  Same seed produces the same test. Share it to reproduce a paper.
                </p>
              </div>

              <button type="button" className="btn-primary mt-6 w-full py-3 text-base" onClick={begin}>
                Start {LENGTHS[length].label.toLowerCase()}
              </button>

              <p className="mt-3 text-center text-xs leading-relaxed text-[#aeb9c6]">
                Allow playback when prompted so the listening items work.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-[#aeb9c6]">{label}</dt>
      <dd className="min-w-0 truncate text-right text-xs font-semibold tabular-nums text-white">{value}</dd>
    </div>
  )
}
