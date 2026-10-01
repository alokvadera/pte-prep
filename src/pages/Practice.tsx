import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ALL_QUESTION_TYPES, MOCK_BLUEPRINT, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { buildDrillMock } from '../domain/assemble'
import { capacityByType } from '../content/bank'
import type { QuestionType, Skill } from '../domain/types'
import { Seo } from '../seo/Seo'
import { PageHeading, SectionHeading } from '../components/ui/primitives'
import { useTest } from '../store/useTest'
import { cn } from '../lib/cn'

const SKILLS: Array<{ id: Skill; label: string; blurb: string }> = [
  { id: 'speaking', label: 'Speaking', blurb: 'Read aloud, repeat sentence, describe image, re-tell lecture and the two new 2025 types.' },
  { id: 'writing', label: 'Writing', blurb: 'Summarize written text, the essay, and summarize spoken text.' },
  { id: 'reading', label: 'Reading', blurb: 'Dropdowns, table completion, multiple choice and re-ordering.' },
  { id: 'listening', label: 'Listening', blurb: 'All eight listening types, from dictation to multiple answers.' },
]

/**
 * Reads `?type=` so the question-type pages can send a candidate straight to a
 * drill for that specific type. Guarded for the prerender pass, where there is
 * no `window`.
 */
function initialTypeFromQuery(): QuestionType | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('type')
  return raw && (ALL_QUESTION_TYPES as string[]).includes(raw) ? (raw as QuestionType) : null
}

