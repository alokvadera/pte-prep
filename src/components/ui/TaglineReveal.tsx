import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'

/**
 * The tagline moment (skill B11).
 *
 * One large statement, sitting on its own below the hero, that resolves word by
 * word as it enters the viewport. Each word is observed individually rather than
 * fading the block as a unit, so the sentence assembles in reading order.
 *
 * `IntersectionObserver` is used instead of a scroll listener per B7 — a scroll
 * handler here would reflow on every frame for the life of the page.
 *
 * The reveal is flat: a value shift from muted ink to full ink, plus a rule that
 * draws across underneath. It stays quiet so the study dashboard's practical
 * navigation, mock choices and score information remain the visual focus.
 *
 * The server-rendered markup is the *resolved* state. Muting happens only after
 * mount, and only if motion is actually wanted — otherwise the prerendered HTML
 * would ship 30% opacity text to crawlers and to anyone without JavaScript.
 */
export function TaglineReveal({ lines, className }: { lines: string[]; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const words = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal-word]'))
    const timers: number[] = []

    const reduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Nothing to animate: leave the resolved server markup alone.
    if (reduced || typeof IntersectionObserver === 'undefined') return

    // Arm the animation. The section sits below the fold, so this muted state is
    // never on screen — it only becomes visible as it is scrolled into view.
    for (const w of words) w.dataset.active = 'false'
    const rule = root.querySelector<HTMLElement>('[data-reveal-rule]')
    if (rule) rule.dataset.armed = 'true'

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (rule) rule.dataset.revealed = 'true'
          const el = entry.target as HTMLElement
          // Staggered per word position, so the sentence resolves in reading
          // order rather than every word flipping at once.
          const delay = Number(el.dataset.revealWord ?? '0') * 42
          timers.push(
            window.setTimeout(() => {
              el.dataset.active = 'true'
            }, delay),
          )
          io.unobserve(el)
        }
      },
      { rootMargin: '0px 0px -14% 0px', threshold: 0.1 },
    )

    for (const w of words) io.observe(w)
    return () => {
      for (const t of timers) window.clearTimeout(t)
      io.disconnect()
    }
  }, [])

  let index = 0

  return (
    <div ref={rootRef} className={cn('group relative', className)}>
      <p className="font-display text-ink-900 dark:text-ink-50 max-w-[42rem] text-4xl leading-[1.14] tracking-[-0.015em] sm:text-5xl">
        {lines.map((line) => (
          <span key={line} className="block">
            {line.split(' ').map((word) => {
              const i = index++
              return (
                <span
                  key={`${word}-${i}`}
                  data-reveal-word={i}
                  data-active="true"
                  className="transition-[color] duration-700 data-[active=false]:text-ink-900/25 dark:text-ink-50 data-[active=false]:dark:text-ink-50/25"
                >
                  {word}
                  {' '}
                </span>
              )
            })}
          </span>
        ))}
      </p>

      {/* The rule that draws across as the sentence resolves. Default is drawn,
          so it is present without JavaScript; `armed` collapses it off screen
          and `revealed` draws it back as the words land. */}
      <span
        aria-hidden="true"
        data-reveal-rule=""
        className="bg-brand-500 mt-8 block h-px origin-left scale-x-100 transition-transform duration-[900ms] data-[armed=true]:scale-x-0 data-[revealed=true]:scale-x-100"
      />
    </div>
  )
}
