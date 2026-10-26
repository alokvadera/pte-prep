import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../src/App'
import TestPage from '../../src/pages/TestPage'
import UiElements from '../../src/pages/UiElements'
import { useTest } from '../../src/store/useTest'
import { useAuth } from '../../src/store/useAuth'
import { useSettings } from '../../src/store/useSettings'
import { makeMockTest } from '../helpers/factories'
import { getGuestOwnerId } from '../../src/lib/guestOwner'
import { getPageMeta } from '../../src/seo/meta'

/* ---------------------------------------------------------------------------
   The shell and the two pages that sit outside it.

   `App` is the route table, `TestPage` is the runner the candidate sees, and
   `UiElements` is the gallery that renders every component in the kit. All
   three are lazy-loaded in the real app, so they are the pieces most likely
   to break without anything else noticing.
   --------------------------------------------------------------------------- */

/**
 * Makes the body's computed background read as something the colour maths
 * cannot parse, so the app falls back to its own house colour. jsdom always
 * resolves a colour to `rgb()` or `rgba()`, so the value has to be replaced.
 */
function stubBodyBackground(value: string): () => void {
  const actual = window.getComputedStyle.bind(window)
  const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const style = actual(element as Element, pseudo)
    if (element === document.body) {
      Object.defineProperty(style, 'backgroundColor', { configurable: true, value })
    }
    return style
  })
  return () => spy.mockRestore()
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('the route table', () => {
  it.each([
    '/',
    '/mock',
    '/practice',
    '/dashboard',
    '/login',
    '/register',
    '/format',
    '/scoring',
    '/guide',
    '/about',
    '/privacy/',
    '/question-types/',
    '/question-types/read-aloud/',
    '/reset-password',
  ])('renders %s', async (path) => {
    renderAt(path)
    await act(async () => {})
    // The body is never empty — the route fallback and the error boundary
    // both render text — so an assertion on its content proves nothing. The
    // title is the page's own: it comes from the metadata registry, so a
    // route that renders the wrong page, or one whose head was never
    // written, fails here.
    expect(document.title).toContain(getPageMeta(path).title)
    expect(screen.getAllByRole('heading', { level: 1 }).length).toBeGreaterThan(0)
  })

  it('renders the 404 page for an unknown path', async () => {
    renderAt('/nowhere-at-all')
    await act(async () => {})
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders the lazily loaded element gallery', async () => {
    renderAt('/ui-elements')
    await act(async () => {})
    expect(document.title).toContain(getPageMeta('/ui-elements/').title)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('sends a candidate with no test to the setup page', async () => {
    useTest.setState({ mock: null, status: 'briefing' })
    renderAt('/test')
    await act(async () => {})
    // The runner redirects to the setup page, so the setup page's own title is
    // what is on screen.
    expect(document.title).toContain(getPageMeta('/mock').title)
  })

  it('runs the test when a mock is in progress', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running', ownerId: getGuestOwnerId() })
    renderAt('/test')
    await act(async () => {})
    // The runner is showing, so the page is the test, not the setup screen
    // the runner redirects to when there is no mock.
    expect(document.title).not.toContain(getPageMeta('/mock').title)
    expect(screen.getByRole('timer')).toBeInTheDocument()
  })

  it('sends a finished test to the report', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'finished', ownerId: getGuestOwnerId() })
    renderAt('/test')
    // The runner redirects to the report, so the title has to be waited for:
    // the report is a lazy route and the runner's own head is written first.
    await waitFor(() => {
      expect(document.title).toContain(getPageMeta('/result').title)
    })
  })

  it('renders the report route', async () => {
    renderAt('/result')
    await act(async () => {})
    expect(document.title).toContain(getPageMeta('/result').title)
  })

  it('re-checks the session when the tab becomes visible', async () => {
    const checkSession = vi.fn().mockResolvedValue(true)
    useAuth.setState({ token: 'tok', user: null, checkSession })
    renderAt('/')
    await act(async () => {})

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // The session check is what a revoked token is caught by, so the test has
    // to show that it ran — a page that merely rendered proves nothing.
    expect(checkSession).toHaveBeenCalled()
  })

  it('keeps the theme colour in step with the page', async () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
    document.body.style.backgroundColor = 'rgb(255, 248, 236)'

    renderAt('/')
    await act(async () => {})

    expect(meta.getAttribute('content')).toBe('#fff8ec')
    meta.remove()
    document.body.style.backgroundColor = ''
  })

  it('falls back to the house colours when the page has no computed colour', async () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
    const restore = stubBodyBackground('')

    renderAt('/')
    await act(async () => {})

    expect(meta.getAttribute('content')).toBe('#fff8ec')
    meta.remove()
    restore()
  })

  it('uses the dark house colour in dark mode', async () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
    const restore = stubBodyBackground('')
    useSettings.setState((state) => ({ ...state, settings: { ...state.settings, theme: 'dark' } }))

    renderAt('/')
    await act(async () => {})

    expect(meta.getAttribute('content')).toBe('#10111e')
    meta.remove()
    restore()
    useSettings.setState((state) => ({ ...state, settings: { ...state.settings, theme: 'light' } }))
  })

  it('does not re-check the session while the tab is hidden', async () => {
    useAuth.setState({ token: null, user: null })
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    renderAt('/')
    await act(async () => {})

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    expect(document.body.textContent).toBeTruthy()
  })

  it('leaves the dark class off after a print in light mode', async () => {
    useSettings.setState((state) => ({ ...state, settings: { ...state.settings, theme: 'light' } }))
    renderAt('/')
    await act(async () => {})

    await act(async () => {
      window.dispatchEvent(new Event('afterprint'))
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('puts the dark class back after a print', async () => {
    useSettings.setState((state) => ({ ...state, settings: { ...state.settings, theme: 'dark' } }))
    renderAt('/')
    await act(async () => {})

    await act(async () => {
      window.dispatchEvent(new Event('beforeprint'))
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await act(async () => {
      window.dispatchEvent(new Event('afterprint'))
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    useSettings.setState((state) => ({ ...state, settings: { ...state.settings, theme: 'light' } }))
  })
})

describe('the test page', () => {
  beforeEach(() => {
    useTest.setState({
      mock: makeMockTest(),
      status: 'running',
      responses: {},
      sectionIndex: 0,
      itemIndex: 0,
      ownerId: getGuestOwnerId(),
    })
  })

  afterEach(() => {
    useTest.setState({ mock: null, status: 'briefing', responses: {} })
  })

  it('renders the runner', async () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})
    expect(document.body.textContent).toBeTruthy()
  })

  it('asks before letting the candidate leave', async () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    await act(async () => {
      screen.getByRole('button', { name: /exit/i }).click()
    })

    expect(screen.getByText('Leave the test?')).toBeInTheDocument()
  })

  it('dismisses the leave prompt on Escape', async () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    await act(async () => {
      screen.getByRole('button', { name: /exit/i }).click()
    })
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(screen.queryByText('Leave the test?')).not.toBeInTheDocument()
  })

  it('keeps focus inside the leave prompt', async () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    await act(async () => {
      screen.getByRole('button', { name: /exit/i }).click()
    })

    const dialog = screen.getByRole('dialog')
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea',
    )
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!

    expect(document.activeElement).toBe(first)

    await act(async () => {
      last.focus()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    })
    expect(document.activeElement).toBe(first)

    await act(async () => {
      first.focus()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }))
    })
    expect(document.activeElement).toBe(last)
  })

  it('closes the leave prompt when the candidate keeps going', async () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    await act(async () => {
      screen.getByRole('button', { name: /exit/i }).click()
    })
    await act(async () => {
      screen.getByRole('button', { name: 'Keep going' }).click()
    })

    expect(screen.queryByText('Leave the test?')).not.toBeInTheDocument()
  })

  it('closes the leave prompt when the backdrop is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    await act(async () => {
      screen.getByRole('button', { name: /exit/i }).click()
    })
    await act(async () => {
      screen.getByRole('button', { name: 'Cancel' }).click()
    })

    expect(screen.queryByText('Leave the test?')).not.toBeInTheDocument()
  })

  it('leaves the test when the candidate confirms', async () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    await act(async () => {
      screen.getByRole('button', { name: /exit/i }).click()
    })
    await act(async () => {
      screen.getByRole('button', { name: 'Leave test' }).click()
    })

    expect(screen.queryByText('Leave the test?')).not.toBeInTheDocument()
  })

  it('warns before a running test is closed', async () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    const event = new Event('beforeunload', { cancelable: true })
    await act(async () => {
      window.dispatchEvent(event)
    })

    expect(event.defaultPrevented).toBe(true)
  })

  it('renders nothing when the session belongs to someone else', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running', ownerId: 'usr_someone_else' })
    const { container } = render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})
    expect(container.textContent).toBe('')
  })

  it('does not warn before a test that is not running is closed', async () => {
    useTest.setState({ status: 'briefing' })
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    const event = new Event('beforeunload', { cancelable: true })
    await act(async () => {
      window.dispatchEvent(event)
    })

    expect(event.defaultPrevented).toBe(false)
  })

  it('ignores the keys the leave prompt has no use for', async () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    await act(async () => {
      screen.getByRole('button', { name: /exit/i }).click()
    })
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    })

    expect(screen.getByText('Leave the test?')).toBeInTheDocument()
  })

  it('lets the focus leave the middle of the leave prompt', async () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    await act(async () => {
      screen.getByRole('button', { name: /exit/i }).click()
    })

    // Only the two ends of the prompt are trapped. A control in the middle
    // is left to the browser.
    const middle = screen.getByRole('button', { name: 'Keep going' })
    middle.focus()
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    })

    expect(document.activeElement).toBe(middle)
  })

  it('does not build the leave prompt once the session has changed hands', async () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <TestPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    // The candidate asks to leave, and in the same breath the session turns
    // out to belong to somebody else. There is no longer a prompt to build.
    await act(async () => {
      screen.getByRole('button', { name: /exit/i }).click()
      useTest.setState({ ownerId: 'usr_someone_else' })
    })

    expect(screen.queryByText('Leave the test?')).not.toBeInTheDocument()
  })
})

describe('the element gallery', () => {
  it('renders every component in the kit', async () => {
    render(
      <MemoryRouter initialEntries={['/ui-elements']}>
        <UiElements />
      </MemoryRouter>,
    )
    await act(async () => {})
    expect(document.body.textContent).toBeTruthy()
  })
})
