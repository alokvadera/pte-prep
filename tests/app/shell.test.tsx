import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import { renderRoute, renderWithProviders } from '../helpers/render'
import { Seo } from '../../src/seo/Seo'
import { render } from '../../src/entry-server'

/* ---------------------------------------------------------------------------
   The app shell.

   Three things live here: the head manager, which owns the document's head;
   the client entry, which either hydrates the prerendered markup or renders
   from scratch; and the server entry, which the prerenderer calls.
   --------------------------------------------------------------------------- */

describe('Seo', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.title = ''
  })

  it('renders nothing itself', () => {
    // The head manager renders nothing, so the page and the server's markup
    // stay identical. A route is not needed for it, only a router.
    const { container } = renderWithProviders(<Seo />, { providers: false })
    expect(container.firstChild).toBeNull()
  })

  it('sets the document title for the route', () => {
    renderRoute(<Seo />, '/about')
    expect(document.title).toContain('About')
  })

  it('writes a description meta tag', () => {
    renderRoute(<Seo />, '/about')
    const description = document.head.querySelector('meta[name="description"]')
    expect(description?.getAttribute('content')).toBeTruthy()
  })

  it('writes a canonical link', () => {
    renderRoute(<Seo />, '/about')
    expect(document.head.querySelector('link[rel="canonical"]')).not.toBeNull()
  })

  it('writes structured data', () => {
    renderRoute(<Seo />, '/about')
    expect(document.head.querySelector('script[type="application/ld+json"]')).not.toBeNull()
  })

  it('replaces the tags of the previous route rather than stacking them', () => {
    const first = renderRoute(<Seo />, '/about')
    first.unmount()
    renderRoute(<Seo />, '/privacy/')

    const titles = document.head.querySelectorAll('title')
    expect(titles.length).toBeLessThanOrEqual(1)
    expect(document.head.querySelectorAll('script[type="application/ld+json"]').length).toBe(1)
  })

  it('marks its own tags so it can retire them later', () => {
    renderRoute(<Seo />, '/about')
    expect(document.head.querySelector('[data-seo]')).not.toBeNull()
  })
})

/**
 * Stubs React's client renderer so the entry can be exercised without
 * mounting the whole app — and without React reporting a hydration mismatch
 * against markup that was never prerendered.
 */
async function stubClient() {
  const createRoot = vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() }))
  const hydrateRoot = vi.fn()
  vi.doMock('react-dom/client', () => ({ createRoot, hydrateRoot }))
  return { createRoot, hydrateRoot }
}

describe('the client entry', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.resetModules()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders from scratch when the markup was not prerendered', async () => {
    const root = document.createElement('div')
    root.id = 'root'
    document.body.appendChild(root)

    const { createRoot, hydrateRoot } = await stubClient()
    await act(async () => {
      await import('../../src/main')
    })

    expect(createRoot).toHaveBeenCalledWith(root)
    expect(hydrateRoot).not.toHaveBeenCalled()
  })

  it('hydrates markup that was prerendered', async () => {
    const root = document.createElement('div')
    root.id = 'root'
    root.dataset.hydrate = 'true'
    document.body.appendChild(root)

    const { createRoot, hydrateRoot } = await stubClient()
    await act(async () => {
      await import('../../src/main')
    })

    expect(hydrateRoot).toHaveBeenCalledWith(root, expect.anything())
    expect(createRoot).not.toHaveBeenCalled()
  })

  it('refuses to start without a root element', async () => {
    await expect(import('../../src/main')).rejects.toThrow('Root element #root not found')
  })
})

describe('the server entry', () => {
  it('renders a route to static HTML', async () => {
    const result = await render('/about')

    expect(result.html).toContain('About')
    expect(result.title).toBeTruthy()
    expect(result.description).toBeTruthy()
    expect(result.canonical).toContain('/about')
    expect(result.noindex).toBe(false)
    expect(result.structuredData.length).toBeGreaterThan(0)
  })

  it('renders the 404 page for an unknown route', async () => {
    const result = await render('/nowhere', { known: false })

    expect(result.html).toContain('404')
    expect(result.noindex).toBe(true)
  })
})
