import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { prefersReducedMotion } from '../../lib/motion'

/* ---------------------------------------------------------------------------
   TextScramble.

   The decode-in effect: a short label
   flickers through random glyphs and
   settles into its final text as it
   scrolls into view. It suits a
   status line — the kind of small
   print a machine would "resolve" —
   and not body copy, so it is used
   on the hero's eyebrow pill only.

   Reduced motion resolves the text
   instantly. The scramble runs once,
   on the way in, and never again.
--------------------------------------------------------------------------- */

const GLYPHS = '!<>-_\\/[]{}=+*^?#'

export function TextScramble({
  text,
  className,
  duration = 700,
}: {
  text: string
  className?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [display, setDisplay] = useState(text)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // `display` is initialised to `text`, so there is nothing to set for a
    // visitor who asked not to be moved — the label is already resolved.
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return

    let raf = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()

        const start = performance.now()
        const step = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          const settled = Math.floor(text.length * t)
          setDisplay(
            text
              .split('')
              .map((ch, i) =>
                i < settled || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
              )
              .join(''),
          )
          if (t < 1) raf = requestAnimationFrame(step)
          else setDisplay(text)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [text, duration])

  return (
    <span ref={ref} className={cn('text-scramble', className)}>
      {display}
    </span>
  )
}
