import { useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

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

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--sp-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--sp-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      className={cn('spotlight-card', className)}
      onPointerMove={onMove}
      onPointerEnter={() => setArmed(true)}
      onPointerLeave={() => setArmed(false)}
      {...rest}
    >
      <span aria-hidden="true" className={cn('spotlight-glow', armed && 'spotlight-glow-on')} />
      {children}
    </div>
  )
}
