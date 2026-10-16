import { StrictMode, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { useSettings, type Theme } from '../store/useSettings'
import { useAuth } from '../store/useAuth'
import { useTest } from '../store/useTest'
import { useClientReady } from '../lib/useClientReady'
import { scrollBehavior } from '../lib/motion'
import { openCommandPalette } from './ui/command-palette-events'
import { Magnetic } from './ui/motion'
import { ScrollProgress } from './ui/scroll-progress'
import { BackToTop } from './ui/back-to-top'

function Logo({ tone = 'default' }: { tone?: 'default' | 'onDark' }) {
  return (
    <Link
      to="/"
      className={cn(
        'group flex shrink-0 items-center gap-[9px] rounded-full py-2 pr-[18px] pl-[14px] transition-colors',
        tone === 'onDark'
          ? 'bg-white text-ink-900 dark:bg-white/10 dark:text-white dark:border dark:border-white/10 dark:hover:bg-white/15'
          : 'bg-ink-900 text-white dark:bg-white/10 dark:text-white dark:border dark:border-white/10 dark:hover:bg-white/15',
      )}
      aria-label="PTE Prep home"
    >
      <span className="size-[11px] shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
      <span className="font-display text-[21px] leading-relaxed font-extrabold tracking-tight">
        PTE Prep
      </span>
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuToggleRef = useRef<HTMLButtonElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const { settings, set } = useSettings()
  const location = useLocation()
  const user = useAuth((s) => s.user)
  const hasLoggedInBefore = useAuth((s) => s.hasLoggedInBefore)
  const activeMock = useTest((s) => s.mock)
  const activeStatus = useTest((s) => s.status)
  const clientReady = useClientReady()
  const hasActiveSession = clientReady && Boolean(activeMock && activeStatus !== 'finished')

  const currentRoute = location.pathname.replace(/\/+$/, '') || '/'
  const currentPath = `${location.pathname}${location.search}${location.hash}`
  const returnPath = /^\/(login|register)\/?$/.test(location.pathname) ? '/dashboard' : currentPath
  const authTarget = user
    ? '/login'
    : `${hasLoggedInBefore ? '/login' : '/register'}?from=${encodeURIComponent(returnPath)}`

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setIsMenuOpen(false)
  }, [currentPath])

  useEffect(() => {
    if (location.hash) {
      try {
        const el = document.querySelector(location.hash)
        if (el) {
          el.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
          return
        }
      } catch {
        // Ignore malformed hash selectors (e.g. '#' or invalid CSS ID syntax)
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    // Client-side navigation swaps the screen without a reload, so the
    // change is announced by hand: focus moves to the new view's main
    // landmark, which tells a screen-reader user the page changed.
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname, location.hash])

  // Escape closes the mobile menu and hands focus back to the toggle
  // that opened it, so keyboard users are never stranded in the overlay.
  useEffect(() => {
    if (!isMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
        menuToggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isMenuOpen])

  // Opening the menu moves focus inside it, onto the overlay itself,
  // so the first Tab lands on the first menu link rather than on the
  // page behind the scrim.
  useEffect(() => {
    if (isMenuOpen) {
      mobileNavRef.current?.focus()
    }
  }, [isMenuOpen])

  // The header earns a shadow once the page has moved under it. The state comes
  // from an IntersectionObserver on a sentinel at the very top of the document,
  // never a scroll listener — the same rule as every other motion here.
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(entry ? !entry.isIntersecting : false),
      { rootMargin: '-6px 0px 0px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-ink-50 dark:bg-ink-900">
      {/* The scroll-progress hairline: a two-pixel band at the
          document's top edge that fills as the page scrolls. */}
      <ScrollProgress />
      {/* The scroll sentinel: one pixel of flow at the document's top, with its
          height cancelled by a negative margin, so the header can tell whether
          anything has scrolled past it without moving the page. */}
      <div ref={sentinelRef} aria-hidden="true" className="-mb-px h-px w-full" />
      <a
        href="#main"
        className="bg-brand-500 focus:ring-brand-300 sr-only rounded px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100"
      >
        Skip to content
      </a>

      <header
        data-scrolled={scrolled ? 'true' : undefined}
        className="site-header border-ink-200 bg-ink-50/80 dark:border-white/10 dark:bg-ink-900/80 sticky top-0 z-40 border-b-2 backdrop-blur-xl backdrop-saturate-180 transition-all duration-500"
      >
        <nav className="page-shell-wide">
          <div className="flex items-center gap-2 py-3.5 sm:gap-4 md:gap-6">
            <Logo />
            <div className="ml-auto hidden items-center gap-1 lg:flex">
              {NAV.map((item) => {
                const isMatch = item.to === '/format'
                  ? currentRoute === '/format' || currentRoute.startsWith('/question-types')
                  : item.to === '/practice'
                    ? currentRoute.startsWith('/practice')
                    : currentRoute === item.to

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={isMatch ? (location.pathname.startsWith('/question-types') ? 'location' : 'page') : undefined}
                    className={cn(
                      /* Pill nav — lavender wash on hover, mint when current,
                         the same active/hover language as the playful mockup. */
                      'flex items-center whitespace-nowrap rounded-full px-[15px] py-[9px] text-[15px] font-bold transition-colors duration-200',
                      isMatch
                        ? 'bg-mint-500/15 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300 dark:border dark:border-mint-500/30'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-mark-700 dark:text-ink-on-dark dark:hover:bg-white/8 dark:hover:text-mark-300',
                    )}
                  >
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="ml-auto sm:ml-0 flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={openCommandPalette}
                className="border-ink-200 text-ink-500 hover:border-ink-400 hover:text-ink-900 dark:border-white/10 dark:text-ink-on-dark dark:hover:text-ink-50 hidden cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors md:inline-flex"
                title="Open Command Palette (⌘K)"
                aria-label="Open Command Palette"
              >
                <svg className="size-3 text-ink-500 dark:text-ink-on-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-xs text-ink-500 dark:text-ink-on-dark-muted">⌘K</span>
              </button>

              <NavLink
                to={authTarget}
                className={cn(
                  'btn-ghost rounded-full p-2 transition-colors cursor-pointer',
                  user
                    ? 'text-ink-900 dark:text-ink-50'
                    : 'text-ink-600 hover:text-ink-900 dark:text-ink-on-dark dark:hover:text-white',
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
              <Magnetic className="hidden lg:inline-flex">
                <NavLink to={hasActiveSession ? '/test' : '/mock'} className="btn-primary px-5 py-[11px] text-[14.5px]">
                  {hasActiveSession ? 'Resume session' : 'Start a mock'}
                </NavLink>
              </Magnetic>
              <button
                ref={menuToggleRef}
                className="menu-toggle lg:hidden text-ink-500 dark:text-ink-on-dark"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-nav"
              >
                {/* Hamburger to X. Lines rotate and translate into a cross,
                    never simply vanish. */}
                <span className={cn('menu-line', isMenuOpen && 'menu-open')} />
                <span className={cn('menu-line', isMenuOpen && 'menu-open')} />
                <span className={cn('menu-line', isMenuOpen && 'menu-open')} />
              </button>
            </div>
          </div>

          {/* Modal expansion. The menu opens as a screen filling overlay with a
              heavy glass effect, and the links stagger in from below. */}
          {isMenuOpen && (
            <div
              id="mobile-nav"
              ref={mobileNavRef}
              tabIndex={-1}
              aria-label="Menu"
              className="lg:hidden fixed inset-x-0 top-14 bottom-0 z-50 animate-fade-in overflow-y-auto outline-none"
            >
              {/* Heavy glass scrim */}
              <div
                className="fixed inset-0 -z-10 bg-ink-50/90 backdrop-blur-3xl dark:bg-ink-950/90"
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="page-shell-wide flex flex-col gap-2 py-8">
                {NAV.map((item, index) => {
                  const isMatch = item.to === '/format'
                    ? currentRoute === '/format' || currentRoute.startsWith('/question-types')
                    : item.to === '/practice'
                      ? currentRoute.startsWith('/practice')
                      : currentRoute === item.to

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-current={isMatch ? (location.pathname.startsWith('/question-types') ? 'location' : 'page') : undefined}
                      className={cn(
                        /* Staggered mask reveal: each link fades in and slides
                           up from an invisible box, staggered per item. */
                        'flex items-center rounded-2xl px-4 py-3 text-lg font-bold transition-all duration-200',
                        'animate-blur-in',
                        isMatch
                          ? 'bg-mint-500/15 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300 dark:border dark:border-mint-500/30'
                          : 'text-ink-600 hover:bg-ink-100/70 hover:text-mark-700 dark:text-ink-on-dark dark:hover:bg-white/6 dark:hover:text-mark-300',
                      )}
                      style={{ animationDelay: `${60 + index * 40}ms` }}
                    >
                      {item.label}
                    </Link>
                  )
                })}
                <NavLink
                  to={hasActiveSession ? '/test' : '/mock'}
                  className="btn-primary w-full justify-center px-4 py-3 mt-4 text-base inline-flex animate-blur-in"
                  style={{ animationDelay: `${60 + NAV.length * 40 + 30}ms` }}
                >
                  {hasActiveSession ? 'Resume session' : 'Start mock'}
                </NavLink>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <div key={location.pathname} className={cn('route-enter', location.pathname === '/' ? '' : 'route-inner')}>
          <Outlet />
        </div>
      </main>

      <Footer />

      {/* The floating return-to-top button, bottom-left, clear of the
          toast stack bottom-right. */}
      <BackToTop />
    </div>
  )
}

function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  const ready = useClientReady()
  const currentTheme = ready ? theme : 'light'
  const next: Theme = currentTheme === 'light' ? 'dark' : 'light'

  return (
    <button
      type="button"
      className="btn-ghost text-ink-600 hover:text-mark-700 dark:text-ink-on-dark dark:hover:text-mark-300 rounded-full p-2"
      onClick={() => onChange(next)}
      aria-label={`Theme: ${currentTheme}. Switch to ${next} theme.`}
      title={`Theme: ${currentTheme}. Switch to ${next}.`}
    >
      <span className="inline-block transition-transform duration-200 hover:scale-110 hover:rotate-12 active:scale-90">
        {currentTheme === 'light' ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  )
}


function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-on-dark mt-16">
      <div className="page-shell-wide pt-12 pb-20 text-sm sm:pt-14 sm:pb-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo tone="onDark" />
            <p className="text-ink-on-dark-muted mt-4 max-w-sm text-xs leading-relaxed sm:text-sm">
              Free, unlimited PTE Academic practice. Everything runs in your browser, so there is
              no account to create and no payment step. An optional account syncs your history
              between devices.
            </p>
          </div>
          <div>
            <h2 className="text-amber-300 font-display text-xs font-extrabold tracking-wide uppercase">
              Practice
            </h2>
            <ul className="mt-3 flex flex-col gap-1 text-xs">
              <li><FooterLink to="/mock">Full mock tests</FooterLink></li>
              <li><FooterLink to="/practice">Single-skill drills</FooterLink></li>
              <li><FooterLink to="/dashboard">Progress history</FooterLink></li>
            </ul>
          </div>
          <div>
            <h2 className="text-amber-300 font-display text-xs font-extrabold tracking-wide uppercase">
              Reference
            </h2>
            <ul className="mt-3 flex flex-col gap-1 text-xs">
              <li><FooterLink to="/format">Test format</FooterLink></li>
              <li><FooterLink to="/question-types/">All 22 question types</FooterLink></li>
              <li><FooterLink to="/scoring">How scoring works</FooterLink></li>
              <li><FooterLink to="/guide">Question type guide</FooterLink></li>
              <li><FooterLink to="/about">About</FooterLink></li>
              <li><FooterLink to="/privacy/">Privacy policy</FooterLink></li>
            </ul>
          </div>
        </div>

        <p className="text-ink-on-dark-muted mt-10 border-t border-white/15 pt-6 text-xs leading-relaxed">
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
      className="hover:text-amber-300 -m-1.5 inline-block px-1.5 py-1.5 transition-colors"
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
