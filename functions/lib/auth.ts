import type { AuthSession, Env } from '../types'

/** @internal Used by tests to point the token-verify path at a known key. */
export const HARDENED_SECRET_PREFIX = 'pte-prep-cf-aided-'

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

export async function createSessionToken(
  session: Omit<AuthSession, 'exp'>,
  secret: string,
  expiresInSeconds = 30 * 24 * 60 * 60,
): Promise<string> {
  const fullSession: AuthSession = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }
  const payloadStr = JSON.stringify(fullSession)
  const enc = new TextEncoder()
  const payloadBytes = enc.encode(payloadStr)
  const key = await getHmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, payloadBytes)

  const payloadB64 = base64UrlEncode(payloadBytes)
  const sigB64 = base64UrlEncode(new Uint8Array(signature))
  return `${payloadB64}.${sigB64}`
}

export async function verifySessionToken(
  token: string,
  secret: string,
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
    if (
      !session ||
      typeof session.userId !== 'string' ||
      !session.userId ||
      typeof session.exp !== 'number' ||
      session.exp < Math.floor(Date.now() / 1000)
    ) {
      return null
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

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
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
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  const hash = base64UrlEncode(new Uint8Array(derivedBits))
  return { hash, salt }
}

/** Precomputed valid 16-byte salt and 256-bit hash for timing-equalized fake verifications */
export const DUMMY_PASSWORD_SALT = '6yV17wuGQ4mpYEsFDXukPg'
export const DUMMY_PASSWORD_HASH = 'aqL9u0wJ9aGNyCB5VH8aS0J-H9wUNqsMqqyC-Dw15DE'

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
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
        iterations: 100000,
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
