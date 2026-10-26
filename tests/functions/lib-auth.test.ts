import { describe, expect, it, vi, beforeEach } from 'vitest'

import './webcrypto'
import {
  DEFAULT_PBKDF2_ITERATIONS,
  DEFAULT_SESSION_EXPIRY_SECONDS,
  MAX_SESSION_EXPIRY_SECONDS,
  MIN_PBKDF2_ITERATIONS,
  MIN_SESSION_EXPIRY_SECONDS,
  createSessionToken,
  extractBearerToken,
  hashPassword,
  recordSession,
  requireSecret,
  resolvePbkdf2Iterations,
  resolveSessionExpiry,
  revokeAllUserSessions,
  revokeSession,
  sha256Hex,
  verifyPassword,
  verifySessionToken,
} from '../../functions/lib/auth'
import { createD1Mock } from './d1'
import { SECRET, makeEnv, nowSeconds, withOverrides } from './support'

/* ---------------------------------------------------------------------------
   Helpers
   --------------------------------------------------------------------------- */

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodePayload(part: string): Record<string, unknown> {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return JSON.parse(atob(padded)) as Record<string, unknown>
}

/** Signs an arbitrary payload with the session secret. */
async function signRaw(body: string, secret = SECRET): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  return `${base64Url(enc.encode(body))}.${base64Url(new Uint8Array(signature))}`
}

function signToken(payload: Record<string, unknown>, secret = SECRET): Promise<string> {
  return signRaw(JSON.stringify(payload), secret)
}

function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const now = nowSeconds()
  return {
    userId: 'usr_1',
    email: 'user@pte.test',
    iat: now,
    exp: now + 3600,
    jti: 'jti_1',
    aud: 'pte-api',
    ...overrides,
  }
}

beforeEach(() => {
  // The session helper prunes expired rows on a 5% dice roll. Pin the dice so
  // the tests are deterministic; the cleanup path is exercised on purpose
  // elsewhere.
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
})

/* ---------------------------------------------------------------------------
   resolveSessionExpiry
   --------------------------------------------------------------------------- */

describe('resolveSessionExpiry', () => {
  it('defaults to seven days', () => {
    expect(DEFAULT_SESSION_EXPIRY_SECONDS).toBe(604_800)
    expect(resolveSessionExpiry()).toBe(DEFAULT_SESSION_EXPIRY_SECONDS)
    expect(resolveSessionExpiry(makeEnv())).toBe(DEFAULT_SESSION_EXPIRY_SECONDS)
  })

  it('uses a configured value', () => {
    expect(resolveSessionExpiry(makeEnv({ SESSION_EXPIRY_SECONDS: '3600' }))).toBe(3600)
  })

  it('clamps a value below the one minute minimum', () => {
    expect(MIN_SESSION_EXPIRY_SECONDS).toBe(60)
    expect(resolveSessionExpiry(makeEnv({ SESSION_EXPIRY_SECONDS: '10' }))).toBe(60)
  })

  it('clamps a value above the thirty day maximum', () => {
    expect(MAX_SESSION_EXPIRY_SECONDS).toBe(2_592_000)
    expect(resolveSessionExpiry(makeEnv({ SESSION_EXPIRY_SECONDS: '99999999' }))).toBe(2_592_000)
  })

  it('falls back to the default for a value that is not a positive number', () => {
    expect(resolveSessionExpiry(makeEnv({ SESSION_EXPIRY_SECONDS: 'not-a-number' }))).toBe(
      DEFAULT_SESSION_EXPIRY_SECONDS,
    )
    expect(resolveSessionExpiry(makeEnv({ SESSION_EXPIRY_SECONDS: '0' }))).toBe(
      DEFAULT_SESSION_EXPIRY_SECONDS,
    )
    expect(resolveSessionExpiry(makeEnv({ SESSION_EXPIRY_SECONDS: '' }))).toBe(
      DEFAULT_SESSION_EXPIRY_SECONDS,
    )
  })
})

/* ---------------------------------------------------------------------------
   resolvePbkdf2Iterations
   --------------------------------------------------------------------------- */

