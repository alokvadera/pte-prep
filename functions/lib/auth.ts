import type { AuthSession } from '../types'

const DEFAULT_SECRET = 'pte-prep-cf-edge-secret-dev-2026'

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
    bytes[i] = binary.charCodeAt(i)
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
  secret = DEFAULT_SECRET,
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
  secret = DEFAULT_SECRET,
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
    if (session.exp < Math.floor(Date.now() / 1000)) {
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
