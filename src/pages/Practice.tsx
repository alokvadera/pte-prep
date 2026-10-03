import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ALL_QUESTION_TYPES, MOCK_BLUEPRINT, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { buildDrillMock } from '../domain/assemble'
import { capacityByType } from '../content/bank'
import { typeSlug } from '../content/questionTypeDetail'
import type { QuestionType, Skill } from '../domain/types'
import { Seo } from '../seo/Seo'
import { Button, ButtonLink, Disclosure, PageWrapper, SectionHeading } from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { useTest } from '../store/useTest'
import { cn } from '../lib/cn'
import { Reveal } from '../components/ui/motion'

const SKILLS: Array<{ id: Skill; label: string; blurb: string }> = [
  { id: 'speaking', label: 'Speaking', blurb: 'Read aloud, repeat sentence, describe image, re-tell lecture and the two new 2025 types.' },
  { id: 'writing', label: 'Writing', blurb: 'Summarize written text, the essay, and summarize spoken text.' },
  { id: 'reading', label: 'Reading', blurb: 'Dropdowns, table completion, multiple choice and re-ordering.' },
  { id: 'listening', label: 'Listening', blurb: 'All eight listening types, from dictation to multiple answers.' },
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
  const deepLinkType = rawType && (ALL_QUESTION_TYPES as string[]).includes(rawType) ? (rawType as QuestionType) : null

  return <PracticeInner key={rawType ?? 'all'} deepLinkType={deepLinkType} />
}