export default function Practice() {
  const navigate = useNavigate()
  const start = useTest((s) => s.start)
  // Arriving from a question-type page locks the drill to that one type.
  const [deepLinkType] = useState<QuestionType | null>(initialTypeFromQuery)
  const [skill, setSkill] = useState<Skill | null>(null)
  const [selected, setSelected] = useState<Set<QuestionType>>(() => new Set(ALL_QUESTION_TYPES))
  const [perType, setPerType] = useState(3)

  const capacity = useMemo(() => capacityByType(), [])

  useEffect(() => {
    if (!deepLinkType) return
    const [primary] = QUESTION_META[deepLinkType].skills
    if (!primary) return
    setSelected(new Set([deepLinkType]))
    setSkill(primary)
  }, [deepLinkType])

  const types = useMemo(
    () => (skill ? ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].skills.includes(skill)) : ALL_QUESTION_TYPES),
    [skill],
  )

  const chosen = [...selected].filter((type) => types.includes(type))
  const buildable = chosen.filter((t) => (capacity[t] ?? 0) >= Math.min(perType, 2))

  const begin = () => {
    const mock = buildDrillMock(Math.floor(Math.random() * 1_000_000), buildable, perType)
    if (mock.sections.every((s) => s.itemIds.length === 0)) return
    start(mock, 'practice')
    navigate('/test')
  }

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

      <div className="page-shell-app">
        <PageHeading
          eyebrow="Practice hub"
          title="Build a session around what you need."
          description="Choose a skill, keep the question types that matter today, and start a focused drill. Tips and transcripts stay beside the work."
          actions={<Link to="/mock" className="btn-secondary px-5 py-3">Set up a full mock</Link>}
        />

        <section className="card-solid p-5 sm:p-7">
          <SectionHeading
            eyebrow={`${skill ? SKILLS.find((s) => s.id === skill)?.label : 'All skills'} · ${buildable.length} ready types`}
            title="Choose your focus"
            description="Pick a skill, then include the question types you want in this drill."
          />

          <fieldset>
            <legend className="label">Skill</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSkill(null)} className={cn('btn-secondary', skill === null && 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300')} aria-pressed={skill === null}>
                All skills <span className="ml-1 font-mono text-xs">{ALL_QUESTION_TYPES.length}</span>
              </button>
              {SKILLS.map((s) => {
                const active = skill === s.id
                const count = ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].skills.includes(s.id)).length
                return (
                  <button key={s.id} type="button" onClick={() => setSkill(active ? null : s.id)} className={cn('btn-secondary', active && 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300')} aria-pressed={active} title={s.blurb}>
                    {s.label} <span className="ml-1 font-mono text-xs">{count}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
            <h3 className="text-ink-900 dark:text-white text-base font-semibold">Question types</h3>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setSelected(new Set(types))}>Select all</button>
              <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setSelected((previous) => new Set([...previous].filter((type) => !types.includes(type))))}>Clear</button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {types.map((t) => {
              const meta = QUESTION_META[t]
              const on = selected.has(t)
              const cap = capacity[t] ?? 0
              return (
                <label key={t} className={cn('choice-card flex min-h-28 cursor-pointer items-start gap-3 p-4', on ? 'choice-active' : 'choice-idle choice-idle-solid')}>
                  <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-brand-500" checked={on} onChange={() => toggle(t)} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <span className="text-ink-900 dark:text-white text-sm font-semibold">{meta.label}</span>
                      <span className="text-ink-500 dark:text-ink-400 font-mono text-xs">{cap} items</span>
                    </span>
                    <span className="text-ink-500 dark:text-ink-300 mt-1 block text-xs leading-relaxed">{meta.tip}</span>
                  </span>
                </label>
              )
            })}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <span className="label mr-2">Questions per type</span>
            {[2, 3, 5, 8].map((n) => (
              <button key={n} type="button" onClick={() => setPerType(n)} className={cn('choice-card min-w-11 px-3 py-2 text-sm font-semibold', perType === n ? 'choice-active' : 'choice-idle choice-idle-solid')} aria-pressed={perType === n}>{n}</button>
            ))}
            <span className="text-ink-500 dark:text-ink-300 ml-auto font-mono text-xs tabular-nums">≈ {buildable.length * perType} questions</span>
          </div>

          {buildable.length < chosen.length ? (
            <p className="text-amber-600 dark:text-amber-300 mt-4 text-sm">
              {chosen.length - buildable.length} question type{chosen.length - buildable.length === 1 ? ' has' : 's have'} too few items for this length and will be skipped.
            </p>
          ) : null}
          {chosen.length === 0 ? <p className="text-amber-600 dark:text-amber-300 mt-4 text-sm">Choose at least one question type to start a drill.</p> : null}

          <div className="border-ink-200 dark:border-white/10 mt-7 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
            <p className="text-ink-500 dark:text-ink-400 text-sm">Transcripts, tips and replays are available throughout.</p>
            <button type="button" className="btn-primary px-5 py-3" onClick={begin} disabled={buildable.length === 0}>Start this practice</button>
          </div>
        </section>

        <details className="card-solid group mt-8 p-0">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-ink-900 dark:text-white [&::-webkit-details-marker]:hidden">
            Browse the exam reference for all {ALL_QUESTION_TYPES.length} question types
            <span className="text-brand-600 transition-transform group-open:rotate-45 dark:text-brand-300" aria-hidden="true">+</span>
          </summary>
          <div className="border-t border-ink-200 px-5 pb-5 pt-4 dark:border-white/10">
            <p className="mb-4 text-sm text-ink-500 dark:text-ink-300">See where each type appears, how often it is tested, and a quick strategy before you begin.</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-lg border-collapse text-left text-sm">
                <caption className="sr-only">All PTE Academic question types by section, skill and count</caption>
                <thead><tr className="border-b border-ink-200 dark:border-white/10">{['Type', 'Section', 'Skill', 'Per test', 'Strategy'].map((h) => <th key={h} scope="col" className="px-3 py-2 text-xs font-semibold text-ink-500">{h}</th>)}</tr></thead>
                <tbody>{ALL_QUESTION_TYPES.map((t) => {
                  const meta = QUESTION_META[t]
                  return <tr key={t} className="border-b border-ink-100 align-top last:border-0 dark:border-white/6"><td className="px-3 py-2.5 font-semibold text-ink-900 dark:text-white">{meta.label}</td><td className="px-3 py-2.5 text-ink-500">{SECTION_META[meta.section].longTitle}</td><td className="px-3 py-2.5 capitalize text-ink-500">{meta.skills.join(' + ')}</td><td className="px-3 py-2.5 tabular-nums text-ink-500">{meta.perTest}</td><td className="px-3 py-2.5 text-xs leading-relaxed text-ink-500">{meta.tip}</td></tr>
                })}</tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-500 dark:text-ink-400">A full mock uses {Object.values(MOCK_BLUEPRINT).reduce((a, b) => a + b, 0)} items in total.</p>
          </div>
        </details>
      </div>
    </>
  )
}
