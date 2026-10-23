import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { Breadcrumbs } from '../../../src/components/ui/Breadcrumbs'
import { ActiveSessionNotice } from '../../../src/components/ui/ActiveSessionNotice'
import { CommandPalette } from '../../../src/components/ui/CommandPalette'
import { StickyCTA } from '../../../src/components/ui/sticky-cta'
import { useTest } from '../../../src/store/useTest'
import { useAuth } from '../../../src/store/useAuth'
import { getGuestOwnerId } from '../../../src/lib/guestOwner'
import { makeMockTest } from '../../helpers/factories'
import { renderWithProviders } from '../../helpers/render'

/* ---------------------------------------------------------------------------
   The shell around a page: the breadcrumb trail, the notice that offers a way
   back into a running test, the command palette, and the sticky call to
   action that rises once the hero has gone.
   --------------------------------------------------------------------------- */

/** Resets the two stores a shell component reads. */
function resetStores(): void {
  useTest.setState({
    mock: null,
    mode: 'exam',
    status: 'briefing',
    sectionIndex: 0,
    itemIndex: 0,
    ownerId: null,
  })
  useAuth.setState({ user: null })
}

describe('Breadcrumbs', () => {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Guide', path: '/guide' },
    { name: 'Scoring' },
  ]

  it('renders a link for every crumb that has a path', () => {
    renderWithProviders(<Breadcrumbs trail={trail} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Guide' })).toHaveAttribute('href', '/guide')
  })

  it('marks the last crumb as the current page', () => {
    renderWithProviders(<Breadcrumbs trail={trail} />)
    expect(screen.getByText('Scoring')).toHaveAttribute('aria-current', 'page')
  })

  it('renders a crumb with no path as plain text', () => {
    renderWithProviders(
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Guide' },
          { name: 'Detail', path: '/guide/detail' },
        ]}
      />,
    )
    expect(screen.queryByRole('link', { name: 'Guide' })).not.toBeInTheDocument()
    expect(screen.getByText('Guide')).not.toHaveAttribute('aria-current')
  })

  it('separates the crumbs with a hidden slash', () => {
    const { container } = renderWithProviders(<Breadcrumbs trail={trail} />)
    const separators = container.querySelectorAll('li[aria-hidden="true"]')
    expect(separators).toHaveLength(2)
    expect(separators[0]).toHaveTextContent('/')
  })

  it('does not separate the last crumb', () => {
    const { container } = renderWithProviders(<Breadcrumbs trail={[{ name: 'Home' }]} />)
    expect(container.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(0)
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(<Breadcrumbs trail={trail} className="mt-4" />)
    expect(container.querySelector('nav')).toHaveClass('mt-4')
  })

  it('renders an empty trail without a list', () => {
    const { container } = renderWithProviders(<Breadcrumbs trail={[]} />)
    expect(container.querySelector('ol')).toBeEmptyDOMElement()
  })
})

