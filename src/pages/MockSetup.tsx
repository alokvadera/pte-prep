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
            <div className="card-solid relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2 font-mono text-[11px] text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                  <span className="text-brand-600 dark:text-brand-400 font-semibold">[SEC.01]</span>
                  <span>SIMULATION SCOPE & TIMING</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>READY</span>
                </div>
              </div>

              <h2 className="sr-only">Test Length and Scope</h2>
              
              <div className="space-y-3">
                {(['full', 'half', 'quick'] as const).map((len) => {
                  const isActive = length === len
                  const meta =
                    len === 'full'
                      ? {
                          index: '01 //',
                          label: 'Full mock',
                          badge: 'OFFICIAL PACE',
                          badgeTone: 'mint' as const,
                          specs: '3 SECTIONS · 22 TYPES · ~120 MINS',
                          desc: 'Full Pearson Academic simulation with machine scoring across Speaking, Writing, Reading, and Listening.',
                        }
                      : len === 'half'
                        ? {
                            index: '02 //',
                            label: 'Half mock',
                            badge: 'ACCELERATED',
                            badgeTone: 'brand' as const,
                            specs: 'REPRESENTATIVE SUBSET · ~60 MINS',
                            desc: 'Proportional question distribution across all sections. Ideal for mid-week pacing and stamina drills.',
                          }
                        : {
                            index: '03 //',
                            label: 'Quick run',
                            badge: 'DIAGNOSTIC',
                            badgeTone: 'neutral' as const,
                            specs: '~25 ITEMS · ~35 MINS',
                            desc: 'Rapid diagnostic run. Validates microphone input, speech recognition latency, and pacing.',
                          }

                  return (
                    <label
                      key={len}
                      className={`group relative flex cursor-pointer items-start gap-4 rounded border p-4 sm:p-5 transition-all duration-200 ${
                        isActive
                          ? 'border-brand-500 bg-brand-50/40 shadow-xs dark:border-brand-400 dark:bg-brand-500/10'
                          : 'border-ink-200 bg-white hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="length"
                        className="sr-only"
                        checked={isActive}
                        onChange={() => { setLength(len); setSingleSection(null); }}
                      />
                      
                      {/* Swiss Technical Radio Pill */}
                      <div className={`mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        isActive
                          ? 'border-brand-500 bg-brand-500 text-white dark:border-brand-400 dark:bg-brand-400'
                          : 'border-ink-300 bg-transparent group-hover:border-ink-400 dark:border-white/20 dark:group-hover:border-white/40'
                      }`}>
                        {isActive && <div className="size-1.5 rounded-full bg-white dark:bg-ink-950" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-ink-400 dark:text-ink-500">{meta.index}</span>
                            <span className="text-base font-bold text-ink-900 dark:text-white">{meta.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-ink-500 dark:text-ink-400 hidden sm:inline">{meta.specs}</span>
                            <Badge tone={meta.badgeTone}>{meta.badge}</Badge>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">{meta.desc}</p>
                      </div>
                    </label>
                  )
                })}
              </div>

              {length !== 'full' && (
                <div className="mt-6 pt-6 border-t border-ink-100 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono text-xs font-semibold text-ink-900 dark:text-white uppercase tracking-wider">
                      Sub-Section Filter (Optional)
                    </h3>
                    <span className="font-mono text-[10px] text-ink-400 dark:text-ink-500">ISOLATE DOMAIN</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleSection(null)}
                      className={`px-3 py-2 rounded text-xs font-mono font-medium border text-center transition-all cursor-pointer ${
                        singleSection === null
                          ? 'border-brand-500 bg-brand-500 text-white shadow-xs dark:border-brand-400 dark:bg-brand-400 dark:text-ink-950'
                          : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-ink-300 dark:hover:border-white/20'
                      }`}
                    >
                      [00 // ALL]
                    </button>
                    {(['speaking-writing', 'reading', 'listening'] as const).map((sId, sIdx) => {
                      const isActive = singleSection === sId
                      const sectionTitle = SECTION_META[sId]?.longTitle || sId
                      const shortCode = sId === 'speaking-writing' ? 'SPEAK/WRITE' : sId.toUpperCase()

                      return (
                        <button
                          key={sId}
                          type="button"
                          onClick={() => setSingleSection(sId)}
                          className={`px-3 py-2 rounded text-xs font-mono font-medium border text-center transition-all cursor-pointer truncate ${
                            isActive
                              ? 'border-brand-500 bg-brand-500 text-white shadow-xs dark:border-brand-400 dark:bg-brand-400 dark:text-ink-950'
                              : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-ink-300 dark:hover:border-white/20'
                          }`}
                          title={sectionTitle}
                        >
                          [0{sIdx + 1} // {shortCode}]
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
            <div className="card-solid sticky top-24">
              <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3 mb-4">
                <h2 className="font-mono text-xs font-bold text-ink-900 dark:text-white uppercase tracking-wider">
                  SESSION MANIFEST
                </h2>
                <span className="font-mono text-[10px] text-brand-600 dark:text-brand-300 font-semibold">[STANDBY]</span>
              </div>
              
              <dl className="space-y-3 mb-6 border-b border-ink-100 dark:border-white/10 pb-5">
                <Row label="Type" value={LENGTHS[length].label} />
                <Row label="Sections" value={preview.mock.sections.map((s) => SECTION_META[s.id]?.longTitle || s.id).join(' → ')} />
                <Row label="Scored Items" value={`${preview.scoredCount} units`} />
                <Row label="Estimated Time" value={formatClock(preview.mock.totalSeconds)} />
                <Row label="Scoring Engine" value="Pearson ML v2.4" />
              </dl>
              
              <Button size="lg" className="w-full justify-center shadow-premium-light dark:shadow-premium-dark font-mono text-sm tracking-wide group" onClick={handleStart}>
                <span>EXECUTE SESSION</span>
                <span className="ml-1.5 font-sans transition-transform group-hover:translate-x-1">→</span>
              </Button>

              <details className="border-ink-200 dark:border-white/10 group mt-5 border-t pt-4">
                <summary className="text-ink-700 dark:text-ink-200 flex cursor-pointer items-center justify-between gap-3 text-xs font-mono font-semibold">
                  <span>[TYPES: {includedTypes.length} LOADED]</span>
                  <span className="text-ink-500 dark:text-ink-400 font-normal group-open:hidden">Inspect ↓</span>
                  <span className="text-ink-500 dark:text-ink-400 hidden font-normal group-open:inline">Collapse ↑</span>
                </summary>
                <ul className="text-ink-600 dark:text-ink-300 mt-3 max-h-48 space-y-1.5 overflow-y-auto pr-2 text-xs font-mono">
                  {includedTypes.map((type, idx) => (
                    <li key={type} className="flex items-center justify-between py-0.5 border-b border-ink-100/60 dark:border-white/5">
                      <span className="truncate">{QUESTION_META[type]?.label || type}</span>
                      <span className="text-ink-400 dark:text-ink-500 text-[10px] shrink-0 ml-2">#{String(idx + 1).padStart(2, '0')}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        </div>

        {confirmOverwrite ? (
          <div className="fixed inset-0 z-100 grid place-items-center p-4">
            <button
              type="button"
              className="bg-ink-950/70 animate-fade-in absolute inset-0 cursor-pointer backdrop-blur-xs"
              onClick={() => setConfirmOverwrite(false)}
              aria-label="Cancel"
            />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-overwrite-title"
              className="card-solid relative z-10 w-full max-w-sm p-6 shadow-2xl animate-modal-enter border border-ink-200 dark:border-white/15"
            >
              <div className="flex items-center gap-2 font-mono text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                <span>[SYS.ALERT // CONFLICT DETECTED]</span>
              </div>
              <h3 id="confirm-overwrite-title" className="text-lg font-bold text-ink-900 dark:text-white">Discard active mock?</h3>
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-400 leading-relaxed font-mono">
                An active simulation session ({activeMock?.title}) is stored in memory. Initializing a new run will overwrite existing progress.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" size="sm" onClick={() => setConfirmOverwrite(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={() => { setConfirmOverwrite(false); begin(); }}>
                  Discard & Execute
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

  const activeBars = Math.min(16, Math.max(1, Math.round((Math.max(8, level) / 100) * 16)))

  return (
    <div className="card-solid relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-4 mb-5">
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-500 dark:text-ink-400 uppercase tracking-wider">
          <span className="text-brand-600 dark:text-brand-400 font-semibold">[SEC.02]</span>
          <span>AUDIO INPUT TRANSDUCER</span>
        </div>
        <div className="flex items-center gap-2">
          {state === 'idle' && (
            <span className="font-mono text-[10px] text-ink-400 dark:text-ink-500 uppercase tracking-wider">
              [STANDBY · 44.1 kHz]
            </span>
          )}
          {state === 'recording' && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold tracking-wider animate-pulse">
              <span className="size-2 rounded-full bg-rose-600" />
              SAMPLING · 0{countdown}S
            </span>
          )}
          {state === 'ready' && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold tracking-wider">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              CALIBRATED
            </span>
          )}
          {state === 'error' && (
            <span className="font-mono text-[10px] text-rose-600 dark:text-rose-400 uppercase font-semibold tracking-wider">
              [ERROR]
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-md">
          <h3 className="text-sm font-bold text-ink-900 dark:text-white">Microphone Input Calibration</h3>
          <p className="text-ink-500 dark:text-ink-400 mt-1 text-xs leading-relaxed">
            Record a 3-second sample to verify browser microphone permissions, validate input signal gain, and preview playback.
          </p>
        </div>

        {state === 'idle' && (
          <Button variant="secondary" onClick={startTest} size="sm" className="shrink-0 text-xs font-mono">
            Calibrate mic (3s)
          </Button>
        )}

        {state === 'ready' && (
          <Button variant="ghost" onClick={startTest} size="sm" className="shrink-0 text-xs font-mono">
            Re-calibrate ↺
          </Button>
        )}
      </div>

      {state === 'recording' && (
        <div className="mt-5 space-y-3 rounded border border-ink-200 dark:border-white/10 bg-ink-50/50 dark:bg-white/[0.02] p-4">
          <div className="flex items-center justify-between font-mono text-[9px] text-ink-400 dark:text-ink-500 uppercase tracking-widest px-0.5">
            <span>-42dB</span>
            <span>-24dB</span>
            <span>-12dB</span>
            <span>-6dB</span>
            <span>0dB</span>
            <span className="text-rose-500 dark:text-rose-400 font-bold">PEAK</span>
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
                  className={`h-full rounded-2xs transition-colors duration-75 ${
                    isLit
                      ? isPeak
                        ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                        : isMid
                          ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                          : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                      : 'bg-ink-200 dark:bg-white/8'
                  }`}
                />
              )
            })}
          </div>

          <div className="pt-2 text-xs font-mono text-ink-600 dark:text-ink-300">
            <span className="text-ink-400 dark:text-ink-500 text-[10px] block uppercase mb-1">Calibration Phrase:</span>
            <span className="font-semibold text-ink-900 dark:text-white">"The quick brown fox jumps over the lazy dog."</span>
          </div>
        </div>
      )}

      {state === 'ready' && audioUrl && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded border border-emerald-500/25 bg-emerald-500/5 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div>
              <p className="font-mono text-xs font-bold text-ink-900 dark:text-white">Transducer verified</p>
              <p className="text-[11px] text-ink-500 dark:text-ink-400">Speech gain validated. Listen to verify clarity.</p>
            </div>
          </div>
          <audio controls src={audioUrl} className="h-8 max-w-xs" />
        </div>
      )}

      {state === 'error' && (
        <div className="mt-4 flex items-start gap-2 rounded border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-600 dark:text-rose-400 font-mono">
          <span>⚠️ {errorMsg}</span>
          <button type="button" onClick={startTest} className="underline font-bold ml-1 cursor-pointer">
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
