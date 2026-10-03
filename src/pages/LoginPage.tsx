import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { syncCloudToLocal } from '../lib/sync'
import { Badge, Button, ButtonLink, Card, PageWrapper } from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Seo } from '../seo/Seo'

const TARGET_PRESETS = [50, 65, 79, 85]

export default function LoginPage() {
  const [params, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, login, register, logout, loading, error, clearError, setTargetScore } = useAuth()

  const initialMode = params.get('mode') === 'register' || location.pathname === '/register' ? 'register' : 'login'
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [targetScore, setTarget] = useState(65)
  const [showPassword, setShowPassword] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)

  const redirectUrl = params.get('from') || '/dashboard'

  useEffect(() => {
    clearError()
  }, [clearError])

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode)
    clearError()
    setClientError(null)
    setSearchParams({ mode: newMode }, { replace: true })
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
      if (password.length < 6) {
        setClientError('Password must be at least 6 characters long.')
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
        await syncCloudToLocal()
        setSyncing(false)
        navigate(redirectUrl)
      }
    }
  }

  const handleManualSync = async () => {
    setSyncing(true)
    setSyncSuccess(false)
    await syncCloudToLocal()
    setSyncing(false)
    setSyncSuccess(true)
    setTimeout(() => setSyncSuccess(false), 3000)
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
                  <span className="text-xs font-semibold text-ink-500 dark:text-ink-400">Signed in as</span>
                  <p className="text-base font-bold text-ink-900 dark:text-white break-all mt-0.5">{user.email}</p>
                </div>
                <Badge tone="mint">Synced</Badge>
              </div>

              <div className="rounded-xl border border-ink-100 bg-ink-50/70 p-4 dark:border-white/8 dark:bg-white/4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">Target PTE Score</span>
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{user.targetScore}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  {TARGET_PRESETS.map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => void setTargetScore(score)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                        user.targetScore === score
                          ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                          : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 dark:border-white/10 dark:bg-ink-800 dark:text-ink-200'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              {syncSuccess && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium" role="status">
                  ✓ All tests and scores are synced with Cloudflare D1.
                </p>
              )}

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
                <span className="text-ink-400">Need to switch accounts?</span>
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
            <Card variant="solid" className="p-6 sm:p-8">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-ink-100/80 p-1 dark:bg-white/6 mb-6" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  onClick={() => switchMode('login')}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-ink-900 shadow-xs dark:bg-ink-800 dark:text-white'
                      : 'text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  onClick={() => switchMode('register')}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-ink-900 shadow-xs dark:bg-ink-800 dark:text-white'
                      : 'text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1.5"
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
                    className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none dark:border-white/10 dark:bg-ink-800 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-ink-700 dark:text-ink-300"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-micro font-medium text-brand-600 hover:underline dark:text-brand-400 cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none dark:border-white/10 dark:bg-ink-800 dark:text-white"
                  />
                </div>

                {mode === 'register' && (
                  <>
                    <div>
                      <label
                        htmlFor="login-confirm-password"
                        className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1.5"
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
                        className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none dark:border-white/10 dark:bg-ink-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1.5">
                        Target PTE Score
                      </label>
                      <div className="flex gap-2">
                        {TARGET_PRESETS.map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => setTarget(score)}
                            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                              targetScore === score
                                ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
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
                    className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300 font-medium"
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

              <div className="mt-6 pt-5 border-t border-ink-100 dark:border-white/6 text-center text-xs text-ink-500 dark:text-ink-400">
                {mode === 'login' ? (
                  <p>
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-brand-600 hover:underline dark:text-brand-400 font-semibold cursor-pointer"
                    >
                      Create one
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-brand-600 hover:underline dark:text-brand-400 font-semibold cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </Card>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/privacy"
              className="text-micro text-ink-400 dark:text-ink-500 hover:underline"
            >
              Privacy policy · Your tests remain private to your account
            </Link>
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
