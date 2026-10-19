import type { Env } from './types'

export const onRequest: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin')
  const allowedOrigin = resolveAllowedOrigin(origin, context.env.CORS_ORIGIN ?? context.env.SITE_ORIGIN)

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

export function resolveAllowedOrigin(origin: string | null, configured?: string): string | null {
  if (!origin) return null
  if (configured) {
    const list = configured.split(',').map((s) => s.trim())
    if (list.includes('*') || list.includes(origin)) return origin
  }
  if (
    origin === 'https://pte-prep.pages.dev' ||
    origin.endsWith('.pte-prep.pages.dev') ||
    origin.startsWith('http://localhost:') ||
    origin === 'http://localhost'
  ) {
    return origin
  }
  return null
}
