import { useEffect, useState, type CSSProperties } from 'react'

/* ---------------------------------------------------------------------------
   ConfettiBurst.

   A one-shot celebration: a ring of
   candy particles that flies out from
   the middle of the viewport and falls,
   fading as it goes. Fired by setting
   `fire` — a new best score, a target
   cleared, an earned achievement. The
   burst self-cleans after the flight, so
   the DOM carries nothing between
   celebrations.
--------------------------------------------------------------------------- */

const PALETTE = [
  'var(--color-mint-500)',
  'var(--color-brand-500)',
  'var(--color-mark-500)',
  'var(--color-amber-500)',
  'var(--color-rose-500)',
]

export function ConfettiBurst({ fire, count = 28 }: { fire: boolean; count?: number }) {
  const [bursts, setBursts] = useState<number[]>([])
  const [wasFired, setWasFired] = useState(fire)

  // `fire` arrives as a prop, so the trigger is handled during render:
  // React re-renders immediately, before paint, with no extra pass through
  // an effect. The id comes from the list itself rather than the clock, so
  // nothing impure runs while rendering.
  if (fire !== wasFired) {
    setWasFired(fire)
    if (fire) setBursts((list) => [...list, list.length ? Math.max(...list) + 1 : 1])
  }

  // The flight lasts 2.4s (see `.confetti-particle`), after which the DOM
  // carries nothing between celebrations. Bursts are cleared together —
  // they are fired one celebration at a time, and the newest one owns the
  // window.
  useEffect(() => {
    if (bursts.length === 0) return
    const timer = window.setTimeout(() => setBursts([]), 2400)
    return () => window.clearTimeout(timer)
  }, [bursts])

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden" aria-hidden="true">
      {bursts.map((id) => (
        <div key={id} className="confetti-origin">
          {Array.from({ length: count }, (_, i) => {
            const angle = (i / count) * 360 + (i % 3) * 7
            const dist = 110 + (i % 6) * 26
            return (
              <span
                key={i}
                className="confetti-particle"
                style={
                  {
                    '--angle': `${angle}deg`,
                    '--dist': `${dist}px`,
                    '--color': PALETTE[i % PALETTE.length],
                    animationDelay: `${(i % 8) * 28}ms`,
                  } as CSSProperties
                }
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