describe('resolvePbkdf2Iterations', () => {
  it('defaults to a hundred thousand iterations', () => {
    expect(DEFAULT_PBKDF2_ITERATIONS).toBe(100_000)
    expect(resolvePbkdf2Iterations()).toBe(DEFAULT_PBKDF2_ITERATIONS)
    expect(resolvePbkdf2Iterations(makeEnv({ PBKDF2_ITERATIONS: undefined }))).toBe(
      DEFAULT_PBKDF2_ITERATIONS,
    )
  })

  it('uses a configured value', () => {
    expect(resolvePbkdf2Iterations(makeEnv({ PBKDF2_ITERATIONS: '50000' }))).toBe(50_000)
  })

  it('accepts a value of exactly the minimum', () => {
    expect(MIN_PBKDF2_ITERATIONS).toBe(10_000)
    expect(resolvePbkdf2Iterations(makeEnv({ PBKDF2_ITERATIONS: '10000' }))).toBe(10_000)
  })

  it('falls back to the default for a value below the minimum', () => {
    expect(resolvePbkdf2Iterations(makeEnv({ PBKDF2_ITERATIONS: '9999' }))).toBe(
      DEFAULT_PBKDF2_ITERATIONS,
    )
  })

  it('falls back to the default for a value that is not a number', () => {
    expect(resolvePbkdf2Iterations(makeEnv({ PBKDF2_ITERATIONS: 'abc' }))).toBe(
      DEFAULT_PBKDF2_ITERATIONS,
    )
  })
})

/* ---------------------------------------------------------------------------
   requireSecret
   --------------------------------------------------------------------------- */

describe('requireSecret', () => {
  it('throws when the secret is not set', () => {
    expect(() => requireSecret(makeEnv({ JWT_SECRET: '' }))).toThrow(/JWT_SECRET is not set/)
    expect(() => requireSecret(makeEnv({ JWT_SECRET: undefined }))).toThrow(/JWT_SECRET is not set/)
  })

  it('throws when the secret is shorter than 32 characters', () => {
    expect(() => requireSecret(makeEnv({ JWT_SECRET: 'too-short' }))).toThrow(
      /at least 32 characters/,
    )
  })

  it('returns the secret when it is long enough', () => {
    expect(requireSecret(makeEnv())).toBe(SECRET)
    expect(requireSecret(makeEnv({ JWT_SECRET: 'x'.repeat(32) }))).toBe('x'.repeat(32))
  })
})

/* ---------------------------------------------------------------------------
   createSessionToken
   --------------------------------------------------------------------------- */

describe('createSessionToken', () => {
  it('produces a two part token carrying the session', async () => {
    const token = await createSessionToken({ userId: 'usr_1', email: 'user@pte.test' }, SECRET)

    const parts = token.split('.')
    expect(parts).toHaveLength(2)

    const payload = decodePayload(parts[0]!)
    expect(payload.userId).toBe('usr_1')
    expect(payload.email).toBe('user@pte.test')
    expect(payload.aud).toBe('pte-api')
    expect(typeof payload.iat).toBe('number')
    expect(typeof payload.exp).toBe('number')
    expect(typeof payload.jti).toBe('string')
    expect((payload.exp! as number) - (payload.iat! as number)).toBe(DEFAULT_SESSION_EXPIRY_SECONDS)
  })

  it('honours the requested lifetime', async () => {
    const token = await createSessionToken({ userId: 'usr_1', email: 'user@pte.test' }, SECRET, 120)
    const payload = decodePayload(token.split('.')[0]!)
    expect((payload.exp! as number) - (payload.iat! as number)).toBe(120)
  })

  it('records the session when a database is given', async () => {
    const mock = createD1Mock()

    const token = await createSessionToken(
      { userId: 'usr_1', email: 'user@pte.test' },
      SECRET,
      3600,
      mock.db,
    )

    expect(mock.sessions.size).toBe(1)
    const row = mock.sessions.get(decodePayload(token.split('.')[0]!).jti as string)
    expect(row?.user_id).toBe('usr_1')
    expect(row?.expires_at).toBe(decodePayload(token.split('.')[0]!).exp)
  })

  it('records no session when no database is given', async () => {
    const mock = createD1Mock()
    await createSessionToken({ userId: 'usr_1', email: 'user@pte.test' }, SECRET)
    expect(mock.sessions.size).toBe(0)
  })
})

/* ---------------------------------------------------------------------------
   verifySessionToken
   --------------------------------------------------------------------------- */

