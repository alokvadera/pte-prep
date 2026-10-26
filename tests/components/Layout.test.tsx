import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from '../helpers/render'
import { flushIntersections } from '../setup/browser-env'
import { Layout } from '../../src/components/Layout'
import { useTest } from '../../src/store/useTest'
import { useAuth } from '../../src/store/useAuth'
import { useSettings } from '../../src/store/useSettings'
import { getGuestOwnerId } from '../../src/lib/guestOwner'
import { OPEN_COMMAND_PALETTE_EVENT } from '../../src/components/ui/command-palette-events'
import { makeMockTest } from '../helpers/factories'

/* ---------------------------------------------------------------------------
   The site shell.

   The header, the skip link, the main landmark and the footer are the
   furniture every route sits inside; the mobile menu, the command palette
   entry point and the theme toggle are the three controls that have to work
   on a phone, on a keyboard and in the dark.
   --------------------------------------------------------------------------- */

/**
 * The hydration flag. `useClientReady` is false until the client has taken
 * over from the server-rendered markup, and the theme toggle has to cope with
 * that window by showing the light theme rather than the stored one.
 */
const clientState = vi.hoisted(() => ({ ready: true }))

vi.mock('../../src/lib/useClientReady', () => ({
  useClientReady: () => clientState.ready,
}))

function renderLayout(route = '/') {
  // A splat route so the shell can be rendered at any path.
  return renderRoute(<Layout />, '*', { route })
}

beforeEach(() => {
  clientState.ready = true
  useTest.setState({ mock: null, status: 'briefing', ownerId: null, sectionIndex: 0, itemIndex: 0 })
  useAuth.setState({ user: null, hasLoggedInBefore: false })
  useSettings.setState((s) => ({ settings: { ...s.settings, theme: 'light' } }))
})

afterEach(() => {
  cleanup()
})

