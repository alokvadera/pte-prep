import React from 'react'
import { ErrorBoundary } from '../src/components/ErrorBoundary'
import { RouteFallback } from '../src/components/RouteFallback'

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

console.log(`\n${fail === 0 ? 'UI STATE CHECKS PASSED' : `${fail} FAILED`} (${pass} passed)\n`)
process.exit(fail === 0 ? 0 : 1)