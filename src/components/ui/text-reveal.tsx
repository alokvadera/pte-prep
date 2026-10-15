import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { prefersReducedMotion } from '../../lib/motion'

/* ---------------------------------------------------------------------------
   TextReveal.

   A heading that arrives word by word —
   each word rises, un-blurs and settles
   a beat after the last. It is the
   hero's signature entrance: the claim
   reads as a sentence being assembled
   rather than a block fading in.

   Like Reveal, the resolved state is the
   server state: words sit in full until
   the observer arms the animation, so
   no-JavaScript visitors and crawlers
   see the complete heading. The reveal
   is two-phase (arm the hidden state,
   then add the shown class a frame
   later) so the transition has a real
   starting point.
--------------------------------------------------------------------------- */

export function TextReveal({
  text,
  as,
  className,
  stagger = 45,
  delay = 0,
}: {
  text: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
  /** Milliseconds between each word's start. */
  stagger?: number
  delay?: number
}) {
  const Tag = (as ?? 'span') as 'span'
  const ref = useRef<HTMLSpanElement | null>(null)
  const [armed, setArmed] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Reduced motion never arms the hidden state, and `.word` ships in its
    // resolved form, so the heading is already legible here — there is
    // nothing to set.
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        setArmed(true)
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Phase two: the armed (hidden) state has
  // painted by the time the shown class lands,
  // so each word has a real transition to run.
  useEffect(() => {
    if (!armed) return
    let raf = 0
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setShown(true))
    })
    return () => cancelAnimationFrame(raf)
  }, [armed])

  // Only strings are split; anything already
  // composed (a styled span inside the
  // heading) arrives as one piece.
  const words = typeof text === 'string' ? text.split(' ') : [text]

  return (
    <Tag ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          data-armed={armed ? 'true' : undefined}
          className={cn('word', shown && 'word-in')}
          style={{ transitionDelay: `${delay + i * stagger}ms` }}
        >
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}
