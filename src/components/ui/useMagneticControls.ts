import { useEffect } from 'react'

/**
 * Give button-shaped actions the same cursor pull as the prominent CTAs without
 * wrapping them. A wrapper would change the width of full-row buttons and the
 * focus/selection behaviour of controls that change state on click.
 *
 * One delegated listener covers controls added by lazy routes and dialogs.
 * The timed runner stays still: its answer and navigation targets should never
 * chase the pointer. Existing <Magnetic> CTAs own their motion and are skipped.
 */
export function useMagneticControls() {
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const selector = 'a.btn-primary, button.btn-primary, a.btn-secondary, button.btn-secondary, a.btn-orange, button.btn-orange, a.btn-ghost, button.btn-ghost, button.btn-danger'
    let active: HTMLElement | null = null
    let frame = 0
    let point: { x: number; y: number } | null = null

    const clear = () => {
      cancelAnimationFrame(frame)
      frame = 0
      point = null
      if (!active) return
      // The class is what the control's transform hangs off, so it goes
      // with the rest of the state: a control the pointer has left is an
      // ordinary control again.
      active.classList.remove('magnetic-control')
      active.style.setProperty('--control-x', '0px')
      active.style.setProperty('--control-y', '0px')
      active = null
    }

    const eligible = (target: EventTarget | null, pointerType: string) => {
      if (pointerType !== 'mouse' || motion.matches || !finePointer.matches) return null
      if (!(target instanceof Element) || target.closest('.test-route')) return null
      const control = target.closest<HTMLElement>(selector)
      if (!control || control.matches(':disabled, [aria-disabled="true"]') || control.closest('.magnetic, [data-no-magnetic]')) return null
      return control
    }

    const onMove = (event: PointerEvent) => {
      const control = eligible(event.target, event.pointerType)
      if (control !== active) clear()
      if (!control) return
      active = control
      control.classList.add('magnetic-control')
      point = { x: event.clientX, y: event.clientY }
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (!active || !point) return
        const rect = active.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        // Cap travel in pixels; the same control can be a tiny icon or a wide CTA.
        const x = Math.max(-8, Math.min(8, (point.x - rect.left - rect.width / 2) * 0.18))
        const y = Math.max(-6, Math.min(6, (point.y - rect.top - rect.height / 2) * 0.18))
        active.style.setProperty('--control-x', `${x.toFixed(1)}px`)
        active.style.setProperty('--control-y', `${y.toFixed(1)}px`)
      })
    }

    const onOut = (event: PointerEvent) => {
      if (active && !(event.relatedTarget instanceof Node && active.contains(event.relatedTarget))) clear()
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut)
    motion.addEventListener('change', clear)
    finePointer.addEventListener('change', clear)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
      motion.removeEventListener('change', clear)
      finePointer.removeEventListener('change', clear)
      clear()
    }
  }, [])
}
