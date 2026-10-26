import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { scrollBehavior } from '../../lib/motion'
import { useClientReady } from '../../lib/useClientReady'

/* ---------------------------------------------------------------------------
   ProgressDots / SectionMinimap.

   A high-end architectural telemetry rail docked on the right edge.
   - Resting state: An ultra-clean 38px precision instrument showing the current
     section sequence index (e.g. "04"), calibrated tick notches, luminous active
     pill marker, and live scroll percentage.
   - Hover state: Smoothly unfurls into an executive Table of Contents revealing
     two-digit sequence numbers, section titles, active pill badge, and scroll bar.
   - Portal-mounted to document.body so it is guaranteed fixed and visible in
     every section of the page.
   - Hidden below 1024px desktop width so it never crowds mobile/tablet viewports.
--------------------------------------------------------------------------- */

export function ProgressDots({
  sections,
  className,
}: {
  sections: ReadonlyArray<{ id: string; label: string }>
  className?: string
}) {
  const [active, setActive] = useState(sections[0]?.id ?? '')
  const [scrollPercent, setScrollPercent] = useState(0)
  const clientReady = useClientReady()

  useEffect(() => {
    /* v8 ignore next -- the component only runs in a browser */
    if (typeof window === 'undefined') return

    const updateActiveSection = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight
      const maxScroll = Math.max(1, docHeight - windowHeight)
      const pct = Math.min(100, Math.max(0, Math.round((scrollY / maxScroll) * 100)))
      setScrollPercent(pct)

      // 1. Top of page edge-case
      if (scrollY < 120) {
        if (sections[0]) setActive(sections[0].id)
        return
      }

      // 2. Bottom of page edge-case
      if (windowHeight + scrollY >= docHeight - 80) {
        const lastSection = sections[sections.length - 1]
        if (lastSection) setActive(lastSection.id)
        return
      }

      // 3. Scan section positions in the viewport
      const targetY = scrollY + windowHeight * 0.4
      let currentSectionId = sections[0]?.id ?? ''

      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (!el) continue
        // offsetTop is measured from the offsetParent, not the document, so
        // it is only the page position when no ancestor is positioned. The
        // rect is measured against the viewport, so the scroll offset is
        // added to get the position in the document.
        const rect = el.getBoundingClientRect()
        const top = rect.top + window.scrollY
        const height = rect.height
        if (targetY >= top && targetY < top + height) {
          currentSectionId = section.id
          break
        } else if (targetY >= top) {
          currentSectionId = section.id
        }
      }

      if (currentSectionId) {
        setActive(currentSectionId)
      }
    }

    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        updateActiveSection()
      })
    }

    updateActiveSection()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [sections])

  const currentIndex = Math.max(
    0,
    sections.findIndex((s) => s.id === active),
  )

  const content = (
    <nav
      className={cn(
        'group/rail fixed right-3.5 top-1/2 -translate-y-1/2 z-[85] hidden lg:flex flex-col',
        'w-[38px] hover:w-[196px] focus-within:w-[196px]',
        'rounded-2xl border border-ink-200/80 bg-white/85 dark:border-white/10 dark:bg-ink-900/85',
        'shadow-[0_8px_30px_rgba(45,42,94,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]',
        'backdrop-blur-xl transition-[width,box-shadow] duration-240 ease-[cubic-bezier(0.16,1,0.3,1)] select-none overflow-hidden p-1',
        className,
      )}
      aria-label="Page section navigation"
    >
      {/* Header telemetry readout */}
      <div className="flex h-6 items-center px-1 text-ink-500 dark:text-ink-on-dark-muted">
        {/* Collapsed state indicator */}
        <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-300 group-hover/rail:hidden group-focus-within/rail:hidden mx-auto">
          {String(currentIndex + 1).padStart(2, '0')}
        </span>

        {/* Expanded state title */}
        <div className="hidden group-hover/rail:flex group-focus-within/rail:flex items-center justify-between w-full px-1">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-on-dark-muted font-mono">
            Navigation
          </span>
          <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-300">
            {String(currentIndex + 1).padStart(2, '0')}
            <span className="text-ink-500 dark:text-ink-on-dark-faint">
              /{String(sections.length).padStart(2, '0')}
            </span>
          </span>
        </div>
      </div>

      <div className="my-1 h-px bg-ink-200/60 dark:bg-white/10" aria-hidden="true" />

      {/* Sections list */}
      <div className="flex flex-col gap-0.5 relative py-0.5">
        {sections.map((section, index) => {
          const isActive = active === section.id
          const seq = String(index + 1).padStart(2, '0')

          return (
            <button
              key={section.id}
              type="button"
              aria-label={`Jump to section ${index + 1}: ${section.label}`}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'group/item relative flex h-7 items-center rounded-lg transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                isActive
                  ? 'bg-brand-500/10 dark:bg-brand-400/15 text-brand-700 dark:text-brand-300 font-bold'
                  : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100/70 dark:hover:bg-white/5 hover:text-ink-900 dark:hover:text-white',
              )}
              onClick={() => {
                const el = document.getElementById(section.id)
                if (el) {
                  el.scrollIntoView({ behavior: scrollBehavior() })
                  setActive(section.id)
                }
              }}
            >
              {/* Left indicator tick (visible both collapsed and expanded) */}
              <div className="w-[30px] shrink-0 flex items-center justify-center">
                <span
                  className={cn(
                    'block rounded-full transition-all duration-160',
                    isActive
                      ? 'h-1.5 w-4 bg-brand-600 dark:bg-brand-400 ring-2 ring-brand-500/30 shadow-[0_0_8px_rgba(120,112,201,0.6)]'
                      : 'h-1 w-2 bg-ink-300 dark:bg-white/20 group-hover/item:w-3.5 group-hover/item:bg-brand-500/80',
                  )}
                  aria-hidden="true"
                />
              </div>

              {/* Expanded labels */}
              <div className="hidden group-hover/rail:flex group-focus-within/rail:flex items-center gap-2 overflow-hidden whitespace-nowrap pr-2">
                <span
                  className={cn(
                    'font-mono text-[10px] shrink-0',
                    isActive
                      ? 'text-brand-600 dark:text-brand-300 font-bold'
                      : 'text-ink-500 dark:text-ink-on-dark-muted',
                  )}
                >
                  {seq}
                </span>
                <span className="text-[12px] truncate font-medium">{section.label}</span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="my-1 h-px bg-ink-200/60 dark:bg-white/10" aria-hidden="true" />

      {/* Footer telemetry progress readout */}
      <div className="flex h-6 items-center px-1 text-ink-500 dark:text-ink-on-dark-muted">
        {/* Collapsed state scroll percentage */}
        <span className="font-mono text-[9px] font-semibold text-ink-500 dark:text-ink-on-dark-muted group-hover/rail:hidden group-focus-within/rail:hidden mx-auto tabular-nums">
          {scrollPercent}%
        </span>

        {/* Expanded state progress bar & readout */}
        <div className="hidden group-hover/rail:flex group-focus-within/rail:flex items-center gap-2 w-full px-1">
          <div className="h-1 flex-1 bg-ink-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-mint-500 transition-[width] duration-150 rounded-full"
              style={{ width: `${scrollPercent}%` }}
            />
          </div>
          <span className="font-mono text-[9.5px] font-bold text-ink-500 dark:text-ink-on-dark-muted tabular-nums shrink-0">
            {scrollPercent}%
          </span>
        </div>
      </div>
    </nav>
  )

  if (clientReady && typeof document !== 'undefined') {
    return createPortal(content, document.body)
  }

  return content
}
