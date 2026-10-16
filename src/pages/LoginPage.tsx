import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { syncCloudToLocal } from '../lib/sync'
import { Badge, Button, ButtonLink, Card, PageWrapper } from '../components/ui/primitives'
import { Dialog } from '../components/ui/dialog'
import { Reveal } from '../components/ui/motion'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Seo } from '../seo/Seo'

const TARGET_PRESETS = [50, 65, 79, 85]

export default function LoginPage() {
  const [params, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, login, register, logout, loading, error, clearError, setTargetScore, hasLoggedInBefore, lastEmail } = useAuth()

  const mode: 'login' | 'register' =
    params.get('mode') === 'register' || location.pathname === '/register'
      ? 'register'
      : params.get('mode') === 'login' || location.pathname === '/login'
        ? 'login'
        : hasLoggedInBefore
          ? 'login'
          : 'register'

  const [email, setEmail] = useState(lastEmail ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [targetScore, setTarget] = useState(65)
  const [showPassword, setShowPassword] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const syncTimer = useRef<number | null>(null)

  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotStatus, setForgotStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetEmail = (forgotEmail || email).trim()
    if (!targetEmail) return
    setForgotLoading(true)
    setForgotStatus(null)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      })
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string }
      if (res.ok) {
        setForgotStatus({
          ok: true,
          message: data.message ?? 'If an account exists with that email, we have sent password reset instructions.',
        })
      } else {
        setForgotStatus({
          ok: false,
          message: data.error ?? 'Failed to send reset link. Please try again.',
        })
      }
    } catch {
      setForgotStatus({
        ok: false,
        message: 'Could not connect to authentication service. Please check your connection.',
      })
    } finally {
      setForgotLoading(false)
    }
  }

  useEffect(() => () => {
    if (syncTimer.current !== null) window.clearTimeout(syncTimer.current)
  }, [])

  // `from` is attacker-controllable, so only same-site paths are allowed.
  // A protocol-relative value like `//evil.com` is treated as a path by the
  // router but as an absolute URL by anything that reads it later, so it is
  // rejected alongside the obvious `https://` and backslash forms.
  const rawFrom = params.get('from')
  const redirectUrl =
    rawFrom && rawFrom.startsWith('/') && !rawFrom.startsWith('//') && !rawFrom.includes('\\')
      ? rawFrom
      : '/dashboard'

  useEffect(() => {
    clearError()
  }, [clearError])

  const switchMode = (newMode: 'login' | 'register') => {
    clearError()
    setClientError(null)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('mode', newMode)
      return next
    }, { replace: true })
  }

  // The mode tabs are a real tab list: arrows move between them
  // (activating as they go — the form below is cheap to re-render),
  // Home/End jump to the ends, and only the active tab sits in the
  // Tab order.
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const handleTabKey = (e: React.KeyboardEvent) => {
    const current = mode === 'login' ? 0 : 1
    let next = current
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (current + 1) % 2
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (current - 1 + 2) % 2
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = 1
    else return
    e.preventDefault()
    switchMode(next === 0 ? 'login' : 'register')
    tabRefs.current[next]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setClientError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setClientError('Please enter your email address.')
      return
    }

    if (!password) {
      setClientError('Please enter your password.')
      return
    }

    if (mode === 'register') {
      if (password.length < 8) {
        setClientError('Password must be at least 8 characters.')
        return
      }
      if (password !== confirmPassword) {
        setClientError('Passwords do not match.')
        return
      }

      const ok = await register(trimmedEmail, password, targetScore)
      if (ok) {
        setSyncing(true)
        await syncCloudToLocal()
        setSyncing(false)
        navigate(redirectUrl)
      }
    } else {
      const ok = await login(trimmedEmail, password)
      if (ok) {
        setSyncing(true)
        try {
          await syncCloudToLocal()
        } finally {
          setSyncing(false)
        }
        navigate(redirectUrl)
      }
    }
  }

  const handleManualSync = async () => {
    setSyncing(true)
    setSyncSuccess(false)
    try {
      await syncCloudToLocal()
      setSyncSuccess(true)
      if (syncTimer.current !== null) window.clearTimeout(syncTimer.current)
      syncTimer.current = window.setTimeout(() => setSyncSuccess(false), 3000)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      <Seo />

      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Account' }]} />}
        eyebrow="Cloud Account"
        title={user ? 'Your PTE Prep Account' : mode === 'register' ? 'Create your account' : 'Welcome back'}
        description={
          user
            ? 'Manage your cloud sync preferences and target scores.'
            : 'Save your mock tests, overall score trends, and skill diagnostics to Cloudflare edge storage.'
        }
      >
        <div className="mt-8 max-w-md mx-auto">
          {user ? (
            <Card variant="solid" className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-ink-500 dark:text-ink-on-dark-muted">Signed in as</span>
                  <p className="text-base font-bold text-ink-900 dark:text-white break-all mt-0.5">{user.email}</p>
                </div>
                <Badge tone="mint">Synced</Badge>
              </div>

              <div className="rounded-md border border-ink-100 bg-ink-50/70 p-4 dark:border-white/8 dark:bg-white/4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">Target PTE Score</span>
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-300">{user.targetScore}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  {TARGET_PRESETS.map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => void setTargetScore(score)}
                      className={`flex-1 rounded-md py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                        user.targetScore === score
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 dark:border-white/10 dark:bg-ink-800 dark:text-ink-200'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              {syncSuccess && (
                <p className="text-xs text-mint-700 dark:text-mint-300 font-medium" role="status">
                  ✓ All tests and scores are synced with cloud storage.
                </p>
              )}

              <PasswordChangeForm />

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <ButtonLink to="/dashboard" variant="primary" className="flex-1 justify-center">
                  Go to Dashboard
                </ButtonLink>
                <Button
                  variant="secondary"
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="flex-1 justify-center"
                >
                  {syncing ? 'Syncing...' : 'Sync now'}
                </Button>
              </div>

              <div className="pt-4 border-t border-ink-100 dark:border-white/6 flex justify-between items-center text-xs">
                <span className="text-ink-500 dark:text-ink-on-dark-muted">Need to switch accounts?</span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </Card>
           ) : (
             <Reveal variant="up" duration={600} delay={50} className="w-full">
               <Card variant="solid" className="p-6 sm:p-8 dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10">
               
              {/* Tab Selector */}
               <div
                 className="flex rounded-md bg-ink-100/80 p-1 dark:bg-white/5 mb-6"
                 role="tablist"
                 aria-label="Account mode"
                 onKeyDown={handleTabKey}
               >
                 <button
                   ref={(el) => { tabRefs.current[0] = el }}
                   type="button"
                   role="tab"
                   id="tab-sign-in"
                   aria-selected={mode === 'login'}
                   tabIndex={mode === 'login' ? 0 : -1}
                   onClick={() => switchMode('login')}
                   className={`flex-1 rounded-md py-2 text-xs font-bold transition-all duration-300 ease-out cursor-pointer ${
                     mode === 'login'
                       ? 'bg-white text-ink-900 dark:bg-white/10 dark:text-white'
                       : 'text-ink-600 hover:text-ink-900 dark:text-ink-on-dark-muted dark:hover:text-white'
                   }`}
                 >
                   Sign In
                 </button>
                 <button
                   ref={(el) => { tabRefs.current[1] = el }}
                   type="button"
                   role="tab"
                   id="tab-create-account"
                   aria-selected={mode === 'register'}
                   tabIndex={mode === 'register' ? 0 : -1}
                   onClick={() => switchMode('register')}
                   className={`flex-1 rounded-md py-2 text-xs font-bold transition-all duration-300 ease-out cursor-pointer ${
                     mode === 'register'
                       ? 'bg-white text-ink-900 dark:bg-white/10 dark:text-white'
                       : 'text-ink-600 hover:text-ink-900 dark:text-ink-on-dark-muted dark:hover:text-white'
                   }`}
                 >
                   Create Account
                 </button>
               </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-ink-700 dark:text-ink-on-dark mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 dark:border-white/10 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-on-dark-faint"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-ink-700 dark:text-ink-on-dark"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300 cursor-pointer"
                    >
                      {showPassword ? 'Hide password' : 'Show password'}
                    </button>
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
                    minLength={mode === 'register' ? 8 : undefined}
                    className="w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 dark:border-white/10 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-on-dark-faint"
                  />
                  {mode === 'login' && (
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email)
                          setForgotStatus(null)
                          setShowForgotModal(true)
                        }}
                        className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300 cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {mode === 'register' && (
                  <>
                    <div>
                      <label
                        htmlFor="login-confirm-password"
                        className="block text-xs font-semibold text-ink-700 dark:text-ink-on-dark mb-1.5"
                      >
                        Confirm Password
                      </label>
                      <input
                        id="login-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type your password"
                        className="w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 dark:border-white/10 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-on-dark-faint"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-700 dark:text-ink-on-dark mb-1.5">
                        Target PTE Score
                      </label>
                      <div className="flex gap-2">
                        {TARGET_PRESETS.map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => setTarget(score)}
                            className={`flex-1 rounded-md py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                              targetScore === score
                                ? 'bg-brand-500 text-white border-brand-500'
                                : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 dark:border-white/10 dark:bg-ink-800 dark:text-ink-200'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {(clientError || error) && (
                  <div
                    key={clientError || error}
                    className="animate-error-nudge rounded-md border border-rose-500/30 bg-rose-500/[0.06] p-3 text-xs font-medium text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300"
                    role="alert"
                  >
                    {clientError || error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading || syncing}
                  className="w-full justify-center mt-2"
                >
                  {loading || syncing ? 'Signing in...' : mode === 'register' ? 'Create Account' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-ink-100 dark:border-white/6 text-center text-xs text-ink-500 dark:text-ink-on-dark-muted">
                {mode === 'login' ? (
                  <>
                    <p>
                      Don't have an account yet?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="text-brand-600 hover:underline dark:text-brand-300 font-semibold cursor-pointer"
                      >
                        Create one
                      </button>
                    </p>
                    <p className="mt-2 text-xs text-ink-500 dark:text-ink-on-dark-muted">
                      Forgot your password? It can be reset from the account page on any device where
                      you are still signed in. Your local practice history is unaffected either way.
                    </p>
                  </>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-brand-600 hover:underline dark:text-brand-300 font-semibold cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </Card>
          </Reveal>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/privacy/"
              className="text-xs text-ink-500 dark:text-ink-on-dark-muted hover:underline"
            >
              Privacy policy, Local by default, optional cloud sync
            </Link>
          </div>
        </div>

        <Dialog
          open={showForgotModal}
          onClose={() => setShowForgotModal(false)}
          title="Reset your password"
        >
          <p className="text-sm text-ink-600 dark:text-ink-on-dark-muted mb-4">
            Enter your email address, and we will send you a secure link to reset your password.
          </p>

          {forgotStatus && (
            <div
              className={`mb-4 rounded-lg p-3.5 text-xs font-medium ${
                forgotStatus.ok
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
              }`}
            >
              {forgotStatus.message}
            </div>
          )}

          {!forgotStatus?.ok ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-semibold text-ink-700 dark:text-ink-on-dark mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 dark:border-white/10 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-on-dark-faint"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForgotModal(false)}
                  disabled={forgotLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={forgotLoading}>
                  {forgotLoading ? 'Sending link...' : 'Send reset link'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={() => setShowForgotModal(false)}
              >
                Done
              </Button>
            </div>
          )}
        </Dialog>
      </PageWrapper>
    </>
  )
}

function PasswordChangeForm() {
  const changePassword = useAuth((s) => s.changePassword)
  const [currentPassword, setCurrentPassword] = useState('')
  const [value, setValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!currentPassword) {
      setMessage({ kind: 'error', text: 'Current password is required.' })
      return
    }
    if (value.length < 8) {
      setMessage({ kind: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    if (value !== confirm) {
      setMessage({ kind: 'error', text: 'Passwords do not match.' })
      return
    }
    setBusy(true)
    try {
      const result = await changePassword(currentPassword, value)
      if (result === true) {
        setCurrentPassword('')
        setValue('')
        setConfirm('')
        setMessage({ kind: 'ok', text: 'Password changed. Use it next time you sign in.' })
      } else {
        setMessage({ kind: 'error', text: result })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-ink-100 bg-ink-50/70 p-4 dark:border-white/8 dark:bg-white/4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">Password</span>
        <span className="text-xs text-ink-500 dark:text-ink-on-dark-muted">Change your account password.</span>
      </div>
      <input
        type="password"
        autoComplete="current-password"
        aria-label="Current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Current password"
        required
        className="w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 dark:border-white/10 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-on-dark-faint"
      />
      <input
        type="password"
        autoComplete="new-password"
        aria-label="New password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="New password, at least 8 characters"
        minLength={8}
        className="w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 dark:border-white/10 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-on-dark-faint"
      />
      <input
        type="password"
        autoComplete="new-password"
        aria-label="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        className="w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 dark:border-white/10 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-on-dark-faint"
      />
      {message ? (
        <p
          key={message.text}
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={
            message.kind === 'error'
              ? 'animate-error-nudge text-xs font-medium text-rose-600 dark:text-rose-300'
              : 'text-xs font-medium text-mint-700 dark:text-mint-300'
          }
        >
          {message.text}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" size="sm" disabled={busy} className="w-full justify-center">
        {busy ? 'Changing…' : 'Change password'}
      </Button>
    </form>
  )
}
