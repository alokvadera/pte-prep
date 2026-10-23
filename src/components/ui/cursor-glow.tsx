import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import { prefersReducedMotion } from '../../lib/motion'

/* ---------------------------------------------------------------------------
   CursorGlow (Refined).

   An atmospheric pool of multi-tone brand light (royal violet core with
   candy mint perimeter) that smoothly glides with the pointer.

   Refinements:
   - Dynamic interactive proximity: subtly expands (scale 1.35x) and brightens
     when hovering clickable elements (buttons, links, choice cards, inputs).
   - Elastic tactile snap: micro-compresses (scale 0.88x) on pointerdown.
   - Smooth viewport lifecycle: fades in on first pointer presence; fades out
     smoothly on pointerleave or window blur.
   - Efficient idle sleeping: stops requestAnimationFrame when settled, waking
     instantly on pointer movement to preserve battery and 0% idle CPU.
   - Screen-aware: disabled under prefers-reduced-motion and touch/coarse devices.
--------------------------------------------------------------------------- */

export function CursorGlow({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    /* v8 ignore next -- the ref is attached before any effect runs */
    if (!el) return
    if (prefersReducedMotion()) return
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) return

    let raf = 0
    let running = false
    let x = -600
    let y = -600
    let tx = -600
    let ty = -600
    let scale = 1
    let targetScale = 1
    let isHovering = false
    let isPressed = false
    let visible = false

    const updateTargetScale = () => {
      if (isPressed) {
        targetScale = 0.88
      } else if (isHovering) {
        targetScale = 1.35
      } else {
        targetScale = 1.0
      }
    }

    const checkInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        isHovering = false
        updateTargetScale()
        return
      }
      const interactive = target.closest(
        'button, a, input, select, textarea, [role="button"], [role="tab"], .btn, .card-interactive, .choice-card, .choice-row, .magnetic-control, summary, [data-interactive="true"]'
      )
      isHovering = Boolean(interactive)
      updateTargetScale()
    }

    const wake = () => {
      if (!running) {
        running = true
        raf = requestAnimationFrame(tick)
      }
    }

    const tick = () => {
      const dx = tx - x
      const dy = ty - y
      const ds = targetScale - scale

      x += dx * 0.14
      y += dy * 0.14
      scale += ds * 0.16

      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale.toFixed(3)})`

      // If nearly settled, pause the RAF loop until the next pointer event
      if (Math.abs(dx) < 0.08 && Math.abs(dy) < 0.08 && Math.abs(ds) < 0.003) {
        x = tx
        y = ty
        scale = targetScale
        el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
        running = false
        return
      }

      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY

      if (!visible) {
        visible = true
        el.style.opacity = '1'
        x = tx
        y = ty
      }

      checkInteractiveTarget(e.target)
      wake()
    }

    const onDown = () => {
      isPressed = true
      updateTargetScale()
      wake()
    }

    const onUp = () => {
      isPressed = false
      updateTargetScale()
      wake()
    }

    const onLeave = () => {
      visible = false
      el.style.opacity = '0'
      isHovering = false
      isPressed = false
      updateTargetScale()
      // Park the glow off-screen instead of letting it drift back towards
      // the last pointer position it was chasing.
      tx = -600
      ty = -600
      wake()
    }

    const onBlur = () => {
      onLeave()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onBlur)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn('cursor-glow', className)}
      aria-hidden="true"
    />
  )
}