describe('ActiveSessionNotice', () => {
  beforeEach(() => {
    resetStores()
  })

  afterEach(() => {
    resetStores()
  })

  function startSession(overrides: Partial<ReturnType<typeof useTest.getState>> = {}) {
    useTest.setState({
      mock: makeMockTest({ title: 'Academic Mock 01' }),
      mode: 'exam',
      status: 'running',
      sectionIndex: 0,
      itemIndex: 0,
      ownerId: getGuestOwnerId(),
      ...overrides,
    })
  }

  it('renders nothing when there is no session', () => {
    const { container } = renderWithProviders(<ActiveSessionNotice />)
    expect(container.querySelector('aside')).toBeNull()
  })

  it('renders nothing once the session is finished', () => {
    startSession({ status: 'finished' })
    const { container } = renderWithProviders(<ActiveSessionNotice />)
    expect(container.querySelector('aside')).toBeNull()
  })

  it('renders nothing when the session belongs to another owner', () => {
    startSession({ ownerId: 'somebody-else' })
    const { container } = renderWithProviders(<ActiveSessionNotice />)
    expect(container.querySelector('aside')).toBeNull()
  })

  it('names the running question and the section it is in', () => {
    startSession()
    renderWithProviders(<ActiveSessionNotice />)
    expect(screen.getByText(/Question 1 of 1 in Speaking & Writing\./)).toBeInTheDocument()
  })

  it('counts the question the candidate is on', () => {
    startSession({ itemIndex: 0 })
    renderWithProviders(<ActiveSessionNotice />)
    expect(screen.getByText(/Question 1 of 1/)).toBeInTheDocument()
  })

  it('says the next section is ready during a break', () => {
    startSession({ status: 'break' })
    renderWithProviders(<ActiveSessionNotice />)
    expect(screen.getByText(/Your next section is ready\./)).toBeInTheDocument()
  })

  it('says the session is ready during the briefing', () => {
    startSession({ status: 'briefing' })
    renderWithProviders(<ActiveSessionNotice />)
    expect(screen.getByText(/Your session is ready to begin\./)).toBeInTheDocument()
  })

  it('warns that a timed session does not pause', () => {
    startSession()
    renderWithProviders(<ActiveSessionNotice />)
    expect(screen.getByText(/Timed sessions do not pause while you are away\./)).toBeInTheDocument()
  })

  it('does not warn about an untimed session', () => {
    startSession({ mock: makeMockTest({ untimed: true }) })
    renderWithProviders(<ActiveSessionNotice />)
    expect(screen.queryByText(/Timed sessions do not pause/)).not.toBeInTheDocument()
  })

  it('calls a practice run a practice drill', () => {
    startSession({ mode: 'practice' })
    renderWithProviders(<ActiveSessionNotice />)
    expect(screen.getByRole('heading', { name: /Continue your practice drill/ })).toBeInTheDocument()
  })

  it('calls an exam a mock test', () => {
    startSession({ mode: 'exam' })
    renderWithProviders(<ActiveSessionNotice />)
    expect(screen.getByRole('heading', { name: /Continue your mock test/ })).toBeInTheDocument()
  })

  it('names the mock it is offering to resume', () => {
    startSession()
    renderWithProviders(<ActiveSessionNotice />)
    expect(screen.getByText(/Academic Mock 01\./)).toBeInTheDocument()
  })

  it('offers a link back into the running test', () => {
    startSession()
    renderWithProviders(<ActiveSessionNotice />)
    expect(screen.getByRole('link', { name: 'Resume session' })).toHaveAttribute('href', '/test')
  })

  it('falls back to the break message when the section index is out of range', () => {
    startSession({ sectionIndex: 9 })
    renderWithProviders(<ActiveSessionNotice />)
    // The running branch needs a section, so a missing one drops to the
    // ready message rather than naming a question that does not exist.
    expect(screen.getByText(/Your session is ready to begin\./)).toBeInTheDocument()
  })
})

