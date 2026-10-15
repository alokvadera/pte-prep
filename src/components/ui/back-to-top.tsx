import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '../../lib/cn'
import { scrollBehavior } from '../../lib/motion'

/* ---------------------------------------------------------------------------
   BackToTop.

   A floating button that surfaces once the
   page has been scrolled past a screen or
   so, and tucks itself away again at the
   top. The rise is the house spring curve;
   the ride back up is smooth because the
   browser does the scrolling. Sits bottom-
   left, clear of the toast stack bottom-right.
--------------------------------------------------------------------------- */

const SHOW_AT = 640

export function BackToTop({ className }: { className?: string }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      setShown(window.scrollY > SHOW_AT)
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
      aria-label="Back to top"
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={cn(
        'fixed bottom-5 left-5 z-[80] flex size-11 items-center justify-center p-0 rounded-full border border-ink-200 bg-white/95 text-ink-700 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-300 hover:text-brand-700 hover:shadow-lg active:translate-y-0 active:shadow-sm dark:border-white/15 dark:bg-ink-850/95 dark:text-ink-100 dark:hover:border-white/25 dark:hover:text-brand-300',
        shown
          ? 'translate-y-0 scale-100 opacity-100'
          // `invisible` matters as much as the fade: an opacity-0 button
          // is still in the tab order, so a keyboard user would land on a
          // control they cannot see.
          : 'pointer-events-none invisible translate-y-4 scale-90 opacity-0',
        className,
      )}
    >
      <ArrowUp className="size-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
    </button>
  )
}
