import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { ErrorBoundary } from '../../src/components/ErrorBoundary'
import { ToastProvider } from '../../src/components/ui/toast'

/**
 * The provider stack the app ships with, reproduced for tests.
 *
 * The order matters and mirrors `src/App.tsx`: the error boundary is
 * outermost, the motion config stills animations for visitors who asked for
 * that, and the toast provider owns the surface every page's notifications
 * are written into.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
    </ErrorBoundary>
  )
}
