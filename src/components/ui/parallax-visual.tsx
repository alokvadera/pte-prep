import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { prefersReducedMotion } from '../../lib/motion'

/* ---------------------------------------------------------------------------
   ParallaxVisual.

   The hero's score card drifts a few
   pixels against the pointer, the way
   a paper card on a desk shifts when
   you lean over it. The travel is
   capped in pixels (not degrees) so a
   narrow card and a wide panel move
   the same distance, and the motion
   is lerped per frame so it glides.

   One pointer owner per element: this
   must not wrap something that already
   animates `translate`. Reduced motion
   and coarse pointers get a still card.
--------------------------------------------------------------------------- */

export function ParallaxVisual({
  children,
  className,
  depth = 10,
}: {
  children: ReactNode
  className?: string
  /** Peak travel in CSS pixels, at the element's edge. */
  depth?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) return

    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0

    const startLoop = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      tx = ((e.clientX - (rect.left + rect.width / 2)) / rect.width) * depth
      ty = ((e.clientY - (rect.top + rect.height / 2)) / rect.height) * depth
      startLoop()
    }

    const onLeave = () => {
      tx = 0
      ty = 0
      startLoop()
    }

    const tick = () => {
      cx += (tx - cx) * 0.06
      cy += (ty - cy) * 0.06
      if (Math.abs(tx - cx) < 0.01 && Math.abs(ty - cy) < 0.01) {
        cx = tx
        cy = ty
        el.style.transform = cx === 0 && cy === 0 ? '' : `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`
        raf = 0
        return
      }
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave, { passive: true })
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [depth])

  return (
    <div ref={ref} className={cn('parallax-visual', className)}>
      {children}
    </div>
  )
}