describe('CommandPalette', () => {
  function LocationProbe() {
    const location = useLocation()
    return <span data-testid="location">{location.pathname}</span>
  }

  function renderPalette() {
    return renderWithProviders(
      <>
        <CommandPalette />
        <LocationProbe />
      </>,
    )
  }

  beforeEach(() => {
    resetStores()
  })

  afterEach(() => {
    resetStores()
  })

  it('stays out of the way until it is opened', () => {
    const { container } = renderPalette()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('opens on the open-command-palette event', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens on the keyboard shortcut', () => {
    renderPalette()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens on the meta-key shortcut', () => {
    renderPalette()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('ignores the letter k without a modifier', () => {
    renderPalette()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }))
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on the keyboard shortcut when it is open', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on Escape', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('ignores Escape while it is closed', () => {
    renderPalette()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lists the standing actions', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    expect(screen.getByRole('button', { name: 'Go to Home' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Practice specific skills' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start a Mock Test' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Read the Format Guide' })).toBeInTheDocument()
  })

  it('offers to resume a test that is still running', () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    expect(screen.getByRole('button', { name: 'Resume Active Test' })).toBeInTheDocument()
  })

  it('does not offer to resume a finished test', () => {
    useTest.setState({ mock: makeMockTest(), status: 'finished' })
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    expect(screen.queryByRole('button', { name: 'Resume Active Test' })).not.toBeInTheDocument()
  })

  it('filters the actions as the query changes', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    const input = screen.getByPlaceholderText(/Type a command/)
    fireEvent.change(input, { target: { value: 'dashboard' } })
    expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go to Home' })).not.toBeInTheDocument()
  })

  it('ignores the case of the query', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    fireEvent.change(screen.getByPlaceholderText(/Type a command/), { target: { value: 'DASHBOARD' } })
    expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument()
  })

  it('says so when nothing matches', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    fireEvent.change(screen.getByPlaceholderText(/Type a command/), { target: { value: 'zzz' } })
    expect(screen.getByText('No results found.')).toBeInTheDocument()
  })

  it('navigates when an action is chosen', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    fireEvent.click(screen.getByRole('button', { name: 'Go to Dashboard' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard')
  })

  it('closes itself after an action runs', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    fireEvent.click(screen.getByRole('button', { name: 'Go to Home' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('runs the first match when the query is submitted', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    const input = screen.getByPlaceholderText(/Type a command/)
    fireEvent.change(input, { target: { value: 'mock' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByTestId('location')).toHaveTextContent('/mock')
  })

  it('does nothing when Enter is pressed with no matches', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    const input = screen.getByPlaceholderText(/Type a command/)
    fireEvent.change(input, { target: { value: 'zzz' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it.each([
    ['Practice specific skills', '/practice'],
    ['Start a Mock Test', '/mock'],
    ['Read the Format Guide', '/format'],
  ])('navigates to %s', (name, path) => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    fireEvent.click(screen.getByRole('button', { name }))
    expect(screen.getByTestId('location')).toHaveTextContent(path)
  })

  it('navigates to the running test when the resume action is chosen', () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    fireEvent.click(screen.getByRole('button', { name: 'Resume Active Test' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/test')
  })

  it('closes when the backdrop is clicked', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    // The backdrop is a mouse-only convenience, hidden from the accessibility
    // tree so a screen reader never reaches it by accident. It is therefore
    // found by its label rather than by its role.
    const backdrop = document.querySelector('button[aria-label="Close quick actions"]')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop as HTMLElement)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clears the query when it is reopened', () => {
    renderPalette()
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    fireEvent.change(screen.getByPlaceholderText(/Type a command/), { target: { value: 'mock' } })
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    expect(screen.getByPlaceholderText(/Type a command/)).toHaveValue('')
  })

  it('hands focus back to whatever opened it', () => {
    function Trigger() {
      return (
        <button type="button" onClick={() => window.dispatchEvent(new Event('open-command-palette'))}>
          Open
        </button>
      )
    }
    renderWithProviders(
      <>
        <Trigger />
        <CommandPalette />
      </>,
    )
    const trigger = screen.getByRole('button', { name: 'Open' })
    trigger.focus()
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(trigger).toHaveFocus()
  })

  it('survives being opened with nothing focused', () => {
    const active = Object.getOwnPropertyDescriptor(Document.prototype, 'activeElement')
    Object.defineProperty(document, 'activeElement', { configurable: true, get: () => null })
    try {
      renderPalette()
      act(() => {
        window.dispatchEvent(new Event('open-command-palette'))
      })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    } finally {
      if (active) Object.defineProperty(Document.prototype, 'activeElement', active)
      delete (document as unknown as { activeElement?: unknown }).activeElement
    }
  })

  it('opens from the keyboard with nothing focused', () => {
    Object.defineProperty(document, 'activeElement', { configurable: true, get: () => null })
    try {
      renderPalette()
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
      })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    } finally {
      delete (document as unknown as { activeElement?: unknown }).activeElement
    }
  })

  it('removes its listeners when it is unmounted', () => {
    const { unmount } = renderPalette()
    unmount()
    expect(() => {
      window.dispatchEvent(new Event('open-command-palette'))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    }).not.toThrow()
  })
})

describe('CommandPalette focus trap', () => {
  // jsdom has no layout, so `offsetParent` is always null and the trap would
  // never see a focusable element. Giving it the parent element restores the
  // browser's answer without touching the component.
  let descriptor: PropertyDescriptor | undefined

  beforeEach(() => {
    descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent')
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get(this: HTMLElement) {
        return this.parentElement
      },
    })
  })

  afterEach(() => {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'offsetParent', descriptor)
  })

  function openPalette() {
    renderWithProviders(<CommandPalette />)
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    return screen.getByRole('dialog')
  }

  it('wraps from the last control back to the first', () => {
    const dialog = openPalette()
    const input = screen.getByPlaceholderText(/Type a command/)
    const last = screen.getByRole('button', { name: 'Read the Format Guide' })
    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(input).toHaveFocus()
    expect(dialog).toBeInTheDocument()
  })

  it('wraps from the first control back to the last on shift-tab', () => {
    openPalette()
    const input = screen.getByPlaceholderText(/Type a command/)
    const last = screen.getByRole('button', { name: 'Read the Format Guide' })
    input.focus()
    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })

  it('ignores keys other than Tab', () => {
    openPalette()
    const input = screen.getByPlaceholderText(/Type a command/)
    input.focus()
    fireEvent.keyDown(input, { key: 'a' })
    expect(input).toHaveFocus()
  })

  it('leaves focus alone in the middle of the trap', () => {
    openPalette()
    const input = screen.getByPlaceholderText(/Type a command/)
    const home = screen.getByRole('button', { name: 'Go to Home' })
    input.focus()
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveFocus()
    expect(home).not.toHaveFocus()
  })

  it('does nothing when the trap holds no focusable element', () => {
    renderWithProviders(<CommandPalette />)
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'))
    })
    // With every control hidden there is nothing to wrap to.
    const hidden = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent')
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get: () => null,
    })
    try {
      const dialog = screen.getByRole('dialog')
      fireEvent.keyDown(dialog, { key: 'Tab' })
      expect(dialog).toBeInTheDocument()
    } finally {
      if (hidden) Object.defineProperty(HTMLElement.prototype, 'offsetParent', hidden)
    }
  })
})

