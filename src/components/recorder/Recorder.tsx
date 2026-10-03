import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioAnalysis } from '../../domain/types'
import { cn } from '../../lib/cn'
import { isRecordingSupported, isSpeechRecognitionSupported, VoiceRecorder, type RecorderLevel, type RecorderState } from '../../lib/recorder'

interface Props {
  /** Seconds allowed for the take. */
  seconds: number
  /** Seconds of preparation before recording may start. */
  prepSeconds?: number
  onRecorded: (analysis: AudioAnalysis, transcript: string) => void
  /** Reports the fallback typed text so short answers can be scored. */
  onTyped?: (text: string) => void
  disabled?: boolean
}

type Phase = 'idle' | 'prep' | 'recording' | 'done'

/**
 * Recording control for the seven speaking item types.
 *
 * Speech recognition is only available in Chromium browsers. Everywhere else
 * the candidate can still record, and a text box is offered so the response can
 * be scored on content rather than dropped entirely.
 */
export function Recorder({ seconds, prepSeconds = 0, onRecorded, onTyped, disabled }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [state, setState] = useState<RecorderState>('idle')
  const [level, setLevel] = useState<RecorderLevel>({ level: 0, speechiness: 0 })
  const [prepLeft, setPrepLeft] = useState(0)
  const [recLeft, setRecLeft] = useState(seconds)
  const [transcript, setTranscript] = useState('')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null)
  const recorderRef = useRef<VoiceRecorder | null>(null)
  const timerRef = useRef<number | null>(null)
  const submittedRef = useRef(false)

  const sttSupported = isSpeechRecognitionSupported()
  const micSupported = isRecordingSupported()
  const finishRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (recorderRef.current?.getState() === 'recording' && !submittedRef.current) {
        void finishRef.current?.()
      } else {
        recorderRef.current?.dispose()
      }
    }
  }, [])

  const finish = useCallback(async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    const rec = recorderRef.current
    const result = rec ? await rec.stop() : null
    setPhase('done')
    setLastDurationMs(result?.analysis?.durationMs ?? 0)
    onRecorded(
      result?.analysis ?? {
        durationMs: 0,
        wordsPerMinute: 0,
        speechRatio: 0,
        pauseCount: 0,
        meanPitchHz: null,
        energyVariance: 0,
        reliable: false,
      },
      result?.transcript ?? '',
    )
  }, [onRecorded])

  useEffect(() => {
    finishRef.current = finish
  }, [finish])

  const beginRecording = useCallback(async () => {
    setError(null)
    let recError: string | null = null
    const rec = new VoiceRecorder({
      onStateChange: (s) => setState(s),
      onLevel: (l) => setLevel(l),
      onTranscript: (t) => setTranscript(t),
      onError: (msg) => {
        recError = msg
        setError(msg)
      },
    })
    recorderRef.current = rec
    const ok = await rec.start()
    if (!ok) {
      if (!recError) {
        setError('Microphone unavailable. Type your answer below instead — it will still be scored on content.')
      }
      setPhase('done')
      return
    }
    setPhase('recording')
    setRecLeft(seconds)
    timerRef.current = window.setInterval(() => {
      setRecLeft((n) => {
        if (n <= 1) {
          void finish()
          return 0
        }
        return n - 1
      })
    }, 1000)
  }, [seconds, finish])

  const start = useCallback(() => {
    submittedRef.current = false
    setTranscript('')
    setError(null)
    setLastDurationMs(null)
    if (prepSeconds > 0) {
      setPhase('prep')
      setPrepLeft(prepSeconds)
      let n = prepSeconds
      timerRef.current = window.setInterval(() => {
        n -= 1
        setPrepLeft(Math.max(0, n))
        if (n <= 0) {
          if (timerRef.current !== null) window.clearInterval(timerRef.current)
          timerRef.current = null
          void beginRecording()
        }
      }, 1000)
    } else {
      void beginRecording()
    }
  }, [prepSeconds, beginRecording])

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    recorderRef.current?.dispose()
    recorderRef.current = null
    setPhase('idle')
    setPrepLeft(0)
    setLevel({ level: 0, speechiness: 0 })
  }, [])

  const restart = useCallback(() => {
    cancel()
    setTyped('')
    setTranscript('')
    setError(null)
    start()
  }, [cancel, start])

  return (
    <div className="card-solid p-4">
      {phase === 'idle' ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-ink-900 dark:text-white text-sm font-semibold">Record your response</p>
            <p className="text-ink-500 dark:text-ink-400 text-xs">
              {disabled
                ? 'Audio is playing. Wait for audio to finish before recording.'
                : prepSeconds > 0
                  ? `${prepSeconds}s to prepare, then up to ${seconds}s to speak.`
                  : `Up to ${seconds} seconds.`}
              {!micSupported ? ' Microphone not detected.' : ''}
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={start} disabled={disabled}>
            <MicIcon />
            {prepSeconds > 0 ? 'Start preparation' : 'Start recording'}
          </button>
        </div>
      ) : null}

      {phase === 'prep' ? (
        <div className="text-center">
          <p className="text-ink-500 dark:text-ink-300 text-sm font-semibold">Prepare</p>
          <p
            className="text-brand-500 dark:text-brand-300 my-2 font-mono text-5xl font-bold tabular-nums"
            role="timer"
            aria-live="off"
            aria-label={`${prepLeft} seconds to prepare`}
          >
            {prepLeft}
          </p>
          <div className="bg-ink-200 dark:bg-white/10 mx-auto h-1.5 w-48 overflow-hidden rounded-full">
            <div
              className="bg-brand-500 h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${((prepSeconds - prepLeft) / Math.max(1, prepSeconds)) * 100}%` }}
            />
          </div>
          <button type="button" className="btn-ghost mt-3" onClick={cancel}>
            Cancel
          </button>
        </div>
      ) : null}

      {phase === 'recording' ? (
        <div>
          <div className="flex items-center justify-between">
            <span className="pill bg-rose-brand/15 text-rose-brand dark:bg-rose-brand/18 dark:text-rose-300">
              <span className="bg-rose-brand size-2 animate-pulse rounded-full" />
              Recording
            </span>
            <span className="text-ink-900 dark:text-white font-mono text-lg font-bold tabular-nums">{recLeft}s</span>
          </div>
          <div className="bg-ink-100 dark:bg-white/6 mt-3 flex h-3 items-center gap-[3px] overflow-hidden rounded-full px-1" aria-hidden="true">
            {Array.from({ length: 48 }, (_, i) => {
              const active = i / 48 < level.level
              const hot = i / 48 < level.speechiness
              return (
                <span
                  key={i}
                  className={cn(
                    'h-full flex-1 rounded-full transition-colors duration-100',
                    hot ? 'bg-mint-500' : active ? 'bg-amber-500/60' : 'bg-transparent',
                  )}
                />
              )
            })}
          </div>
          {transcript ? (
            <p className="text-ink-500 dark:text-ink-400 mt-3 line-clamp-3 text-xs italic">“{transcript}”</p>
          ) : sttSupported ? (
            <p className="text-ink-500 dark:text-ink-400 mt-3 text-xs">Listening for speech…</p>
          ) : (
            <p className="text-ink-500 dark:text-ink-400 mt-3 text-xs">
              This browser cannot transcribe speech, so the estimate will rely on length and fluency signals only.
            </p>
          )}
          <button type="button" className="btn-secondary mt-3 w-full" onClick={() => void finish()}>
            <StopIcon />
            Stop recording
          </button>
        </div>
      ) : null}

      {phase === 'done' ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-ink-900 dark:text-white text-sm font-semibold">
              {error ? 'Answer not recorded' : 'Response captured'}
            </p>
            <p className="text-ink-500 dark:text-ink-400 text-xs">
              {state === 'denied' ? 'Microphone permission denied' : state === 'unsupported' ? 'No microphone detected' : 'Microphone released'}
            </p>
            <button type="button" className="btn-secondary" onClick={restart}>
              Record again
            </button>
          </div>

          {transcript ? (
            <div className="border-ink-200 dark:border-white/10 mt-3 border-t pt-3">
              <p className="text-ink-500 dark:text-ink-400 text-xs font-semibold">
                What the browser heard
              </p>
              <p className="passage mt-1.5">{transcript}</p>
            </div>
          ) : null}

          {error ? <p className="text-rose-brand dark:text-rose-300 mt-3 text-xs">{error}</p> : null}

          {lastDurationMs !== null && lastDurationMs > 0 && lastDurationMs <= 500 ? (
            <p className="text-amber-600 dark:text-amber-300 mt-3 text-xs" role="status">
              That take was under half a second, so it scores as unanswered. Record a longer take or type your
              answer below so content can still be scored.
            </p>
          ) : null}

          {!sttSupported || !transcript ? (
            <div className="mt-3">
              <label className="label" htmlFor={`typed-${seconds}`}>
                Type what you said (optional, improves the estimate)
              </label>
              <textarea
                id={`typed-${seconds}`}
                className="field min-h-20 resize-y"
                value={typed}
                placeholder="Write your answer in full so content can be scored."
                onChange={(e) => {
                  setTyped(e.target.value)
                  onTyped?.(e.target.value)
                }}
              />
              {typed.trim() ? (
                <p className="text-ink-500 dark:text-ink-400 mt-1 text-xs">
                  {typed.trim().split(/\s+/).length} words · this will be used for scoring
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Standalone textarea used for items where speaking is optional. */
export function TypedAnswer({
  value,
  onChange,
  placeholder,
  minWords,
  maxWords,
  showCount = true,
  rows = 5,
  id,
  label = 'Your response',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minWords?: number
  maxWords?: number
  showCount?: boolean
  rows?: number
  id?: string
  label?: string
}) {
  const wc = value.trim() ? value.trim().split(/\s+/).length : 0
  const under = minWords !== undefined && wc > 0 && wc < minWords
  const over = maxWords !== undefined && wc > maxWords

  return (
    <div>
      <textarea
        id={id}
        aria-label={label}
        className="field min-h-32 resize-y leading-relaxed"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {showCount ? (
        <p
          className={cn(
            'mt-1.5 text-xs tabular-nums',
            under || over ? 'text-amber-600 dark:text-amber-300' : 'text-ink-500 dark:text-ink-400',
          )}
        >
          {wc} words
          {minWords !== undefined ? ` · minimum about ${minWords}` : ''}
          {maxWords !== undefined ? ` · maximum about ${maxWords}` : ''}
          {under ? ' — too short so far' : ''}
          {over ? ' — over length' : ''}
        </p>
      ) : null}
    </div>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" strokeLinecap="round" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}
