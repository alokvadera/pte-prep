import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTest } from '../../store/useTest'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  // A finished session keeps its mock in the store so the report can read it.
  // Only an unfinished one has anything to resume.
  const activeMock = useTest(s => s.mock)
  const activeStatus = useTest(s => s.status)
  const hasActiveMock = Boolean(activeMock && activeStatus !== 'finished')

  // The element that had focus when the palette opened. Focus returns to it
  // on close, so opening a palette never strands keyboard focus in a
  // component that no longer exists.
  const lastTrigger = useRef<HTMLElement | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOpen = () => {
      lastTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setOpen(true)
    }
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (!open) {
          lastTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        }
        setOpen((o) => !o)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('open-command-palette', handleOpen)
    document.addEventListener('keydown', down)
    return () => {
      window.removeEventListener('open-command-palette', handleOpen)
      document.removeEventListener('keydown', down)
    }
  }, [open])

  // Close: hand focus back to whatever opened the palette.
  useEffect(() => {
    if (!open && lastTrigger.current) {
      lastTrigger.current.focus()
      lastTrigger.current = null
    }
  }, [open])

  // A custom overlay cannot use the native <dialog>, so the trap is
  // hand-rolled: Tab on the last focusable element wraps to the first,
  // Shift+Tab on the first wraps to the last. The background stays
  // unreachable for keyboard users, which is what `aria-modal` promises.
  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const el = dialogRef.current
    if (!el) return
    const focusables = Array.from(
      el.querySelectorAll<HTMLElement>(
        'input, button, [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((f) => !f.hasAttribute('disabled') && f.offsetParent !== null)
    if (focusables.length === 0) return
    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!open) return null

  interface Action {
    id: string
    name: string
    shortcut?: string
    run: () => void
  }

  const actions: Action[] = [
    { id: 'home', name: 'Go to Home', run: () => navigate('/') },
    { id: 'dashboard', name: 'Go to Dashboard', run: () => navigate('/dashboard') },
    { id: 'practice', name: 'Practice specific skills', run: () => navigate('/practice') },
    { id: 'mock', name: 'Start a Mock Test', run: () => navigate('/mock') },
    { id: 'format', name: 'Read the Format Guide', run: () => navigate('/format') },
    ...(hasActiveMock ? [{ id: 'resume', name: 'Resume Active Test', run: () => navigate('/test') }] : []),
  ]

  const filtered = query
    ? actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
    : actions

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        onKeyDown={trapFocus}
        className="bg-white dark:bg-ink-850 relative w-full max-w-xl overflow-hidden rounded-2xl border-2 border-ink-200 shadow-lift-lg animate-modal-enter dark:border-white/10 dark:shadow-glass-strong"
      >
        <div className="flex items-center justify-between border-b border-ink-200 bg-ink-100/60 px-4 py-2 text-xs font-semibold text-ink-500 dark:border-white/10 dark:bg-ink-950/80 dark:text-ink-on-dark-muted">
          <span id="command-palette-title">Quick actions</span>
          <span>Esc to close</span>
        </div>
        <div className="flex items-center px-4 py-3 border-b border-ink-200 dark:border-white/10">
          <svg className="w-4 h-4 text-ink-500 dark:text-ink-on-dark-muted mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <label htmlFor="command-palette-search" className="sr-only">
            Search commands
          </label>
          <input
            id="command-palette-search"
            autoFocus
            className="flex-1 bg-transparent border-0 text-ink-900 dark:text-white placeholder:text-ink-on-dark-faint font-sans text-base"
            placeholder="Type a command or jump to page..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-block border border-ink-200 dark:border-white/10 rounded-sm px-1.5 py-0.5 text-xs text-ink-500 dark:text-ink-on-dark-faint font-mono">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink-500 dark:text-ink-on-dark-faint">No results found.</p>
          ) : (
            filtered.map((action, i) => (
              <button
                key={action.id}
                className="animate-tab-enter w-full flex items-center justify-between p-3 rounded-md hover:bg-ink-50 dark:hover:bg-white/5 text-left transition-colors cursor-pointer group"
                style={{ animationDelay: `${30 + i * 35}ms` }}
                onClick={() => {
                  action.run()
                  setOpen(false)
                }}
              >
                <span className="text-ink-700 dark:text-ink-200 group-hover:text-ink-900 dark:group-hover:text-white font-medium">
                  {action.name}
                </span>
                {action.shortcut && (
                  <div className="flex gap-1 hidden sm:flex" aria-hidden="true">
                    {action.shortcut.split(' ').map(key => (
                      <kbd key={key} className="bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-on-dark-muted rounded-sm px-1.5 py-0.5 text-xs font-mono border border-ink-200 dark:border-white/5">
                        {key}
                      </kbd>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
