import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Card.

   One surface for everything that reads as a contained unit. The `.card`
   utility owns colour, border, radius and padding; this component only adds
   the polymorphic `as` prop and a way to opt out of the default padding for
   tables and media, which always need `p-0`.

   Variants:
   - default   translucent white over the page ground (most cards)
   - solid     opaque white / ink-850, for dense or interactive panels
   - exam      solid + a hard 3px brand top rule (section summaries only)
--------------------------------------------------------------------------- */

type CardVariant = 'default' | 'solid' | 'exam'

const CARD_UTILITY: Record<CardVariant, string> = {
  default: 'card',
  solid: 'card-solid',
  exam: 'card-exam',
}

export function Card({
  as = 'div',
  variant = 'default',
  flush = false,
  className,
  children,
  ...rest
}: {
  as?: 'div' | 'section' | 'article' | 'li'
  variant?: CardVariant
  /** Removes the default padding, for tables and full-bleed content. */
  flush?: boolean
  className?: string
  children: ReactNode
} & Omit<React.HTMLAttributes<HTMLElement>, 'children'>) {
  const Comp = as as 'div'
  return (
    <Comp className={cn(CARD_UTILITY[variant], flush && 'p-0', className)} {...rest}>
      {children}
    </Comp>
  )
}

/**
 * The one heading style inside cards. Cards previously used text-sm, text-base
 * and text-lg headings with three different weights; every card H3 is now this.
 */
export function CardTitle({ className, children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-ink-900 dark:text-white text-lg font-bold leading-tight text-balance',
        className,
      )}
      {...rest}
    >
      {children}
    </h3>
  )
}

/* ---------------------------------------------------------------------------
   Button.

   A single component for every button-shaped control in the app. Variants own
   colour; sizes own padding and font size — so call sites never re-invent
   either. Renders a <button> by default, an <a> when href is given, or a
   react-router <Link> when `to` is given.

   One primary action per context: btn-primary is the filled blue pill, and it
   is the only variant that draws the eye.
--------------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
}

type ButtonOwnProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)
}

/** Base props shared by the three element flavours. */
type ButtonBaseProps = ButtonOwnProps & {
  children: ReactNode
}

export function Button(props: ButtonBaseProps & ComponentPropsWithoutRef<'button'>) {
  const { variant = 'primary', size = 'md', className, children, ...rest } = props
  return (
    <button type="button" className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink(props: ButtonBaseProps & ComponentPropsWithoutRef<typeof Link>) {
  const { variant = 'primary', size = 'md', className, children, to, ...rest } = props
  return (
    <Link to={to} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  )
}

export function ButtonAnchor(props: ButtonBaseProps & { href: string }) {
  const { variant = 'secondary', size = 'md', className, children, href, ...rest } = props
  return (
    <a href={href} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </a>
  )
}

/* ---------------------------------------------------------------------------
   Accordion.

   The single disclosure pattern. Native <details>/<summary> stays — it is the
   keyboard and no-JS story — but the chevron, hover, divider and expanded
   padding now live here so every collapsible on the site behaves identically.
   The plus rotates 45° into a close cross on open.
--------------------------------------------------------------------------- */

export function Accordion({
  items,
  className,
}: {
  items: Array<{ question: string; answer: string }>
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {items.map((f) => (
        <details key={f.question} className="card group">
          <summary className="text-ink-900 dark:text-white flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold sm:text-base [&::-webkit-details-marker]:hidden">
            {f.question}
            <AccordionMark />
          </summary>
          <p className="text-ink-500 dark:text-ink-300 mt-3 border-t pt-3 text-sm leading-relaxed">
            {f.answer}
          </p>
        </details>
      ))}
    </div>
  )
}

/** The shared open/close marker: a plus that rotates into a cross. */
function AccordionMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'text-ink-500 group-open:rotate-45 grid size-7 shrink-0 place-items-center rounded-md bg-ink-100 text-lg leading-none transition-transform duration-200 ease-out dark:bg-white/8 dark:text-ink-300',
        className,
      )}
    >
      +
    </span>
  )
}

