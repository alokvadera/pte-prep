/**
 * The Suspense fallback for the two lazily loaded routes (`/test` and
 * `/result`), which are the only parts of the app that are never prerendered.
 *
 * `fallback={null}` was correct for correctness but wrong for experience: it
 * meant a blank white screen for the length of a chunk fetch, at exactly the
 * moment the user has just pressed Start and is watching for the clock.
 *
 * The shape deliberately mirrors the test shell — a status bar and a column of
 * content — rather than a spinner, so the transition into the real view is a
 * fill rather than a swap. It uses the project's flat ruled language: a slow
 * pulse on solid blocks, no shimmer sweep, which would read as decoration.
 */
export function RouteFallback() {
  return (
    <div className="bg-ink-50 dark:bg-ink-900 flex min-h-dvh flex-col">
      {/* Status bar */}
      <div className="border-ink-200 dark:border-white/10 border-b">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
          <div className="bg-ink-200 dark:bg-white/12 h-3 w-24 animate-pulse rounded-sm" />
          <div className="ml-auto flex items-center gap-3">
            <div className="bg-ink-200 dark:bg-white/12 h-3 w-16 animate-pulse rounded-sm" />
            <div className="bg-ink-200 dark:bg-white/12 h-8 w-20 animate-pulse rounded-sm" />
          </div>
        </div>
      </div>

      {/* Question column */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="bg-ink-200 dark:bg-white/12 h-2 w-24 animate-pulse rounded-sm" />
        <div className="mt-4 space-y-3">
          {[92, 84, 78, 88, 70].map((w, i) => (
            <div
              key={i}
              className="bg-ink-200 dark:bg-white/12 h-4 animate-pulse rounded-sm"
              style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>

        <div className="border-ink-200 dark:border-white/10 mt-10 border-t pt-6">
          <div className="bg-ink-200 dark:bg-white/12 h-2 w-32 animate-pulse rounded-sm" />
          <div className="mt-4 space-y-3">
            {[80, 86, 74].map((w, i) => (
              <div
                key={i}
                className="border-ink-200 dark:border-white/10 h-11 animate-pulse rounded-lg border"
                style={{ width: `${w}%`, animationDelay: `${(i + 2) * 90}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="border-ink-200 dark:border-white/10 border-t">
        <div className="mx-auto flex h-20 max-w-4xl items-center gap-3 px-4">
          <div className="bg-ink-200 dark:bg-white/12 h-11 w-32 animate-pulse rounded-sm" />
          <div className="bg-ink-200 dark:bg-white/12 h-11 w-24 animate-pulse rounded-sm" />
        </div>
      </div>

      <p className="sr-only" role="status">
        Loading the test
      </p>
    </div>
  )
}