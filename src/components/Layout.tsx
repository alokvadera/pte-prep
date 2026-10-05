import { StrictMode, useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { useSettings, type Theme } from '../store/useSettings'
import { useAuth } from '../store/useAuth'
import { openCommandPalette } from './ui/CommandPalette'

function Logo() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-3" aria-label="PTE Prep home">
      <span className="bg-ink-900 dark:bg-white text-white dark:text-ink-900 grid size-7 place-items-center rounded-sm font-mono text-[11px] font-bold tracking-tight shadow-sm transition-transform duration-200 group-hover:scale-105">
        PTE
      </span>
      <div className="flex flex-col">
        <span className="text-ink-900 dark:text-white text-sm font-bold tracking-tight leading-none">
          PTE Prep
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-ink-500 dark:text-ink-400 leading-none mt-1">
          SYS // 01
        </span>
      </div>
    </Link>
  )
}

const NAV = [
  { to: '/practice', label: 'Practice', code: '01' },
  { to: '/mock', label: 'Mock Test', code: '02' },
  { to: '/format', label: 'Test Format', code: '03' },
  { to: '/dashboard', label: 'Telemetry', code: '04' },
]

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { settings, set } = useSettings()
  const location = useLocation()
  const user = useAuth((s) => s.user)
  const hasLoggedInBefore = useAuth((s) => s.hasLoggedInBefore)

  const authTarget = user ? '/login' : hasLoggedInBefore ? '/login' : '/register'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    setIsMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col bg-ink-50 dark:bg-ink-900">
      <a
        href="#main"
        className="bg-brand-500 focus:ring-brand-300 sr-only rounded px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100"
      >
        Skip to content
      </a>

      <header className="fixed top-3 left-3 right-3 z-40 bg-white/92 backdrop-blur-md dark:bg-ink-900/92 sm:left-1/2 sm:right-auto sm:w-[calc(100%-1.5rem)] sm:max-w-5xl sm:-translate-x-1/2 rounded-md border border-ink-200 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
        <div className="flex h-14 items-center gap-2 sm:gap-4 md:gap-6 px-4 sm:px-5">
          <Logo />
          <nav aria-label="Main navigation" className="site-nav ml-auto hidden sm:flex items-center gap-1 text-xs text-ink-700 dark:text-ink-200">
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
                      'flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium transition-all',
                      isMatch
                        ? 'bg-ink-900 text-white font-semibold shadow-xs dark:bg-white dark:text-ink-900'
                        : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100/80 dark:text-ink-300 dark:hover:text-white dark:hover:bg-white/5',
                    )
                  }
                >
                  <span className={cn('font-mono text-[10px]', isMatch ? 'opacity-80' : 'text-ink-400')}>{item.code}</span>
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="ml-auto sm:ml-0 flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={openCommandPalette}
              className="hidden md:inline-flex items-center gap-1.5 rounded border border-ink-200/90 bg-ink-100/60 px-2.5 py-1 text-xs font-mono font-medium text-ink-600 transition-all hover:border-ink-400 hover:bg-ink-200/60 hover:text-ink-900 dark:border-white/10 dark:bg-white/5 dark:text-ink-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
              title="Open Command Palette (⌘K)"
              aria-label="Open Command Palette"
            >
              <svg className="size-3 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-[10px] text-ink-500 dark:text-ink-400">⌘K</span>
            </button>

            <NavLink
              to={authTarget}
              className={cn(
                'btn-ghost rounded p-1.5 transition-colors cursor-pointer',
                user
                  ? 'text-brand-600 hover:text-brand-700 dark:text-brand-400'
                  : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white',
              )}
              title={
                user
                  ? `Signed in as ${user.email} (Account)`
                  : hasLoggedInBefore
                    ? 'Sign in to your account'
                    : 'Create a free account'
              }
              aria-label={
                user
                  ? `Account: ${user.email}`
                  : hasLoggedInBefore
                    ? 'Sign in'
                    : 'Create account'
              }
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </NavLink>
            <ThemeToggle theme={settings.theme} onChange={(t) => set('theme', t)} />
            <NavLink to="/mock" className="btn-primary rounded px-3 py-1.5 text-xs hidden sm:inline-flex">
              Run Mock
            </NavLink>
            <button 
              className="sm:hidden btn-ghost rounded-full p-2 text-ink-600 dark:text-ink-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="sm:hidden border-t border-ink-200 dark:border-white/10 px-4 py-4 flex flex-col gap-2">
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
                      'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      isMatch
                        ? 'bg-brand-500/10 text-brand-600 font-semibold dark:bg-brand-400/15 dark:text-brand-300'
                        : 'text-ink-700 hover:bg-ink-100/70 dark:text-ink-200 dark:hover:bg-white/6',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              )
            })}
            <NavLink to="/mock" className="btn-primary w-full justify-center px-4 py-2 mt-2 text-sm inline-flex">
              Start mock
            </NavLink>
          </div>
        )}
      </header>

      <main id="main" className="flex-1 pt-24 sm:pt-28">
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


