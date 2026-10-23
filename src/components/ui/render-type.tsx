import { useEffect, useRef, useState, useMemo, type ElementType, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { usePrefersReducedMotion } from '../../lib/motion'

export interface RenderTypeProps {
  /** Single string or array of strings to cycle through. */
  text: string | string[]
  /** Typing speed in ms per character. Default: 42ms. */
  speed?: number
  /** Deletion speed in ms per character when looping phrases. Default: 24ms. */
  deleteSpeed?: number
  /** Duration in ms to hold the full typed phrase before deleting. Default: 2000ms. */
  holdDuration?: number
  /** Initial delay before typing starts in ms. Default: 250ms. */
  startDelay?: number
  /** Loop through array phrases continuously. Defaults to true if text is an array. */
  loop?: boolean
  /** Whether to render the blinking cursor. Default: true. */
  cursor?: boolean
  /** Visual style of the cursor: 'bar' | 'block' | 'underscore'. Default: 'bar'. */
  cursorStyle?: 'bar' | 'block' | 'underscore'
  /** Custom classes for the cursor. */
  cursorClassName?: string
  /** HTML tag to render as. Default: 'span'. */
  as?: ElementType
  /** Additional container classes. */
  className?: string
  /** Optional prefix element rendered before the typed text. */
  prefix?: ReactNode
  /** Optional suffix element rendered after the cursor. */
  suffix?: ReactNode
  /** Callback fired when a single text finishes typing. */
  onComplete?: () => void
}

/**
 * RenderType — An interactive typing renderer element that renders text
 * with natural character-by-character cadence, punctuation micro-pauses,
 * looping support, accessible screen-reader fallbacks, and reduced-motion immunity.
 */
export function RenderType({
  text,
  speed = 42,
  deleteSpeed = 24,
  holdDuration = 2000,
  startDelay = 250,
  loop,
  cursor = true,
  cursorStyle = 'bar',
  cursorClassName,
  as: Component = 'span',
  className,
  prefix,
  suffix,
  onComplete,
}: RenderTypeProps) {
  const phrases = useMemo(() => (Array.isArray(text) ? text : [text]), [text])
  const shouldLoop = loop ?? phrases.length > 1

  const [phraseIndex, setPhraseIndex] = useState(0)
  // The hook is given a server snapshot, so the server's render and the first
  // render during hydration agree; the preference is applied straight
  // afterwards. Reading the media query during render instead would give a
  // reduced-motion visitor different text from the server's, and break
  // hydration on the prerendered home page.
  const isReduced = usePrefersReducedMotion()
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // The callback is held in a ref rather than being a dependency: a caller
  // that passes an inline arrow would otherwise re-run the effect on every
  // render, and the effect calls the callback back.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const currentPhrase = phrases[phraseIndex] ?? ''
  const renderedText = isReduced ? (phrases[0] ?? '') : displayText
  const isTypingActive = !isReduced && displayText.length > 0 && displayText.length < currentPhrase.length

  useEffect(() => {
    // If the candidate prefers reduced motion, notify completion immediately without typing loop
    if (isReduced) {
      onCompleteRef.current?.()
      return
    }

    let timer: ReturnType<typeof setTimeout>

    // Starting or in-progress
    if (!isDeleting) {
      if (displayText.length < currentPhrase.length) {
        /* v8 ignore next -- the index is inside the phrase while it is typing */
        const nextChar = currentPhrase[displayText.length] ?? ''
        // Add natural human micro-pause after punctuation
        const isPunctuation = [',', '.', '!', '?', ';', ':'].includes(nextChar)
        const delay = (displayText.length === 0 ? startDelay : speed) + (isPunctuation ? 140 : 0)

        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1))
        }, delay)
      } else {
        // Phrase is fully typed
        onCompleteRef.current?.()

        if (shouldLoop && phrases.length > 1) {
          timer = setTimeout(() => {
            setIsDeleting(true)
          }, holdDuration)
        }
      }
    } else {
      // Deleting back
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, deleteSpeed)
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false)
          setPhraseIndex((prev) => (prev + 1) % phrases.length)
        }, 80)
      }
    }

    return () => clearTimeout(timer)
  }, [
    displayText,
    isDeleting,
    isReduced,
    currentPhrase,
    phrases.length,
    shouldLoop,
    speed,
    deleteSpeed,
    holdDuration,
    startDelay,
  ])

  // Cursor styling based on chosen style
  const cursorShapeClass =
    cursorStyle === 'block'
      ? 'inline-block w-[0.55em] h-[1.1em] align-middle bg-mark-500 dark:bg-mint-400 rounded-xs'
      : cursorStyle === 'underscore'
        ? 'inline-block w-[0.65em] h-[3px] align-baseline bg-mark-500 dark:bg-mint-400 rounded-full translate-y-0.5'
        : 'inline-block w-[2.5px] sm:w-[3px] h-[1.15em] align-middle bg-mark-500 dark:bg-mint-400 rounded-full'

  return (
    <Component className={cn('inline-flex items-center flex-wrap', className)}>
      {/* Screen readers read the full intended phrase without letter-by-letter stutter */}
      <span className="sr-only">{currentPhrase}</span>

      {prefix}

      <span aria-hidden="true" className="whitespace-pre-wrap">
        {renderedText}
      </span>

      {cursor && (
        <span
          aria-hidden="true"
          className={cn(
            'ml-1 select-none pointer-events-none transition-opacity duration-150',
            cursorShapeClass,
            !isTypingActive && 'animate-type-cursor',
            cursorClassName
          )}
        />
      )}

      {suffix}
    </Component>
  )
}
