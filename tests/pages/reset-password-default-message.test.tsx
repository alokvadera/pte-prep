import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { installFetchMock } from '../helpers/fetch'

/* ---------------------------------------------------------------------------
   The page's own default message.

   The form check is mocked here so it can fail without saying why. The check
   in `src/lib/format.ts` always explains itself, so the page's fallback — the
   message it shows when a check fails without a reason — is otherwise never
   seen. The page must still say something sensible when it happens.
   --------------------------------------------------------------------------- */

vi.mock('../../src/lib/format', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/format')>()
  return {
    ...actual,
    validateResetPasswordForm: () => ({ valid: false }),
  }
})

const ResetPasswordPage = (await import('../../src/pages/ResetPasswordPage')).default

describe('ResetPasswordPage without a reason', () => {
  it('says the input was invalid when the check gives no reason', async () => {
    installFetchMock([])
    const { container } = renderRoute(
      <ResetPasswordPage />,
      '/reset-password',
      { route: '/reset-password?token=abc' },
    )
    const form = container.querySelector('form') as HTMLFormElement

    await act(async () => {
      fireEvent.submit(form)
    })

    expect(screen.getByRole('alert').textContent).toContain('Invalid input')
  })

  it('does not send the form on when the check gives no reason', async () => {
    const fetchMock = installFetchMock([])
    const { container } = renderRoute(
      <ResetPasswordPage />,
      '/reset-password',
      { route: '/reset-password?token=abc' },
    )
    const form = container.querySelector('form') as HTMLFormElement

    await act(async () => {
      fireEvent.submit(form)
    })

    expect(fetchMock.calls).toHaveLength(0)
  })
})
