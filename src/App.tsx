import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CommandPalette } from './components/ui/CommandPalette'
import { ToastProvider } from './components/ui/toast'
import { CursorGlow } from './components/ui/cursor-glow'
import { GrainOverlay } from './components/ui/grain-overlay'
import { useMagneticControls } from './components/ui/useMagneticControls'
import { RouteFallback } from './components/RouteFallback'
import { useTest } from './store/useTest'
import { useSettings } from './store/useSettings'
import { useAuth } from './store/useAuth'

// ---------------------------------------------------------------------------
// The indexable routes are imported eagerly, on purpose.
//
// They are prerendered to static HTML, and `React.lazy` suspends on its very
// first render even when the module has already been downloaded. React would
// then hydrate against a Suspense fallback instead of the markup already in the
// document and throw that markup away — which would undo the prerender. Eager
// imports keep the static HTML intact, and the content bank plus the test engine
// dominate the bundle either way, so the code-split saving is small next to the
// SEO saving.
//
// Only the two routes that run inside a test session, and are therefore never
// prerendered, stay lazy.
// ---------------------------------------------------------------------------
import Home from './pages/Home'
import MockSetup from './pages/MockSetup'
import Practice from './pages/Practice'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import TestFormat from './pages/TestFormat'
import ScoringGuide from './pages/ScoringGuide'
import Guide from './pages/Guide'
import About from './pages/About'
import Privacy from './pages/Privacy'
import QuestionTypes from './pages/QuestionTypes'
import QuestionTypePage from './pages/QuestionTypePage'
import NotFound from './pages/NotFound'
import UiElements from './pages/UiElements'
import ResetPasswordPage from './pages/ResetPasswordPage'

const TestPage = lazy(() => import('./pages/TestPage'))
const ResultPage = lazy(() => import('./pages/ResultPage'))

function FullScreen({ children }: { children?: ReactNode }) {
  return <div className="min-h-dvh">{children}</div>
}

/** Guards the runner: no test in progress means there is nothing to run. */
function TestRoute({ children }: { children?: ReactNode }) {
  const mock = useTest((s) => s.mock)
  const status = useTest((s) => s.status)

  if (!mock) return <Navigate to="/mock" replace />
  if (status === 'finished') return <Navigate to="/result" replace />
  return <div className="test-route min-h-dvh">{children}</div>
}

export default function App() {
  useMagneticControls()
  const { settings } = useSettings()
  const checkSession = useAuth((s) => s.checkSession)

  // Validate a persisted login on load and whenever the tab becomes visible
  // again, so a revoked token from a long-lived tab cannot linger.
  useEffect(() => {
    void checkSession()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkSession()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [checkSession])

  // Signals that the app is interactive. It runs as an effect so that, under
  // hydration, it fires only after React has taken over the prerendered markup
  // — the outside world (and browser-check) can trust it as "hydrated".
  useEffect(() => {
    document.documentElement.dataset.appReady = 'true'
  }, [])

  useEffect(() => {
    const dark = settings.theme === 'dark'
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.fontSize = `${16 * settings.textScale}px`

    // Keep the browser chrome on the same ground as the page. Without a system
    // theme to fall back on, this is the only signal the address bar gets.
    //
    // Read the value off the rendered element rather than hardcoding it. This
    // had drifted three ways: the inline script in index.html set #0d1117, this
    // effect set #171b20, and the actual dark ground is --color-ink-900. Any of
    // them being wrong paints an address bar that does not match the page, and
    // the value changes whenever the palette does. Reading it means the theme
    // colour is correct by construction.
    //
    // Emitted as hex rather than `rgb()`: the computed value is serialised as
    // `rgb(r, g, b)`, which is a valid theme-color, but hex is what the
    // pre-paint script in index.html writes and what the browser-check asserts
    // against, so keeping the format identical avoids a spurious mismatch at
    // the hydration boundary.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      const computed = getComputedStyle(document.body).backgroundColor
      const asHex = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      meta.setAttribute(
        'content',
        dark && asHex
          ? `#${[asHex[1], asHex[2], asHex[3]]
              .map((c) => Number(c).toString(16).padStart(2, '0'))
              .join('')}`
          : '#ffffff',
      )
    }

    const beforePrint = () => {
      document.documentElement.classList.remove('dark')
    }
    const afterPrint = () => {
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    }
    window.addEventListener('beforeprint', beforePrint)
    window.addEventListener('afterprint', afterPrint)
    return () => {
      window.removeEventListener('beforeprint', beforePrint)
      window.removeEventListener('afterprint', afterPrint)
    }
  }, [settings.theme, settings.textScale])

  return (
    // This boundary is shared by the server render and the client, so its
    // markers are identical on both sides and hydration is unaffected.
    //
    // The error boundary sits inside Suspense so that a render failure anywhere
    // in the tree — including a lazily loaded test route — resolves to a working
    // recovery page instead of a blank document.
    <ErrorBoundary>
      {/* `reducedMotion="user"` is the JS-side half of the
          reduced-motion story: the CSS blanket reset already
          stills every CSS animation, and this stills the
          transform/opacity animations that motion libraries
          drive from JavaScript. */}
      <MotionConfig reducedMotion="user">
      <ToastProvider>
        {/* Ambient layers: the cursor's pool of light and
            the whisper of grain. Both are fixed, both are
            decorative, and both sit under every interactive
            layer (dialogs, toasts, the palette). */}
        <CursorGlow />
        <GrainOverlay />
        <Suspense fallback={<RouteFallback />}>
        <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/mock" element={<MockSetup />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />
          <Route path="/format" element={<TestFormat />} />
          <Route path="/scoring" element={<ScoringGuide />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy/" element={<Privacy />} />
          <Route path="/question-types/" element={<QuestionTypes />} />
          <Route path="/question-types/:slug/" element={<QuestionTypePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/ui-elements" element={<UiElements />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          path="/test"
          element={
            <TestRoute>
              <TestPage />
            </TestRoute>
          }
        />
        <Route
          path="/result"
          element={
            <FullScreen>
              <ResultPage />
            </FullScreen>
          }
        />
      </Routes>
      </Suspense>
      <CommandPalette />
      </ToastProvider>
      </MotionConfig>
    </ErrorBoundary>
  )
}
