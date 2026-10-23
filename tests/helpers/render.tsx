import type { ReactNode } from 'react'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from './providers'
import { LocationProbe } from './LocationProbe'

/* ---------------------------------------------------------------------------
   Render helpers.

   The app's provider stack is reproduced here so a page or component is
   tested under the same conditions it ships under. Anything that needs the
   router gets a `MemoryRouter`, which is what makes `useParams`,
   `useSearchParams` and `Link` behave the way they do in the browser.
   --------------------------------------------------------------------------- */

export interface ProviderOptions {
  /** The URL the router starts at. */
  route?: string
  /** Skip the router entirely — for components that use no router hooks. */
  withoutRouter?: boolean
  /** Wrap in the ErrorBoundary / MotionConfig / ToastProvider stack. */
  providers?: boolean
  /** Options forwarded to Testing Library's `render`. */
  renderOptions?: Omit<RenderOptions, 'wrapper'>
}

export function renderWithProviders(
  ui: ReactNode,
  { route = '/', withoutRouter = false, providers = true, renderOptions }: ProviderOptions = {},
): RenderResult {
  let tree = ui
  if (providers) tree = <AppProviders>{tree}</AppProviders>
  if (!withoutRouter) tree = <MemoryRouter initialEntries={[route]}>{tree}</MemoryRouter>

  return render(tree, renderOptions)
}

/**
 * Renders a page at a route, so route params and query strings resolve the
 * way the real router resolves them.
 */
export function renderRoute(
  element: ReactNode,
  path: string,
  { route = path, providers = true, renderOptions }: ProviderOptions = {},
): RenderResult {
  let tree = (
    <>
      <Routes>
        <Route path={path} element={element} />
      </Routes>
      <LocationProbe />
    </>
  )
  if (providers) tree = <AppProviders>{tree}</AppProviders>
  tree = <MemoryRouter initialEntries={[route]}>{tree}</MemoryRouter>

  return render(tree, renderOptions)
}
