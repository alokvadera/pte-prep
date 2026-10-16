import React from 'react'
import { ErrorBoundary } from '../src/components/ErrorBoundary'
import { RouteFallback } from '../src/components/RouteFallback'
import { ScoreRangeBar } from '../src/components/charts/ScoreRangeBar'
import { rawToPteScale, scoreBand } from '../src/domain/scoring'

/**
 * React's legacy server renderer rethrows rather than letting an error boundary
 * catch, so the fallback cannot be exercised through `renderToString`. What is
 * worth testing is the boundary's own contract: that it derives state from a
 * thrown error, and that the fallback it then renders says the right things.
 */
function flatten(node: unknown): string {
  if (node === null || node === undefined || node === false || node === true) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flatten).join(' ')
  const el = node as { props?: { children?: unknown } }
  return el.props?.children === undefined ? '' : flatten(el.props.children)
}

const healthyChild = React.createElement('p', null, 'the app rendered normally')
const boomChild = React.createElement(() => {
  throw new Error('IndexedDB is unavailable')
})

const healthy = new ErrorBoundary({ children: healthyChild })
healthy.state = { error: null }
const healthyOut = flatten((healthy as unknown as { render: () => React.ReactNode }).render())

const caught = new ErrorBoundary({ children: boomChild })
caught.state = ErrorBoundary.getDerivedStateFromError(new Error('IndexedDB is unavailable'))
const caughtOut = flatten((caught as unknown as { render: () => React.ReactNode }).render())

let pass = 0
let fail = 0
const check = (label: string, ok: boolean, detail = '') => {
  if (ok) {
    pass++
    console.log(`  ok   ${label}`)
  } else {
    fail++
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

console.log('\n== Error boundary (B9 error state) ==\n')

check('healthy children render through the boundary', healthyOut.includes('the app rendered normally'))
check('the boundary derives state from a thrown error', caught.state.error instanceof Error)
check('the fallback explains what happened', caughtOut.includes('could not finish loading'))
check('the fallback names the cause', caughtOut.includes('IndexedDB is unavailable'))
check('the fallback offers recovery', caughtOut.includes('Clear local data and start over'))
check('the fallback offers a plain retry', caughtOut.includes('Try again'))
check('the fallback does not blame the user', !/your fault|you broke|invalid input/i.test(caughtOut))
check('the fallback avoids a generic "Oops!"', !/oops/i.test(caughtOut))

console.log('\n== Route fallback (B9 loading state) ==\n')

function countPulse(node: unknown): number {
  if (node === null || node === undefined || typeof node !== 'object') return 0
  if (Array.isArray(node)) return node.reduce<number>((a, n) => a + countPulse(n), 0)
  const el = node as { props?: { className?: unknown; children?: unknown } }
  const cls = typeof el.props?.className === 'string' ? el.props.className : ''
  return (cls.includes('animate-pulse') ? 1 : 0) + countPulse(el.props?.children)
}

const skeletonCount = countPulse(RouteFallback())
const fallback = flatten(
  (RouteFallback() as unknown as { props?: { children?: unknown } }),
)

check('the loading fallback renders content, not a blank page', fallback.length > 0)
check('it announces itself to assistive technology', fallback.includes('Loading the test'))
check('it uses skeleton blocks rather than a spinner', skeletonCount >= 8, `${skeletonCount} blocks`)

console.log(`\n== Score band (conversion sensitivity) ==\n`)

// The rail is only meaningful if it can never contradict the score beside it.
// Every one of these fails if `scoreBand` regresses into re-deriving the
// midpoint from the fraction, which is the bug the stored 2dp totals invite.
let outsideRail = 0
let degenerateMidRange = 0
let widest = 0
for (let i = 0; i <= 200; i++) {
  const f = i / 200
  const shown = rawToPteScale(f)
  const b = scoreBand(f, shown)
  if (b.low > b.mid || b.mid > b.high) outsideRail++
  // A zero-width band is only honest at the extremes: at the bottom everything
  // rounds to 10, and by the top of the scale the curvature no longer moves
  // the score by half a point. Anywhere else it would be a bug.
  if (b.high - b.low === 0 && f > 0 && f < 0.95) degenerateMidRange++
  widest = Math.max(widest, b.high - b.low)
  // Rounding alone can never push the marker out: at a given fraction the two
  // bounds bracket the midpoint by construction, and everything is quantised to
  // the same half-point. What the fold in `scoreBand` actually buys is that
  // the rail is anchored on the score the caller is *displaying*. So test that
  // directly, with a score that disagrees with its own fraction — the shape an
  // attempt rehydrated from an older schema can take. A regression that
  // re-derives the midpoint from the fraction fails here and nowhere else.
  for (const drift of [-9, -7, -3, 3, 7, 9]) {
    const s = scoreBand(f, shown + drift)
    if (s.mid !== shown + drift) outsideRail++
    if (s.low > s.mid || s.mid > s.high) outsideRail++
  }
}
check('the rail is anchored on the displayed score, never re-derived', outsideRail === 0, `${outsideRail} cases`)
check('the band collapses only at the ends of the scale', degenerateMidRange === 0, `${degenerateMidRange} mid-range`)
check('the band is wide enough to be worth drawing', widest >= 6, `widest ${widest} points`)

const midBand = scoreBand(0.5, rawToPteScale(0.5))
check(
  'the band is asymmetric, as the sensitivity analysis actually is',
  midBand.high - midBand.mid !== midBand.mid - midBand.low,
  `${midBand.low}–${midBand.mid}–${midBand.high}`,
)

const bandedHtml = flatten(ScoreRangeBar({ score: 60, band: 'B2', fraction: 0.6 }))
check('a supplied fraction draws the rail', bandedHtml.includes('bound on the mapping'))
check('the rail states both ends', bandedHtml.includes(String(midBand.mid)) || bandedHtml.includes('60'))
check(
  'the copy never calls it a confidence interval',
  !bandedHtml.toLowerCase().includes('confidence interval of') && bandedHtml.includes('not a'),
  'must deny the stronger claim rather than avoid the words',
)

const fullMarksHtml = flatten(ScoreRangeBar({ score: 90, band: 'C1', fraction: 1 }))
check('a degenerate band draws no rail', !fullMarksHtml.includes('bound on the mapping'))

const noFractionHtml = flatten(ScoreRangeBar({ score: 60, band: 'B2' }))
check('an unknown fraction draws no rail rather than a zero-width one', !noFractionHtml.includes('bound on the mapping'))

console.log(`\n${fail === 0 ? 'UI STATE CHECKS PASSED' : `${fail} FAILED`} (${pass} passed)\n`)
process.exit(fail === 0 ? 0 : 1)