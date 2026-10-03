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
  up: 'data-[armed=true]:data-[shown=false]:translate-y-6',
  down: 'data-[armed=true]:data-[shown=false]:-translate-y-6',
  left: 'data-[armed=true]:data-[shown=false]:translate-x-6',
  right: 'data-[armed=true]:data-[shown=false]:-translate-x-6',
  scale: 'data-[armed=true]:data-[shown=false]:scale-95',
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
  duration = 600,
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

  // `data-countup` is the hook the motion review samples: timing the roll from
  // outside is otherwise impossible, since the value never sits in the DOM
  // between frames.
  return (
    <span ref={ref} data-countup="" className={cn('tabular-nums', className)}>
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
  max = 5,
  glare = true,
  travel = 16,
}: {
  children: ReactNode
  className?: string
  /**
   * Ceiling on the lean at the edges, for a surface narrow enough not to be
   * limited by `travel`. Every stage on the site today is a full-width panel,
   * so this is a backstop rather than a per-call-site setting: at 960px the
   * clamp lands on about 3.1deg, well under it.
   */
  max?: number
  glare?: boolean
  /** How far the outer edge is allowed to travel, in CSS pixels. */
  travel?: number
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

      /* Lean is proportional to the distance from the centre, so a single angle
         moves a wide surface's edge much further than a small card's: at 4deg a
         960px stage swings its corner about 33px, a 240px card only 8px. The
         same `max` therefore reads as a strong lean on a card and a barely
         perceptible one on a full-width panel. Rather than tune each call site
         by hand, cap the angle so the outer edge travels about `travel` pixels.
         Measured, the full-width stages were leaning under 1.5deg before this. */
      const halfWidth = rect.width / 2
      const byTravel =
        halfWidth > travel
          ? (2 * Math.asin(travel / halfWidth) * 180) / Math.PI
          : Number.POSITIVE_INFINITY
      const lean = Math.min(max, byTravel)

      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--tilt-x', `${(-py * lean).toFixed(2)}deg`)
        el.style.setProperty('--tilt-y', `${(px * lean).toFixed(2)}deg`)
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
  }, [max, travel])

  return (
    <div ref={ref} className={cn('tilt', className)}>
      <div className="tilt-inner">{children}</div>
      {glare ? <span className="tilt-glare" aria-hidden="true" /> : null}
    </div>
  )
}

/**
 * A pointer-proximity field: children drift a few pixels toward the cursor as
 * it comes near them, and settle back when it leaves.
 *
 * This is the one cursor behaviour on the site, and it earns its place on the
 * 22-card question-type grid rather than by decoration. That grid is two
 * columns of near-identical cards, and the thing a reader is actually doing is
 * scanning for one entry — moving the pointer toward the card narrows the
 * search, the way leaning toward something narrows a search visually. It is
 * deliberately not a cursor follower, a trail, or a glow: those are decoration
 * wearing the costume of interaction.
 *
 * The rules it obeys are the ones `Tilt` already obeys, and they are not
 * optional:
 *
 * - **Pixel travel, not degrees.** `travel` is the cap on how far a child's
 *   edge actually moves, so the motion reads the same on a 200px card and a
 *   600px panel. `Tilt` had to compute this from its own half-width; here it is
 *   simply the value written.
 * - **Not armed at all under `prefers-reduced-motion`.** Same rule as Reveal:
 *   the element is left in its resolved state rather than transitioned through
 *   a zero-duration version of a movement.
 * - **Not armed on a coarse pointer.** A tap has no approach and no hover, so
 *   on touch this would only ever fire after the fact.
 * - **One listener, written to custom properties.** The per-frame work is two
 *   `setProperty` calls on the child that is actually near the cursor; the
 *   interpolation is the browser's, via a CSS `transition` on `translate`.
 *
 * It must not be pointed at an element that already carries `Reveal` or
 * `Tilt`. Both of those animate `translate`, and two owners of one property is
 * the last thing a grid of 22 cards needs. Targets are therefore opted in with
 * `data-pf`, not assumed from the child list, which lets the field sit outside
 * a grid whose items are already scroll-revealed.
 */
export function PointerField({
  children,
  className,
  radius = 260,
  travel = 12,
}: {
  children: ReactNode
  className?: string
  /** Pointer distance at which a child has fully settled back to rest. */
  radius?: number
  /** Maximum pixel travel of a child's edge. */
  travel?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) return

    let raf = 0
    let queued: { x: number; y: number } | null = null

    const apply = () => {
      raf = 0
      const point = queued
      queued = null
      if (!point) return

      for (const child of el.querySelectorAll<HTMLElement>('[data-pf]')) {
        const box = child.getBoundingClientRect()
        if (box.width === 0 && box.height === 0) continue
        // Distance from the pointer to the nearest edge, so a pointer inside a
        // card reads as fully arrived rather than as distance zero at centre.
        const dx = Math.max(box.left - point.x, 0, point.x - box.right)
        const dy = Math.max(box.top - point.y, 0, point.y - box.bottom)
        const distance = Math.hypot(dx, dy)
        const falloff = distance >= radius ? 0 : 1 - distance / radius
        if (falloff <= 0.01) {
          if (child.style.getPropertyValue('--pf-x')) {
            child.style.setProperty('--pf-x', '0px')
            child.style.setProperty('--pf-y', '0px')
          }
          continue
        }
        const cx = box.left + box.width / 2
        const cy = box.top + box.height / 2
        const pull = falloff * travel
        const ux = (cx - point.x) / (Math.hypot(cx - point.x, cy - point.y) || 1)
        const uy = (cy - point.y) / (Math.hypot(cx - point.x, cy - point.y) || 1)
        child.style.setProperty('--pf-x', `${(ux * pull).toFixed(2)}px`)
        child.style.setProperty('--pf-y', `${(uy * pull).toFixed(2)}px`)
      }
    }

    const onMove = (e: PointerEvent) => {
      queued = { x: e.clientX, y: e.clientY }
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const onLeave = () => {
      queued = null
      cancelAnimationFrame(raf)
      raf = 0
      for (const child of el.querySelectorAll<HTMLElement>('[data-pf]')) {
        child.style.setProperty('--pf-x', '0px')
        child.style.setProperty('--pf-y', '0px')
      }
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [radius, travel])

  return (
    <div ref={ref} className={cn('pointer-field', className)}>
      {children}
    </div>
  )
}
