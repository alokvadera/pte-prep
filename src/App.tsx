import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RouteFallback } from './components/RouteFallback'
import { useTest } from './store/useTest'

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
import TestFormat from './pages/TestFormat'
import ScoringGuide from './pages/ScoringGuide'
import Guide from './pages/Guide'
import About from './pages/About'
import Privacy from './pages/Privacy'
import QuestionTypes from './pages/QuestionTypes'
import QuestionTypePage from './pages/QuestionTypePage'
import NotFound from './pages/NotFound'

const TestPage = lazy(() => import('./pages/TestPage'))
const ResultPage = lazy(() => import('./pages/ResultPage'))

function FullScreen({ children }: { children?: ReactNode }) {
  return <div className="min-h-dvh">{children}</div>
}

/** Guards the runner: no test in progress means there is nothing to run. */
function TestRoute({ children }: { children?: ReactNode }) {
  const mock = useTest((s) => s.mock)
  const status = useTest((s) => s.status)
  const navigate = useNavigate()

  if (!mock) {
    navigate('/mock', { replace: true })
    return <FullScreen />
  }
  if (status === 'finished') return <Navigate to="/result" replace />
  return <FullScreen>{children}</FullScreen>
}

export default function App() {
  // Signals that the app is interactive. It runs as an effect so that, under
  // hydration, it fires only after React has taken over the prerendered markup
  // — the outside world (and browser-check) can trust it as "hydrated".
  useEffect(() => {
    document.documentElement.dataset.appReady = 'true'
  }, [])

  return (
    // This boundary is shared by the server render and the client, so its
    // markers are identical on both sides and hydration is unaffected.
    //
    // The error boundary sits inside Suspense so that a render failure anywhere
    // in the tree — including a lazily loaded test route — resolves to a working
    // recovery page instead of a blank document.
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/mock" element={<MockSetup />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/format" element={<TestFormat />} />
          <Route path="/scoring" element={<ScoringGuide />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy/" element={<Privacy />} />
          <Route path="/question-types/" element={<QuestionTypes />} />
          <Route path="/question-types/:slug/" element={<QuestionTypePage />} />
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
    </ErrorBoundary>
  )
}
