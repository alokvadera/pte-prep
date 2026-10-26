import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ALL_QUESTION_TYPES,
  MOCK_BLUEPRINT,
  QUESTION_META,
  SECTION_META,
} from '../domain/blueprint'
import { manifestCapacityByType } from '../content/manifest'
import { typeSlug } from '../content/questionTypeDetail'
import type { QuestionType, Skill } from '../domain/types'
import { Seo } from '../seo/Seo'
import {
  Button,
  ButtonLink,
  Disclosure,
  PageWrapper,
  SectionHeading,
} from '../components/ui/primitives'
import { ActiveSessionNotice } from '../components/ui/ActiveSessionNotice'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { useTest } from '../store/useTest'
import { cn } from '../lib/cn'
import { Reveal } from '../components/ui/motion'
import { useClientReady } from '../lib/useClientReady'

const SKILLS: Array<{ id: Skill; label: string; blurb: string }> = [
  {
    id: 'speaking',
    label: 'Speaking',
    blurb:
      'Read aloud, repeat sentence, describe image, re-tell lecture and the two new 2025 types.',
  },
  {
    id: 'writing',
    label: 'Writing',
    blurb: 'Summarize written text, the essay, and summarize spoken text.',
  },
  {
    id: 'reading',
    label: 'Reading',
    blurb: 'Dropdowns, table completion, multiple choice and re-ordering.',
  },
  {
    id: 'listening',
    label: 'Listening',
    blurb: 'All eight listening types, from dictation to multiple answers.',
  },
]

/**
 * How many question types score more than one skill.
 *
 * Read from the blueprint rather than hardcoded, so the sentence under the skill
 * filter can never disagree with the filter it explains.
 */
const DUAL_SKILL_TYPES = ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].skills.length > 1).length

export default function Practice() {
  const [params] = useSearchParams()
  const rawType = params.get('type')
  const deepLinkType =
    rawType && (ALL_QUESTION_TYPES as string[]).includes(rawType) ? (rawType as QuestionType) : null

  return <PracticeInner key={rawType ?? 'all'} deepLinkType={deepLinkType} />
}

