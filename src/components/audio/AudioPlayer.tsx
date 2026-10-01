import { useCallback, useEffect, useRef, useState } from 'react'
import { AUDIO_INDEX } from '../../content/bank'
import { cn } from '../../lib/cn'
import { isSpeechSupported, playCountdownBeep, speakScript, speakText, speakWithBeep, stopAllSpeech, type SpeakController } from '../../lib/speech'

interface Props {
  audioId?: string
  /**
   * Speak this literal text instead of a bank script. Used by Repeat Sentence
   * (the sentence has no recorded conversation of its own) and by Highlight
   * Incorrect Words (the recording is the single correct sentence, not the
   * whole conversation the item was derived from).
   */
  utterance?: string
  /** Inclusive turn range to play. WFD/Missing Word test one turn; FIB-L starts mid-script. */
  fromTurn?: number
  toTurn?: number
  /** With a single-turn scope, replace this word index with a beep (Missing Word). */
  beepWord?: number
  /** Number of extra plays allowed. 0 means the recording plays once. */
  replays?: number
  /** Seconds of countdown before playback. */
  leadIn?: number
  /** Show the transcript beneath the player. */
  showTranscript?: boolean
  onPlayed?: () => void
  compact?: boolean
  allowSpeedControl?: boolean
}

type PlayState = 'idle' | 'countdown' | 'playing'

