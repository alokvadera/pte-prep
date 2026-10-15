import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { prefersReducedMotion } from '../../lib/motion'

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

type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' | 'blur-up'

/**
 * Hidden classes are written out in full rather than assembled from a variable,
 * because Tailwind scans source text for complete class names — a template
 * literal would compile to no CSS at all.
 *
 * The `blur-up` variant is the house entrance per B7: a heavy, slow fade up
 * with a blur that resolves to nothing. It is the signature motion for
 * headline moments and cards that deserve a beat.
 *
 * The `up` variant is 06-playful's `.rise`: 36px of travel, the same
 * 800ms house curve the mockup's `riseIn` scroll-driven animation uses.
 */
const HIDDEN_CLASS: Record<RevealVariant, string> = {
  up: 'data-[armed=true]:data-[shown=false]:translate-y-5',
  down: 'data-[armed=true]:data-[shown=false]:-translate-y-4',
  left: 'data-[armed=true]:data-[shown=false]:translate-x-4',
  right: 'data-[armed=true]:data-[shown=false]:-translate-x-4',
  scale: 'data-[armed=true]:data-[shown=false]:scale-95',
  fade: '',
  'blur-up': 'data-[armed=true]:data-[shown=false]:translate-y-5 data-[armed=true]:data-[shown=false]:blur-[5px]',
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
  duration = 480,
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
        // `filter` is transitioned so the `blur-up` variant can resolve its
        // blur to nothing. The house curve per B7, never the framework default.
        'transition-[opacity,translate,scale,filter]',
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
  duration = 750,
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
  const hasAnimatedRef = useRef(false)
  const currentRef = useRef(value)

  useEffect(() => {
    currentRef.current = display
  }, [display])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setDisplay(value)
      return
    }

    let raf = 0

    // If already animated once and value is updated (e.g. user dragged a slider),
    // smoothly glide from current display to new value without resetting to 0!
    if (hasAnimatedRef.current) {
      const from = currentRef.current
      const to = value
      const diff = to - from
      if (Math.abs(diff) < 0.01) {
        setDisplay(to)
        return
      }
      const transitionDur = Math.min(220, duration)
      const startedAt = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - startedAt) / transitionDur)
        const eased = 1 - Math.pow(1 - t, 3.5)
        setDisplay(from + diff * eased)
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        hasAnimatedRef.current = true
        const startedAt = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - startedAt) / duration)
          const eased = 1 - Math.pow(1 - t, 3.5)
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
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) return

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
  radius = 300,
  travel = 10,
}: {
  children: ReactNode
  className?: string
  /** Centre-to-centre distance at which a child has fully settled back to rest. */
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
        const cx = box.left + box.width / 2
        const cy = box.top + box.height / 2
        const dx0 = point.x - cx
        const dy0 = point.y - cy
        const distance = Math.hypot(dx0, dy0)

        // Falloff on centre distance, not distance to the nearest edge. The
        // edge version looked right for the card being pointed at and wrong for
        // everything else: a neighbour one 16px gap away scored almost as
        // strongly as the target and slid 5.9px, which read as the whole column
        // shifting rather than one card being chosen.
        const falloff = distance >= radius ? 0 : 1 - distance / radius
        if (falloff <= 0.01) {
          if (child.style.getPropertyValue('--pf-x')) {
            child.style.setProperty('--pf-x', '0px')
            child.style.setProperty('--pf-y', '0px')
          }
          continue
        }
        const unit = distance || 1

        // Two parts, because one part was measurably wrong. Leaning the card
        // toward the pointer alone gives the card *under* the cursor a
        // direction of zero, so the card you are pointing at stayed still while
        // its neighbours moved toward it — the opposite of what this is for.
        // So every card in range also rises by its own proximity, and the
        // lean is the smaller half of the movement.
        const lean = falloff * travel
        let vx = (dx0 / unit) * lean * 0.5
        let vy = (dy0 / unit) * lean * 0.5 - falloff * travel * 0.5

        // `travel` is a hard ceiling on the edge's movement, not a scale hint.
        const magnitude = Math.hypot(vx, vy)
        if (magnitude > travel) {
          vx = (vx / magnitude) * travel
          vy = (vy / magnitude) * travel
        }
        child.style.setProperty('--pf-x', `${vx.toFixed(2)}px`)
        child.style.setProperty('--pf-y', `${vy.toFixed(2)}px`)
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

/* ---------------------------------------------------------------------------
   Magnetic.

   A premium hover effect where an element leans toward the cursor as it
   approaches, and springs back when the pointer leaves. The effect falls off
   with distance so only the element being pointed at responds, and it is
   disabled entirely for touch pointers and for visitors who asked for reduced
   motion.

   Wrap a primary CTA or a floating action with this and the surface feels like
   it has physical mass. One or two per page is enough — overuse reads as noise.
--------------------------------------------------------------------------- */
export function Magnetic({
  children,
  strength = 0.2,
  radius = 85,
  maxTravel = 8,
  className,
}: {
  children: ReactNode
  /** How far the element travels at maximum proximity, as a ratio of distance. */
  strength?: number
  /** Centre-to-centre distance at which the element has fully settled back. */
  radius?: number
  /** Maximum displacement cap in pixels so button never detaches or over-pulls. */
  maxTravel?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) return

    let raf = 0
    let queued: { x: number; y: number } | null = null
    let active = false
    let restingCenter: { cx: number; cy: number } | null = null

    const reset = () => {
      cancelAnimationFrame(raf)
      raf = 0
      queued = null
      active = false
      restingCenter = null
      el.style.setProperty('--mg-x', '0px')
      el.style.setProperty('--mg-y', '0px')
      window.removeEventListener('pointermove', onWindowMove)
    }

    const apply = () => {
      raf = 0
      if (!queued || !restingCenter) return
      const { cx, cy } = restingCenter
      const dx = queued.x - cx
      const dy = queued.y - cy
      const distance = Math.hypot(dx, dy)

      if (distance > radius) {
        reset()
        return
      }

      const falloff = 1 - distance / radius
      const tx = Math.max(-maxTravel, Math.min(maxTravel, dx * strength * falloff))
      const ty = Math.max(-maxTravel * 0.75, Math.min(maxTravel * 0.75, dy * strength * falloff))
      el.style.setProperty('--mg-x', `${tx.toFixed(2)}px`)
      el.style.setProperty('--mg-y', `${ty.toFixed(2)}px`)
    }

    const onWindowMove = (e: PointerEvent) => {
      queued = { x: e.clientX, y: e.clientY }
      if (!raf) raf = requestAnimationFrame(apply)
    }

    const onEnter = (e: PointerEvent) => {
      if (active) return
      active = true
      const box = el.getBoundingClientRect()
      const curX = parseFloat(el.style.getPropertyValue('--mg-x')) || 0
      const curY = parseFloat(el.style.getPropertyValue('--mg-y')) || 0
      restingCenter = {
        cx: box.left + box.width / 2 - curX,
        cy: box.top + box.height / 2 - curY,
      }
      queued = { x: e.clientX, y: e.clientY }
      window.addEventListener('pointermove', onWindowMove, { passive: true })
      if (!raf) raf = requestAnimationFrame(apply)
    }

    el.addEventListener('pointerenter', onEnter)
    return () => {
      el.removeEventListener('pointerenter', onEnter)
      window.removeEventListener('pointermove', onWindowMove)
      cancelAnimationFrame(raf)
    }
  }, [strength, radius, maxTravel])

  return (
    <div ref={ref} className={cn('magnetic', className)}>
      {children}
    </div>
  )
}
