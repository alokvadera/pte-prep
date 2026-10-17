import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { Button, Card, PageWrapper } from '../components/ui/primitives'
import { Reveal } from '../components/ui/motion'
import { Seo } from '../seo/Seo'

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

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setSession } = useAuth()

  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (navTimer.current !== null) window.clearTimeout(navTimer.current)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const check = validateResetPasswordForm(token, password, confirmPassword)
    if (!check.valid) {
      setError(check.error ?? 'Invalid input')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        token?: string
        expiresAt?: number
        user?: { id: string; email: string; targetScore: number }
      }

      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Failed to reset password. Please try again.')
        setLoading(false)
        return
      }

      setSuccess(true)
      if (data.token && data.user) {
        setSession(data.user, data.token, data.expiresAt)
      }

      if (navTimer.current !== null) window.clearTimeout(navTimer.current)
      navTimer.current = window.setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch {
      setError('Could not connect to authentication service. Please check your connection.')
      setLoading(false)
    }
  }

  return (
    <>
      <Seo />

      <PageWrapper
        eyebrow="Security"
        title="Set new password"
        description="Choose a secure password of at least 8 characters for your account."
      >
        <div className="mx-auto max-w-md py-6 sm:py-10">
          <Reveal>
            <Card className="p-6 sm:p-8 shadow-sm">
            {!token ? (
              <div className="space-y-4 text-center">
                <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="font-semibold">Invalid or missing token</p>
                  <p className="mt-1">
                    This password reset link is invalid or incomplete. Please request a new link from the sign-in page.
                  </p>
                </div>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/login')}>
                  Back to Sign In
                </Button>
              </div>
            ) : success ? (
              <div className="space-y-4 text-center">
                <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <p className="font-semibold">Password updated!</p>
                  <p className="mt-1">
                    Your password has been reset successfully. Redirecting you to your dashboard...
                  </p>
                </div>
                <Button variant="primary" className="w-full" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 font-medium"
                  >
                    {error}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="new-password"
                      className="block text-xs font-semibold text-ink-700 dark:text-ink-on-dark"
                    >
                      New password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300 cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 dark:border-white/10 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-on-dark-faint"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-new-password"
                    className="block text-xs font-semibold text-ink-700 dark:text-ink-on-dark mb-1.5"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirm-new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your new password"
                    className="w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 dark:border-white/10 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-on-dark-faint"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Updating password...' : 'Update Password & Sign In'}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="text-xs font-medium text-ink-600 hover:text-ink-900 dark:text-ink-on-dark-muted dark:hover:text-white"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </Card>
        </Reveal>
      </div>
    </PageWrapper>
  </>
)
}
