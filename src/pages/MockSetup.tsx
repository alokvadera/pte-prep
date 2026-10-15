import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MOCK_BLUEPRINT,
  QUESTION_META,
  SECTION_META,
  describeMockPreview,
} from '../domain/blueprint'
import type { MockMode, QuestionType, SectionId } from '../domain/types'
import { manifestCapacityByType } from '../content/manifest'
import { Seo } from '../seo/Seo'
import { Badge, Button, PageWrapper } from '../components/ui/primitives'
import { ActiveSessionNotice } from '../components/ui/ActiveSessionNotice'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Reveal } from '../components/ui/motion'
import { Dialog } from '../components/ui/dialog'
import { ScoreCalculator } from '../components/ui/score-calculator'
import { SectionHeading } from '../components/ui/primitives'
import { useTest } from '../store/useTest'

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

const LENGTHS: Record<Length, { label: string; scale: number }> = {
  full: { label: 'Full mock', scale: 1 },
  half: { label: 'Half mock', scale: 0.5 },
  quick: { label: 'Quick run', scale: 0.3 },
}

export default function MockSetup() {
  const navigate = useNavigate()
  const start = useTest((s) => s.start)
  const activeMock = useTest((s) => s.mock)
  const activeStatus = useTest((s) => s.status)
  
  const [length, setLength] = useState<Length>('full')
  const [mode] = useState<MockMode>('exam')
  const [singleSection, setSingleSection] = useState<SectionId | null>(null)
  const [timing, setTiming] = useState<TimingId>('standard')
  const [forwardOnly] = useState(false)
  // The assembler and the content bank it reads are only fetched when the
  // candidate actually starts a session, so the ~10 000 LOC bank never
  // lands on this page's initial JavaScript.
  const [starting, setStarting] = useState(false)

  const capacity = useMemo(() => manifestCapacityByType(), [])

  const counts = useMemo(() => {
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
  }, [length, capacity])

  // The session summary is derived from the blueprint alone — the
  // assembler only runs when the session starts. describeMockPreview is
  // asserted against the real assembler by scripts/bank-check.ts, so the
  // figures shown here are the figures the built session will carry.
  const preview = useMemo(() => {
    const t = TIMINGS[timing]
    return describeMockPreview(counts, {
      singleSection,
      timeScale: t.scale,
      untimed: t.untimed,
    })
  }, [counts, singleSection, timing])

  const includedTypes = preview.includedTypes

  const [confirmOverwrite, setConfirmOverwrite] = useState(false)

  const handleStart = () => {
    if (activeMock && activeStatus !== 'finished') {
      setConfirmOverwrite(true)
      return
    }
    void begin()
  }

  // Assemble the session on demand. The preview above already knows the
  // section, item and time figures; this is where the passages, lectures
  // and charts are actually fetched. The summary depends on counts, not item
  // order, so choose a fresh seed only when starting: another mock can draw
  // different material without changing the prerendered setup screen.
  const begin = async () => {
    if (starting) return
    setStarting(true)
    try {
      const t = TIMINGS[timing]
      const seed = Math.floor(Math.random() * 0x1_0000_0000)
      const { buildFullMock, buildSectionMock } = await import('../domain/assemble')
      const mock = singleSection
        ? buildSectionMock(seed, singleSection, counts, {
            timeScale: t.scale,
            untimed: t.untimed,
            forwardOnly,
          })
        : buildFullMock(seed, {
            counts,
            timeScale: t.scale,
            untimed: t.untimed,
            forwardOnly,
          })
      start(mock, mode)
      navigate('/test')
    } finally {
      setStarting(false)
    }
  }

  return (
    <>
      <Seo />
      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Mock test' }]} />}
        eyebrow="Mock configuration"
        title="Set up your mock test"
        description="Choose a length, then check your microphone before you start."
      >
        <ActiveSessionNotice />
        <div className="mt-6 flex items-start gap-3.5 rounded-2xl border border-mark-500/25 bg-mark-500/[0.04] p-4.5 dark:border-mark-400/25 dark:bg-mark-500/[0.08]">
          <div className="size-8 rounded-xl bg-mark-500/10 text-mark-600 dark:bg-mark-400/20 dark:text-mark-300 grid place-items-center shrink-0 mt-0.5">
            <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-mark-700 dark:text-mark-300">
                Official Exam Conditions
              </span>
              <span className="rounded-full bg-mark-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-mark-700 dark:text-mark-300">
                Continuous timers
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-600 dark:text-ink-on-dark-muted">
              Section clocks run continuously without pausing, matching real Pearson test-centre rules. Verify your headset microphone below before beginning Part 1.
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Reveal variant="up" duration={550}>
            <div className="card-solid relative overflow-hidden">
              <h2 className="text-ink-900 dark:text-ink-50 border-ink-200 dark:border-white/10 mb-4 border-b pb-4 text-xs font-extrabold uppercase tracking-wider">
                Test length and timing
              </h2>
              
              <div className="space-y-3">
                {(['full', 'half', 'quick'] as const).map((len) => {
                  const isActive = length === len
                  const meta =
                    len === 'full'
                      ? {
                          label: 'Full mock',
                          badge: 'Official pace',
                          badgeTone: 'mint' as const,
                          specs: 'All 3 sections · 22 types · ~2h 15m',
                          desc: 'Full Pearson Academic simulation with machine scoring across Speaking, Writing, Reading, and Listening.',
                        }
                      : len === 'half'
                        ? {
                            label: 'Half mock',
                            badge: 'Accelerated',
                            badgeTone: 'brand' as const,
                            specs: 'Every section halved · ~1h',
                            desc: 'Proportional question distribution across all sections. Ideal for mid-week pacing and stamina drills.',
                          }
                        : {
                            label: 'Quick run',
                            badge: 'Diagnostic',
                            badgeTone: 'neutral' as const,
                            specs: 'Around 25 items · ~30m',
                            desc: 'Rapid diagnostic run. Validates microphone input, speech recognition latency, and pacing.',
                          }

                  return (
                    <label
                      key={len}
                      className={cn(
                        'group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 sm:p-5 transition-all duration-200',
                        isActive
                          ? 'border-mark-500/80 bg-mark-500/[0.07] ring-1 ring-mark-500/40 dark:border-mark-400 dark:bg-mark-500/[0.12] dark:ring-mark-400/40 shadow-sm shadow-mark-500/10'
                          : 'border-ink-200/80 bg-white hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/[0.04]',
                      )}
                    >
                      <input
                        type="radio"
                        name="length"
                        className="peer sr-only"
                        checked={isActive}
                        onChange={() => { setLength(len); setSingleSection(null); }}
                      />

                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-all',
                          isActive
                            ? 'border-mark-600 bg-mark-600 dark:border-mark-400 dark:bg-mark-600 text-white shadow-sm'
                            : 'border-ink-300 group-hover:border-ink-400 dark:border-white/20 dark:group-hover:border-white/40',
                        )}
                      >
                        {isActive ? (
                          <span className="size-2 rounded-full bg-white dark:bg-ink-950" />
                        ) : null}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="text-ink-900 dark:text-ink-50 text-base font-bold">
                              {meta.label}
                            </span>
                            <Badge tone={meta.badgeTone}>{meta.badge}</Badge>
                          </div>
                          <span className="text-ink-500 dark:text-ink-on-dark-muted font-mono text-xs">
                            {meta.specs}
                          </span>
                        </div>
                        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1.5 text-xs leading-relaxed">
                          {meta.desc}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>

              <div className="border-ink-100 dark:border-white/10 mt-6 border-t pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-ink-900 dark:text-white text-xs font-bold uppercase tracking-wider">Pacing &amp; Clock</h3>
                  <span className="text-[11px] font-mono text-ink-500 dark:text-ink-on-dark-muted">WCAG 2.2 accessible</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Timing">
                  {(Object.keys(TIMINGS) as TimingId[]).map((id) => {
                    const isActive = timing === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTiming(id)}
                        aria-pressed={isActive}
                        className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-xs font-bold transition-all duration-150 ${
                          isActive
                            ? 'border-mark-500 bg-mark-600 text-white shadow-sm shadow-mark-500/20 dark:border-mark-400 dark:bg-mark-600 dark:text-white'
                            : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-ink-on-dark dark:hover:border-white/20'
                        }`}
                      >
                        {TIMINGS[id].label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-ink-500 dark:text-ink-on-dark-muted mt-3 text-xs leading-relaxed">
                  {TIMINGS[timing].detail}
                </p>
              </div>

              {length !== 'full' && (
                <div className="mt-6 pt-6 border-t border-ink-100 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-ink-900 dark:text-white uppercase tracking-wider">
                      Section filter (optional)
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleSection(null)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        singleSection === null
                          ? 'border-mark-500 bg-mark-600 text-white dark:border-mark-400 dark:bg-mark-600 dark:text-white'
                          : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-ink-on-dark dark:hover:border-white/20'
                      }`}
                    >
                      All sections
                    </button>
                    {(['speaking-writing', 'reading', 'listening'] as const).map((sId) => {
                      const isActive = singleSection === sId
                      const sectionTitle = SECTION_META[sId]?.longTitle || sId

                      return (
                        <button
                          key={sId}
                          type="button"
                          onClick={() => setSingleSection(sId)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer truncate ${
                            isActive
                              ? 'border-mark-500 bg-mark-600 text-white dark:border-mark-400 dark:bg-mark-600 dark:text-white'
                              : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-ink-on-dark dark:hover:border-white/20'
                          }`}
                          title={sectionTitle}
                        >
                          {SECTION_META[sId]?.longTitle || sId}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              </div>
            </Reveal>

            <Reveal variant="up" delay={60} duration={500}>
              <MicChecker />
            </Reveal>
          </div>

          <div className="lg:col-span-1">
            <Reveal variant="up" delay={40} duration={550}>
              <div className="card-solid sticky top-24 border-t-2 border-t-mark-500 shadow-lg shadow-mark-500/5">
              <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-mint-500 animate-pulse" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-900 dark:text-white">
                    Session summary
                  </h2>
                </div>
                <Badge tone="mint">Ready</Badge>
              </div>
              
              <dl className="space-y-3 mb-6 border-b border-ink-100 dark:border-white/10 pb-5">
                <Row label="Type" value={LENGTHS[length].label} />
                <Row label="Timing" value={TIMINGS[timing].label} />
                <Row label="Sections" value={preview.sectionIds.map((s) => SECTION_META[s]?.longTitle || s).join(' → ')} />
                <Row label="Scored items" value={`${preview.scoredCount} items`} popKey={preview.scoredCount} />
                <Row label="Estimated time" value={formatClock(preview.totalSeconds)} popKey={preview.totalSeconds} />
                <Row label="Scoring" value="Pearson Automated (AI)" />
              </dl>
              
              <Button size="lg" className="w-full justify-center text-sm font-bold shadow-md shadow-mark-500/20" onClick={handleStart} disabled={starting}>
                {starting ? 'Preparing your mock…' : 'Start mock test'}
              </Button>

              <details className="border-ink-200 dark:border-white/10 group mt-5 border-t pt-4">
                <summary className="text-ink-700 dark:text-ink-200 flex cursor-pointer items-center justify-between gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="rounded-full bg-mark-500/10 dark:bg-mark-400/20 px-2 py-0.5 font-mono text-[11px] font-bold text-mark-700 dark:text-mark-300">
                      {includedTypes.length}
                    </span>
                    <span>question types</span>
                  </span>
                  <span className="text-ink-500 dark:text-ink-on-dark-muted font-normal group-open:hidden">Inspect ↓</span>
                  <span className="text-ink-500 dark:text-ink-on-dark-muted hidden font-normal group-open:inline">Collapse ↑</span>
                </summary>
                <ul className="text-ink-600 dark:text-ink-on-dark mt-3 max-h-48 space-y-1.5 overflow-y-auto pr-2 text-xs">
                  {includedTypes.map((type, idx) => (
                    <li key={type} className="flex items-center justify-between py-1 border-b border-ink-100/60 dark:border-white/5">
                      <span className="truncate">{QUESTION_META[type]?.label || type}</span>
                      <span className="text-ink-500 dark:text-ink-on-dark-muted font-mono text-xs shrink-0 ml-2">#{String(idx + 1).padStart(2, '0')}</span>
                    </li>
                  ))}
                </ul>
              </details>
              </div>
            </Reveal>
          </div>
        </div>

        {/* What-if: the target score against current
            practice, beside the setup it feeds. */}
        <section className="mt-10" aria-labelledby="calculator-heading">
          <SectionHeading
            id="calculator-heading"
            eyebrow="What if"
            title="Know the gap before you start"
            description="Where does your current practice stand against the score you need? Drag the sliders — the ring is the estimate."
          />
          <ScoreCalculator hideEyebrow />
        </section>

        <Dialog
          open={confirmOverwrite}
          onClose={() => setConfirmOverwrite(false)}
          title="Discard active mock?"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setConfirmOverwrite(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={() => { setConfirmOverwrite(false); void begin(); }}>
                Discard & start
              </Button>
            </>
          }
        >
          <p className="text-amber-600 dark:text-amber-400 mb-2 text-xs font-bold">
            This conflicts with your current selection
          </p>
          <p>
            You have an active mock ({activeMock?.title}). Starting a new one will discard its progress.
          </p>
        </Dialog>
      </PageWrapper>
    </>
  )
}

function Row({ label, value, popKey }: { label: string; value: string; popKey?: string | number }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3">
      <dt className="text-ink-500 dark:text-ink-on-dark-muted shrink-0 text-xs">{label}</dt>
      <dd className="text-ink-900 dark:text-white min-w-0 truncate text-right text-xs font-semibold tabular-nums">
        {/* A figure that changes with the controls gets a spring nudge, so the
            summary reads as answering the last choice rather than swapping
            text. Everything else renders as it always did. */}
        {popKey === undefined ? (
          value
        ) : (
          <span key={popKey} className="animate-pop inline-block">
            {value}
          </span>
        )}
      </dd>
    </div>
  )
}

function MicChecker() {
  const [state, setState] = useState<'idle' | 'recording' | 'ready' | 'error'>('idle')
  const [countdown, setCountdown] = useState(3)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [level, setLevel] = useState(0)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animRef = useRef<number | null>(null)
  const countTimerRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      if (countTimerRef.current !== null) window.clearInterval(countTimerRef.current)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      void audioCtxRef.current?.close().catch(() => undefined)
    }
  }, [audioUrl])

  const startTest = async () => {
    setErrorMsg(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }

    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState('error')
      setErrorMsg('Microphone recording is not supported in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      streamRef.current = stream

      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctor) {
        const ctx = new Ctor()
        audioCtxRef.current = ctx
        if (ctx.state === 'suspended') await ctx.resume().catch(() => undefined)
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)

        const updateLevel = () => {
          analyser.getByteFrequencyData(data)
          let sum = 0
          for (let i = 0; i < data.length; i++) sum += data[i] ?? 0
          const avg = sum / data.length
          setLevel(Math.min(100, Math.round((avg / 128) * 100)))
          animRef.current = requestAnimationFrame(updateLevel)
        }
        updateLevel()
      }

      chunksRef.current = []
      const mimeType =
        typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        if (animRef.current) cancelAnimationFrame(animRef.current)
        setLevel(0)
        stream.getTracks().forEach((t) => t.stop())
        void audioCtxRef.current?.close().catch(() => undefined)

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob)
          setAudioUrl(url)
          setState('ready')
        } else {
          setState('error')
          setErrorMsg('No audio was captured. Check your microphone connection.')
        }
      }

      recorder.start(100)
      setState('recording')
      setCountdown(3)

      let count = 3
      countTimerRef.current = window.setInterval(() => {
        count -= 1
        setCountdown(count)
        if (count <= 0) {
          if (countTimerRef.current !== null) {
            window.clearInterval(countTimerRef.current)
            countTimerRef.current = null
          }
          if (recorder.state === 'recording') {
            recorder.stop()
          }
        }
      }, 1000)
    } catch (err) {
      const name = err instanceof DOMException ? err.name : 'Error'
      setState('error')
      setErrorMsg(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone permission was denied. Allow microphone access in your browser to test your mic.'
          : 'Could not access microphone. Ensure your headset is connected.',
      )
    }
  }

  const activeBars = Math.min(16, Math.max(1, Math.round((Math.max(8, level) / 100) * 16)))

  return (
    <div className="card-solid relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-4 mb-5">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-ink-on-dark-muted">
          <svg className="size-3.5 text-mark-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 00-3 3v7.5a3 3 0 006 0V4.5a3 3 0 00-3-3z" />
          </svg>
          <span>Hardware Readiness</span>
        </div>
        <div className="flex items-center gap-2">
          {state === 'idle' && (
            <span className="text-xs text-ink-500 dark:text-ink-on-dark-muted">
              Ready
            </span>
          )}
          {state === 'recording' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse">
              <span className="size-2 rounded-full bg-rose-600" />
              Recording <span className="font-mono tabular-nums">{countdown}s</span>
            </span>
          )}
          {state === 'ready' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-mint-700 dark:text-mint-300">
              <span className="size-1.5 rounded-full bg-mint-500" />
              Level looks good
            </span>
          )}
          {state === 'error' && (
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Something went wrong
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-md">
          <h3 className="text-sm font-bold text-ink-900 dark:text-white">Microphone input test</h3>
          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-xs leading-relaxed">
            Record a 3-second sample to verify browser microphone permissions and ensure acoustic clarity before starting Part 1.
          </p>
        </div>

        {state === 'idle' && (
          <Button variant="secondary" onClick={startTest} size="sm" className="shrink-0 text-xs">
            Check microphone (3s)
          </Button>
        )}

        {state === 'ready' && (
          <Button variant="ghost" onClick={startTest} size="sm" className="shrink-0 text-xs">
            Check again ↺
          </Button>
        )}
      </div>

      {state === 'recording' && (
        <div className="mt-5 space-y-3 rounded-xl border border-ink-200 dark:border-white/10 bg-ink-50/50 dark:bg-white/[0.02] p-4">
          <div className="flex items-center justify-between font-mono text-xs text-ink-500 dark:text-ink-on-dark-muted px-0.5">
            <span>-42dB</span>
            <span>-24dB</span>
            <span>-12dB</span>
            <span>-6dB</span>
            <span>0dB</span>
            <span className="text-rose-500 dark:text-rose-400 font-bold">Peak</span>
          </div>

          {/* 16-Segment LED Bar Graph */}
          <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1 h-3 p-1 rounded-xs bg-ink-950/10 dark:bg-black/40 border border-ink-200 dark:border-white/10">
            {Array.from({ length: 16 }).map((_, i) => {
              const isLit = i < activeBars
              const isPeak = i >= 14
              const isMid = i >= 10 && i < 14
              return (
                <div
                  key={i}
                  className={`h-full rounded-xs transition-colors duration-75 ${
                    isLit
                      ? isPeak
                        ? 'bg-rose-500'
                        : isMid
                          ? 'bg-amber-500'
                          : 'bg-mint-500'
                      : 'bg-ink-200 dark:bg-white/8'
                  }`}
                />
              )
            })}
          </div>

          <div className="pt-2 text-xs text-ink-600 dark:text-ink-on-dark">
            <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs block mb-1">Say this phrase:</span>
            <span className="font-semibold text-ink-900 dark:text-white">"The quick brown fox jumps over the lazy dog."</span>
          </div>
        </div>
      )}

      {state === 'ready' && audioUrl && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-mint-500/25 bg-mint-500/5 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mint-500/20 text-mint-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div>
              <p className="text-xs font-bold text-ink-900 dark:text-white">Microphone works</p>
              <p className="text-xs text-ink-500 dark:text-ink-on-dark-muted">Your voice was recorded clearly. Listen back to check.</p>
            </div>
          </div>
          <audio controls src={audioUrl} className="h-8 max-w-xs" />
        </div>
      )}

      {state === 'error' && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-600 dark:text-rose-400">
          <span>⚠️ {errorMsg}</span>
          <button type="button" onClick={startTest} className="underline font-bold ml-1 cursor-pointer">
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