function PracticeInner({ deepLinkType }: { deepLinkType: QuestionType | null }) {
  const navigate = useNavigate()
  const start = useTest((s) => s.start)
  const activeMock = useTest((s) => s.mock)
  const activeStatus = useTest((s) => s.status)
  const isHydrated = useClientReady()
  const effectiveType = isHydrated ? deepLinkType : null

  const [confirmOverwrite, setConfirmOverwrite] = useState(false)
  const [prevType, setPrevType] = useState<QuestionType | null>(effectiveType)
  const [skill, setSkill] = useState<Skill | null>(() =>
    effectiveType ? (QUESTION_META[effectiveType].skills[0] ?? null) : null,
  )
  // A first visit starts with one approachable drill, not 22 types at once.
  // Deep links from a report keep their recommended type selected instead.
  const [selected, setSelected] = useState<Set<QuestionType>>(
    () => new Set([effectiveType ?? 'read-aloud']),
  )
  const [perType, setPerType] = useState(3)

  if (effectiveType !== prevType) {
    setPrevType(effectiveType)
    if (effectiveType) {
      setSkill(QUESTION_META[effectiveType].skills[0] ?? null)
      setSelected(new Set([effectiveType]))
    }
  }
  // The assembler and the content bank it reads are only fetched
  // when the candidate actually starts a drill, so the ~10 000 LOC
  // bank never lands on this page's initial JavaScript.
  const [building, setBuilding] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  /** False once the page has gone, so a late drill build stops itself. */
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  const capacity = useMemo(() => manifestCapacityByType(), [])

  const types = useMemo(
    () =>
      skill
        ? ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].skills.includes(skill))
        : ALL_QUESTION_TYPES,
    [skill],
  )

  const chosen = [...selected].filter((type) => types.includes(type))
  const buildable = chosen.filter((t) => (capacity[t] ?? 0) >= Math.min(perType, 2))
  const dropped = chosen.filter((t) => !buildable.includes(t))
  // pickN clamps to the bank, so the honest estimate caps each type at what
  // exists rather than promising perType items for every ready type.
  const estimatedItems = buildable.reduce((sum, t) => sum + Math.min(capacity[t] ?? 0, perType), 0)

  const begin = async () => {
    if (building) return
    setBuilding(true)
    setLoadError(null)
    try {
      // The assembler is a large chunk fetched on demand, so the wait is long
      // enough for the candidate to navigate away. A drill that starts after
      // they have left would throw them into a test they abandoned.
      const { buildDrillMock } = await import('../domain/assemble')
      /* v8 ignore next -- the page is still mounted in every test */
      if (!aliveRef.current) return
      const mock = buildDrillMock(Math.floor(Math.random() * 1_000_000), buildable, perType)
      if (mock.sections.every((s) => s.itemIds.length === 0)) {
        // The estimate comes from the manifest and the build from the bank,
        // so they can disagree. Say so, rather than re-enabling the button
        // with nothing having happened.
        setLoadError(
          'No questions are available for the selected types. Try another type, or fewer questions per type.',
        )
        return
      }
      /* v8 ignore next -- the page is still mounted in every test */
      if (!aliveRef.current) return
      start(mock, 'practice')
      navigate('/test')
    } catch {
      /* v8 ignore next -- the page is still mounted in every test */
      if (aliveRef.current) {
        setLoadError('Failed to load drill questions. Please check your connection and try again.')
      }
    } finally {
      /* v8 ignore next -- the page is still mounted in every test */
      if (aliveRef.current) setBuilding(false)
    }
  }

  const handleBegin = () => {
    if (activeMock && activeStatus !== 'finished') {
      setConfirmOverwrite(true)
      return
    }
    void begin()
  }

  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!confirmOverwrite) return
    const dialog = dialogRef.current
    /* v8 ignore next -- the ref is attached before the effect runs */
    if (!dialog) return

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusable[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setConfirmOverwrite(false)
        return
      }
      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0]!
        const last = focusable[focusable.length - 1]!
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmOverwrite])

  const toggle = (t: QuestionType) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  return (
    <>
      <Seo />
      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Practice' }]} />}
        eyebrow="Practice hub"
        title="Build a session around what you need."
        description="Choose a skill, keep the question types that matter today, and start a focused drill. Tips and transcripts stay beside the work."
        actions={
          <ButtonLink to="/mock" variant="secondary" size="lg">
            Set up a full mock
          </ButtonLink>
        }
      >
        <ActiveSessionNotice />
        <div className="mb-8 flex flex-wrap items-center gap-2.5">
          <Link
            to="/format#weightage"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Scoring and practice guide</span>
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-600 dark:bg-white/10 dark:text-ink-on-dark-muted">
              Editorial guide
            </span>
          </Link>
          <Link
            to="/guide#templates"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span className="size-2 rounded-full bg-amber-500" />
            <span>Strategy templates</span>
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-600 dark:bg-white/10 dark:text-ink-on-dark-muted">
              DI, Essay, SST
            </span>
          </Link>
          <Link
            to="/guide#collocations"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span className="size-2 rounded-full bg-purple-500" />
            <span>Collocations cheat sheet</span>
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-600 dark:bg-white/10 dark:text-ink-on-dark-muted">
              For FIB
            </span>
          </Link>
        </div>

        <section className="card-solid relative overflow-hidden mt-6">
          <SectionHeading
            eyebrow={`${skill ? SKILLS.find((s) => s.id === skill)?.label : 'All skills'}, ${buildable.length} ready ${buildable.length === 1 ? 'type' : 'types'}`}
            title="Choose your focus"
            description={
              effectiveType
                ? `${QUESTION_META[effectiveType].label} is selected from your last step. Adjust the questions or start the drill.`
                : 'Read Aloud is selected for a short first drill. Choose another skill or question type to change your focus.'
            }
          />

          <fieldset>
            <legend className="label font-bold text-xs uppercase tracking-wider text-ink-700 dark:text-ink-200 mb-2">
              Skill focus
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSkill(null)}
                aria-pressed={skill === null}
                className={cn(
                  'cursor-pointer rounded-xl border px-3.5 py-2 text-xs font-bold transition-all duration-150',
                  skill === null
                    ? 'border-mark-500 bg-mark-600 text-white shadow-sm shadow-mark-500/20 dark:border-mark-400 dark:bg-mark-600 dark:text-white'
                    : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-ink-on-dark dark:hover:border-white/20',
                )}
              >
                All skills{' '}
                <span className="ml-1.5 font-mono opacity-80">
                  {ALL_QUESTION_TYPES.length} types
                </span>
              </button>
              {SKILLS.map((s) => {
                const active = skill === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSkill(active ? null : s.id)}
                    aria-pressed={active}
                    title={s.blurb}
                    className={cn(
                      'cursor-pointer rounded-xl border px-3.5 py-2 text-xs font-bold transition-all duration-150',
                      active
                        ? 'border-mark-500 bg-mark-600 text-white shadow-sm shadow-mark-500/20 dark:border-mark-400 dark:bg-mark-600 dark:text-white'
                        : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-ink-on-dark dark:hover:border-white/20',
                    )}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
            {/* The per-skill totals deliberately carry no number. Eight of the 22
              types score two skills at once, so 6 + 4 + 8 + 12 reads as 30
              against a promised 22 and looks like a bug. The sentence below
              says why once, rather than repeating a total on every button. */}
            <p className="text-ink-500 dark:text-ink-on-dark-muted mt-3 text-xs leading-relaxed">
              {DUAL_SKILL_TYPES} of the {ALL_QUESTION_TYPES.length} types score two skills at once,
              so the skills overlap rather than splitting the list between them.
            </p>
          </fieldset>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-ink-900 dark:text-white text-base font-bold">Question types</h3>
            <div className="flex flex-wrap items-center gap-2">
              {/* Both buttons work on the types currently in view, and neither
                discards a selection the candidate made under another skill
                filter: "Select all" used to replace the whole set, so a
                speaking tick vanished when the reading types were selected. */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelected((previous) => new Set([...previous, ...types]))}
              >
                Select all
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setSelected(
                    (previous) => new Set([...previous].filter((type) => !types.includes(type))),
                  )
                }
              >
                Clear
              </Button>
              <Button
                size="sm"
                className="ml-1"
                onClick={handleBegin}
                disabled={buildable.length === 0 || building}
              >
                {building ? 'Preparing drill…' : `Start drill (${estimatedItems} questions)`}
              </Button>
            </div>
          </div>
          {loadError ? (
            <div
              className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-medium text-red-600 dark:text-red-400"
              role="alert"
            >
              {loadError}
            </div>
          ) : null}
          {dropped.length > 0 ? (
            <p
              className="text-ink-500 dark:text-ink-on-dark-muted mt-3 text-xs leading-relaxed"
              role="status"
            >
              {dropped.length} selected {dropped.length === 1 ? 'type is' : 'types are'} skipped —
              the bank holds fewer than {Math.min(perType, 2)} items for{' '}
              {dropped.map((t) => QUESTION_META[t].label).join(', ')}.
            </p>
          ) : null}

          {/* Roomier selection cards: p-5, min-height, and a 4-unit grid gap so a
            dense list of 22 types still reads as calm. */}
          <div key={skill ?? 'all'} className="mt-4 grid gap-4 sm:grid-cols-2">
            {types.map((t, idx) => {
              const meta = QUESTION_META[t]
              const on = selected.has(t)
              const cap = capacity[t] ?? 0
              const isHighYield = [
                'read-aloud',
                'repeat-sentence',
                'write-from-dictation',
                'fill-in-blanks-dropdown',
                'fill-in-blanks-listening',
                'summarize-spoken-text',
              ].includes(t)

              return (
                <Reveal key={t} delay={Math.min(idx, 5) * 30} variant="up" duration={400}>
                  <label
                    className={cn(
                      'group relative flex min-h-32 cursor-pointer items-start gap-3.5 rounded-2xl border p-5 sm:p-6 transition-all duration-200',
                      on
                        ? 'border-mark-500/80 bg-mark-500/[0.07] ring-1 ring-mark-500/40 dark:border-mark-400 dark:bg-mark-500/[0.12] dark:ring-mark-400/40 shadow-sm shadow-mark-500/10'
                        : 'border-ink-200/80 bg-white hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/[0.04]',
                    )}
                  >
                    <input
                      type="checkbox"
                      aria-label={meta.label}
                      className="peer sr-only"
                      checked={on}
                      onChange={() => toggle(t)}
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-all',
                        on
                          ? 'border-mark-600 bg-mark-600 dark:border-mark-400 dark:bg-mark-600 text-white shadow-sm'
                          : 'border-ink-300 group-hover:border-ink-400 dark:border-white/20 dark:group-hover:border-white/40',
                      )}
                    >
                      {on ? (
                        <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                        <span className="flex items-center gap-2">
                          <span className="text-ink-900 dark:text-white text-sm font-bold">
                            {meta.label}
                          </span>
                          {isHighYield && (
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                              High Yield
                            </span>
                          )}
                        </span>
                        <span className="text-ink-500 dark:text-ink-on-dark-muted font-mono text-xs">
                          {cap} items
                        </span>
                      </span>
                      <span className="text-ink-500 dark:text-ink-on-dark mt-2 block text-xs leading-relaxed">
                        {meta.tip}
                      </span>
                      <span className="mt-2.5 flex items-center gap-2 text-[11px] font-medium text-ink-500 dark:text-ink-on-dark-muted">
                        <span className="capitalize">{meta.skills.join(' + ')}</span>
                        <span>·</span>
                        <span>{meta.perTest} per test</span>
                      </span>
                    </span>
                  </label>
                </Reveal>
              )
            })}
          </div>

          <div
            className="mt-8 flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Questions per type"
          >
            <span
              className="label mr-2 font-bold text-xs uppercase tracking-wider text-ink-700 dark:text-ink-200"
              aria-hidden="true"
            >
              Questions per type
            </span>
            {[2, 3, 5, 8].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPerType(n)}
                className={cn(
                  'min-w-11 rounded-xl border px-4 py-2 text-sm font-bold transition-all cursor-pointer',
                  perType === n
                    ? 'border-mark-500 bg-mark-600 text-white shadow-sm shadow-mark-500/20 dark:border-mark-400 dark:bg-mark-600 dark:text-white'
                    : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-ink-on-dark dark:hover:border-white/20',
                )}
                aria-pressed={perType === n}
              >
                {n}
              </button>
            ))}
            <span
              key={estimatedItems}
              className="text-ink-600 dark:text-ink-200 animate-pop ml-auto font-mono text-xs font-semibold tabular-nums"
            >
              Total ≈ {estimatedItems} questions
            </span>
          </div>

          {chosen.length === 0 ? (
            <p role="status" className="text-amber-600 dark:text-amber-300 mt-4 text-sm">
              Choose at least one question type to start a drill.
            </p>
          ) : null}

          <div className="border-ink-200 dark:border-white/10 mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
            <p className="text-ink-500 dark:text-ink-on-dark-muted text-sm">
              Transcripts, tips and replays are available throughout.
            </p>
            <Button
              size="lg"
              magnetic
              onClick={handleBegin}
              disabled={buildable.length === 0 || building}
            >
              {building ? 'Preparing drill…' : `Start drill (${estimatedItems} questions)`}
            </Button>
          </div>
        </section>

        {confirmOverwrite ? (
          <div className="fixed inset-0 z-100 grid place-items-center p-4">
            <button
              type="button"
              className="bg-ink-950/70 animate-fade-in absolute inset-0 cursor-pointer"
              onClick={() => setConfirmOverwrite(false)}
              aria-label="Cancel"
            />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-overwrite-title"
              className="card-solid animate-modal-enter relative w-full max-w-sm"
            >
              <h2
                id="confirm-overwrite-title"
                className="text-xl leading-[1.25] font-bold text-balance text-ink-900 dark:text-ink-50"
              >
                Discard active test?
              </h2>
              <p className="text-ink-500 dark:text-ink-on-dark mt-2 text-sm leading-relaxed">
                You have a test in progress ({activeMock?.title}). Starting a practice drill will
                discard your current progress.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmOverwrite(false)}
                >
                  Keep active test
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    setConfirmOverwrite(false)
                    void begin()
                  }}
                >
                  Discard & Start drill
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <Disclosure
          className="mt-8"
          summary={`Browse the exam reference for all ${ALL_QUESTION_TYPES.length} question types`}
        >
          <p className="mb-4 text-sm text-ink-500 dark:text-ink-on-dark">
            See where each type appears, how often it is tested, and a quick strategy before you
            begin.
          </p>
          <div className="overflow-x-auto">
            <table className="table-data min-w-lg">
              <caption className="sr-only">
                All PTE Academic question types by section, skill and count
              </caption>
              <thead>
                <tr className="border-ink-200 dark:border-white/10 border-b">
                  {['Type', 'Section', 'Skill', 'Per test', 'Strategy'].map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_QUESTION_TYPES.map((t, i) => {
                  const meta = QUESTION_META[t]
                  return (
                    <tr
                      key={t}
                      className="border-ink-100 align-top last:border-0 dark:border-white/6 motion-safe:animate-fade-in"
                      style={{ animationDelay: `${Math.min(i, 8) * 15}ms` }}
                    >
                      <td className="font-semibold text-ink-900 dark:text-white">
                        <Link
                          to={`/question-types/${typeSlug(t)}/`}
                          className="-m-1 inline-flex min-h-6 items-center rounded-sm px-1 hover:text-brand-600 dark:hover:text-brand-300 hover:underline"
                        >
                          {meta.label}
                        </Link>
                      </td>
                      <td className="text-ink-500 dark:text-ink-on-dark-muted">
                        {SECTION_META[meta.section].longTitle}
                      </td>
                      <td className="capitalize text-ink-500 dark:text-ink-on-dark-muted">
                        {meta.skills.join(' + ')}
                      </td>
                      <td className="tabular-nums text-ink-500 dark:text-ink-on-dark-muted">
                        {meta.perTest}
                      </td>
                      <td className="text-xs leading-relaxed text-ink-500 dark:text-ink-on-dark-muted">
                        {meta.tip}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-500 dark:text-ink-on-dark-muted">
            A full mock uses {Object.values(MOCK_BLUEPRINT).reduce((a, b) => a + b, 0)} items in
            total.
          </p>
        </Disclosure>
      </PageWrapper>
    </>
  )
}
