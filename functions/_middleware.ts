import type { Env } from './types'

export const onRequest: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin')
  const allowedOrigin =
    context.env.CORS_ORIGIN ??
    (origin &&
    (origin === 'https://pte-prep.pages.dev' ||
      origin.endsWith('.pte-prep.pages.dev') ||
      origin.startsWith('http://localhost:'))
      ? origin
      : 'https://pte-prep.pages.dev')
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '600',
      },
    })
  }

  try {
    const response = await context.next()
    const newHeaders = new Headers(response.headers)
    newHeaders.set('Access-Control-Allow-Origin', allowedOrigin)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
      },
    })
  }
}
