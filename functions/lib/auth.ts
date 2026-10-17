import type { AuthSession, Env } from '../types'

export const DEFAULT_SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60 // 7 days
export const MAX_SESSION_EXPIRY_SECONDS = 30 * 24 * 60 * 60 // 30 days max cap
export const MIN_SESSION_EXPIRY_SECONDS = 60 // 1 minute min

export const DEFAULT_PBKDF2_ITERATIONS = 100_000
export const MIN_PBKDF2_ITERATIONS = 10_000

export function resolveSessionExpiry(env?: Env): number {
  const configured = env?.SESSION_EXPIRY_SECONDS ? Number.parseInt(env.SESSION_EXPIRY_SECONDS, 10) : NaN
  if (Number.isFinite(configured) && configured > 0) {
    return Math.min(MAX_SESSION_EXPIRY_SECONDS, Math.max(MIN_SESSION_EXPIRY_SECONDS, configured))
  }
  return DEFAULT_SESSION_EXPIRY_SECONDS
}

export function resolvePbkdf2Iterations(env?: Env): number {
  const configured = env?.PBKDF2_ITERATIONS ? Number.parseInt(env.PBKDF2_ITERATIONS, 10) : NaN
  return Number.isFinite(configured) && configured >= MIN_PBKDF2_ITERATIONS ? configured : DEFAULT_PBKDF2_ITERATIONS
}

export function requireSecret(env: Env): string {
  const secret = env.JWT_SECRET
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Add it with `wrangler secret put JWT_SECRET` ' +
        '(or the equivalent for your host) before serving traffic.',
    )
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters of random data.')
  }
  return secret
}

function base64UrlEncode(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.byteLength; i++) {
    binary += String.fromCharCode(data[i]!)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)!
  }
  return bytes
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

let sessionsTableReady = false

export async function ensureSessionsTable(db: D1Database): Promise<void> {
  if (sessionsTableReady) return
  try {
    await db.exec(
      'CREATE TABLE IF NOT EXISTS user_sessions (jti TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime(\'now\')));' +
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);' +
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);'
    )
    sessionsTableReady = true
  } catch (err) {
    console.warn('[Auth] ensureSessionsTable notice:', err)
  }
}

export async function recordSession(
  db: D1Database,
  jti: string,
  userId: string,
  expiresAt: number,
): Promise<void> {
  await ensureSessionsTable(db)
  if (Math.random() < 0.05) {
    const now = Math.floor(Date.now() / 1000)
    await db
      .prepare('DELETE FROM user_sessions WHERE expires_at < ?')
      .bind(now)
      .run()
      .catch((err) => console.warn('[Auth] Session cleanup failed:', err))
  }
  await db
    .prepare('INSERT INTO user_sessions (jti, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(jti, userId, expiresAt)
    .run()
}

export async function revokeAllUserSessions(db: D1Database, userId: string): Promise<void> {
  await ensureSessionsTable(db)
  await db
    .prepare('DELETE FROM user_sessions WHERE user_id = ?')
    .bind(userId)
    .run()
}

/**
 * Revokes a single session by its token id, leaving other devices signed in.
 *
 * Sign-out needs this: clearing the token in the browser does not stop the
 * bearer token being replayed, so the server-side row has to go too.
 */
export async function revokeSession(db: D1Database, jti: string): Promise<void> {
  await ensureSessionsTable(db)
  await db.prepare('DELETE FROM user_sessions WHERE jti = ?').bind(jti).run()
}

export async function createSessionToken(
  session: Omit<AuthSession, 'exp' | 'iat' | 'jti' | 'aud'>,
  secret: string,
  expiresInSeconds = DEFAULT_SESSION_EXPIRY_SECONDS,
  db?: D1Database,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + expiresInSeconds
  const jti = crypto.randomUUID()
  const fullSession: AuthSession = {
    ...session,
    iat: now,
    exp,
    jti,
    aud: 'pte-api',
  }
  const payloadStr = JSON.stringify(fullSession)
  const enc = new TextEncoder()
  const payloadBytes = enc.encode(payloadStr)
  const key = await getHmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, payloadBytes)

  const payloadB64 = base64UrlEncode(payloadBytes)
  const sigB64 = base64UrlEncode(new Uint8Array(signature))
  const token = `${payloadB64}.${sigB64}`

  if (db) {
    await recordSession(db, jti, session.userId, exp)
  }

  return token
}

export async function verifySessionToken(
  token: string,
  secret: string,
  db?: D1Database,
): Promise<AuthSession | null> {
  try {
    const [payloadB64, sigB64] = token.split('.')
    if (!payloadB64 || !sigB64) return null

    const payloadBytes = base64UrlDecode(payloadB64)
    const sigBytes = base64UrlDecode(sigB64)
    const key = await getHmacKey(secret)

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, payloadBytes)
    if (!valid) return null

    const dec = new TextDecoder()
    const session = JSON.parse(dec.decode(payloadBytes)) as AuthSession
    const now = Math.floor(Date.now() / 1000)
    if (
      !session ||
      typeof session.userId !== 'string' ||
      !session.userId ||
      typeof session.exp !== 'number' ||
      session.exp < now ||
      session.aud !== 'pte-api'
    ) {
      return null
    }

    if (db) {
      if (!session.jti) return null
      await ensureSessionsTable(db)
      const row = await db
        .prepare('SELECT jti FROM user_sessions WHERE jti = ? AND user_id = ? AND expires_at > ?')
        .bind(session.jti, session.userId, now)
        .first<{ jti: string }>()
      if (!row) return null
    }

    return session
  } catch {
    return null
  }
}

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7).trim()
}

export async function hashPassword(
  password: string,
  iterations = DEFAULT_PBKDF2_ITERATIONS,
): Promise<{ hash: string; salt: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = base64UrlEncode(saltBytes)

  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  const hash = base64UrlEncode(new Uint8Array(derivedBits))
  return { hash, salt }
}

/**
 * Precomputed salt + hash for timing-equalized fake password verifications.
 *
 * These are NOT secrets and are safe to commit. They are the stored form of a
 * random password that nobody knows, used only so `login` can run a real
 * PBKDF2 derivation when the email is not found — without that, a missing
 * account would return faster than a present one and reveal which emails are
 * registered.
 *
 * They correspond to no real user: no password produces DUMMY_PASSWORD_HASH
 * against DUMMY_PASSWORD_SALT, so the fake verification always fails. Do NOT
 * rotate these values; login's timing behaviour depends on them being stable
 * and known in advance.
 *
 * @internal Used by tests to point the token-verify path at a known key.
 */
export const DUMMY_PASSWORD_SALT = '6yV17wuGQ4mpYEsFDXukPg'
export const DUMMY_PASSWORD_HASH = 'aqL9u0wJ9aGNyCB5VH8aS0J-H9wUNqsMqqyC-Dw15DE'

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string,
  iterations = DEFAULT_PBKDF2_ITERATIONS,
): Promise<boolean> {
  try {
    const saltBytes = base64UrlDecode(salt)
    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits'],
    )

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      256,
    )

    const computedHash = base64UrlEncode(new Uint8Array(derivedBits))
    if (computedHash.length !== hash.length) return false
    let diff = 0
    for (let i = 0; i < computedHash.length; i++) {
      diff |= computedHash.charCodeAt(i) ^ hash.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(input))
  const arr = Array.from(new Uint8Array(digest))
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('')
}
