import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', className)} {...rest}>
      {children}
    </div>
  )
}

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="page-heading">
      <div className="min-w-0">
        <p className="page-heading-kicker">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-intro">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </header>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-ink-500 dark:text-ink-400 mb-1.5 flex items-center gap-2 font-mono text-micro">
            <span aria-hidden="true" className="bg-brand-500 inline-block h-px w-5" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="section-title">{title}</h2>
        {description ? (
          <p className="text-ink-500 dark:text-ink-300 mt-1.5 max-w-2xl text-sm leading-relaxed">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

type Tone = 'neutral' | 'brand' | 'mint' | 'amber' | 'rose'

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-600 dark:bg-white/8 dark:text-ink-200',
  brand: 'bg-brand-500/12 text-brand-700 dark:text-brand-300 dark:bg-brand-500/18',
  mint: 'bg-mint-500/14 text-mint-700 dark:text-mint-300 dark:bg-mint-500/16',
  amber: 'bg-amber-500/14 text-amber-700 dark:text-amber-300 dark:bg-amber-500/16',
  rose: 'bg-rose-brand/14 text-rose-600 dark:text-rose-300',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: ReactNode
}) {
  return <span className={cn('pill', TONES[tone], className)}>{children}</span>
}

export function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  sub?: string
  tone?: Tone
}) {
  return (
    <div className="card-solid p-4">
      <p className="text-ink-500 dark:text-ink-400 text-xs font-semibold">{label}</p>
      <p
        className={cn(
          'mt-1.5 font-bold tabular-nums',
          tone === 'mint' && 'text-mint-600 dark:text-mint-300',
          tone === 'brand' && 'text-brand-600 dark:text-brand-300',
          tone === 'amber' && 'text-amber-600 dark:text-amber-300',
          tone === 'rose' && 'text-rose-600 dark:text-rose-300',
          tone === 'neutral' && 'text-ink-900 dark:text-white',
        )}
      >
        {value}
      </p>
      {sub ? <p className="text-ink-500 dark:text-ink-400 mt-0.5 text-xs">{sub}</p> : null}
    </div>
  )
}

export function ProgressBar({
  value,
  max = 1,
  tone = 'brand',
  className,
  label,
}: {
  value: number
  max?: number
  tone?: 'brand' | 'mint' | 'amber' | 'rose'
  className?: string
  label?: string
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100))
  const colors = {
    brand: 'bg-brand-500',
    mint: 'bg-mint-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-brand',
  }
  return (
    <div
      className={cn('bg-ink-200 dark:bg-white/10 h-2 w-full overflow-hidden rounded-full', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', colors[tone])} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2.5">
      <span className="min-w-0">
        <span className="text-ink-800 dark:text-ink-100 block text-sm font-medium">{label}</span>
        {description ? <span className="text-ink-500 dark:text-ink-400 block text-xs">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors',
          checked ? 'border-brand-500 bg-brand-500' : 'border-ink-300 bg-ink-200 dark:border-white/15 dark:bg-white/10',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4.5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5.5' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  )
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {icon ? <div className="text-ink-300 dark:text-ink-400 mb-3">{icon}</div> : null}
      <h3 className="text-ink-900 dark:text-white text-base font-semibold text-balance">{title}</h3>
      <p className="text-ink-500 dark:text-ink-400 mt-1.5 max-w-sm text-sm">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

/**
 * The closing call to action, shared by every content page so the ending of a
 * page is always the same shape. A flat tinted field separated by a rule — the
 * one place the accent tints a whole surface, which is why it stays a tint and
 * never a gradient.
 */
export function CtaBand({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description: string
  actions: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'bg-brand-500/[0.06] dark:bg-brand-500/10 border-ink-200 dark:border-white/10 mt-16 border-b border-t-2 border-t-brand-500 p-8 text-center sm:p-10',
        className,
      )}
    >
      <h2 className="section-title">{title}</h2>
      <p className="text-ink-600 dark:text-ink-300 mx-auto mt-3 max-w-md leading-relaxed">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>
    </section>
  )
}