describe('verifySessionToken', () => {
  it('accepts a good token', async () => {
    const token = await createSessionToken({ userId: 'usr_1', email: 'user@pte.test' }, SECRET)

    const session = await verifySessionToken(token, SECRET)

    expect(session?.userId).toBe('usr_1')
    expect(session?.email).toBe('user@pte.test')
    expect(session?.aud).toBe('pte-api')
  })

  it('accepts a good token whose session row exists', async () => {
    const mock = createD1Mock()
    const token = await createSessionToken(
      { userId: 'usr_1', email: 'user@pte.test' },
      SECRET,
      3600,
      mock.db,
    )

    const session = await verifySessionToken(token, SECRET, mock.db)

    expect(session?.userId).toBe('usr_1')
  })

  it('rejects a token whose session row is missing', async () => {
    const mock = createD1Mock()
    const token = await createSessionToken({ userId: 'usr_1', email: 'user@pte.test' }, SECRET)

    expect(await verifySessionToken(token, SECRET, mock.db)).toBeNull()
  })

  it('rejects a token signed for a different payload', async () => {
    const first = await createSessionToken({ userId: 'usr_1', email: 'user@pte.test' }, SECRET)
    const second = await createSessionToken({ userId: 'usr_2', email: 'other@pte.test' }, SECRET)
    const [payload] = first.split('.')
    const [, signature] = second.split('.')

    expect(await verifySessionToken(`${payload}.${signature}`, SECRET)).toBeNull()
  })

  it('rejects a token with no payload', async () => {
    expect(await verifySessionToken('not-a-token', SECRET)).toBeNull()
    expect(await verifySessionToken('', SECRET)).toBeNull()
  })

  it('rejects an expired token', async () => {
    const token = await createSessionToken({ userId: 'usr_1', email: 'user@pte.test' }, SECRET, -10)
    expect(await verifySessionToken(token, SECRET)).toBeNull()
  })

  it('rejects a token with the wrong audience', async () => {
    const token = await signToken(validPayload({ aud: 'some-other-api' }))
    expect(await verifySessionToken(token, SECRET)).toBeNull()
  })

  it('rejects a token with no audience', async () => {
    const token = await signToken(validPayload({ aud: undefined }))
    expect(await verifySessionToken(token, SECRET)).toBeNull()
  })

  it('rejects a token with no user id', async () => {
    expect(
      await verifySessionToken(await signToken(validPayload({ userId: '' })), SECRET),
    ).toBeNull()
    expect(
      await verifySessionToken(await signToken(validPayload({ userId: 42 })), SECRET),
    ).toBeNull()
  })

  it('rejects a token whose expiry is not a number', async () => {
    expect(
      await verifySessionToken(await signToken(validPayload({ exp: 'soon' })), SECRET),
    ).toBeNull()
  })

  it('rejects a token whose payload is null', async () => {
    expect(await verifySessionToken(await signRaw('null'), SECRET)).toBeNull()
  })

  it('rejects a token with no session id when a database is given', async () => {
    const mock = createD1Mock()
    const token = await signToken(validPayload({ jti: undefined }))
    expect(await verifySessionToken(token, SECRET, mock.db)).toBeNull()
  })

  it('returns null for a token that cannot be decoded', async () => {
    expect(await verifySessionToken('!!!.!!!', SECRET)).toBeNull()
  })
})

/* ---------------------------------------------------------------------------
   extractBearerToken
   --------------------------------------------------------------------------- */

describe('extractBearerToken', () => {
  it('returns the token of a bearer header', () => {
    const request = new Request('https://site.test/api/auth/me', {
      headers: { Authorization: 'Bearer abc123' },
    })
    expect(extractBearerToken(request)).toBe('abc123')
  })

  it('trims the token', () => {
    const request = new Request('https://site.test/api/auth/me', {
      headers: { Authorization: 'Bearer   abc123  ' },
    })
    expect(extractBearerToken(request)).toBe('abc123')
  })

  it('returns null when there is no authorization header', () => {
    expect(extractBearerToken(new Request('https://site.test/api/auth/me'))).toBeNull()
  })

  it('returns null when the header is not the bearer scheme', () => {
    const request = new Request('https://site.test/api/auth/me', {
      headers: { Authorization: 'Basic abc123' },
    })
    expect(extractBearerToken(request)).toBeNull()
  })
})

/* ---------------------------------------------------------------------------
   Passwords
   --------------------------------------------------------------------------- */

