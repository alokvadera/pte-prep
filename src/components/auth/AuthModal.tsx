import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button } from '../ui/primitives'
import { useAuth } from '../../store/useAuth'
import { syncCloudToLocal } from '../../lib/sync'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const TARGET_PRESETS = [50, 65, 79, 85]

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const { user, login, logout, loading, error, setTargetScore } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)

  // Focus trap + Escape dismiss
  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusable[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0]!
        const last = focusable[focusable.length - 1]!
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    const ok = await login(email.trim(), password || undefined)
    if (ok) {
      setIsSyncing(true)
      await syncCloudToLocal()
      setIsSyncing(false)
      onSuccess?.()
      onClose()
    }
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    setSyncStatus(null)
    const { pushed, pulled } = await syncCloudToLocal()
    setIsSyncing(false)
    setSyncStatus(`Synced! (${pushed} uploaded, ${pulled} downloaded)`)
    onSuccess?.()
    setTimeout(() => setSyncStatus(null), 3500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="card-solid animate-modal-enter relative w-full max-w-md p-6 shadow-xl space-y-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="auth-modal-title" className="text-ink-900 dark:text-white text-lg font-bold">
              {user ? 'Cloud Account' : 'Cloud Backup & Sync'}
            </h2>
            <p className="text-ink-500 dark:text-ink-400 text-xs mt-1">
              {user
                ? 'Your test attempts are saved to your private Cloudflare D1 storage.'
                : 'Back up your tests and practice records to Cloudflare edge database.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-ink-400 hover:text-ink-700 dark:text-ink-500 dark:hover:text-ink-200 cursor-pointer rounded-md p-1"
          >
            <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-4 dark:border-white/8 dark:bg-white/4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500 dark:text-ink-400 font-medium">Logged in as</span>
                <Badge tone="mint">Synced</Badge>
              </div>
              <p className="font-semibold text-sm text-ink-900 dark:text-white break-all">{user.email}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1.5">
                Target Score: <span className="text-brand-600 dark:text-brand-400 font-bold">{user.targetScore}</span>
              </label>
              <div className="flex gap-2">
                {TARGET_PRESETS.map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => void setTargetScore(score)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                      user.targetScore === score
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'border-ink-200 bg-white text-ink-700 dark:border-white/10 dark:bg-ink-800 dark:text-ink-200 hover:border-brand-300'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            {syncStatus && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium" role="status">
                {syncStatus}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-ink-100 dark:border-white/6">
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign out
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleManualSync} disabled={isSyncing}>
                  {isSyncing ? 'Syncing...' : 'Sync now'}
                </Button>
                <Button variant="primary" size="sm" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1.5">
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none dark:border-white/10 dark:bg-ink-800 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1.5">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (if set)"
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none dark:border-white/10 dark:bg-ink-800 dark:text-white"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-ink-100 dark:border-white/6">
              <Link
                to="/login"
                onClick={onClose}
                className="text-xs text-brand-600 hover:underline dark:text-brand-400 font-semibold"
              >
                Full login / register page →
              </Link>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={loading || !email.trim()}>
                  {loading ? 'Signing in...' : 'Sign in & Sync'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
