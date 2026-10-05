import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_BLUEPRINT, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { buildFullMock, buildSectionMock } from '../domain/assemble'
import type { MockMode, QuestionType, SectionId } from '../domain/types'
import { capacityByType } from '../content/bank'
import { Seo } from '../seo/Seo'
import { Button, PageWrapper } from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { useTest } from '../store/useTest'

import { formatClock } from '../lib/format'


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
  
  const [length, setLength] = useState<Length>('full')
  const [mode] = useState<MockMode>('exam')
  // A fixed initial seed keeps the prerendered HTML and the hydrated output identical.
  // A fresh seed is generated on demand by the shuffle control below.
  const [seed] = useState(DEFAULT_SEED)
  const [singleSection, setSingleSection] = useState<SectionId | null>(null)
  const [timing] = useState<TimingId>('standard')
  const [forwardOnly] = useState(false)

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

  const includedTypes = [...new Set(
    preview.mock.sections
      .flatMap((section) => section.itemIds)
      .map((id) => preview.mock.items[id]?.type)
      .filter((type): type is QuestionType => type != null),
  )]

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
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Mock Setup' }]} />}
        eyebrow="Mock configuration"
        title="Start a new session"
        description="Pick a length and check your microphone."
      >
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="card card-glow relative overflow-hidden bg-white/50 backdrop-blur-xl dark:bg-ink-900/40 dark:backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-white mb-6">Test Length</h2>
              
              <div className="space-y-3">
                {(['full', 'half', 'quick'] as const).map((len) => {
                  const isActive = length === len
                  const meta =
                    len === 'full'
                      ? { label: 'Full mock', desc: 'All 3 sections · Official test pacing · Best for accurate scoring' }
                      : len === 'half'
                        ? { label: 'Half mock', desc: 'Shorter duration · Good for focused section testing' }
                        : { label: 'Quick run', desc: 'A handful of questions to test the platform and your equipment' }

                  return (
                    <label key={len} className={`choice-card flex items-start gap-4 p-5 transition-all duration-300 ${isActive ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 shadow-[0_0_0_1px_rgba(23,86,176,1)]' : 'border-ink-200 bg-white hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'}`}>
                      <input
                        type="radio"
                        name="length"
                        className="mt-1 h-5 w-5 accent-brand-500 shrink-0 cursor-pointer"
                        checked={isActive}
                        onChange={() => { setLength(len); setSingleSection(null); }}
                      />
                      <div>
                        <div className="text-ink-900 dark:text-white font-semibold">{meta.label}</div>
                        <div className="text-ink-500 dark:text-ink-300 text-sm mt-1">{meta.desc}</div>
                      </div>
                    </label>
                  )
                })}
              </div>

              {length !== 'full' && (
                <div className="mt-6 pt-6 border-t border-ink-100 dark:border-white/10">
                  <h3 className="text-sm font-semibold text-ink-900 dark:text-white mb-3">Target a specific section (Optional)</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleSection(null)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 cursor-pointer ${singleSection === null ? 'border-brand-500 bg-brand-500 text-white shadow-sm' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-white/20'}`}
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
                          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 cursor-pointer ${isActive ? 'border-brand-500 bg-brand-500 text-white shadow-sm' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-white/20'}`}
                        >
                          {sectionTitle}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <MicChecker />
          </div>

          <div className="lg:col-span-1">
            <div className="card card-glow sticky top-24 bg-white/80 backdrop-blur-xl dark:bg-ink-900/80">
              <h2 className="text-lg font-bold tracking-tight text-ink-900 dark:text-white mb-4">Summary</h2>
              
              <dl className="space-y-4 mb-8 border-b border-ink-100 dark:border-white/10 pb-6">
                <Row label="Type" value={LENGTHS[length].label} />
                <Row label="Sections" value={preview.mock.sections.map((s) => SECTION_META[s.id]?.longTitle || s.id).join(' → ')} />
                <Row label="Scored Items" value={String(preview.scoredCount)} />
                <Row label="Estimated Time" value={formatClock(preview.mock.totalSeconds)} />
              </dl>
              
              <Button size="lg" className="w-full justify-center shadow-premium-light dark:shadow-premium-dark" onClick={handleStart}>
                Start session →
              </Button>

              <details className="border-ink-200 dark:border-white/10 group mt-5 border-t pt-4">
                <summary className="text-ink-700 dark:text-ink-200 flex cursor-pointer items-center justify-between gap-3 text-xs font-semibold">
                  <span>{includedTypes.length} question types included</span>
                  <span className="text-ink-500 dark:text-ink-400 font-normal group-open:hidden">Show</span>
                  <span className="text-ink-500 dark:text-ink-400 hidden font-normal group-open:inline">Hide</span>
                </summary>
                <ul className="text-ink-600 dark:text-ink-300 mt-3 max-h-48 space-y-1 overflow-y-auto pr-2 text-xs">
                  {includedTypes.map((type) => <li key={type}>{QUESTION_META[type]?.label || type}</li>)}
                </ul>
              </details>
            </div>
          </div>
        </div>

        {confirmOverwrite ? (
          <div className="fixed inset-0 z-100 grid place-items-center p-4">
            <button
              type="button"
              className="bg-ink-950/70 animate-fade-in absolute inset-0 cursor-pointer backdrop-blur-sm"
              onClick={() => setConfirmOverwrite(false)}
              aria-label="Cancel"
            />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-overwrite-title"
              className="card relative z-10 w-full max-w-sm p-6 shadow-2xl animate-modal-enter"
            >
              <h3 id="confirm-overwrite-title" className="text-lg font-bold text-ink-900 dark:text-white">Discard active mock?</h3>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
                You already have a mock in progress ({activeMock?.title}). Starting a new one will discard it permanently.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setConfirmOverwrite(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => { setConfirmOverwrite(false); begin(); }}>
                  Discard & Start
                </Button>
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
      <dt className="text-ink-500 dark:text-ink-400 shrink-0 text-xs">{label}</dt>
      <dd className="text-ink-900 dark:text-white min-w-0 truncate text-right text-xs font-semibold tabular-nums">
        {value}
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
