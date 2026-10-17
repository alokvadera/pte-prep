import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { prefersReducedMotion } from '../../lib/motion'

/* ---------------------------------------------------------------------------
   ScrollVelocity.

   A ticker that reads the reader: it
   drifts at a walking pace and speeds up
   with scroll velocity, so scrolling
   faster whips it along. The position is
   integrated per frame in JavaScript
   rather than driven by a CSS animation,
   because the speed has to respond to a
   signal the animation engine cannot see.

   The boost decays back to the base pace
   on its own, so the strip never spins
   out. Not armed under reduced motion,
   where it sits still and readable.
--------------------------------------------------------------------------- */

/** Base travel, in CSS pixels per second. */
const BASE = 55

export function ScrollVelocity({
  items,
  separator = '•',
  className,
}: {
  items: ReactNode[]
  separator?: ReactNode
  className?: string
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const track = trackRef.current
    if (!track) return

    let raf = 0
    let running = false
    let x = 0
    let last = performance.now()
    let boost = 0
    let lastY = typeof window.scrollY === 'number' ? window.scrollY : 0

    const onScroll = () => {
      const y = window.scrollY
      boost = Math.min(boost + Math.abs(y - lastY) * 0.35, 14)
      lastY = y
    }

    const tick = (now: number) => {
      if (!running) return
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      boost += -boost * 0.025
      x -= BASE * (1 + boost) * dt
      const half = track.scrollWidth / 2
      if (half > 0) track.style.transform = `translateX(${x % half}px)`
      raf = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }

    const stop = () => {
      running = false
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            if (entry?.isIntersecting) {
              start()
            } else {
              stop()
            }
          })
        : null

    if (observer) {
      observer.observe(track)
    } else {
      start()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      observer?.disconnect()
      stop()
    }
  }, [])

  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-5">{item}</span>
          <span aria-hidden="true" className="opacity-40">
            {separator}
          </span>
        </span>
      ))}
    </div>
  )

  return (
    <div className={cn('marquee overflow-hidden', className)} aria-hidden="true">
      <div ref={trackRef} className="marquee-track flex w-max">
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}