/**
 * A disclosure card that is open to whatever content, not just an FAQ answer —
 * for the drill reference table, practice settings and per-result panels.
 * Header is always a row with a shared marker; the expanded body keeps the
 * same top divider.
 */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  className,
}: {
  summary: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  return (
    <details className={cn('card-solid group p-0', className)} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-ink-900 sm:px-6 [&::-webkit-details-marker]:hidden dark:text-white">
        <span className="min-w-0">{summary}</span>
        <AccordionMark />
      </summary>
      <div className="border-ink-200 border-t px-5 pt-4 pb-5 sm:px-6 sm:pt-5 sm:pb-6 dark:border-white/10">
        {children}
      </div>
    </details>
  )
}

/* ---------------------------------------------------------------------------
   Page wrapper.

   Every route opens with the same sequence: breadcrumbs, then the page
   heading, then content. Codifying it here means the top of every page lines
   up pixel-for-pixel — same shell, same eyebrow, same H1, same lead — and a
   new page cannot drift.

   size controls the shell only:
   - prose    3xl  About, Privacy, question-type detail
   - content  4xl  Guide, Test format, Scoring guide
   - app      5xl  Mock setup, Practice, Dashboard, Result
--------------------------------------------------------------------------- */

export function PageWrapper({
  size = 'app',
  breadcrumbs,
  eyebrow,
  title,
  description,
  actions,
  className,
  children,
}: {
  size?: 'prose' | 'content' | 'app'
  breadcrumbs?: ReactNode
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  children: ReactNode
}) {
  const shell = size === 'prose' ? 'page-shell-prose' : size === 'content' ? 'page-shell-content' : 'page-shell-app'
  return (
    <div className={cn(shell, className)}>
      {breadcrumbs ? <div className="mb-6">{breadcrumbs}</div> : null}
      {(eyebrow || title || description || actions) && (
        <PageHeading eyebrow={eyebrow} title={title} description={description} actions={actions} />
      )}
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
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="page-heading">
      <div className="min-w-0">
        {eyebrow ? <p className="page-heading-kicker">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-intro">{description}</p> : null}
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
            <span aria-hidden="true" className="bg-brand-500 dark:bg-brand-400 inline-block h-px w-5" />
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
  rose: 'bg-rose-brand/14 text-rose-600 dark:text-rose-300 dark:bg-rose-brand/18',
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
    <div className="card-solid p-4 sm:p-5">
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
      <div className={cn('h-full rounded-full origin-left animate-bar-reveal transition-[width] duration-500 ease-out', colors[tone])} style={{ width: `${pct}%` }} />
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
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        aria-checked={checked}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 ease-out',
          checked ? 'border-brand-500 bg-brand-500' : 'border-ink-300 bg-ink-200 dark:border-white/15 dark:bg-white/10',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4.5 rounded-full bg-white shadow-xs transition-transform duration-200 ease-out',
            checked ? 'translate-x-5.5' : 'translate-x-0.5',
          )}
        />
      </span>
    </label>
  )
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {icon ? <div className="text-ink-300 dark:text-ink-400 mb-3">{icon}</div> : null}
      <h3 className="text-ink-900 dark:text-white text-lg font-bold text-balance">{title}</h3>
      <p className="text-ink-500 dark:text-ink-400 mt-1.5 max-w-sm text-sm leading-relaxed">{description}</p>
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
        'bg-brand-500/[0.06] dark:bg-brand-500/10 border-ink-200 dark:border-white/10 mt-16 rounded-xl border border-t-4 border-t-brand-500 dark:border-t-brand-400 p-8 text-center sm:p-10 shadow-xs',
        className,
      )}
    >
      <h2 className="section-title">{title}</h2>
      <p className="text-ink-600 dark:text-ink-300 mx-auto mt-3 max-w-md leading-relaxed">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>
    </section>
  )
}
