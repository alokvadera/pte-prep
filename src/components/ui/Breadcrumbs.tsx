import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

export interface Crumb {
  name: string
  /** Omit on the final crumb, which is the current page. */
  path?: string
}

/**
 * Visible breadcrumb trail.
 *
 * Mirrors the `BreadcrumbList` JSON-LD emitted for the same trail, so the copy a
 * user reads and the copy a crawler parses can never drift apart. The last item
 * is the current page and is marked `aria-current` rather than being a link.
 */
export function Breadcrumbs({ trail, className }: { trail: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-ink-500 dark:text-ink-400 text-sm', className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {trail.map((c, i) => {
          const last = i === trail.length - 1
          return (
            <Fragment key={`${c.name}-${i}`}>
              <li>
                {last || !c.path ? (
                  <span className={cn(last && 'text-ink-900 dark:text-white font-medium')} aria-current={last ? 'page' : undefined}>{c.name}</span>
                ) : (
                  // Padded to reach a 24px hit area without loosening the
                  // visual rhythm of the trail.
                  <Link
                    to={c.path}
                    className="hover:text-brand-600 dark:hover:text-brand-300 -m-1 inline-block rounded-sm px-1 py-1"
                  >
                    {c.name}
                  </Link>
                )}
              </li>
              {last ? null : (
                <li aria-hidden="true" className="text-ink-300 dark:text-ink-400 select-none">
                  /
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}