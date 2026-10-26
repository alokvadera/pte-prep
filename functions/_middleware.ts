import type { Env } from './types'

export const onRequest: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin')
  const allowedOrigin = resolveAllowedOrigin(
    origin,
    context.env.CORS_ORIGIN ?? context.env.SITE_ORIGIN,
    context.request.url,
  )

  if (context.request.method === 'OPTIONS') {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '600',
    }
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin
      headers['Vary'] = 'Origin'
    }
    return new Response(null, { status: 204, headers })
  }

  try {
    const response = await context.next()
    const newHeaders = new Headers(response.headers)
    if (allowedOrigin) {
      newHeaders.set('Access-Control-Allow-Origin', allowedOrigin)
      newHeaders.set('Vary', 'Origin')
    }
    newHeaders.set('X-Content-Type-Options', 'nosniff')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  } catch (err: unknown) {
    console.error('Unhandled API error:', err)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    }
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin
      headers['Vary'] = 'Origin'
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    })
  }
}

/**
 * Whether the API itself is being served from a local address — the state
 * `wrangler pages dev` and the preview server put it in, where the app and
 * the functions run on the same machine on different ports.
 */
function isLocalRequestUrl(requestUrl?: string): boolean {
  if (!requestUrl) return false
  try {
    const { hostname } = new URL(requestUrl)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  } catch {
    return false
  }
}

export function resolveAllowedOrigin(
  origin: string | null,
  configured?: string,
  requestUrl?: string,
): string | null {
  if (!origin) return null
  if (configured) {
    const list = configured.split(',').map((s) => s.trim())
    return list.includes('*') || list.includes(origin) ? origin : null
  }
  if (origin === 'https://pte-prep.pages.dev' || origin.endsWith('.pte-prep.pages.dev')) {
    return origin
  }
  // The localhost allowlist exists for local development, where the app calls
  // the API on another local port. It is honoured only when the request is
  // itself arriving on a local address: on a deployed host, reflecting an
  // origin from the visitor's own machine would let any page served at
  // http://localhost:… read API responses cross-origin, which is exactly what
  // an attacker-hosted local page would want. Without a request URL the answer
  // is deny — the safe default for anything that is not provably local.
  if (
    isLocalRequestUrl(requestUrl) &&
    (origin === 'http://localhost' || origin.startsWith('http://localhost:'))
  ) {
    return origin
  }
  return null
}
