import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_BLUEPRINT, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { buildFullMock, buildSectionMock } from '../domain/assemble'
import type { MockMode, QuestionType, SectionId } from '../domain/types'
import { capacityByType } from '../content/bank'
import { Seo } from '../seo/Seo'
import { Badge, Button, PageWrapper } from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
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
  const [forwardOnly, setForwardOnly] = useState(false)

  const capacity = useMemo(() => capacityByType(), [])

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

  const preview = useMemo(() => {
    const t = TIMINGS[timing]
    const mock = singleSection
      ? buildSectionMock(seed, singleSection, counts, { timeScale: t.scale, untimed: t.untimed, forwardOnly })
      : buildFullMock(seed, { counts, timeScale: t.scale, untimed: t.untimed, forwardOnly })
    const scored = mock.sections.flatMap((s) => s.itemIds).filter((id) => (mock.items[id]?.maxPoints ?? 0) > 0)
    return { mock, scoredCount: scored.length, minutes: Math.round(mock.totalSeconds / 60) }
  }, [seed, counts, singleSection, timing, forwardOnly])

  const [confirmOverwrite, setConfirmOverwrite] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleStart = () => {
    if (activeMock && activeStatus !== 'finished') {
      setConfirmOverwrite(true)
      return
    }
    begin()
  }

  const begin = () => {
    start(preview.mock, mode)
    navigate('/test')
  }

  // Focus trap + Escape dismiss for the overwrite dialog
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

  return (
    <>
      <Seo />

      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Mock test' }]} />}
        eyebrow="Mock test setup"
        title="Build a test around your day."
        description="Choose the length, conditions and timing that suit your session. Questions and answer order are shuffled from your seed."
      >

        {activeMock && activeStatus !== 'finished' ? (
          <div className="card-solid mt-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-ink-900 dark:text-white text-sm font-bold">You have a test in progress</p>
              <p className="text-ink-500 dark:text-ink-400 mt-0.5 text-xs">{activeMock.title}</p>
            </div>
            <Button onClick={() => navigate('/test')}>Resume</Button>
          </div>
        ) : null}

        <div className="mt-6 sm:mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
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
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
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
              <legend className="label">Navigation</legend>
              <button
                type="button"
                onClick={() => setForwardOnly((v) => !v)}
                className={cn('choice-card w-full', forwardOnly ? 'choice-active' : 'choice-idle')}
                aria-pressed={forwardOnly}
              >
                <p className="text-ink-900 dark:text-white text-sm font-bold">Test-day mode (no going back)</p>
                <p className="text-ink-500 dark:text-ink-400 mt-1 text-xs leading-relaxed">
                  On test day you cannot return to a previous question. Turn this on to rehearse that: Back,
                  question jumping and flags are disabled for the run.
                </p>
              </button>
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

            <MicChecker />
          </div>

          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl bg-ink-900 p-5 text-white shadow-card">
              <p className="font-mono text-micro text-brand-300">TEST PREVIEW</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-balance">This run</h2>

              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Scored items" value={String(preview.scoredCount)} />
                <Row label="Total points" value={String(preview.mock.totalPoints)} />
                <Row label="Time allowed" value={formatClock(preview.mock.totalSeconds)} />
                <div className="flex flex-col gap-1 border-t border-white/10 pt-2.5">
                  <dt className="text-xs text-ink-300">Sections</dt>
                  <dd className="text-xs font-semibold leading-relaxed text-white">
                    {preview.mock.sections.map((s) => SECTION_META[s.id].longTitle).join(' → ')}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold text-ink-300">
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
                        <Badge tone="neutral" className="bg-white/8 text-ink-200">{QUESTION_META[t].short}</Badge>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <label className="mb-1.5 block text-xs font-semibold text-ink-300" htmlFor="seed">
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
                  <Button variant="secondary" className="shrink-0" onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))}>
                    Shuffle
                  </Button>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-300">
                  Same seed produces the same test. Share it to reproduce a paper.
                </p>
              </div>

              <Button size="lg" className="mt-6 w-full" onClick={handleStart}>
                Start {LENGTHS[length].label.toLowerCase()}
              </Button>

              <p className="mt-3 text-center text-xs leading-relaxed text-ink-300">
                Allow playback when prompted so the listening items work.
              </p>
            </div>
          </aside>
        </div>

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
                You have a test in progress ({activeMock?.title}). Starting a new mock test will discard your current progress.
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
                  Discard & Start
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </PageWrapper>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-ink-300">{label}</dt>
      <dd className="min-w-0 truncate text-right text-xs font-semibold tabular-nums text-white">{value}</dd>
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

  return (
    <div className="card-solid">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-ink-900 dark:text-white text-sm font-bold">Equipment check · Microphone test</p>
          <p className="text-ink-500 dark:text-ink-400 mt-1 text-xs leading-relaxed">
            Record a 3-second sample to verify your headset microphone and hear playback before launching your test.
          </p>
        </div>

        {state === 'idle' && (
          <Button variant="secondary" onClick={startTest} className="shrink-0 text-xs">
            Test microphone (3s)
          </Button>
        )}

        {state === 'recording' && (
          <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold animate-pulse">
            <span className="size-2 rounded-full bg-rose-600" />
            Recording: {countdown}s
          </span>
        )}

        {state === 'ready' && (
          <Button variant="ghost" onClick={startTest} className="shrink-0 text-xs">
            Test again
          </Button>
        )}
      </div>

      {state === 'recording' && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-white/10">
            <div
              className="h-full bg-mint-500 transition-all duration-75"
              style={{ width: `${Math.max(12, level)}%` }}
            />
          </div>
          <p className="text-ink-500 dark:text-ink-400 mt-1.5 text-xs">
            Speak a sentence clearly into your microphone: "The quick brown fox jumps over the lazy dog."
          </p>
        </div>
      )}

      {state === 'ready' && audioUrl && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-3 dark:border-white/10">
          <span className="inline-flex items-center gap-1.5 text-mint-700 dark:text-mint-300 text-xs font-semibold">
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            Microphone verified
          </span>
          <audio controls src={audioUrl} className="h-8 max-w-xs" />
        </div>
      )}

      {state === 'error' && (
        <div className="mt-3 flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
          <span>⚠️ {errorMsg}</span>
          <button type="button" onClick={startTest} className="underline font-semibold ml-1 cursor-pointer">
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
