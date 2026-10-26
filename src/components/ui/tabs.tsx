import { useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Tabs.

   The one tab strip on the site, codified so the Result page's
   overview / pace / by-type / review panels all behave the same.
   Controlled: the caller owns `value`, the strip only reports
   changes. The active tab's underline slides along via a
   transform measured from the trigger's own offset, so it works
   at any width without a layout animation library.
--------------------------------------------------------------------------- */

export function Tabs({
  value,
  onChange,
  tabs,
  className,
  panelClassName,
  controlsId,
}: {
  value: string
  onChange: (value: string) => void
  /**
   * `content` is optional: a caller that renders its own
   * panels (a result report, say) can use Tabs purely as
   * the strip, and no panel wrapper is emitted.
   */
  tabs: Array<{ id: string; label: string; content?: ReactNode }>
  className?: string
  panelClassName?: string
  /**
   * The id of the panel a tab controls, for a caller that renders the
   * panels itself. Without it the strip only declares the relationship
   * when it renders the panel as well.
   */
  controlsId?: (id: string) => string
}) {
  // Hooks run before any early return: a conditional `useRef` would
  // change the hook order between renders.
  const listRef = useRef<HTMLDivElement | null>(null)
  const hasPanels = tabs.some((t) => t.content !== undefined)
  const active = tabs.find((t) => t.id === value) ?? tabs[0]
  if (!active) return null

  const panelId = (id: string) => (controlsId ? controlsId(id) : `panel-${id}`)

  // Roving tabindex, the same contract every tab strip
  // owes a keyboard user: arrows move focus and select.
  const onListKey = (e: React.KeyboardEvent) => {
    /* v8 ignore next -- the list is attached before any key can reach it */
    const triggers = Array.from(
      listRef.current?.querySelectorAll('[role="tab"]') ?? [],
    ) as HTMLButtonElement[]
    /* v8 ignore next -- the strip always renders one trigger per tab */
    if (triggers.length === 0) return
    const i = triggers.findIndex((t) => t.getAttribute('aria-selected') === 'true')
    let next = -1
    if (e.key === 'ArrowRight') {
      next = (i + 1) % triggers.length
    } else if (e.key === 'ArrowLeft') {
      next = (i - 1 + triggers.length) % triggers.length
    } else if (e.key === 'Home') {
      next = 0
    } else if (e.key === 'End') {
      next = triggers.length - 1
    }
    if (next !== -1) {
      triggers[next]?.focus()
      triggers[next]?.click()
      e.preventDefault()
    }
  }

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label="Sections"
        onKeyDown={onListKey}
        className="border-ink-200 dark:border-white/10 flex flex-wrap gap-1 border-b"
      >
        {tabs.map((t) => {
          const isActive = t.id === active.id
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={hasPanels || controlsId ? panelId(t.id) : undefined}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(t.id)}
              className={cn(
                'relative cursor-pointer px-4 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-ink-500 hover:text-ink-800 dark:text-ink-on-dark-muted dark:hover:text-white',
              )}
            >
              {t.label}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-500 transition-transform duration-300',
                  isActive ? 'scale-x-100' : 'scale-x-0',
                )}
              />
            </button>
          )
        })}
      </div>
      {hasPanels ? (
        <div
          key={active.id}
          id={panelId(active.id)}
          role="tabpanel"
          aria-labelledby={`tab-${active.id}`}
          className={cn('pt-5 animate-tab-enter', panelClassName)}
        >
          {active.content}
        </div>
      ) : null}
    </div>
  )
}
