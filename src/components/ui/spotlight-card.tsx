import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { prefersReducedMotion } from '../../lib/motion'

/* ---------------------------------------------------------------------------
   SpotlightCard.

   A card whose surface lights up where the pointer
   is — a soft radial glow that tracks the cursor
   across the card, the way a desk lamp follows
   a page. The glow is written to CSS custom
   properties on pointer move, so React never
   re-renders while the pointer travels; the
   browser only repaints the composited layer.
   Not armed for touch pointers or reduced
   motion, where a hover does not exist.
--------------------------------------------------------------------------- */

export function SpotlightCard({
  className,
  children,
  ...rest
}: {
  className?: string
  children: ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [armed, setArmed] = useState(false)
  // The same guard the other pointer effects use: a touch pointer has no
  // hover, and a visitor who asked for reduced motion gets a still card.
  // The check runs after mount, so the server and the browser render the
  // same markup.
  const live = useRef(false)

  useEffect(() => {
    if (prefersReducedMotion()) return
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches)
      return
    live.current = true
  }, [])

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    /* v8 ignore next -- the ref is attached before any event can reach it */
    if (!el || !live.current) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--sp-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--sp-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      className={cn('spotlight-card', className)}
      onPointerMove={onMove}
      onPointerEnter={() => {
        if (live.current) setArmed(true)
      }}
      onPointerLeave={() => setArmed(false)}
      {...rest}
    >
      <span aria-hidden="true" className={cn('spotlight-glow', armed && 'spotlight-glow-on')} />
      {children}
    </div>
  )
}
