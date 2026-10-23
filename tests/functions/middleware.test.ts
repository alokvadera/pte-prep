import { describe, expect, it, vi } from 'vitest'

import './webcrypto'
import { onRequest, resolveAllowedOrigin } from '../../functions/_middleware'
import { makeContext, makeEnv, requestWith } from './support'

function contextFor(
  options: {
    url?: string
    method?: string
    origin?: string
    headers?: Record<string, string>
    corsOrigin?: string
    siteOrigin?: string
    next?: () => Promise<Response>
  } = {},
): Parameters<typeof onRequest>[0] {
  const headers: Record<string, string> = { ...options.headers }
  if (options.origin !== undefined) headers['Origin'] = options.origin
  const request = requestWith(options.url ?? 'https://site.test/api/auth/login', {
    method: options.method ?? 'GET',
    headers,
  })
  return makeContext({
    request,
    env: makeEnv({ CORS_ORIGIN: options.corsOrigin, SITE_ORIGIN: options.siteOrigin }),
    next: options.next,
  })
}

describe('resolveAllowedOrigin', () => {
  it('returns null when the request carries no Origin header', () => {
    expect(resolveAllowedOrigin(null, 'https://pte-prep.pages.dev')).toBeNull()
    expect(resolveAllowedOrigin(null)).toBeNull()
  })

  it('allows an origin that is on the configured list', () => {
    expect(resolveAllowedOrigin('https://pte-prep.pages.dev', 'https://pte-prep.pages.dev')).toBe(
      'https://pte-prep.pages.dev',
    )
  })

  it('allows an origin that appears in a comma separated list', () => {
    const configured = 'https://a.test , https://b.test'
    expect(resolveAllowedOrigin('https://b.test', configured)).toBe('https://b.test')
  })

  it('allows any origin when the configuration is the wildcard', () => {
    expect(resolveAllowedOrigin('https://anything.test', '*')).toBe('https://anything.test')
    expect(resolveAllowedOrigin('https://anything.test', 'https://a.test, *')).toBe(
      'https://anything.test',
    )
  })

  it('rejects an origin that is not on the configured list', () => {
    expect(resolveAllowedOrigin('https://evil.test', 'https://pte-prep.pages.dev')).toBeNull()
  })

  it('rejects an origin when no origin is configured at all', () => {
    expect(resolveAllowedOrigin('https://evil.test', undefined)).toBeNull()
    expect(resolveAllowedOrigin('https://evil.test', '')).toBeNull()
  })

  it('allows the production origin and its subdomains', () => {
    expect(resolveAllowedOrigin('https://pte-prep.pages.dev')).toBe('https://pte-prep.pages.dev')
    expect(resolveAllowedOrigin('https://staging.pte-prep.pages.dev')).toBe(
      'https://staging.pte-prep.pages.dev',
    )
  })

  it('allows the local development origins', () => {
    expect(resolveAllowedOrigin('http://localhost:5173')).toBe('http://localhost:5173')
    expect(resolveAllowedOrigin('http://localhost')).toBe('http://localhost')
  })

  it('rejects a look-alike origin that only shares a prefix', () => {
    expect(resolveAllowedOrigin('https://pte-prep.pages.dev.evil.test')).toBeNull()
    expect(resolveAllowedOrigin('http://localhost.evil.test')).toBeNull()
  })
})

describe('middleware onRequest', () => {
  it('answers an OPTIONS preflight with 204 and the CORS methods', async () => {
    const res = await onRequest(
      contextFor({ method: 'OPTIONS', origin: 'https://pte-prep.pages.dev' }),
    )

    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe(
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    )
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization')
    expect(res.headers.get('Access-Control-Max-Age')).toBe('600')
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://pte-prep.pages.dev')
    expect(res.headers.get('Vary')).toBe('Origin')
  })

  it('answers a preflight without an allowed origin with no CORS origin header', async () => {
    const res = await onRequest(contextFor({ method: 'OPTIONS', origin: 'https://evil.test' }))

    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(res.headers.get('Vary')).toBeNull()
  })

  it('passes an allowed origin through to the handler response', async () => {
    const res = await onRequest(
      contextFor({
        origin: 'https://pte-prep.pages.dev',
        corsOrigin: 'https://pte-prep.pages.dev',
        next: async () => new Response('ok', { status: 201, statusText: 'Created' }),
      }),
    )

    expect(res.status).toBe(201)
    expect(res.statusText).toBe('Created')
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://pte-prep.pages.dev')
    expect(res.headers.get('Vary')).toBe('Origin')
  })

  it('falls back to SITE_ORIGIN when CORS_ORIGIN is not set', async () => {
    const res = await onRequest(
      contextFor({
        origin: 'https://pte-prep.pages.dev',
        siteOrigin: 'https://pte-prep.pages.dev',
        next: async () => new Response('ok'),
      }),
    )

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://pte-prep.pages.dev')
  })

  it('injects the nosniff header on every handler response', async () => {
    const res = await onRequest(
      contextFor({ origin: 'https://evil.test', next: async () => new Response('ok') }),
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(await res.text()).toBe('ok')
  })

  it('returns a 500 instead of crashing when the handler throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = await onRequest(
      contextFor({
        origin: 'https://pte-prep.pages.dev',
        corsOrigin: 'https://pte-prep.pages.dev',
        next: async () => {
          throw new Error('handler exploded')
        },
      }),
    )

    expect(res.status).toBe(500)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://pte-prep.pages.dev')
    expect(await res.json()).toEqual({ error: 'Internal server error' })
    expect(error).toHaveBeenCalled()
  })

  it('returns a 500 without CORS headers when the origin is not allowed', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = await onRequest(
      contextFor({
        origin: 'https://evil.test',
        next: async () => {
          throw new Error('handler exploded')
        },
      }),
    )

    expect(res.status).toBe(500)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(res.headers.get('Vary')).toBeNull()
    expect(error).toHaveBeenCalled()
  })
})
