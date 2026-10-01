import { useEffect, useState } from 'react'
import { QUESTION_META, SECTION_META } from '../../domain/blueprint'
import { cn } from '../../lib/cn'
import { hasResponse, useTest } from '../../store/useTest'
import { PageHeading } from '../ui/primitives'
import { QuestionView } from '../questions/QuestionView'
import { TestHeader } from './TestHeader'

// ---------------------------------------------------------------------------
// Section briefing
// ---------------------------------------------------------------------------

function SectionBriefing({ onStart }: { onStart: () => void }) {
  const mock = useTest((s) => s.mock)!
  const sectionIndex = useTest((s) => s.sectionIndex)
  const section = mock.sections[sectionIndex]!
  const meta = SECTION_META[section.id]
  const typeCounts = new Map<string, number>()
  for (const id of section.itemIds) {
    const item = mock.items[id]
    if (!item || item.maxPoints === 0) continue
    typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1)
  }

  return (
    <div className="page-shell-app">
      <PageHeading
        eyebrow={`Section ${sectionIndex + 1} of ${mock.sections.length} · ${meta.title}`}
        title={meta.longTitle}
        description={meta.blurb}
      />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="section-question-types">
          <div className="flex items-baseline justify-between gap-4 border-b border-ink-200 pb-3 dark:border-white/10">
            <h2 id="section-question-types" className="text-ink-900 dark:text-white text-lg font-bold text-balance">
              In this section
            </h2>
            <span className="text-ink-500 dark:text-ink-400 text-xs tabular-nums">
              {section.itemIds.length} questions
            </span>
          </div>
          <ul className="divide-y divide-ink-200 dark:divide-white/10">
            {[...typeCounts.entries()].map(([type, count]) => {
              const qm = QUESTION_META[type as keyof typeof QUESTION_META]
              return (
                <li key={type} className="flex items-start justify-between gap-5 py-4">
                  <div className="min-w-0">
                    <p className="text-ink-900 dark:text-white text-sm font-semibold">{qm?.label ?? type}</p>
                    {qm?.tip ? <p className="text-ink-500 dark:text-ink-400 mt-1 text-sm leading-relaxed">{qm.tip}</p> : null}
                  </div>
                  <span className="text-ink-500 dark:text-ink-300 shrink-0 pt-0.5 text-sm font-semibold tabular-nums">×{count}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <aside className="rounded-xl bg-ink-900 p-6 text-white shadow-card lg:sticky lg:top-24">
          <p className="font-mono text-micro text-[#9bc9ff]">READY WHEN YOU ARE</p>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
            {section.itemIds.length}<span className="ml-2 text-sm font-medium text-[#aeb9c6]">questions</span>
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
            <div>
              <dt className="text-xs text-[#aeb9c6]">Time</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums">{mock.untimed ? 'No limit' : `${Math.round(section.seconds / 60)} min`}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#aeb9c6]">Scored skill</dt>
              <dd className="mt-1 text-sm font-semibold capitalize">{meta.skill}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-[#aeb9c6]">
            {mock.untimed ? 'Take your time. Your answers are saved as you go.' : 'The clock starts when you begin and continues through every question.'}
          </p>
          <button type="button" className="btn-primary mt-6 w-full px-7 py-3 text-base" onClick={onStart}>
            Begin {meta.longTitle}
          </button>
        </aside>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Question navigator
// ---------------------------------------------------------------------------

function Navigator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mock = useTest((s) => s.mock)!
  const sectionIndex = useTest((s) => s.sectionIndex)
  const itemIndex = useTest((s) => s.itemIndex)
  const responses = useTest((s) => s.responses)
  const goTo = useTest((s) => s.goTo)
  const section = mock.sections[sectionIndex]!

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Question overview">
      <button type="button" className="bg-ink-950/60 animate-fade-in absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <div className="scrollbar-thin border-ink-200 dark:border-white/10 animate-drawer-enter relative h-full w-full max-w-sm overflow-y-auto border-l bg-white p-5 dark:bg-ink-850">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-ink-900 dark:text-white font-bold text-balance">{section.title}</h2>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {section.itemIds.map((id, i) => {
            const item = mock.items[id]
            const answered = hasResponse(responses[id])
            const flagged = responses[id]?.flagged
            const current = i === itemIndex
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  goTo(sectionIndex, i)
                  onClose()
                }}
                className={cn(
                  'relative grid aspect-square place-items-center rounded-lg text-xs font-bold tabular-nums transition-colors',
                  current && 'ring-brand-500 ring-2 ring-offset-1 dark:ring-offset-ink-850',
                  item?.maxPoints === 0
                    ? 'bg-ink-100 text-ink-500 dark:bg-white/6 dark:text-ink-400'
                    : answered
                      ? 'bg-mint-500 text-white'
                      : 'bg-ink-200 text-ink-600 dark:bg-white/12 dark:text-ink-200',
                )}
                aria-label={`Question ${i + 1}${answered ? ', answered' : ', not answered'}${flagged ? ', flagged' : ''}`}
              >
                {i + 1}
                {flagged ? (
                  <span className="bg-amber-500 absolute -top-1 -right-1 size-2.5 rounded-full" aria-hidden="true" />
                ) : null}
              </button>
            )
          })}
        </div>
        <div className="mt-6 space-y-2 text-xs">
          <p className="text-ink-500 dark:text-ink-400 flex items-center gap-2">
            <span className="bg-mint-500 size-3 rounded" /> Answered
          </p>
          <p className="text-ink-500 dark:text-ink-400 flex items-center gap-2">
            <span className="bg-ink-200 dark:bg-white/12 size-3 rounded" /> Not answered
          </p>
          <p className="text-ink-500 dark:text-ink-400 flex items-center gap-2">
            <span className="bg-amber-500 size-3 rounded-full" /> Flagged for review
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export function TestRunner({ onExit }: { onExit: () => void }) {
  const mock = useTest((s) => s.mock)
  const mode = useTest((s) => s.mode)
  const status = useTest((s) => s.status)
  const sectionIndex = useTest((s) => s.sectionIndex)
  const itemIndex = useTest((s) => s.itemIndex)
  const responses = useTest((s) => s.responses)
  const sectionEndsAt = useTest((s) => s.sectionEndsAt)
  const timeExpired = useTest((s) => s.timeExpired)
  const next = useTest((s) => s.next)
  const prev = useTest((s) => s.prev)
  const beginSection = useTest((s) => s.beginSection)
  const setResponse = useTest((s) => s.setResponse)
  const toggleFlag = useTest((s) => s.toggleFlag)

  const examMode = mode === 'exam'
  const [navOpen, setNavOpen] = useState(false)
  // SC 4.1.3: question advanced, flag toggled, section changed.
  const [announcement, setAnnouncement] = useState('')

  // A single ticking timestamp, rather than a stored countdown. Deriving the
  // remaining time from it means the value is correct on the very first render
  // after a section starts, instead of lagging one tick behind and briefly
  // reading zero — which would expire the section immediately.
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (status !== 'running') return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [status, sectionEndsAt])

  useEffect(() => {
    if (sectionEndsAt) setNow(Date.now())
  }, [sectionEndsAt])

  const remaining = sectionEndsAt ? Math.max(0, Math.ceil((sectionEndsAt - now) / 1000)) : 0

  useEffect(() => {
    if (status !== 'running' || !sectionEndsAt || timeExpired) return
    if (Date.now() >= sectionEndsAt) useTest.getState().expireSection()
  }, [now, sectionEndsAt, timeExpired, status])

  useEffect(() => {
    if (status !== 'running' || !mock) return
    const handleKeyDown = (e: KeyboardEvent) => {
      const curSection = mock.sections[sectionIndex]
      if (!curSection) return
      const curIsLast = itemIndex === curSection.itemIds.length - 1
      const curIsLastSection = sectionIndex === mock.sections.length - 1
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        const atEnd = curIsLast && curIsLastSection
        setAnnouncement(
          atEnd ? 'Test finished, scoring your responses.' : curIsLast ? 'Section finished.' : 'Question advanced.',
        )
        next()
      } else if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        if (!(itemIndex === 0 && sectionIndex === 0)) {
          e.preventDefault()
          prev()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status, mock, sectionIndex, itemIndex, next, prev])

  if (!mock) return null
  const section = mock.sections[sectionIndex]
  if (!section) return null

  const itemId = section.itemIds[itemIndex]
  const item = itemId ? mock.items[itemId] : undefined
  if (!item) return null

  const response = responses[item.id]
  const answered = section.itemIds.filter((id) => hasResponse(responses[id])).length
  const flagged = section.itemIds.filter((id) => responses[id]?.flagged).length
  const group = section.groups.find((g) => g.id === item.groupId)
  const isLast = itemIndex === section.itemIds.length - 1
  const isLastSection = sectionIndex === mock.sections.length - 1

  if (status === 'briefing') {
    return <SectionBriefing onStart={() => beginSection(sectionIndex)} />
  }

  if (status === 'break' || timeExpired) {
    const nextSection = mock.sections[sectionIndex]
    const meta = nextSection ? SECTION_META[nextSection.id] : null
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-brand-600 dark:text-brand-300 text-sm font-semibold">
          {timeExpired ? 'Time' : 'Section complete'}
        </p>
        <h1 className="text-ink-900 dark:text-white mt-2 text-2xl font-bold text-balance">
          {timeExpired ? 'Time is up for this section' : `${section.title} complete`}
        </h1>
        <p className="text-ink-500 dark:text-ink-300 mt-3 leading-relaxed">
          {meta
            ? `Next: ${meta.longTitle} — ${meta.weightNote}, ${nextSection?.itemIds.length ?? 0} items.`
            : 'You have reached the end of the test.'}
        </p>
        <button
          type="button"
          className="btn-primary mt-8 px-7 py-3 text-base"
          onClick={() => {
            useTest.getState().setStatus('running')
            beginSection(sectionIndex)
          }}
        >
          {meta ? `Start ${meta.longTitle}` : 'Finish test'}
        </button>
      </div>
    )
  }

  return (
    // pb-28 clears the fixed bottom bar, and the scroll padding stops that bar
    // covering the focused control as the user tabs through the answers.
    <div className="min-h-dvh pb-28 [scroll-padding-bottom:7rem]">
      {/* Status messages for assistive technology: the visual header already
          shows this, but the change needs announcing. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <TestHeader
        untimed={Boolean(mock.untimed)}
        onExtend={(seconds) => {
          useTest.getState().extendSection(seconds)
          setAnnouncement(`Time extended by ${seconds / 60} minutes.`)
        }}
        secondsRemaining={remaining}
        totalSeconds={section.seconds}
        sectionTitle={section.title}
        itemNumber={itemIndex + 1}
        itemCount={section.itemIds.length}
        answered={answered}
        flagged={flagged}
      />

      <main className="page-shell-wide py-7">
        {group?.stimulus.passageParagraphs && group.type !== 'summarize-written-text' ? (
          <article className="card mb-6">
            {group.stimulus.passageTitle ? (
              <h2 className="text-ink-900 dark:text-white border-ink-200 dark:border-white/10 border-b pb-3 text-lg font-bold text-balance">
                {group.stimulus.passageTitle}
              </h2>
            ) : null}
            <div className="mt-3 space-y-3.5">
              {group.stimulus.passageParagraphs.map((p, i) => (
                <p key={i} className="passage">
                  {p}
                </p>
              ))}
            </div>
            {group.stimulus.note ? (
              <p className="text-ink-500 dark:text-ink-400 mt-4 border-t pt-3 text-xs italic">{group.stimulus.note}</p>
            ) : null}
          </article>
        ) : null}

        {group?.stimulus.passageParagraphs && group.type === 'summarize-written-text' ? (
          <article className="card mb-6">
            <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">
              {group.stimulus.passageTitle}
            </h2>
            <div className="mt-3 space-y-3.5">
              {group.stimulus.passageParagraphs.map((p, i) => (
                <p key={i} className="passage">
                  {p}
                </p>
              ))}
            </div>
          </article>
        ) : null}

        {group?.stimulus.note && !group.stimulus.passageParagraphs ? (
          <p className="text-ink-500 dark:text-ink-400 mb-5 text-sm italic">{group.stimulus.note}</p>
        ) : null}

        <section key={item.id} className="card animate-question-enter p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 pb-4 dark:border-white/10">
            <span className="pill bg-brand-500/12 text-brand-700 dark:text-brand-300">
              {QUESTION_META[item.type]?.label ?? item.type}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => {
                  toggleFlag(item.id)
                  setAnnouncement(responses[item.id]?.flagged ? 'Flag removed.' : 'Flagged for review.')
                }}
                aria-pressed={Boolean(response?.flagged)}
              >
                <span className={response?.flagged ? 'text-amber-500' : ''}>⚑</span>
                {response?.flagged ? 'Flagged' : 'Flag'}
              </button>
              <button type="button" className="btn-ghost text-xs" onClick={() => setNavOpen(true)}>
                All questions
              </button>
            </div>
          </div>

          <QuestionView
            item={item}
            response={response}
            onChange={(patch) => setResponse(item.id, patch)}
            examMode={examMode}
            showTranscript={!examMode}
          />

          {!examMode && item.tip ? (
            <p className="text-brand-500 dark:text-brand-300 border-brand-500/25 mt-6 border-t pt-4 text-sm leading-relaxed">
              <span className="font-bold">Tip · </span>
              {item.tip}
            </p>
          ) : null}
        </section>
      </main>

      <div className="border-ink-200 dark:border-white/10 fixed inset-x-0 bottom-0 z-30 border-t bg-white/90 backdrop-blur-md dark:bg-ink-900/90">
        <div className="page-shell-wide flex items-center justify-between gap-3 py-3">
          <button type="button" className="btn-secondary" onClick={prev} disabled={itemIndex === 0 && sectionIndex === 0}>
            ← Back
            <kbd className="hidden sm:inline-block ml-1 rounded bg-ink-200/60 dark:bg-white/10 px-1 py-0.5 text-[10px] font-mono text-ink-500 dark:text-ink-400">Alt+B</kbd>
          </button>
          <button type="button" className="btn-ghost hidden sm:inline-flex" onClick={() => setNavOpen(true)}>
            {answered} of {section.itemIds.length} answered
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              const atEnd = isLast && isLastSection
              setAnnouncement(
                atEnd ? 'Test finished, scoring your responses.' : isLast ? 'Section finished.' : 'Question advanced.',
              )
              next()
            }}
          >
            {isLast ? (isLastSection ? 'Finish test' : 'End section') : 'Next →'}
            <kbd className="hidden sm:inline-block ml-1.5 rounded bg-white/25 px-1 py-0.5 text-[10px] font-mono text-white">Alt+N</kbd>
          </button>
        </div>
      </div>

      <Navigator open={navOpen} onClose={() => setNavOpen(false)} />
      <button type="button" className="sr-only" onClick={onExit}>
        Exit test
      </button>
    </div>
  )
}
