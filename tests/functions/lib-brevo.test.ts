import { describe, expect, it, vi, afterEach } from 'vitest'

import './webcrypto'
import { sendBrevoEmail } from '../../functions/lib/brevo'

interface BrevoInit {
  method?: string
  headers?: Record<string, string>
  body?: string
}

function stubFetch(response: () => Response): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (..._args: unknown[]): Promise<Response> => response())
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const BASE_OPTIONS = {
  apiKey: 'key-123',
  senderEmail: 'no-reply@pte.test',
  to: 'user@pte.test',
  subject: 'Reset your PTE Prep password',
  htmlContent: '<p>Reset your password</p>',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('sendBrevoEmail', () => {
  it('rejects a missing api key without calling Brevo', async () => {
    const fetchMock = stubFetch(() => new Response('{}', { status: 201 }))

    const result = await sendBrevoEmail({ ...BASE_OPTIONS, apiKey: '' })

    expect(result).toEqual({ ok: false, error: 'BREVO_API_KEY is not configured.' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a missing sender email without calling Brevo', async () => {
    const fetchMock = stubFetch(() => new Response('{}', { status: 201 }))

    const result = await sendBrevoEmail({ ...BASE_OPTIONS, senderEmail: '' })

    expect(result).toEqual({ ok: false, error: 'BREVO_SENDER_EMAIL is not configured.' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends the message and returns the message id', async () => {
    const fetchMock = stubFetch(
      () => new Response(JSON.stringify({ messageId: '<20240101.1@smtp-relay.brevo.com>' }), { status: 201 }),
    )

    const result = await sendBrevoEmail(BASE_OPTIONS)

    expect(result).toEqual({ ok: true, messageId: '<20240101.1@smtp-relay.brevo.com>' })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const call = fetchMock.mock.calls[0]
    expect(call?.[0]).toBe('https://api.brevo.com/v3/smtp/email')

    const init = call?.[1] as BrevoInit | undefined
    expect(init?.method).toBe('POST')
    expect(init?.headers?.['accept']).toBe('application/json')
    expect(init?.headers?.['api-key']).toBe('key-123')
    expect(init?.headers?.['content-type']).toBe('application/json')

    const body = JSON.parse(init?.body ?? '{}') as Record<string, unknown>
    expect(body.sender).toEqual({ name: 'PTE Prep', email: 'no-reply@pte.test' })
    expect(body.to).toEqual([{ email: 'user@pte.test' }])
    expect(body.subject).toBe('Reset your PTE Prep password')
    expect(body.htmlContent).toBe('<p>Reset your password</p>')
    expect(body.textContent).toBeUndefined()
  })

  it('includes the sender name, the recipient name and the text content when given', async () => {
    const fetchMock = stubFetch(() => new Response(JSON.stringify({ messageId: 'msg_2' }), { status: 201 }))

    const result = await sendBrevoEmail({
      ...BASE_OPTIONS,
      senderName: 'PTE Prep Team',
      toName: 'Ada Lovelace',
      textContent: 'Reset your password',
    })

    expect(result).toEqual({ ok: true, messageId: 'msg_2' })

    const init = fetchMock.mock.calls[0]?.[1] as BrevoInit | undefined
    const body = JSON.parse(init?.body ?? '{}') as Record<string, unknown>
    expect(body.sender).toEqual({ name: 'PTE Prep Team', email: 'no-reply@pte.test' })
    expect(body.to).toEqual([{ email: 'user@pte.test', name: 'Ada Lovelace' }])
    expect(body.textContent).toBe('Reset your password')
  })

  it('surfaces the error message Brevo sends back', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    stubFetch(
      () =>
        new Response(JSON.stringify({ message: 'Bad request', code: 'invalid_parameter' }), {
          status: 400,
        }),
    )

    const result = await sendBrevoEmail(BASE_OPTIONS)

    expect(result).toEqual({ ok: false, error: 'Bad request' })
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    stubFetch(() => new Response('upstream exploded', { status: 502 }))

    const result = await sendBrevoEmail(BASE_OPTIONS)

    expect(result).toEqual({ ok: false, error: 'Brevo API error (502): upstream exploded' })
  })

  it('survives a network exception', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (): Promise<Response> => {
        throw new Error('network down')
      }),
    )

    const result = await sendBrevoEmail(BASE_OPTIONS)

    expect(result).toEqual({ ok: false, error: 'network down' })
  })

  it('survives a rejection that is not an error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (): Promise<Response> => {
        throw 'string failure'
      }),
    )

    const result = await sendBrevoEmail(BASE_OPTIONS)

    expect(result).toEqual({ ok: false, error: 'string failure' })
  })
})
