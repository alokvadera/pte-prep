import type { Env, UserRecord } from '../../types'
import { sha256Hex } from '../../lib/auth'
import { sendBrevoEmail } from '../../lib/brevo'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '../../lib/rateLimit'

async function padDuration(startMs: number, targetMs = 350): Promise<void> {
  const elapsed = Date.now() - startMs
  if (elapsed < targetMs) {
    await new Promise((r) => setTimeout(r, targetMs - elapsed))
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const start = Date.now()
  let parsed: unknown
  try {
    parsed = await context.request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const body = parsed as { email?: unknown }

  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return new Response(JSON.stringify({ error: 'Please enter a valid email address' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const db = context.env.DB
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database binding unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Validate email service configuration upfront so unconfigured environments fail uniformly
  // without leaking account existence through conditional 503 vs 200 responses.
  const brevoKey = context.env.BREVO_API_KEY
  const senderEmail = context.env.BREVO_SENDER_EMAIL
  const senderName = context.env.BREVO_SENDER_NAME || 'PTE Prep'
  if (!brevoKey || !senderEmail) {
    console.warn('Brevo email service is not configured in environment.')
    return new Response(JSON.stringify({ error: 'Email service is currently unavailable.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Rate limit: 10 requests per 10 minutes per IP, 3 requests per 10 minutes per email
  const clientIp = getClientIp(context.request)
  const ipCheck = await checkRateLimit(db, `forgot-password:ip:${clientIp}`, 10, 600)
  if (!ipCheck.allowed) {
    return rateLimitExceededResponse(ipCheck.retryAfter)
  }
  const emailCheck = await checkRateLimit(db, `forgot-password:email:${rawEmail}`, 3, 600)
  if (!emailCheck.allowed) {
    return rateLimitExceededResponse(emailCheck.retryAfter)
  }

  const genericSuccess = new Response(
    JSON.stringify({
      ok: true,
      message: 'If an account exists with that email, we have sent password reset instructions.',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )

  // Expired links are unusable, and every reset adds a row to this table. The
  // cleanup is best-effort: a failure must not break the request.
  await db
    .prepare("DELETE FROM password_resets WHERE datetime(expires_at) <= datetime('now')")
    .run()
    .catch((err) => console.warn('[Auth] Reset token cleanup failed:', err))

  // Look up user
  const user = await db
    .prepare('SELECT id, email FROM users WHERE email = ?')
    .bind(rawEmail)
    .first<Pick<UserRecord, 'id' | 'email'>>()

  if (!user) {
    // Equalize timing via dummy query and hash to prevent user enumeration
    await db
      .prepare(
        "SELECT id FROM password_resets WHERE user_id = ? AND datetime(created_at) > datetime('now', '-2 minutes') LIMIT 1",
      )
      .bind('usr_dummy_timing_probe')
      .first()
    await sha256Hex('dummy_token_pad_for_constant_time')
    await padDuration(start, 350)
    return genericSuccess
  }

  // Rate limit: throttle repeated reset emails to once per 2 minutes
  const recent = await db
    .prepare(
      "SELECT id FROM password_resets WHERE user_id = ? AND datetime(created_at) > datetime('now', '-2 minutes') LIMIT 1",
    )
    .bind(user.id)
    .first<{ id: string }>()

  if (recent) {
    await padDuration(start, 350)
    return genericSuccess
  }

  // Generate random 64-char token & hash it
  const rawToken = `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`
  const tokenHash = await sha256Hex(rawToken)
  const resetId = `rst_${crypto.randomUUID().replace(/-/g, '')}`
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 mins

  // Store hashed token in D1
  await db
    .prepare(
      'INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    )
    .bind(resetId, user.id, tokenHash, expiresAt)
    .run()

  // Build reset link
  const requestUrl = new URL(context.request.url)
  const origin = context.env.SITE_ORIGIN || requestUrl.origin
  // Keep reset links inside a configured sub-path deployment. The Pages
  // function sees the mounted request path even when BASE_PATH is only a
  // build-time variable and is not present in the runtime environment.
  const apiPath = '/api/auth/forgot-password'
  const basePath = requestUrl.pathname.endsWith(apiPath)
    ? requestUrl.pathname.slice(0, -apiPath.length).replace(/\/+$/, '')
    : ''
  const resetUrl = new URL(`${basePath}/reset-password`, origin)
  resetUrl.searchParams.set('token', rawToken)
  const resetLink = resetUrl.toString()

  const escHtml = (s: string): string => {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #18181b;">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 8px 0; color: #18181b;">Reset your PTE Prep password</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #52525b; margin: 0;">
          We received a request to reset the password for your account (<strong>${escHtml(user.email)}</strong>).
        </p>
      </div>
      
      <div style="margin: 28px 0;">
        <a href="${resetLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 24px; border-radius: 8px; text-decoration: none; text-align: center;">
          Reset Password
        </a>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #71717a;">
        This link will expire in <strong>15 minutes</strong> for security reasons. If you did not request a password reset, you can safely ignore this email.
      </p>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      
      <p style="font-size: 12px; color: #a1a1aa; line-height: 1.4;">
        If the button above does not work, copy and paste this link into your browser:<br />
        <a href="${resetLink}" style="color: #4f46e5; word-break: break-all;">${resetLink}</a>
      </p>
    </div>
  `

  const sendRes = await sendBrevoEmail({
    apiKey: brevoKey,
    senderEmail,
    senderName,
    to: user.email,
    subject: 'Reset your PTE Prep password',
    htmlContent,
    textContent: `Reset your PTE Prep password by visiting: ${resetLink} (Expires in 15 minutes).`,
  })

  if (!sendRes.ok) {
    // Answer exactly as if the mail had gone out. Only a registered address
    // reaches this branch, so a 503 here would confirm that the account exists
    // — the one thing the generic response above is built to hide. The failure
    // is logged for the operator instead.
    console.warn('Failed to send reset email via Brevo:', sendRes.error)
    await padDuration(start, 350)
    return genericSuccess
  }

  return genericSuccess
}
