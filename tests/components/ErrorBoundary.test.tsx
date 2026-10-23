import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ErrorBoundary } from '../../src/components/ErrorBoundary'

/* ---------------------------------------------------------------------------
   The error boundary.

   It is the last line of defence for the whole app, so the copy matters as
   much as the mechanics: the screen has to say what happened, has to offer a
   way out that actually recovers, and must not tell the user it is their
   fault. Everything here is local to the browser, so the realistic failures
   are storage failures, not network ones.
   --------------------------------------------------------------------------- */

function Boom({ error }: { error: Error }): never {
  throw error
}

function renderBoundary(ui: ReactNode) {
  return render(
    <MemoryRouter>
      <ErrorBoundary>{ui}</ErrorBoundary>
    </MemoryRouter>,
  )
}

/** A stand-in for the `IDBOpenDBRequest` the boundary awaits. */
interface FakeRequest {
  onsuccess: (() => void) | null
  onerror: (() => void) | null
  onblocked: (() => void) | null
}

function fakeRequest(): FakeRequest {
  return { onsuccess: null, onerror: null, onblocked: null }
}

let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  // React logs every error it hands to a boundary. The failure is the point of
  // the test, so the noise is silenced rather than asserted on.
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  // Vitest runs with `globals: false`, so Testing Library cannot register its
  // own automatic cleanup. Every component test file does it explicitly.
  cleanup()
  consoleError.mockRestore()
  window.localStorage.clear()
})

describe('ErrorBoundary', () => {
  it('renders its children when nothing goes wrong', () => {
    renderBoundary(<p>Everything is fine</p>)

    expect(screen.getByText('Everything is fine')).toBeInTheDocument()
    expect(screen.queryByText('The page could not finish loading')).not.toBeInTheDocument()
  })

  it('shows a recovery screen naming the cause when a child throws', () => {
    renderBoundary(<Boom error={new Error('IndexedDB could not be opened')} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'The page could not finish loading' }),
    ).toBeInTheDocument()
    // The cause is named: the raw message and the reason it matters.
    expect(screen.getByText('IndexedDB could not be opened')).toBeInTheDocument()
    expect(screen.getByText(/browser could not read it/i)).toBeInTheDocument()
    expect(screen.getByText(/stored only in this browser/i)).toBeInTheDocument()
  })

  it('does not blame the user for the failure', () => {
    renderBoundary(<Boom error={new Error('Quota exceeded')} />)

    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/your fault|you caused|you did something wrong|invalid input/i)
    expect(text).toMatch(/could not read it/i)
  })

  it('offers a retry and a way back to a working page', () => {
    renderBoundary(<Boom error={new Error('boom')} />)

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /clear local data and start over/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'the home page' })).toHaveAttribute('href', '/')
  })

  it('retries without losing the fallback when the page cannot be reloaded', async () => {
    const user = userEvent.setup()
    renderBoundary(<Boom error={new Error('boom')} />)

    // jsdom's `Location` is unforgeable, so the reload cannot be intercepted;
    // the control still has to be wired to it and must not throw.
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      screen.getByRole('heading', { name: 'The page could not finish loading' }),
    ).toBeInTheDocument()
  })

  it('clears the local data and deletes the local database', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('pte-prep-settings', '{"theme":"dark"}')
    window.localStorage.setItem('pte-prep-active-test', '{"mock":"mock-1"}')
    window.localStorage.setItem('pte-prep-auth', '{"token":"t"}')

    const request = fakeRequest()
    const deleteDatabase = vi.fn(() => request)
    vi.stubGlobal('indexedDB', { deleteDatabase })

    renderBoundary(<Boom error={new Error('boom')} />)
    await user.click(screen.getByRole('button', { name: /clear local data and start over/i }))

    expect(window.localStorage.getItem('pte-prep-settings')).toBeNull()
    expect(window.localStorage.getItem('pte-prep-active-test')).toBeNull()
    expect(window.localStorage.getItem('pte-prep-auth')).toBeNull()
    expect(deleteDatabase).toHaveBeenCalledWith('pte-prep')

    // The deletion completed, so the app restarts from scratch.
    expect(request.onsuccess).toBeTypeOf('function')
    expect(() => request.onsuccess?.()).not.toThrow()
  })

  it('still starts over when the database deletion fails or is blocked', async () => {
    const user = userEvent.setup()
    const request = fakeRequest()
    vi.stubGlobal('indexedDB', { deleteDatabase: vi.fn(() => request) })

    renderBoundary(<Boom error={new Error('boom')} />)
    await user.click(screen.getByRole('button', { name: /clear local data and start over/i }))

    expect(request.onerror).toBeTypeOf('function')
    expect(() => request.onerror?.()).not.toThrow()
    expect(request.onblocked).toBeTypeOf('function')
    expect(() => request.onblocked?.()).not.toThrow()
  })

  it('starts over when the browser has no IndexedDB at all', async () => {
    const user = userEvent.setup()
    // `vi.stubGlobal` records the original so the property is put back after
    // the test; deleting it makes `'indexedDB' in window` false, which is the
    // private-mode shape the boundary has to survive.
    vi.stubGlobal('indexedDB', undefined)
    Reflect.deleteProperty(window, 'indexedDB')

    renderBoundary(<Boom error={new Error('boom')} />)
    await user.click(screen.getByRole('button', { name: /clear local data and start over/i }))

    expect(
      screen.getByRole('heading', { name: 'The page could not finish loading' }),
    ).toBeInTheDocument()
  })

  it('starts over when the storage API refuses to answer', async () => {
    const user = userEvent.setup()
    const request = fakeRequest()
    const deleteDatabase = vi.fn(() => request)
    vi.stubGlobal('indexedDB', { deleteDatabase })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })

    renderBoundary(<Boom error={new Error('boom')} />)
    await user.click(screen.getByRole('button', { name: /clear local data and start over/i }))

    // The storage failure is swallowed — the recovery still runs.
    expect(deleteDatabase).toHaveBeenCalledWith('pte-prep')
  })

  it('starts over when deleting the database throws', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('indexedDB', {
      deleteDatabase: vi.fn(() => {
        throw new Error('database locked')
      }),
    })

    renderBoundary(<Boom error={new Error('boom')} />)
    await user.click(screen.getByRole('button', { name: /clear local data and start over/i }))

    expect(
      screen.getByRole('heading', { name: 'The page could not finish loading' }),
    ).toBeInTheDocument()
  })
})
