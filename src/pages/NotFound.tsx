import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES } from '../domain/blueprint'
import { Seo } from '../seo/Seo'
import { ButtonLink } from '../components/ui/primitives'

/**
 * The 404 keeps the empty-state shell and centre alignment — an error page is
 * one of the three places the design allows centred type — but it now uses the
 * same furniture as every other route: the one tinted band, a rule, and the
 * mono voice for the status code itself.
 */
export default function NotFound() {
  const DESTINATIONS = [
    { to: '/question-types/', label: `All ${ALL_QUESTION_TYPES.length} PTE question types` },
    { to: '/format', label: 'What the test looks like' },
    { to: '/scoring', label: 'How PTE scoring works' },
  ]

  return (
    <>
      <Seo />

      <div className="band-flush">
        <div className="page-shell-empty text-center">
          <p className="text-brand-500 dark:text-brand-300 font-mono text-5xl font-bold tabular-nums">404</p>
          <div aria-hidden="true" className="rule-gradient mx-auto mt-6 h-px w-24" />
          <h1 className="text-ink-900 dark:text-white mt-6 text-2xl font-bold tracking-tight text-balance">
            This page does not exist
          </h1>
          <p className="text-ink-500 dark:text-ink-300 mt-3 leading-relaxed">
            The link may be out of date, or the address may have a typo. Nothing is broken on your side.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/" variant="primary">
              Back to home
            </ButtonLink>
            <ButtonLink to="/mock" variant="secondary">
              Start a mock test
            </ButtonLink>
          </div>

          {/* These were three bare underlined links stacked with 48px above them and no
            container, so they read as orphaned text rather than as places to
            go. They now sit under a label, inside one bordered field, as rows
            with a visible target — the same shape as every other list of
            destinations on the site. */}
          <div className="border-ink-200 dark:border-white/10 mx-auto mt-10 max-w-sm border-t pt-8">
            <p className="section-eyebrow mb-4 justify-center">Or try one of these</p>
            <ul className="space-y-1">
              {DESTINATIONS.map((d) => (
                <li key={d.to}>
                  <Link
                    to={d.to}
                    className="hover:bg-ink-50 dark:hover:bg-white/4 text-ink-700 dark:text-ink-200 hover:text-brand-600 dark:hover:text-brand-300 flex items-center justify-between gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors"
                  >
                    <span className="link-card">{d.label}</span>
                    <span aria-hidden="true" className="text-ink-400 dark:text-ink-500 shrink-0">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
