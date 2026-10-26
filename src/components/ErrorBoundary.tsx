import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last line of defence for the whole application.
 *
 * Everything here runs client side against local storage, so the realistic
 * failures are not network errors but corrupt or unavailable IndexedDB, a schema
 * change across deploys, or a browser refusing storage in private mode. Without
 * a boundary any of those throws during render and leaves a blank page, which is
 * the worst possible outcome: the user cannot tell whether the site is broken,
 * whether they lost their history, or what to do next.
 *
 * The fallback therefore says what happened in plain terms, offers the action
 * that actually recovers (reset local data and reload), and keeps a way back to
 * a working page. It is deliberately not dismissible, because there is nothing to
 * dismiss back into.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Deliberately local only. There is no endpoint to report to, and sending
    // anything anywhere would contradict the privacy claim made on every page.
    console.error('Unhandled render error', error, info.componentStack)
  }

  private reset = () => {
    try {
      window.localStorage.removeItem('pte-prep-settings')
      window.localStorage.removeItem('pte-prep-active-test')
      window.localStorage.removeItem('pte-prep-auth')
    } catch {
      /* storage unavailable */
    }

    const proceed = () => window.location.assign(import.meta.env.BASE_URL)

    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const req = window.indexedDB.deleteDatabase('pte-prep')
        const timer = setTimeout(proceed, 500)
        req.onsuccess = () => {
          clearTimeout(timer)
          proceed()
        }
        req.onerror = () => {
          clearTimeout(timer)
          proceed()
        }
        req.onblocked = () => {
          clearTimeout(timer)
          proceed()
        }
        return
      }
    } catch {
      /* ignore */
    }

    proceed()
  }

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    // The recovery screen sits on the same tinted ground as the 404: the two
    // screens a user reaches when something has gone wrong should look like the
    // same product as the one that worked.
    return (
      <div className="band-flush flex min-h-dvh flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <p className="section-eyebrow">Something went wrong</p>

          <h1 className="page-title">The page could not finish loading</h1>

          <p className="text-ink-600 dark:text-ink-200 mt-4 leading-relaxed">
            Your test data is stored only in this browser, so this usually means the browser could
            not read it. Clearing the local data below starts the app fresh. Anything already saved
            on this device will be lost.
          </p>

          <pre className="border-ink-200 dark:border-white/10 text-ink-500 dark:text-ink-on-dark-muted mt-6 overflow-x-auto border p-3 font-mono text-xs leading-relaxed">
            {error.message}
          </pre>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Try again
            </button>
            <button type="button" className="btn-secondary" onClick={this.reset}>
              Clear local data and start over
            </button>
          </div>

          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-6 text-sm">
            Or go back to{' '}
            <Link to="/" className="link-inline">
              the home page
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }
}
