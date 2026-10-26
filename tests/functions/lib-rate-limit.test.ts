import { describe, expect, it, vi, beforeEach } from 'vitest'

import './webcrypto'
import {
  checkRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from '../../functions/lib/rateLimit'
import { createD1Mock, createFailingD1 } from './d1'
import { nowSeconds, withOverrides } from './support'

beforeEach(() => {
  // The limiter prunes expired keys on a 5% dice roll. Pin the dice so the
  // tests are deterministic; the cleanup path is exercised on purpose below.
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
})

describe('getClientIp', () => {
  it('reads the connecting ip header', () => {
    const request = new Request('https://site.test/api/auth/login', {
      headers: { 'cf-connecting-ip': '203.0.113.5' },
    })
    expect(getClientIp(request)).toBe('203.0.113.5')
  })

  it('trims the header value', () => {
    const request = new Request('https://site.test/api/auth/login', {
      headers: { 'cf-connecting-ip': '  203.0.113.5  ' },
    })
    expect(getClientIp(request)).toBe('203.0.113.5')
  })

  it('ignores x-forwarded-for, which the caller controls', () => {
    // Trusting the first XFF entry would hand any attacker a fresh bucket per
    // request simply by rotating the header.
    const request = new Request('https://site.test/api/auth/login', {
      headers: { 'x-forwarded-for': '198.51.100.22, 10.0.0.1' },
    })
    expect(getClientIp(request)).toBe('unknown')
  })

  it('falls back to unknown when the header is missing', () => {
    expect(getClientIp(new Request('https://site.test/api/auth/login'))).toBe('unknown')
  })

  it('falls back to unknown when the header is blank', () => {
    const request = new Request('https://site.test/api/auth/login', {
      headers: { 'cf-connecting-ip': '   ' },
    })
    expect(getClientIp(request)).toBe('unknown')
  })
})

describe('checkRateLimit', () => {
  it('allows the first request', async () => {
    const mock = createD1Mock()

    const result = await checkRateLimit(mock.db, 'login:ip:203.0.113.5', 3, 60)

    expect(result).toEqual({ allowed: true, retryAfter: 0 })
    expect(mock.rateLimits.get('login:ip:203.0.113.5')?.count).toBe(1)
  })

  it('allows every request up to the limit and blocks the one after it', async () => {
    const mock = createD1Mock()

    for (let attempt = 0; attempt < 3; attempt++) {
      const allowed = await checkRateLimit(mock.db, 'login:ip:203.0.113.5', 3, 60)
      expect(allowed.allowed).toBe(true)
    }

    const blocked = await checkRateLimit(mock.db, 'login:ip:203.0.113.5', 3, 60)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
    expect(blocked.retryAfter).toBeLessThanOrEqual(60)
    expect(mock.rateLimits.get('login:ip:203.0.113.5')?.count).toBe(4)
  })

  it('counts every key separately', async () => {
    const mock = createD1Mock()

    expect((await checkRateLimit(mock.db, 'a', 1, 60)).allowed).toBe(true)
    expect((await checkRateLimit(mock.db, 'a', 1, 60)).allowed).toBe(false)
    expect((await checkRateLimit(mock.db, 'b', 1, 60)).allowed).toBe(true)
  })

  it('resets the counter once the window has passed', async () => {
    const mock = createD1Mock({
      rateLimits: [{ key: 'login:ip:203.0.113.5', count: 5, reset_at: nowSeconds() - 1 }],
    })

    const result = await checkRateLimit(mock.db, 'login:ip:203.0.113.5', 3, 60)

    expect(result.allowed).toBe(true)
    expect(mock.rateLimits.get('login:ip:203.0.113.5')?.count).toBe(1)
  })

  it('prunes expired keys during the opportunistic cleanup', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const mock = createD1Mock({
      rateLimits: [{ key: 'stale', count: 1, reset_at: nowSeconds() - 10 }],
    })

    const result = await checkRateLimit(mock.db, 'fresh', 3, 60)

    expect(result.allowed).toBe(true)
    expect(mock.rateLimits.has('stale')).toBe(false)
    expect(mock.rateLimits.has('fresh')).toBe(true)
  })

  it('keeps serving when the cleanup fails', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mock = createD1Mock()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('DELETE FROM rate_limits WHERE reset_at < ?'),
        run: async () => {
          throw new Error('cleanup failed')
        },
      },
    ])

    const result = await checkRateLimit(db, 'login:ip:203.0.113.5', 3, 60)

    expect(result.allowed).toBe(true)
    expect(warn).toHaveBeenCalled()
  })

  it('fails closed when the database throws', async () => {
    vi.resetModules()
    const fresh = await import('../../functions/lib/rateLimit')
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const result = await fresh.checkRateLimit(createFailingD1(), 'login:ip:203.0.113.5', 3, 60)

    expect(result).toEqual({ allowed: false, retryAfter: 60 })
    expect(error).toHaveBeenCalled()
  })

  it('fails closed when the upsert returns no row', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const mock = createD1Mock()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('INSERT INTO rate_limits'),
        first: async () => null,
      },
    ])

    const result = await checkRateLimit(db, 'login:ip:203.0.113.5', 3, 60)

    expect(result).toEqual({ allowed: false, retryAfter: 60 })
    expect(error).toHaveBeenCalled()
  })
})

describe('rateLimitExceededResponse', () => {
  it('answers with 429 and the retry-after header', async () => {
    const res = rateLimitExceededResponse(42)

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('42')
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(await res.json()).toEqual({
      error: 'Too many requests. Please wait a moment and try again.',
    })
  })
})