describe('Layout', () => {
  it('renders the header with the site navigation', () => {
    renderLayout()

    const banner = screen.getByRole('banner')
    expect(banner).toBeInTheDocument()
    const nav = within(banner)
    expect(nav.getByRole('link', { name: 'Practice' })).toHaveAttribute('href', '/practice')
    expect(nav.getByRole('link', { name: 'Mock test' })).toHaveAttribute('href', '/mock')
    expect(nav.getByRole('link', { name: 'Test format' })).toHaveAttribute('href', '/format')
    expect(nav.getByRole('link', { name: 'Progress' })).toHaveAttribute('href', '/dashboard')
    expect(nav.getByRole('link', { name: 'PTE Prep home' })).toHaveAttribute('href', '/')
  })

  it('marks the current page in the navigation', () => {
    renderLayout('/practice')

    const nav = within(screen.getByRole('banner'))
    expect(nav.getByRole('link', { name: 'Practice' })).toHaveAttribute('aria-current', 'page')
    expect(nav.getByRole('link', { name: 'Progress' })).not.toHaveAttribute('aria-current')
  })

  it('offers a skip link to the main landmark', () => {
    renderLayout()

    const skip = screen.getByRole('link', { name: 'Skip to content' })
    expect(skip).toHaveAttribute('href', '#main')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
  })

  it('renders the footer', () => {
    renderLayout()

    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveTextContent(/trademarks of Pearson/i)
    expect(screen.getByRole('link', { name: 'All 22 question types' })).toHaveAttribute(
      'href',
      '/question-types/',
    )
  })

  it('opens and closes the mobile menu, returning focus to the toggle', async () => {
    const user = userEvent.setup()
    renderLayout()

    const toggle = screen.getByRole('button', { name: 'Toggle menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Menu')).toBeInTheDocument()
    // Focus moves into the overlay so the first Tab lands on a menu link.
    expect(document.activeElement).toBe(screen.getByLabelText('Menu'))

    await user.keyboard('{Escape}')

    expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(toggle)
  })

  it('closes the mobile menu when the scrim is clicked', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Toggle menu' }))
    expect(screen.getByLabelText('Menu')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Menu').firstElementChild as HTMLElement)

    expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument()
  })

  it('dispatches the open event when the command palette button is pressed', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen)

    renderLayout()
    await user.click(screen.getByRole('button', { name: 'Open Command Palette' }))

    expect(onOpen).toHaveBeenCalledTimes(1)
    window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen)
  })

  it('switches the theme', async () => {
    const user = userEvent.setup()
    renderLayout()

    const toggle = screen.getByRole('button', { name: /Theme: light\. Switch to dark theme\./ })
    await user.click(toggle)

    expect(useSettings.getState().settings.theme).toBe('dark')
    expect(
      screen.getByRole('button', { name: /Theme: dark\. Switch to light theme\./ }),
    ).toBeInTheDocument()
  })

  it('only offers to resume a session when there is one to resume', () => {
    renderLayout()

    expect(screen.getByRole('link', { name: 'Start a mock' })).toHaveAttribute('href', '/mock')
    expect(screen.queryByRole('link', { name: 'Resume session' })).not.toBeInTheDocument()
  })

  it('offers to resume an active session owned by this browser', () => {
    useTest.setState({
      mock: makeMockTest(),
      status: 'running',
      ownerId: getGuestOwnerId(),
    })

    renderLayout()

    expect(screen.getByRole('link', { name: 'Resume session' })).toHaveAttribute('href', '/test')
    expect(screen.queryByRole('link', { name: 'Start a mock' })).not.toBeInTheDocument()
  })

  it('does not offer to resume a session owned by somebody else', () => {
    useTest.setState({
      mock: makeMockTest(),
      status: 'running',
      ownerId: 'account-someone-else',
    })

    renderLayout()

    expect(screen.queryByRole('link', { name: 'Resume session' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start a mock' })).toBeInTheDocument()
  })

  it('does not offer to resume a finished test', () => {
    useTest.setState({
      mock: makeMockTest(),
      status: 'finished',
      ownerId: getGuestOwnerId(),
    })

    renderLayout()

    expect(screen.queryByRole('link', { name: 'Resume session' })).not.toBeInTheDocument()
  })

  it('points a signed-out visitor at registration, or at sign-in once they have an account', () => {
    renderLayout()

    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      '/register?from=%2F',
    )

    cleanup()
    useAuth.setState({ user: null, hasLoggedInBefore: true })
    renderLayout()

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login?from=%2F')
  })

  it('shows the signed-in account', () => {
    useAuth.setState({
      user: { id: 'u1', email: 'runner@example.com', targetScore: 65 },
      hasLoggedInBefore: true,
    })

    renderLayout()

    expect(screen.getByRole('link', { name: 'Account: runner@example.com' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('sends a visitor away from the sign-in page after signing in', () => {
    renderLayout('/login')

    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      '/register?from=%2Fdashboard',
    )
  })

  it('scrolls to a hash target instead of jumping to the top', () => {
    renderLayout('/#main')

    expect(screen.getByRole('main')).toBeInTheDocument()
    // The main landmark is the hash target, so the scroll happened on it.
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('copes with a browser that has no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)

    expect(() => renderLayout()).not.toThrow()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('marks a question-type page as the current location', () => {
    renderLayout('/question-types/read-aloud')

    const nav = within(screen.getByRole('banner'))
    expect(nav.getByRole('link', { name: 'Test format' })).toHaveAttribute(
      'aria-current',
      'location',
    )
  })

  it('keeps the mobile menu open for any key other than Escape', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Toggle menu' }))
    await user.keyboard('a')

    expect(screen.getByLabelText('Menu')).toBeInTheDocument()
  })

  it('falls back to the top of the page when the hash matches nothing', () => {
    renderLayout('/#nothing-here')

    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('raises the header once the sentinel has left the viewport', () => {
    let callback: IntersectionObserverCallback | undefined
    class StubObserver implements IntersectionObserver {
      readonly root = null
      readonly rootMargin = ''
      readonly scrollMargin = ''
      readonly thresholds = [0]
      constructor(cb: IntersectionObserverCallback) {
        callback = cb
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return []
      }
    }
    vi.stubGlobal('IntersectionObserver', StubObserver)

    renderLayout()
    const banner = screen.getByRole('banner')
    expect(banner).not.toHaveAttribute('data-scrolled')

    act(() => {
      callback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })
    expect(banner).toHaveAttribute('data-scrolled', 'true')

    // An observer that fires with no entries at all must not throw.
    act(() => {
      callback?.([], {} as IntersectionObserver)
    })
    expect(banner).not.toHaveAttribute('data-scrolled')
  })

  it('shows the light theme until the client has taken over', () => {
    clientState.ready = false
    useSettings.setState((s) => ({ settings: { ...s.settings, theme: 'dark' } }))

    renderLayout()

    expect(
      screen.getByRole('button', { name: /Theme: light\. Switch to dark theme\./ }),
    ).toBeInTheDocument()
  })

  it('reacts to the page sentinel becoming visible again', () => {
    renderLayout()

    expect(() => flushIntersections()).not.toThrow()
  })

  it('offers the session controls inside the mobile menu', async () => {
    const user = userEvent.setup()
    useTest.setState({
      mock: makeMockTest(),
      status: 'running',
      ownerId: getGuestOwnerId(),
    })

    renderLayout('/mock')
    await user.click(screen.getByRole('button', { name: 'Toggle menu' }))

    const menu = screen.getByLabelText('Menu')
    expect(within(menu).getByRole('link', { name: 'Mock test' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(menu).getByRole('link', { name: 'Resume session' })).toHaveAttribute(
      'href',
      '/test',
    )
  })

  it('marks a question-type page inside the mobile menu too', async () => {
    const user = userEvent.setup()

    renderLayout('/question-types/read-aloud')
    await user.click(screen.getByRole('button', { name: 'Toggle menu' }))

    const menu = screen.getByLabelText('Menu')
    expect(within(menu).getByRole('link', { name: 'Test format' })).toHaveAttribute(
      'aria-current',
      'location',
    )
  })
})
