import type { Env } from '../../types'
import {
  extractBearerToken,
  requireSecret,
  revokeAllUserSessions,
  revokeSession,
  verifySessionToken,
} from '../../lib/auth'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '../../lib/rateLimit'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

/**
 * Sign out.
 *
 * Clearing the token in the browser is not enough to end a session: the bearer
 * token stays valid until it expires, so anyone holding a copy of it keeps
 * access. This deletes the session row the token refers to, which is the same
 * revocation the password-reset and change-password paths already perform.
 *
 * The call is idempotent and always answers 200 with `{ ok: true }` once it has
 * a database, because the client has to be able to drop its local session even
 * when the token is already expired, already revoked, or malformed.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database binding unavailable' }), {
      status: 500,
      headers: JSON_HEADERS,
    })
  }

  // Rate limit: 30 sign-outs per 10 minutes per IP.
  const clientIp = getClientIp(context.request)
  const limit = await checkRateLimit(db, `logout:ip:${clientIp}`, 30, 600)
  if (!limit.allowed) {
    return rateLimitExceededResponse(limit.retryAfter)
  }

  const token = extractBearerToken(context.request)
  if (!token) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: JSON_HEADERS })
  }

  // `all: true` signs out every device for the account, not just this one.
  let all = false
  try {
    const body = (await context.request.json()) as { all?: boolean } | null
    all = body?.all === true
  } catch {
    /* no body, or not JSON: treat as a single-session sign-out */
  }

  try {
    const session = await verifySessionToken(token, requireSecret(context.env), db)
    if (session) {
      if (all) {
        await revokeAllUserSessions(db, session.userId)
      } else if (session.jti) {
        await revokeSession(db, session.jti)
      }
    }
  } catch (err) {
    // Never fail the sign-out on a verification problem. The token is either
    // already unusable or the deployment is misconfigured; either way the
    // client still needs to clear its session, and the error is logged here.
    console.warn('[Logout] Session could not be revoked:', err)
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: JSON_HEADERS })
}
