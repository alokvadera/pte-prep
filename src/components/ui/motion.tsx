import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Motion primitives.

   Three pieces of behaviour that every animated surface on the site shares, so
   none of them invents its own observer, timer or pointer math:

   - Reveal   an element that settles in as it enters the viewport
   - CountUp  a figure that rolls up to its value once seen
   - Tilt     a pointer-reactive 3D lean

   All three follow the same two rules the tagline reveal (B11) established:

   1. The server-rendered markup is the *resolved* state. Nothing is hidden in
      HTML — muting and offsetting happen only after mount, and only when motion
      is wanted. Without JavaScript, or for a crawler, the page is simply there.
   2. `prefers-reduced-motion` is honoured by not arming at all, not by running
      an animation at 0.01ms inside a transition that still shifts layout.
--------------------------------------------------------------------------- */

/** True when the visitor has asked the system to reduce motion. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'

/**
 * Hidden classes are written out in full rather than assembled from a variable,
 * because Tailwind scans source text for complete class names — a template
 * literal would compile to no CSS at all.
 */
const HIDDEN_CLASS: Record<RevealVariant, string> = {
  up: 'data-[armed=true]:data-[shown=false]:translate-y-10',
  down: 'data-[armed=true]:data-[shown=false]:-translate-y-10',
  left: 'data-[armed=true]:data-[shown=false]:translate-x-12',
  right: 'data-[armed=true]:data-[shown=false]:-translate-x-12',
  scale: 'data-[armed=true]:data-[shown=false]:scale-90',
  fade: '',
}

/**
 * Settles its children in as they scroll into view.
 *
 * The wrapper is a grid/flex child rather than a visual element, so it can wrap
 * a card, a list item or a whole section without changing the layout. Delay is
 * used to stagger siblings.
 */
export function Reveal({
  children,
  as,
  id,
  variant = 'up',
  delay = 0,
  duration = 700,
  className,
}: {
  children: ReactNode
  as?: ElementType
  /** Kept so a revealed card can still carry an anchor target. */
  id?: string
  variant?: RevealVariant
  /** Milliseconds to wait after the element enters, for staggering siblings. */
  delay?: number
  duration?: number
  className?: string
}) {
  const Tag = (as ?? 'div') as 'div'
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return

    el.dataset.armed = 'true'
    let timer: number | null = null

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          timer = window.setTimeout(() => {
            el.dataset.shown = 'true'
          }, delay)
          io.unobserve(el)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    )
    io.observe(el)
    return () => {
      if (timer !== null) window.clearTimeout(timer)
      io.disconnect()
    }
  }, [delay])

  return (
    <Tag
      ref={ref}
      id={id}
      style={{ transitionDuration: `${duration}ms` }}
      className={cn(
        'transition-[opacity,translate,scale] ease-[cubic-bezier(0.32,0.72,0,1)]',
        // `will-change` is scoped to the waiting state only. Once a card has
        // revealed it is left alone, so a page with 20+ revealed cards is not
        // holding 20+ promoted layers for the life of the view.
        'data-[armed=true]:data-[shown=false]:will-change-transform',
        'data-[armed=true]:data-[shown=false]:opacity-0',
        HIDDEN_CLASS[variant],
        className,
      )}
    >
      {children}
    </Tag>
  )
}

/**
 * A figure that rolls from zero up to its value the first time it is seen.
 *
 * The value renders in full on the server and on the first client paint, so the
 * markup never disagrees with itself and hydration stays clean; the roll begins
 * only once the observer fires.
 */
export function CountUp({
  value,
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '',
  format,
  className,
}: {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  /** Overrides the default formatting entirely (prefix/suffix included). */
  format?: (n: number) => string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return

    let raf = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        const startedAt = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - startedAt) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          setDisplay(value * eased)
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        setDisplay(0)
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration])

  const text =
    format?.(display) ??
    `${prefix}${decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}${suffix}`

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {text}
    </span>
  )
}

/**
 * A pointer-reactive 3D lean, plus a soft glare that tracks the cursor.
 *
 * The transform is written to CSS custom properties on the stage and consumed
 * by the `.tilt-*` classes, so React never re-renders on pointer move — the
 * browser only repaints the composited layer.
 */
export function Tilt({
  children,
  className,
  max = 7,
  glare = true,
}: {
  children: ReactNode
  className?: string
  /** Maximum lean in degrees at the edges. */
  max?: number
  glare?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return

    let raf = 0
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width - 0.5
      const py = (event.clientY - rect.top) / rect.height - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--tilt-x', `${(-py * max).toFixed(2)}deg`)
        el.style.setProperty('--tilt-y', `${(px * max).toFixed(2)}deg`)
        el.style.setProperty('--tilt-gx', `${((px + 0.5) * 100).toFixed(1)}%`)
        el.style.setProperty('--tilt-gy', `${((py + 0.5) * 100).toFixed(1)}%`)
      })
    }
    const onLeave = () => {
      cancelAnimationFrame(raf)
      el.style.setProperty('--tilt-x', '0deg')
      el.style.setProperty('--tilt-y', '0deg')
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [max])

  return (
    <div ref={ref} className={cn('tilt', className)}>
      <div className="tilt-inner">{children}</div>
      {glare ? <span className="tilt-glare" aria-hidden="true" /> : null}
    </div>
  )
}