describe('StickyCTA', () => {
  beforeEach(() => {
    resetStores()
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 })
  })

  afterEach(() => {
    resetStores()
  })

  it('stays hidden at the top of the page', () => {
    const { container } = renderWithProviders(<StickyCTA to="/mock" label="Start a mock" />)
    expect(container.querySelector('.sticky-cta')).not.toHaveClass('sticky-cta-on')
    expect(container.querySelector('.sticky-cta')).toHaveAttribute('aria-hidden', 'true')
  })

  it('rises once the page has been scrolled past the threshold', async () => {
    const { container } = renderWithProviders(<StickyCTA to="/mock" label="Start a mock" showAfter={600} />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 900 })
      window.dispatchEvent(new Event('scroll'))
    })
    // The scroll listener only asks for a frame, so the work happens on the
    // next one rather than on the scroll event itself.
    await waitFor(() => {
      expect(container.querySelector('.sticky-cta')).toHaveClass('sticky-cta-on')
    })
    expect(container.querySelector('.sticky-cta')).toHaveAttribute('aria-hidden', 'false')
  })

  it('takes the tab order out of the tab order while it is away', () => {
    renderWithProviders(<StickyCTA to="/mock" label="Start a mock" />)
    expect(screen.getByRole('link', { name: 'Start a mock', hidden: true })).toHaveAttribute('tabindex', '-1')
  })

  it('puts the link back in the tab order once it is showing', async () => {
    renderWithProviders(<StickyCTA to="/mock" label="Start a mock" showAfter={600} />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 900 })
      window.dispatchEvent(new Event('scroll'))
    })
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Start a mock' })).toHaveAttribute('tabindex', '0')
    })
  })

  it('links to the given destination', () => {
    renderWithProviders(<StickyCTA to="/mock" label="Start a mock" />)
    expect(screen.getByRole('link', { name: 'Start a mock', hidden: true })).toHaveAttribute('href', '/mock')
  })

  it('shows the default note', () => {
    renderWithProviders(<StickyCTA to="/mock" label="Start a mock" />)
    expect(screen.getByText('Free · no account')).toBeInTheDocument()
  })

  it('shows a custom note', () => {
    renderWithProviders(<StickyCTA to="/mock" label="Start a mock" note="No sign-up" />)
    expect(screen.getByText('No sign-up')).toBeInTheDocument()
  })

  it('bows out when the closing band arrives', async () => {
    const { container } = renderWithProviders(
      <>
        <footer data-testid="footer" />
        <StickyCTA to="/mock" label="Start a mock" showAfter={600} />
      </>,
    )
    const footer = screen.getByTestId('footer')
    footer.getBoundingClientRect = () => ({ top: 10, bottom: 100, left: 0, right: 0, width: 0, height: 90 }) as DOMRect
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 900 })
      window.dispatchEvent(new Event('scroll'))
    })
    await waitFor(() => {
      expect(container.querySelector('.sticky-cta')).not.toHaveClass('sticky-cta-on')
    })
  })

  it('stays away when the closing band is still off screen', async () => {
    const { container } = renderWithProviders(
      <>
        <footer data-testid="footer" />
        <StickyCTA to="/mock" label="Start a mock" showAfter={600} />
      </>,
    )
    const footer = screen.getByTestId('footer')
    footer.getBoundingClientRect = () => ({ top: 5000, bottom: 6000, left: 0, right: 0, width: 0, height: 1000 }) as DOMRect
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 900 })
      window.dispatchEvent(new Event('scroll'))
    })
    await waitFor(() => {
      expect(container.querySelector('.sticky-cta')).toHaveClass('sticky-cta-on')
    })
  })

  it('removes its scroll listener when it goes', () => {
    const { unmount } = renderWithProviders(<StickyCTA to="/mock" label="Start a mock" />)
    unmount()
    expect(() => window.dispatchEvent(new Event('scroll'))).not.toThrow()
  })
})
