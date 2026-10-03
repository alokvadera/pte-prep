import { StrictMode, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { useSettings, type Theme } from '../store/useSettings'
import { useAuth } from '../store/useAuth'
import { AuthModal } from './auth/AuthModal'

function Logo() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="PTE Prep home">
      <span className="bg-brand-500 grid size-[30px] place-items-center rounded-full font-display text-micro font-bold tracking-tight text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
        PTE
      </span>
      <span className="text-ink-900 dark:text-ink-50 text-lg font-bold tracking-tight">PTE Prep</span>
    </Link>
  )
}

const NAV = [
  { to: '/practice', label: 'Practice' },
  { to: '/mock', label: 'Mock test' },
  { to: '/format', label: 'Test format' },
  { to: '/dashboard', label: 'Progress' },
]

export function Layout() {
  const { settings, set } = useSettings()
  const location = useLocation()
  const [authOpen, setAuthOpen] = useState(false)
  const user = useAuth((s) => s.user)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="bg-brand-500 focus:ring-brand-300 sr-only rounded-lg px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100"
      >
        Skip to content
      </a>

      <header className="border-ink-200 dark:border-white/10 sticky top-0 z-40 border-b bg-white/85 backdrop-blur-md pt-[env(safe-area-inset-top,0px)] dark:bg-ink-900/80">
        <div className="site-header-row page-shell-wide flex h-[72px] items-center gap-2 sm:gap-4 md:gap-6">
          <Logo />
          <nav aria-label="Main navigation" className="site-nav ml-auto flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs text-ink-700 dark:text-ink-200 sm:text-sm">
            {NAV.map((item) => {
              const isMatch = item.to === '/format'
                ? location.pathname === '/format' || location.pathname.startsWith('/question-types')
                : item.to === '/practice'
                  ? location.pathname.startsWith('/practice')
                  : location.pathname === item.to

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={
                    cn(
                      'flex items-center whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3 sm:text-sm',
                      item.label === 'Test format' && 'hidden sm:flex',
                      isMatch
                        ? 'bg-brand-500/10 text-brand-600 font-semibold dark:bg-brand-400/15 dark:text-brand-300'
                        : 'text-ink-700 hover:bg-ink-100/70 hover:text-brand-600 dark:text-ink-200 dark:hover:bg-white/6 dark:hover:text-brand-300',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <NavLink
              to="/login"
              className={cn(
                'btn-ghost rounded-full p-2 transition-colors cursor-pointer',
                user
                  ? 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'
                  : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white',
              )}
              title={user ? `Signed in as ${user.email} (Account)` : 'Sign in / Cloud Account'}
              aria-label={user ? `Account: ${user.email}` : 'Sign in or Create Account'}
            >
              <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </NavLink>
            <ThemeToggle theme={settings.theme} onChange={(t) => set('theme', t)} />
            <NavLink to="/mock" className="btn-primary px-4 py-2 text-xs sm:px-5 sm:text-sm hidden sm:inline-flex">
              Start mock
            </NavLink>
          </div>
        </div>
        <ScrollProgress />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </header>

      <main id="main" className="flex-1">
        <div key={location.pathname} className={cn('route-enter', location.pathname === '/' ? '' : 'route-inner')}>
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  )
}

function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  const next: Theme = theme === 'light' ? 'dark' : 'light'

  return (
    <button
      type="button"
      className="btn-ghost rounded-full p-2 text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
      onClick={() => onChange(next)}
      aria-label={`Theme: ${theme}. Switch to ${next} theme.`}
      title={`Theme: ${theme}. Switch to ${next}.`}
    >
      <span className="inline-block transition-transform duration-200 hover:scale-110 hover:rotate-12 active:scale-90">
        {theme === 'light' ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  )
}

/**
 * A hairline that fills with scroll position, pinned to the bottom edge of the
 * sticky header.
 *
 * The width is driven from a rAF-throttled scroll listener rather than React
 * state, so scrolling never triggers a re-render of the header (or the page
 * beneath it). The transform is written straight to the node.
 */
function ScrollProgress() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const bar = ref.current
    if (!bar) return
    let raf = 0

    const update = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const progress = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0
      bar.style.transform = `scaleX(${progress})`
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <span
      className="no-print pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden"
      aria-hidden="true"
    >
      <span
        ref={ref}
        className="bg-brand-500 dark:bg-brand-300 block h-full w-full"
        style={{ transform: 'scaleX(0)', transformOrigin: 'left' }}
      />
    </span>
  )
}

function Footer() {
  return (
    <footer className="border-ink-200 dark:border-white/10 mt-12 border-t">
      <div className="page-shell-wide text-ink-500 dark:text-ink-400 py-10 text-sm">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm leading-relaxed">
              Free, unlimited PTE Academic practice. Everything runs in your browser — no account, no upload, no
              payment.
            </p>
          </div>
          <div>
            <h2 className="section-eyebrow">Practice</h2>
            <ul className="flex flex-col gap-0.5">
              <li><FooterLink to="/mock">Full mock tests</FooterLink></li>
              <li><FooterLink to="/practice">Single-skill practice</FooterLink></li>
              <li><FooterLink to="/dashboard">Progress and history</FooterLink></li>
            </ul>
          </div>
          <div>
            <h2 className="section-eyebrow">Learn</h2>
            <ul className="flex flex-col gap-0.5">
              <li><FooterLink to="/format">PTE test format</FooterLink></li>
              <li><FooterLink to="/question-types/">All 22 question types</FooterLink></li>
              <li><FooterLink to="/scoring">How PTE scores work</FooterLink></li>
              <li><FooterLink to="/guide">Question-type tips</FooterLink></li>
              <li><FooterLink to="/about">About this tool</FooterLink></li>
              <li><FooterLink to="/privacy/">Privacy</FooterLink></li>
            </ul>
          </div>
        </div>

        <p className="text-ink-500 dark:text-ink-400 mt-8 border-t pt-6 text-xs leading-relaxed">
          PTE Academic and the PTE logo are trademarks of Pearson Education Ltd. This is an independent practice tool
          and is not affiliated with, endorsed by, or sponsored by Pearson. Practice material is original and written
          for this site. Scores produced here are estimates for practice only and are not official Pearson scores.
        </p>
      </div>
    </footer>
  )
}

/**
 * A footer link.
 *
 * The negative margin and equal positive padding keep the visual rhythm of the
 * list unchanged while lifting the hit area to 24px, which is the minimum a
 * finger needs. Without it these read as 18px-tall tap targets on a phone.
 */
function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="hover:text-brand-600 dark:hover:text-brand-300 -m-1.5 inline-block px-1.5 py-1.5 transition-colors"
    >
      {children}
    </Link>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinejoin="round" />
    </svg>
  )
}

export { StrictMode }
