import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES } from '../domain/blueprint'
import { Seo } from '../seo/Seo'
import { ButtonLink } from '../components/ui/primitives'
import { Reveal } from '../components/ui/motion'

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
          <Reveal variant="up" duration={500}>
            {/* Display serif for the 404 as well: it is the largest single figure on the
                page and the same document voice as every other status figure.
                Mono here read as a machine counter. */}
            <p className="animate-pop font-display text-mark-600 dark:text-mark-400 text-7xl leading-none tabular-nums">
              404
            </p>
            <div
              aria-hidden="true"
              className="bg-ink-200 dark:bg-white/10 mx-auto mt-6 h-px w-24"
            />
            <h1 className="font-display text-ink-900 dark:text-white mt-6 text-2xl leading-[1.2] font-extrabold text-balance">
              This page does not exist
            </h1>
            <p className="text-ink-500 dark:text-ink-on-dark mt-3 leading-relaxed">
              The link may be out of date, or the address may have a typo. Nothing is broken on your
              side.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/" variant="primary" magnetic>
                Back to home
              </ButtonLink>
              <ButtonLink to="/mock" variant="secondary">
                Start a mock test
              </ButtonLink>
            </div>
          </Reveal>

          {/* These were three bare underlined links stacked with 48px above them and no
            container, so they read as orphaned text rather than as places to
            go. They now sit under a label, inside one bordered field, as rows
            with a visible target — the same shape as every other list of
            destinations on the site. */}
          <Reveal variant="up" delay={80} duration={500}>
            <div className="border-ink-200 dark:border-white/10 mx-auto mt-10 max-w-sm border-t pt-8">
              <p className="section-eyebrow mb-4 text-center">Or try one of these</p>
              <ul className="space-y-1">
                {DESTINATIONS.map((d) => (
                  <li key={d.to}>
                    <Link
                      to={d.to}
                      className="hover:bg-ink-100 dark:hover:bg-white/4 text-ink-700 dark:text-ink-200 hover:text-mark-700 dark:hover:text-mark-300 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors"
                    >
                      <span className="link-card">{d.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </>
  )
}
