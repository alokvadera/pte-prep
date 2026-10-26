import type { ItemResponse } from '../domain/types'

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  if (total < 60) return `${total}s`
  const m = Math.floor(total / 60)
  const s = total % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  // An unparseable date makes toLocaleDateString throw, which would take the
  // whole view down over one bad record.
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${formatDate(iso)}, ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function percent(value: number, total: number): number {
  if (total <= 0) return 0
  return clamp((value / total) * 100, 0, 100)
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

export function titleCase(input: string): string {
  return input.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function validateResetPasswordForm(
  token: string | null | undefined,
  password: string,
  confirmPassword: string,
): { valid: boolean; error?: string } {
  if (!token) {
    return { valid: false, error: 'Missing or invalid reset token. Please request a new link.' }
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' }
  }
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match.' }
  }
  return { valid: true }
}

export function formatResponseEchoLines(
  response: ItemResponse,
  tokens?: readonly string[],
): string[] {
  const lines: string[] = []
  const choice = response.choice as string | undefined
  if (choice) lines.push(`Your answer: ${choice}`)
  const choices = response.choices as string[] | undefined
  if (choices && choices.length) lines.push(`Your answers: ${choices.join(', ')}`)
  const blanks = response.blanks
  if (Array.isArray(blanks) && blanks.length > 0) {
    lines.push(`Your answers: ${blanks.map((b, i) => b || `(blank ${i + 1})`).join(', ')}`)
  }
  const order = response.order as string[] | undefined
  if (order) lines.push(`Your order: ${order.join(' → ')}`)
  const highlighted = response.highlighted as number[] | undefined
  if (highlighted && highlighted.length > 0) {
    lines.push(
      `You highlighted: ${highlighted.map((i) => (tokens?.[i] ? `“${tokens[i]}”` : `#${i + 1}`)).join(', ')}`,
    )
  }
  const text = response.text as string | undefined
  if (text) lines.push(`You wrote: ${text}`)
  const transcript = response.transcript as string | undefined
  if (transcript) lines.push(`Your answer (transcribed): ${transcript}`)

  return lines
}
