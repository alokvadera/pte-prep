import { useEffect, useState } from 'react'

/* ---------------------------------------------------------------------------
   ScrollProgress.

   A hairline at the very top of the page
   that fills as the visitor reads. It is
   the site's one ambient progress signal:
   long pages (the guide, the scoring guide)
   get a sense of "how far through am I".
   The width is written on a rAF-throttled
   scroll listener, so no per-scroll re-render
   storm; only the final percentage commits.
--------------------------------------------------------------------------- */

export function ScrollProgress({ className }: { className?: string }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const p = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0
      setPct(Math.round(p * 10) / 10)
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      className={className ?? 'fixed inset-x-0 top-0 z-[90] h-0.5'}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-brand-500 via-mint-500 to-amber-400 transition-[width] duration-150 ease-out dark:from-mark-400 dark:via-mint-400 dark:to-amber-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
