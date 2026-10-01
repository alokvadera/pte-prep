import { useCallback, useEffect, useRef, useState } from 'react'
import { AUDIO_INDEX } from '../../content/bank'
import { cn } from '../../lib/cn'
import { isSpeechSupported, playCountdownBeep, speakScript, stopAllSpeech, type SpeakController } from '../../lib/speech'

interface Props {
  audioId?: string
  /** Number of extra plays allowed. 0 means the recording plays once. */
  replays?: number
  /** Seconds of countdown before playback. */
  leadIn?: number
  /** Show the transcript beneath the player. */
  showTranscript?: boolean
  onPlayed?: () => void
  compact?: boolean
}

type PlayState = 'idle' | 'countdown' | 'playing'

export function AudioPlayer({ audioId, replays = 0, leadIn = 3, showTranscript = false, onPlayed, compact = false }: Props) {
  const script = audioId ? AUDIO_INDEX.get(audioId) : undefined
  const [state, setState] = useState<PlayState>('idle')
  const [playsLeft, setPlaysLeft] = useState(replays + 1)
  const [countdown, setCountdown] = useState(0)
  const [turnIndex, setTurnIndex] = useState(0)
  const [showText, setShowText] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const controllerRef = useRef<SpeakController | null>(null)
  const timerRef = useRef<number | null>(null)
  const onPlayedRef = useRef(onPlayed)

  useEffect(() => {
    onPlayedRef.current = onPlayed
  }, [onPlayed])

  // Reset whenever the stimulus changes.
  useEffect(() => {
    setPlaysLeft(replays + 1)
    setState('idle')
    setShowText(false)
    setTurnIndex(0)
    setUnsupported(false)
  }, [audioId, replays])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const halt = useCallback(() => {
    clearTimer()
    controllerRef.current?.stop()
    controllerRef.current = null
    setState('idle')
  }, [clearTimer])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      controllerRef.current?.stop()
    }
  }, [])

  // Countdown, then playback.
  useEffect(() => {
    if (state !== 'countdown' || !script) return
    let n = leadIn
    setCountdown(n)

    const step = () => {
      if (n >= 0) playCountdownBeep(n)
      n -= 1
      if (n < 0) {
        setState('playing')
        return
      }
      setCountdown(n)
      timerRef.current = window.setTimeout(step, 1000)
    }

    timerRef.current = window.setTimeout(step, 500)
    return () => clearTimer()
  }, [state, leadIn, script, clearTimer])

  useEffect(() => {
    if (state !== 'playing' || !script) return
    let cancelled = false
    void (async () => {
      stopAllSpeech()
      const controller = await speakScript(script, {
        rate: 1.02,
        onTurnStart: (i) => setTurnIndex(i),
        onEnd: () => {
          setState('idle')
          onPlayedRef.current?.()
        },
        onError: () => {
          setUnsupported(true)
          setState('idle')
        },
      })
      if (cancelled) controller.stop()
      else controllerRef.current = controller
    })()
    return () => {
      cancelled = true
    }
  }, [state, script])

  if (!script) return null

  const speaker = script.speakers.find((s) => s.id === script.turns[turnIndex]?.speaker)
  const exhausted = playsLeft <= 0

  return (
    <div className={cn('card-solid', compact ? 'p-3' : 'p-4')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-ink-900 dark:text-white truncate text-sm font-semibold">
            {state === 'playing' && speaker ? `${speaker.name}:` : script.title}
          </p>
          <p className="text-ink-500 dark:text-ink-400 truncate text-xs">
            {script.speakers.length === 1
              ? 'Single speaker'
              : `${script.speakers.length} speakers: ${script.speakers.map((s) => s.name).join(', ')}`}
          </p>
        </div>

        {state === 'idle' ? (
          <button
            type="button"
            className="btn-primary"
            disabled={exhausted}
            onClick={() => {
              if (!isSpeechSupported()) {
                setUnsupported(true)
                return
              }
              setPlaysLeft((n) => n - 1)
              setTurnIndex(0)
              setState('countdown')
            }}
          >
            <PlayIcon />
            {exhausted ? 'Played' : playsLeft > 1 ? `Play · ${playsLeft} left` : 'Play'}
          </button>
        ) : (
          <button type="button" className="btn-secondary" onClick={halt}>
            <StopIcon />
            {state === 'countdown' ? 'Cancel' : 'Stop'}
          </button>
        )}
      </div>

      {state === 'countdown' ? (
        <p className="text-brand-500 dark:text-brand-300 mt-3 font-mono text-2xl font-bold tabular-nums" aria-live="assertive">
          Starting in {countdown}
        </p>
      ) : null}

      {state === 'playing' ? (
        <div className="mt-3 flex h-6 items-end gap-0.5" aria-hidden="true">
          {Array.from({ length: 32 }, (_, i) => (
            <span
              key={i}
              className="bg-mint-500/70 w-1.5 rounded-full"
              style={{ height: `${7 + Math.abs(Math.sin((i + turnIndex * 3) * 0.6)) * 17}px` }}
            />
          ))}
        </div>
      ) : null}

      {unsupported ? (
        <p className="text-rose-600 dark:text-rose-300 mt-3 text-xs">
          This browser cannot play audio. Open the page in Chrome, Edge or Safari, or read the transcript below.
        </p>
      ) : null}

      {showText ? (
        <div className="border-ink-200 dark:border-white/10 mt-4 border-t pt-3">
          {script.turns.map((t, i) => {
            const sp = script.speakers.find((s) => s.id === t.speaker)
            return (
              <p key={i} className="passage mt-1.5">
                <span className="text-brand-500 dark:text-brand-300 font-semibold">{sp?.name}:</span> {t.text}
              </p>
            )
          })}
        </div>
      ) : null}

      {showTranscript || unsupported ? (
        <button
          type="button"
          className="text-brand-500 dark:text-brand-300 mt-3 cursor-pointer text-xs font-semibold hover:underline"
          onClick={() => setShowText((v) => !v)}
          aria-expanded={showText}
        >
          {showText ? 'Hide transcript' : 'Show transcript'}
        </button>
      ) : null}
    </div>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
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