function PracticeInner({ deepLinkType }: { deepLinkType: QuestionType | null }) {
  const navigate = useNavigate()
  const start = useTest((s) => s.start)
  const activeMock = useTest((s) => s.mock)
  const activeStatus = useTest((s) => s.status)
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)
  const [skill, setSkill] = useState<Skill | null>(() => (deepLinkType ? QUESTION_META[deepLinkType].skills[0] ?? null : null))
  const [selected, setSelected] = useState<Set<QuestionType>>(() => (deepLinkType ? new Set([deepLinkType]) : new Set(ALL_QUESTION_TYPES)))
  const [perType, setPerType] = useState(3)

  const capacity = useMemo(() => capacityByType(), [])

  const types = useMemo(
    () => (skill ? ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].skills.includes(skill)) : ALL_QUESTION_TYPES),
    [skill],
  )

  const chosen = [...selected].filter((type) => types.includes(type))
  const buildable = chosen.filter((t) => (capacity[t] ?? 0) >= Math.min(perType, 2))
  const dropped = chosen.filter((t) => !buildable.includes(t))

  const begin = () => {
    const mock = buildDrillMock(Math.floor(Math.random() * 1_000_000), buildable, perType)
    if (mock.sections.every((s) => s.itemIds.length === 0)) return
    start(mock, 'practice')
    navigate('/test')
  }

  const handleBegin = () => {
    if (activeMock && activeStatus !== 'finished') {
      setConfirmOverwrite(true)
      return
    }
    begin()
  }

  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!confirmOverwrite) return
    const dialog = dialogRef.current
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
        actions={<ButtonLink to="/mock" variant="secondary" size="lg">Set up a full mock</ButtonLink>}
      >
        <div className="-mt-4 mb-8 flex flex-wrap items-center gap-2">
          <Link to="/format/#weightage" className="btn-secondary px-3 py-1.5 text-xs">
            Score weightage matrix (high-yield priorities) →
          </Link>
          <Link to="/guide/#templates" className="btn-secondary px-3 py-1.5 text-xs">
            Strategy templates (DI, Essay, SST) →
          </Link>
          <Link to="/guide/#collocations" className="btn-secondary px-3 py-1.5 text-xs">
            Collocations cheat sheet (for FIB) →
          </Link>
        </div>

        <section className="card-solid mt-6">
        <SectionHeading
          eyebrow={`${skill ? SKILLS.find((s) => s.id === skill)?.label : 'All skills'} · ${buildable.length} ready types`}
          title="Choose your focus"
          description="Pick a skill, then include the question types you want in this drill."
        />

        <fieldset>
          <legend className="label">Skill</legend>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={skill === null ? 'primary' : 'secondary'} onClick={() => setSkill(null)} aria-pressed={skill === null}>
              All skills <span className="ml-1 font-mono">{ALL_QUESTION_TYPES.length} types</span>
            </Button>
            {SKILLS.map((s) => {
              const active = skill === s.id
              return (
                <Button key={s.id} size="sm" variant={active ? 'primary' : 'secondary'} onClick={() => setSkill(active ? null : s.id)} aria-pressed={active} title={s.blurb}>
                  {s.label}
                </Button>
              )
            })}
          </div>
          {/* The per-skill totals deliberately carry no number. Eight of the 22
              types score two skills at once, so 6 + 4 + 8 + 12 reads as 30
              against a promised 22 and looks like a bug. The sentence below
              says why once, rather than repeating a total on every button. */}
          <p className="text-ink-500 dark:text-ink-400 mt-3 text-xs leading-relaxed">
            {DUAL_SKILL_TYPES} of the {ALL_QUESTION_TYPES.length} types score two skills at once, so the skills
            overlap rather than splitting the list between them.
          </p>
        </fieldset>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-ink-900 dark:text-white text-base font-semibold">Question types</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSelected(new Set(types))}>Select all</Button>
            <Button size="sm" variant="secondary" onClick={() => setSelected((previous) => new Set([...previous].filter((type) => !types.includes(type))))}>Clear</Button>
            <Button
              size="sm"
              className="ml-1"
              onClick={begin}
              disabled={buildable.length === 0}
            >
              Start drill ({buildable.length * perType} items) →
            </Button>
          </div>
        </div>
        {dropped.length > 0 ? (
          <p className="text-ink-500 dark:text-ink-400 mt-3 text-xs leading-relaxed" role="status">
            {dropped.length} selected {dropped.length === 1 ? 'type is' : 'types are'} skipped — the bank holds fewer
            than {Math.min(perType, 2)} items for {dropped.map((t) => QUESTION_META[t].label).join(', ')}.
          </p>
        ) : null}

        {/* Roomier selection cards: p-5, min-height, and a 4-unit grid gap so a
            dense list of 22 types still reads as calm. */}
        <div key={skill ?? 'all'} className="mt-4 grid gap-4 sm:grid-cols-2">
          {types.map((t, idx) => {
            const meta = QUESTION_META[t]
            const on = selected.has(t)
            const cap = capacity[t] ?? 0
            return (
              <Reveal key={t} delay={Math.min(idx, 5) * 30} variant="up" duration={400}>
                <label className={cn('choice-card flex min-h-32 cursor-pointer items-start gap-3 p-5', on ? 'choice-active' : 'choice-idle choice-idle-solid')}>
                  <input
                    type="checkbox"
                    aria-label={meta.label}
                    className="mt-0.5 size-4 shrink-0 accent-brand-500"
                    checked={on}
                    onChange={() => toggle(t)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <span className="text-ink-900 dark:text-white text-sm font-semibold">{meta.label}</span>
                      <span className="text-ink-500 dark:text-ink-400 font-mono text-xs">{cap} items</span>
                    </span>
                    <span className="text-ink-500 dark:text-ink-300 mt-1.5 block text-xs leading-relaxed">{meta.tip}</span>
                  </span>
                </label>
              </Reveal>
            )
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="label mr-2">Questions per type</span>
          {[2, 3, 5, 8].map((n) => (
            <button key={n} type="button" onClick={() => setPerType(n)} className={cn('choice-card min-w-11 px-4 py-2.5 text-sm font-semibold', perType === n ? 'choice-active' : 'choice-idle choice-idle-solid')} aria-pressed={perType === n}>{n}</button>
          ))}
          <span className="text-ink-500 dark:text-ink-300 ml-auto font-mono text-xs tabular-nums">≈ {buildable.length * perType} questions</span>
        </div>

        {chosen.length === 0 ? <p className="text-amber-600 dark:text-amber-300 mt-4 text-sm">Choose at least one question type to start a drill.</p> : null}

        <div className="border-ink-200 dark:border-white/10 mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
          <p className="text-ink-500 dark:text-ink-400 text-sm">Transcripts, tips and replays are available throughout.</p>
          <Button size="lg" onClick={handleBegin} disabled={buildable.length === 0}>Start this practice</Button>
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
            className="card-solid animate-modal-enter relative w-full max-w-sm shadow-xl"
          >
            <h2 id="confirm-overwrite-title" className="text-ink-900 dark:text-white text-lg font-bold text-balance">
              Discard active test?
            </h2>
            <p className="text-ink-500 dark:text-ink-300 mt-2 text-sm leading-relaxed">
              You have a test in progress ({activeMock?.title}). Starting a practice drill will discard your current progress.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setConfirmOverwrite(false)}>
                Keep active test
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  setConfirmOverwrite(false)
                  begin()
                }}
              >
                Discard & Start drill
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Disclosure className="mt-8" summary={`Browse the exam reference for all ${ALL_QUESTION_TYPES.length} question types`}>
        <p className="mb-4 text-sm text-ink-500 dark:text-ink-300">See where each type appears, how often it is tested, and a quick strategy before you begin.</p>
        <div className="overflow-x-auto">
          <table className="table-data min-w-lg">
            <caption className="sr-only">All PTE Academic question types by section, skill and count</caption>
            <thead><tr className="border-ink-200 dark:border-white/10 border-b">{['Type', 'Section', 'Skill', 'Per test', 'Strategy'].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{ALL_QUESTION_TYPES.map((t) => {
              const meta = QUESTION_META[t]
              return (
                <tr key={t} className="border-ink-100 align-top last:border-0 dark:border-white/6">
                  <td className="font-semibold text-ink-900 dark:text-white">
                    <Link to={`/question-types/${typeSlug(t)}/`} className="-m-1 inline-flex min-h-6 items-center rounded-sm px-1 hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
                      {meta.label}
                    </Link>
                  </td>
                  <td className="text-ink-500 dark:text-ink-400">{SECTION_META[meta.section].longTitle}</td>
                  <td className="capitalize text-ink-500 dark:text-ink-400">{meta.skills.join(' + ')}</td>
                  <td className="tabular-nums text-ink-500 dark:text-ink-400">{meta.perTest}</td>
                  <td className="text-xs leading-relaxed text-ink-500 dark:text-ink-400">{meta.tip}</td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-500 dark:text-ink-400">A full mock uses {Object.values(MOCK_BLUEPRINT).reduce((a, b) => a + b, 0)} items in total.</p>
      </Disclosure>
    </PageWrapper>
    </>
  )
}
