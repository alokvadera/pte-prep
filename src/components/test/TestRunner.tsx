import { useCallback, useEffect, useRef, useState } from 'react'
import { QUESTION_META, SECTION_META } from '../../domain/blueprint'
import { cn } from '../../lib/cn'
import { hasResponse, useTest } from '../../store/useTest'
import { PageHeading } from '../ui/primitives'
import { Reveal } from '../ui/motion'
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
        eyebrow={`Section ${sectionIndex + 1} of ${mock.sections.length}, ${meta.title}`}
        title={meta.longTitle}
        description={meta.blurb}
      />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="section-question-types">
          <div className="flex items-baseline justify-between gap-4 border-b border-ink-200 pb-3 dark:border-white/10">
            <h2 id="section-question-types" className="text-lg leading-[1.3] text-balance text-ink-900 dark:text-white">
              In this section
            </h2>
            <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs tabular-nums">
              {section.itemIds.length} questions
            </span>
          </div>
          <ul className="divide-y divide-ink-200 dark:divide-white/10">
            {[...typeCounts.entries()].map(([type, count], i) => {
              const qm = QUESTION_META[type as keyof typeof QUESTION_META]
              return (
                <Reveal key={type} variant="up" delay={Math.min(i, 5) * 25} duration={500}>
                  <li className="flex items-start justify-between gap-5 py-4">
                  <div className="min-w-0">
                    <p className="text-ink-900 dark:text-white text-sm font-semibold">{qm?.label ?? type}</p>
                    {qm?.tip ? <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-sm leading-relaxed">{qm.tip}</p> : null}
                  </div>
                  <span className="text-ink-500 dark:text-ink-on-dark shrink-0 pt-0.5 text-sm font-semibold tabular-nums">×{count}</span>
                </li>
              </Reveal>
              )
            })}
          </ul>
        </section>

        <aside className="rounded-md bg-ink-900 p-6 text-white lg:sticky lg:top-24 dark:border dark:border-white/10 dark:bg-ink-850">
          <p className="text-xs font-bold text-brand-300">Ready when you are</p>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
            {section.itemIds.length}<span className="ml-2 text-sm font-medium text-ink-on-dark-muted">questions</span>
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
            <div>
              <dt className="text-xs text-ink-on-dark-muted">Time</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums">{mock.untimed ? 'No limit' : `${Math.round(section.seconds / 60)} min`}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-on-dark-muted">Scored skill</dt>
              <dd className="mt-1 text-sm font-semibold capitalize">{meta.skill}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-ink-on-dark-muted">
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
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return

    const previousActive = document.activeElement as HTMLElement | null
    // Move focus into the drawer
    const focusable = panel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    focusable[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab' && focusable.length > 0) {
        e.preventDefault()
        const focusableArr = Array.from(focusable)
        const curIdx = focusableArr.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey) {
          const nextIdx = curIdx <= 0 ? focusableArr.length - 1 : curIdx - 1
          focusableArr[nextIdx]?.focus()
        } else {
          const nextIdx = curIdx === -1 || curIdx >= focusableArr.length - 1 ? 0 : curIdx + 1
          focusableArr[nextIdx]?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      previousActive?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="nav-drawer-title">
      <button type="button" className="bg-ink-950/60 animate-fade-in absolute inset-0 cursor-pointer" onClick={onClose} aria-label="Close question overview" />
      <div ref={panelRef} className="scrollbar-thin border-ink-200 dark:border-white/10 animate-drawer-enter relative h-full w-full max-w-sm overflow-y-auto border-l bg-white p-5 dark:bg-ink-850">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="nav-drawer-title" className="text-ink-900 dark:text-white font-bold text-balance">{section.title}</h2>
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
                  'relative grid aspect-square place-items-center rounded-sm text-xs font-bold tabular-nums transition-colors',
                  current && 'ring-brand-500 ring-2 ring-offset-1 dark:ring-offset-ink-850',
                  item?.maxPoints === 0
                    ? 'bg-ink-100 text-ink-500 dark:bg-white/6 dark:text-ink-on-dark-muted'
                    : answered
                      ? 'bg-mint-500 text-ink-900 dark:bg-emerald-600 dark:text-white'
                      : 'bg-ink-200 text-ink-600 dark:bg-white/12 dark:text-ink-200',
                )}
                aria-label={`Question ${i + 1}${answered ? ', answered' : ', not answered'}${flagged ? ', flagged' : ''}`}
              >
                {i + 1}
                {answered && item?.maxPoints !== 0 ? (
                  <span className="absolute bottom-1 size-1 rounded-full bg-white/80" aria-hidden="true" />
                ) : null}
                {flagged ? (
                  <span className="bg-amber-500 absolute -top-1 -right-1 size-2.5 rounded-full" aria-hidden="true" />
                ) : null}
              </button>
            )
          })}
        </div>
        <div className="mt-6 space-y-2 text-xs">
          <p className="text-ink-500 dark:text-ink-on-dark-muted flex items-center gap-2">
            <span className="bg-mint-500 dark:bg-emerald-600 relative flex size-3 items-center justify-center rounded-sm">
              <span className="size-1 rounded-full bg-white/80" />
            </span>{' '}
            Answered
          </p>
          <p className="text-ink-500 dark:text-ink-on-dark-muted flex items-center gap-2">
            <span className="bg-ink-200 dark:bg-white/12 size-3 rounded-sm" /> Not answered
          </p>
          <p className="text-ink-500 dark:text-ink-on-dark-muted flex items-center gap-2">
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
  const forwardOnly = Boolean(mock?.forwardOnly)
  const [navOpen, setNavOpen] = useState(false)
  const onCloseNav = useCallback(() => setNavOpen(false), [])
  // SC 4.1.3: question advanced, flag toggled, section changed.
  const [announcement, setAnnouncement] = useState('')

  // Record how long each item is on screen.
  useEffect(() => {
    if (status !== 'running') return
    const startedAt = Date.now()
    return () => {
      if (!mock) return
      const section = mock.sections[sectionIndex]
      const id = section?.itemIds[itemIndex]
      if (!id) return
      const elapsed = Math.round((Date.now() - startedAt) / 1000)
      if (elapsed <= 0) return
      const previous = useTest.getState().responses[id]?.secondsOnItem ?? 0
      useTest.getState().setResponse(id, { secondsOnItem: previous + elapsed })
    }
  }, [status, itemIndex, sectionIndex, mock])

  useEffect(() => {
    if (mock?.untimed || status !== 'running' || !sectionEndsAt || timeExpired) return
    const msUntilExpiry = Math.max(0, sectionEndsAt - Date.now())
    const timer = window.setTimeout(() => {
      useTest.getState().expireSection()
    }, msUntilExpiry)
    return () => window.clearTimeout(timer)
  }, [sectionEndsAt, timeExpired, status, mock?.untimed])

  useEffect(() => {
    if (status !== 'running' || !mock) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) return

      const curSection = mock.sections[sectionIndex]
      if (!curSection) return
      const curIsLast = itemIndex === curSection.itemIds.length - 1
      const curIsLastSection = sectionIndex === mock.sections.length - 1
      if (e.altKey && (e.key === 'n' || e.key === 'N' || e.code === 'KeyN')) {
        e.preventDefault()
        const atEnd = curIsLast && curIsLastSection
        setAnnouncement(
          atEnd ? 'Test finished, scoring your responses.' : curIsLast ? 'Section finished.' : 'Question advanced.',
        )
        next()
      } else if (e.altKey && (e.key === 'b' || e.key === 'B' || e.code === 'KeyB')) {
        if (mock.forwardOnly) return
        if (itemIndex > 0) {
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
    const isBreak = status === 'break'
    const completedSection = isBreak ? mock.sections[sectionIndex - 1] : mock.sections[sectionIndex]
    const nextIndex = isBreak ? sectionIndex : sectionIndex + 1
    const hasNext = nextIndex < mock.sections.length
    const nextSection = hasNext ? mock.sections[nextIndex] : null
    const meta = nextSection ? SECTION_META[nextSection.id] : null

    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-brand-600 dark:text-brand-300 text-sm font-semibold">
          {timeExpired ? 'Time' : 'Section complete'}
        </p>
        <h1 className="mt-2 text-2xl leading-[1.2] text-balance text-ink-900 dark:text-white">
          {timeExpired
            ? `Time is up for ${completedSection?.title ?? 'this section'}`
            : `${completedSection?.title ?? 'Section'} complete`}
        </h1>
        <p className="text-ink-500 dark:text-ink-on-dark mt-3 leading-relaxed">
          {meta
            ? `Next: ${meta.longTitle} — ${meta.weightNote}, ${nextSection?.itemIds.length ?? 0} items.`
            : 'You have reached the end of the test.'}
        </p>
        <button
          type="button"
          className="btn-primary mt-8 px-7 py-3 text-base"
          onClick={() => {
            if (hasNext) {
              useTest.getState().setStatus('running')
              beginSection(nextIndex)
            } else {
              useTest.getState().setStatus('finished')
            }
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
        onExtend={
          !examMode
            ? (seconds) => {
                useTest.getState().extendSection(seconds)
                setAnnouncement(`Time extended by ${seconds / 60} minutes.`)
              }
            : undefined
        }
        sectionEndsAt={sectionEndsAt}
        onExpire={() => useTest.getState().expireSection()}
        totalSeconds={section.seconds}
        sectionTitle={section.title}
        itemNumber={itemIndex + 1}
        itemCount={section.itemIds.length}
        answered={answered}
        flagged={flagged}
        onExit={onExit}
      />

      <main id="test-main" tabIndex={-1} className="page-shell-wide pt-7 pb-24 outline-none">
        {group?.stimulus.passageParagraphs && group.type !== 'summarize-written-text' ? (
          <article className="card mb-6">
            {group.stimulus.passageTitle ? (
              <h2 className="border-ink-200 dark:border-white/10 border-b pb-3 text-lg leading-[1.3] text-balance text-ink-900 dark:text-white">
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
              <p className="text-ink-500 dark:text-ink-on-dark-muted mt-4 border-t pt-3 text-xs italic">{group.stimulus.note}</p>
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
          <p className="text-ink-500 dark:text-ink-on-dark-muted mb-5 text-sm italic">{group.stimulus.note}</p>
        ) : null}

        <section key={item.id} className="card animate-question-enter p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 pb-4 dark:border-white/10">
            <span className="pill bg-brand-500/12 text-brand-700 dark:text-brand-300">
              {QUESTION_META[item.type]?.label ?? item.type}
            </span>
            <div className="flex items-center gap-2">
              {forwardOnly ? (
                <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold">Test-day mode, forward only</span>
              ) : (
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={() => {
                    toggleFlag(item.id)
                    setAnnouncement(responses[item.id]?.flagged ? 'Flag removed.' : 'Flagged for review.')
                  }}
                  aria-pressed={Boolean(response?.flagged)}
                >
                  <span className={response?.flagged ? 'text-amber-500 dark:text-amber-300' : ''}>⚑</span>
                  {response?.flagged ? 'Flagged' : 'Flag'}
                </button>
              )}
              {forwardOnly ? null : (
                <button type="button" className="btn-ghost text-xs" onClick={() => setNavOpen(true)}>
                  All questions
                </button>
              )}
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
              <span className="font-bold">Tip, </span>
              {item.tip}
            </p>
          ) : null}
        </section>
      </main>

      <div className="border-ink-200 dark:border-white/10 fixed inset-x-0 bottom-0 z-30 border-t bg-white/90 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] dark:bg-ink-900/90">
        <div className="page-shell-wide flex items-center justify-between gap-3 pt-3">
          {forwardOnly ? (
            <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs">Test-day mode, no going back</span>
          ) : (
            <button type="button" className="btn-secondary" onClick={prev} disabled={itemIndex === 0}>
              ← Back
              <kbd className="hidden sm:inline-block ml-1 rounded-sm bg-ink-200/60 dark:bg-white/10 px-1 py-0.5 text-xs font-mono text-ink-500 dark:text-ink-on-dark-muted">Alt+B</kbd>
            </button>
          )}
          {forwardOnly ? (
            <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs tabular-nums">
              {answered} of {section.itemIds.length} answered
            </span>
          ) : (
            <button type="button" className="btn-ghost inline-flex" onClick={() => setNavOpen(true)}>
              <span className="hidden sm:inline">{answered} of {section.itemIds.length} answered</span>
              <span className="sm:hidden tabular-nums">{answered}/{section.itemIds.length}</span>
            </button>
          )}
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
            {isLast ? (isLastSection ? 'Finish test' : 'End section') : 'Next'}
            <kbd className="hidden sm:inline-block ml-1.5 rounded-sm bg-white/25 px-1 py-0.5 text-xs font-mono text-white">Alt+N</kbd>
          </button>
        </div>
      </div>

      <Navigator open={navOpen} onClose={onCloseNav} />
    </div>
  )
}
