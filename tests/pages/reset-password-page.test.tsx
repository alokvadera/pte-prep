import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { installFetchMock } from '../helpers/fetch'
import ResetPasswordPage from '../../src/pages/ResetPasswordPage'
import { useAuth } from '../../src/store/useAuth'

/* ---------------------------------------------------------------------------
   The password reset.

   Four things have to hold: a link without a token is refused, the two
   passwords have to match, a failed reset says so, and a successful one
   signs the candidate in and sends them to their dashboard.
   --------------------------------------------------------------------------- */

const RESET_URL = '/api/auth/reset-password'

function renderReset(route = '/reset-password?token=abc') {
  return renderRoute(<ResetPasswordPage />, '/reset-password', { route })
}

async function fill(form: HTMLFormElement, password: string, confirm: string) {
  const pw = form.querySelector('#new-password') as HTMLInputElement
  const cp = form.querySelector('#confirm-new-password') as HTMLInputElement
  await act(async () => {
    fireEvent.change(pw, { target: { value: password } })
    fireEvent.change(cp, { target: { value: confirm } })
  })
  await act(async () => {
    fireEvent.submit(form)
  })
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    useAuth.setState({ user: null, token: null, expiresAt: null, error: null })
  })

  it('refuses a link that carries no token', () => {
    const { container } = renderReset('/reset-password')
    expect(container.textContent).toContain('Invalid or missing token')
    expect(container.querySelector('form')).toBeNull()
  })

  it('sends a candidate with no token back to the sign-in page', async () => {
    const { container } = renderReset('/reset-password')
    const back = screen.getByRole('button', { name: 'Back to Sign In' })
    expect(back).toBeInTheDocument()
    // The route only holds this page, so navigating away empties the router.
    await act(async () => {
      fireEvent.click(back)
    })
    expect(container.textContent).not.toContain('Invalid or missing token')
  })

  it('rejects a password that is too short', async () => {
    installFetchMock([])
    const { container } = renderReset()
    const form = container.querySelector('form') as HTMLFormElement
    await fill(form, 'short', 'short')
    expect(screen.getByRole('alert').textContent).toContain(
      'Password must be at least 8 characters long.',
    )
  })

  it('rejects two passwords that do not match', async () => {
    installFetchMock([])
    const { container } = renderReset()
    const form = container.querySelector('form') as HTMLFormElement
    await fill(form, 'password123', 'password124')
    expect(screen.getByRole('alert').textContent).toContain('Passwords do not match.')
  })

  it('shows the passwords in the clear on request', async () => {
    installFetchMock([])
    const { container } = renderReset()
    const pw = container.querySelector('#new-password') as HTMLInputElement
    const toggle = screen.getByRole('button', { name: 'Show' })
    await act(async () => {
      fireEvent.click(toggle)
    })
    expect(pw.type).toBe('text')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hide' }))
    })
    expect(pw.type).toBe('password')
  })

  it('reports a reset the server refused', async () => {
    installFetchMock([
      { url: RESET_URL, body: { ok: false, error: 'Token has expired' }, status: 400 },
    ])
    const { container } = renderReset()
    const form = container.querySelector('form') as HTMLFormElement
    await fill(form, 'password123', 'password123')
    expect(screen.getByRole('alert').textContent).toContain('Token has expired')
    expect(useAuth.getState().token).toBeNull()
  })

  it('reports a reset that never reached the server', async () => {
    installFetchMock([{ url: RESET_URL, networkError: true }])
    const { container } = renderReset()
    const form = container.querySelector('form') as HTMLFormElement
    await fill(form, 'password123', 'password123')
    expect(screen.getByRole('alert').textContent).toContain(
      'Could not connect to authentication service',
    )
  })

  it('reports a refusal the server gave no reason for', async () => {
    installFetchMock([{ url: RESET_URL, body: { ok: false }, status: 500 }])
    const { container } = renderReset()
    const form = container.querySelector('form') as HTMLFormElement
    await fill(form, 'password123', 'password123')
    expect(screen.getByRole('alert').textContent).toContain(
      'Failed to reset password. Please try again.',
    )
  })

  it('cancels the redirect when the form is submitted twice', async () => {
    installFetchMock([{ url: RESET_URL, body: { ok: true } }])
    const { container } = renderReset()
    const form = container.querySelector('form') as HTMLFormElement
    const pw = form.querySelector('#new-password') as HTMLInputElement
    const cp = form.querySelector('#confirm-new-password') as HTMLInputElement
    await act(async () => {
      fireEvent.change(pw, { target: { value: 'password123' } })
      fireEvent.change(cp, { target: { value: 'password123' } })
    })

    // Two submissions race each other: the second one finds the redirect
    // timer the first one has already set, and cancels it.
    await act(async () => {
      fireEvent.submit(form)
      fireEvent.submit(form)
    })

    expect(screen.getByText('Password updated!')).toBeInTheDocument()
    expect(useAuth.getState().token).toBeNull()
  })

  it('signs the candidate in after a successful reset', async () => {
    vi.useFakeTimers()
    try {
      installFetchMock([
        {
          url: RESET_URL,
          body: {
            ok: true,
            token: 'tok',
            expiresAt: Date.now() + 60_000,
            user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 },
          },
        },
      ])
      const { container } = renderReset()
      const form = container.querySelector('form') as HTMLFormElement
      await fill(form, 'password123', 'password123')

      expect(screen.getByText('Password updated!')).toBeInTheDocument()
      expect(useAuth.getState().token).toBe('tok')
      expect(useAuth.getState().user?.email).toBe('a@b.c')

      // The page sends the candidate to their dashboard on its own.
      await act(async () => {
        vi.advanceTimersByTime(2000)
      })
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard')
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not sign anyone in when the server returns no session', async () => {
    installFetchMock([{ url: RESET_URL, body: { ok: true } }])
    const { container } = renderReset()
    const form = container.querySelector('form') as HTMLFormElement
    await fill(form, 'password123', 'password123')

    expect(screen.getByText('Password updated!')).toBeInTheDocument()
    expect(useAuth.getState().token).toBeNull()
  })

  it('offers a way on to the dashboard from the success panel', async () => {
    installFetchMock([{ url: RESET_URL, body: { ok: true } }])
    const { container } = renderReset()
    const form = container.querySelector('form') as HTMLFormElement
    await fill(form, 'password123', 'password123')

    const go = screen.getByRole('button', { name: 'Go to Dashboard' })
    await act(async () => {
      fireEvent.click(go)
    })
    expect(container.textContent).not.toContain('Password updated!')
  })
})
