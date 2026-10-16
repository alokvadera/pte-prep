export interface BrevoSendOptions {
  apiKey: string
  senderEmail: string
  senderName?: string
  to: string
  toName?: string
  subject: string
  htmlContent: string
  textContent?: string
}

export interface BrevoSendResult {
  ok: boolean
  messageId?: string
  error?: string
}

/**
 * Sends a transactional email using Brevo's v3 API.
 * Uses standard fetch, requiring zero Node packages.
 */
export async function sendBrevoEmail(options: BrevoSendOptions): Promise<BrevoSendResult> {
  const { apiKey, senderEmail, senderName = 'PTE Prep', to, toName, subject, htmlContent, textContent } = options

  if (!apiKey) {
    return { ok: false, error: 'BREVO_API_KEY is not configured.' }
  }

  if (!senderEmail) {
    return { ok: false, error: 'BREVO_SENDER_EMAIL is not configured.' }
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: to,
            ...(toName ? { name: toName } : {}),
          },
        ],
        subject,
        htmlContent,
        ...(textContent ? { textContent } : {}),
      }),
    })

    const rawText = await response.text()
    let data: { messageId?: string; message?: string; code?: string } = {}
    try {
      data = JSON.parse(rawText) as { messageId?: string; message?: string; code?: string }
    } catch {
      console.warn('Brevo API response is not valid JSON:', response.status, rawText)
    }

    if (!response.ok) {
      const errorMessage = data.message || `Brevo API error (${response.status}): ${rawText.slice(0, 200)}`
      console.error('Brevo API delivery failed:', response.status, data, rawText)
      return { ok: false, error: errorMessage }
    }

    return { ok: true, messageId: data.messageId }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('Network error calling Brevo API:', error)
    return { ok: false, error }
  }
}