export function AudioPlayer({
  audioId,
  utterance,
  fromTurn,
  toTurn,
  beepWord,
  replays = 0,
  leadIn = 3,
  showTranscript = false,
  onPlayed,
  compact = false,
  allowSpeedControl = false,
}: Props) {
  const script = audioId ? AUDIO_INDEX.get(audioId) : undefined
  const [state, setState] = useState<PlayState>('idle')
  const [playsLeft, setPlaysLeft] = useState(replays + 1)
  const [countdown, setCountdown] = useState(0)
  const [turnIndex, setTurnIndex] = useState(0)
  const [speed, setSpeed] = useState<0.8 | 1.0 | 1.2>(1.0)
  const [showText, setShowText] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const controllerRef = useRef<SpeakController | null>(null)
  const timerRef = useRef<number | null>(null)
  const onPlayedRef = useRef(onPlayed)

  useEffect(() => {
    onPlayedRef.current = onPlayed
  }, [onPlayed])

  const stimulusKey = `${audioId ?? ''}:${utterance ?? ''}:${fromTurn ?? ''}:${toTurn ?? ''}:${beepWord ?? ''}:${replays}`
  const [prevStimulusKey, setPrevStimulusKey] = useState(stimulusKey)

  if (stimulusKey !== prevStimulusKey) {
    setPrevStimulusKey(stimulusKey)
    setPlaysLeft(replays + 1)
    setState('idle')
    setShowText(false)
    setTurnIndex(0)
    setUnsupported(false)
  }

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

  // Countdown, then playback. The play is charged when playback actually
  // starts, not when the button is pressed — cancelling during the countdown
  // previously consumed a replay, which silently stole attempts.
  useEffect(() => {
    if (state !== 'countdown') return
    if (!script && !utterance) return
    let n = leadIn

    const step = () => {
      if (n >= 0) playCountdownBeep(n)
      n -= 1
      if (n < 0) {
        setPlaysLeft((p) => p - 1)
        setState('playing')
        return
      }
      setCountdown(n)
      timerRef.current = window.setTimeout(step, 1000)
    }

    timerRef.current = window.setTimeout(step, 500)
    return () => clearTimer()
  }, [state, leadIn, script, utterance, clearTimer])

  useEffect(() => {
    if (state !== 'playing') return
    if (!script && !utterance) return
    let cancelled = false
    void (async () => {
      stopAllSpeech()
      const done = () => {
        setState('idle')
        onPlayedRef.current?.()
      }
      const failed = () => {
        setUnsupported(true)
        setState('idle')
      }
      // Utterance mode: a single sentence with no bank script behind it.
      if (utterance && !script) {
        setTurnIndex(0)
        const controller = await speakText(utterance, {
          rate: Number((1.02 * speed).toFixed(2)),
          onEnd: done,
          onError: failed,
        })
        if (cancelled) controller.stop()
        else controllerRef.current = controller
        return
      }
      if (!script) return
      // Beep mode: one turn with a word replaced by a tone.
      if (beepWord !== undefined && fromTurn !== undefined) {
        const turn = script.turns[fromTurn]
        const speaker = script.speakers.find((s) => s.id === turn?.speaker)
        const words = (turn?.text ?? '').split(/\s+/).filter((w) => w.length > 0)
        if (turn && beepWord >= 0 && beepWord < words.length) {
          setTurnIndex(fromTurn)
          const controller = await speakWithBeep(words.slice(0, beepWord).join(' '), words.slice(beepWord + 1).join(' '), {
            rate: Number((1.02 * speed).toFixed(2)),
            voiceHint: speaker?.voiceHint ?? 'mid',
            onEnd: done,
            onError: failed,
          })
          if (cancelled) controller.stop()
          else controllerRef.current = controller
          return
        }
      }
      const controller = await speakScript(script, {
        rate: Number((1.02 * speed).toFixed(2)),
        fromTurn,
        toTurn,
        onTurnStart: (i) => setTurnIndex(i),
        onEnd: done,
        onError: failed,
      })
      if (cancelled) controller.stop()
      else controllerRef.current = controller
    })()
    return () => {
      cancelled = true
    }
  }, [state, script, utterance, fromTurn, toTurn, beepWord, speed])

  if (!script && !utterance) return null

  const speaker = script?.speakers.find((s) => s.id === script.turns[turnIndex]?.speaker)
  const exhausted = playsLeft <= 0
  const title = script?.title ?? (beepWord !== undefined ? 'Listen and select the missing word' : 'Listen and repeat the sentence')

  return (
    <div className={cn('card-solid', compact ? 'p-3' : 'p-4')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-ink-900 dark:text-white truncate text-sm font-semibold">
            {state === 'playing' && speaker ? `${speaker.name}:` : title}
          </p>
          <p className="text-ink-500 dark:text-ink-400 truncate text-xs">
            {!script
              ? 'Single speaker'
              : script.speakers.length === 1
                ? 'Single speaker'
                : `${script.speakers.length} speakers: ${script.speakers.map((s) => s.name).join(', ')}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {allowSpeedControl ? (
            <div
              className="flex items-center gap-0.5 rounded-lg border border-ink-200 bg-ink-100 p-0.5 dark:border-white/10 dark:bg-white/6"
              role="group"
              aria-label="Playback speed"
            >
              {([0.8, 1.0, 1.2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={state === 'playing'}
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                  className={cn(
                    'rounded px-1.5 py-0.5 font-mono text-micro font-semibold transition-colors disabled:opacity-50',
                    speed === s
                      ? 'bg-white text-ink-900 shadow-xs dark:bg-ink-800 dark:text-white'
                      : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100',
                  )}
                >
                  {s.toFixed(1)}×
                </button>
              ))}
            </div>
          ) : null}

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
                setTurnIndex(0)
                setCountdown(leadIn)
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
              className="bg-mint-500/80 eq-bar w-1.5 rounded-full"
              style={{
                height: `${7 + Math.abs(Math.sin((i + turnIndex * 3) * 0.6)) * 17}px`,
                animationDelay: `${(i % 7) * 0.12}s`,
              }}
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
        utterance ? (
          <div className="border-ink-200 dark:border-white/10 mt-4 border-t pt-3">
            <p className="passage mt-1.5">{utterance}</p>
          </div>
        ) : (
          <div className="border-ink-200 dark:border-white/10 mt-4 border-t pt-3">
            {script?.turns.map((t, i) => {
              const sp = script.speakers.find((s) => s.id === t.speaker)
              return (
                <p key={i} className="passage mt-1.5">
                  <span className="text-brand-500 dark:text-brand-300 font-semibold">{sp?.name}:</span> {t.text}
                </p>
              )
            })}
          </div>
        )
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