function Footer() {
  return (
    <footer className="border-t border-ink-200 dark:border-white/10 mt-16 bg-white/40 dark:bg-ink-950/40">
      <div className="page-shell-wide text-ink-500 dark:text-ink-400 py-10 sm:py-12 text-sm">
        {/* Architectural Telemetry Status Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-ink-200 dark:border-white/10 pb-6 mb-8 font-mono text-[11px] text-ink-500 dark:text-ink-400 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-ink-800 dark:text-ink-200">CORE ENGINES OPERATIONAL</span>
            <span className="text-ink-300 dark:text-ink-600">·</span>
            <span>WASM v2.4</span>
          </div>
          <div className="flex items-center gap-3">
            <span>SPEC: 10–90 CONTINUOUS</span>
            <span className="text-ink-300 dark:text-ink-600">/</span>
            <span>BROWSER ISOLATED</span>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm leading-relaxed text-xs sm:text-sm">
              Free, unlimited PTE Academic practice. Everything runs in your browser by default — zero cloud lag, no account required, no
              payment step. Optional account synchronises history across devices.
            </p>
          </div>
          <div>
            <h2 className="section-eyebrow font-mono text-[11px] uppercase tracking-wider">Practice Modules</h2>
            <ul className="flex flex-col gap-1 font-mono text-xs">
              <li><FooterLink to="/mock">01 // Full Mock Tests</FooterLink></li>
              <li><FooterLink to="/practice">02 // Single-Skill Drills</FooterLink></li>
              <li><FooterLink to="/dashboard">03 // Progress Telemetry</FooterLink></li>
            </ul>
          </div>
          <div>
            <h2 className="section-eyebrow font-mono text-[11px] uppercase tracking-wider">Specification</h2>
            <ul className="flex flex-col gap-1 font-mono text-xs">
              <li><FooterLink to="/format">Test Blueprint</FooterLink></li>
              <li><FooterLink to="/question-types/">All 22 Question Types</FooterLink></li>
              <li><FooterLink to="/scoring">Scoring Mechanics</FooterLink></li>
              <li><FooterLink to="/guide">Question Type Guide</FooterLink></li>
              <li><FooterLink to="/about">About Engine</FooterLink></li>
              <li><FooterLink to="/privacy/">Privacy Policy</FooterLink></li>
            </ul>
          </div>
        </div>

        <p className="text-ink-500 dark:text-ink-400 mt-10 border-t border-ink-200 dark:border-white/10 pt-6 text-[11px] font-mono leading-relaxed">
          PTE Academic and the PTE logo are trademarks of Pearson Education Ltd. This is an independent practice tool
          and is not affiliated with, endorsed by, or sponsored by Pearson. Practice material is original and written
          specifically for this simulator. Scores produced are estimates for practice only.
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
