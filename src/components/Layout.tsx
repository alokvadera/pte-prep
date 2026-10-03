import { StrictMode, useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { useSettings, type Theme } from '../store/useSettings'

function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="PTE Prep home">
      <span className="bg-brand-500 grid size-[30px] place-items-center rounded-full font-display text-micro font-bold tracking-tight text-white">
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

      <header className="border-ink-200 dark:border-white/10 sticky top-0 z-40 border-b bg-white/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)] dark:bg-ink-900/95">
        <div className="site-header-row page-shell-wide flex h-[72px] items-center gap-6">
          <Logo />
          <nav aria-label="Main navigation" className="site-nav ml-auto flex items-center gap-1 sm:gap-2 text-xs text-ink-700 dark:text-ink-200 sm:text-sm">
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
                      'flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:text-sm',
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

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle theme={settings.theme} onChange={(t) => set('theme', t)} />
            <NavLink to="/mock" className="btn-primary px-5 py-2 text-sm hidden sm:inline-flex">
              Start mock
            </NavLink>
          </div>
        </div>
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
      <span className="inline-block transition-transform duration-200 active:scale-90">
        {theme === 'light' ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
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
            <h2 className="text-ink-900 dark:text-white mb-2.5 text-sm font-semibold text-balance">Practice</h2>
            <ul className="flex flex-col gap-0.5">
              <li><FooterLink to="/mock">Full mock tests</FooterLink></li>
              <li><FooterLink to="/practice">Single-skill practice</FooterLink></li>
              <li><FooterLink to="/dashboard">Progress and history</FooterLink></li>
            </ul>
          </div>
          <div>
            <h2 className="text-ink-900 dark:text-white mb-2.5 text-sm font-semibold text-balance">Learn</h2>
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