describe('hashPassword and verifyPassword', () => {
  it('round-trips a password', async () => {
    const { hash, salt } = await hashPassword('correct horse battery staple', 1000)

    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(salt).toMatch(/^[0-9]+\$[A-Za-z0-9_-]+$/)
    expect(await verifyPassword('correct horse battery staple', hash, salt, 1000)).toBe(true)
  })

  it('verifies a legacy salt that does not contain embedded iterations', async () => {
    // Before self-describing salts, salt was purely base64url without '$'
    const legacySalt = '6yV17wuGQ4mpYEsFDXukPg'
    // Derive a hash with 1000 iterations against the raw legacy salt
    const enc = new TextEncoder()
    const saltBytes = new Uint8Array([
      235, 37, 117, 239, 11, 134, 67, 137, 169, 96, 75, 5, 13, 123, 164, 62,
    ])
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode('mypassword'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits'],
    )
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations: 1000, hash: 'SHA-256' },
      keyMaterial,
      256,
    )
    let binary = ''
    for (const b of new Uint8Array(derived)) binary += String.fromCharCode(b)
    const legacyHash = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    expect(await verifyPassword('mypassword', legacyHash, legacySalt, 1000)).toBe(true)
    expect(await verifyPassword('wrongpassword', legacyHash, legacySalt, 1000)).toBe(false)
  })

  it('rejects the wrong password', async () => {
    const { hash, salt } = await hashPassword('correct horse battery staple', 1000)
    expect(await verifyPassword('wrong horse battery staple', hash, salt, 1000)).toBe(false)
  })

  it('rejects a hash of the wrong length', async () => {
    const { salt } = await hashPassword('correct horse battery staple', 1000)
    expect(await verifyPassword('correct horse battery staple', 'short', salt, 1000)).toBe(false)
  })

  it('rejects a malformed salt', async () => {
    const { hash } = await hashPassword('correct horse battery staple', 1000)
    expect(await verifyPassword('correct horse battery staple', hash, 'not base64!!', 1000)).toBe(
      false,
    )
  })

  it('uses a fresh salt for every hash', async () => {
    const first = await hashPassword('same password', 1000)
    const second = await hashPassword('same password', 1000)

    expect(first.salt).not.toBe(second.salt)
    expect(first.hash).not.toBe(second.hash)
  })

  it('hashes with the default cost when none is given', async () => {
    const { hash, salt } = await hashPassword('default cost password')
    expect(await verifyPassword('default cost password', hash, salt)).toBe(true)
  })
})

/* ---------------------------------------------------------------------------
   sha256Hex
   --------------------------------------------------------------------------- */

describe('sha256Hex', () => {
  it('returns 64 lowercase hex characters', async () => {
    const digest = await sha256Hex('abc')
    expect(digest).toMatch(/^[0-9a-f]{64}$/)
    expect(digest).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('is stable for the same input', async () => {
    expect(await sha256Hex('abc')).toBe(await sha256Hex('abc'))
  })

  it('differs for different input', async () => {
    expect(await sha256Hex('abc')).not.toBe(await sha256Hex('abd'))
  })
})

/* ---------------------------------------------------------------------------
   Session bookkeeping
   --------------------------------------------------------------------------- */

describe('session bookkeeping', () => {
  it('records a session row', async () => {
    const mock = createD1Mock()

    await recordSession(mock.db, 'jti_1', 'usr_1', nowSeconds() + 3600)

    expect(mock.sessions.get('jti_1')?.user_id).toBe('usr_1')
    expect(mock.sessions.get('jti_1')?.expires_at).toBe(nowSeconds() + 3600)
  })

  it('prunes expired sessions during the opportunistic cleanup', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const mock = createD1Mock({
      sessions: [{ jti: 'expired', user_id: 'usr_1', expires_at: nowSeconds() - 10 }],
    })

    await recordSession(mock.db, 'jti_new', 'usr_1', nowSeconds() + 3600)

    expect(mock.sessions.has('expired')).toBe(false)
    expect(mock.sessions.has('jti_new')).toBe(true)
  })

  it('keeps the new session when the cleanup fails', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mock = createD1Mock()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('DELETE FROM user_sessions WHERE expires_at < ?'),
        run: async () => {
          throw new Error('cleanup failed')
        },
      },
    ])

    await recordSession(db, 'jti_1', 'usr_1', nowSeconds() + 3600)

    expect(mock.sessions.has('jti_1')).toBe(true)
    expect(warn).toHaveBeenCalled()
  })

  it('revokes a single session and leaves the others alone', async () => {
    const mock = createD1Mock({
      sessions: [
        { jti: 'a', user_id: 'usr_1', expires_at: nowSeconds() + 100 },
        { jti: 'b', user_id: 'usr_1', expires_at: nowSeconds() + 100 },
      ],
    })

    await revokeSession(mock.db, 'a')

    expect(mock.sessions.has('a')).toBe(false)
    expect(mock.sessions.has('b')).toBe(true)
  })

  it('revokes every session of a user', async () => {
    const mock = createD1Mock({
      sessions: [
        { jti: 'a', user_id: 'usr_1', expires_at: nowSeconds() + 100 },
        { jti: 'b', user_id: 'usr_1', expires_at: nowSeconds() + 100 },
        { jti: 'c', user_id: 'usr_2', expires_at: nowSeconds() + 100 },
      ],
    })

    await revokeAllUserSessions(mock.db, 'usr_1')

    expect(mock.sessions.has('a')).toBe(false)
    expect(mock.sessions.has('b')).toBe(false)
    expect(mock.sessions.has('c')).toBe(true)
  })
})
