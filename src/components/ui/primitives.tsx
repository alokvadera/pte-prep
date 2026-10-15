import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { CountUp, Magnetic, Reveal } from './motion'

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
 * Display serif at text-xl: a card title is a sub-heading, and the one size
 * step below the section title is where the face starts to do real work.
 */
export function CardTitle({ className, children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-display text-ink-900 dark:text-ink-50 text-lg leading-[1.3] font-extrabold text-balance',
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
  md: 'px-6 py-3 text-sm',
  lg: 'px-7 py-3 text-base',
}

type ButtonOwnProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** The pointer lean, reserved for the one filled action a page wants the eye
   *  to land on — a hero CTA, a band's action. Off by default by design: a
   *  control that flips variant on state would gain and lose the wrapper on
   *  click, remount, and drop focus, and a full-width button owns its row
   *  where a wrapper would break the stretch. */
  magnetic?: boolean
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
  const { variant = 'primary', size = 'md', magnetic = false, className, children, ...rest } = props
  const control = (
    <button type="button" className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  )
  return magnetic ? <Magnetic>{control}</Magnetic> : control
}

export function ButtonLink(props: ButtonBaseProps & ComponentPropsWithoutRef<typeof Link>) {
  const { variant = 'primary', size = 'md', magnetic = false, className, children, to, ...rest } = props
  const control = (
    <Link to={to} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  )
  return magnetic ? <Magnetic>{control}</Magnetic> : control
}

export function ButtonAnchor(props: ButtonBaseProps & { href: string }) {
  const { variant = 'secondary', size = 'md', magnetic = false, className, children, href, ...rest } = props
  const control = (
    <a href={href} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </a>
  )
  return magnetic ? <Magnetic>{control}</Magnetic> : control
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
    <div className={cn('rule-list', className)}>
      {items.map((f) => (
        <details key={f.question} className="group">
          <summary className="text-ink-900 dark:text-ink-50 flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-semibold text-balance [&::-webkit-details-marker]:hidden">
            {f.question}
            <AccordionMark />
          </summary>
          <p className="text-ink-500 dark:text-ink-on-dark max-w-2xl pb-6 text-sm leading-relaxed group-open:animate-details-sweep">
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
        'text-ink-500 dark:text-ink-on-dark-muted group-open:rotate-45 grid size-5 shrink-0 place-items-center text-xl leading-none font-normal transition-transform duration-200 ease-out',
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
    /* The page heading is its own Reveal rather than a wrapper around one, so
       every route opens with the same settle without changing the DOM. */
    <Reveal as="header" variant="up" duration={650} className="page-heading">
      <div className="min-w-0">
        {eyebrow ? <p className="page-heading-kicker">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-intro">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </Reveal>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  id,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  /** So a section heading can still be the target of an in-page anchor, and so
   *  a `aria-labelledby` on a wrapper section names the heading alone rather
   *  than the eyebrow and the heading as one string. */
  id?: string
  /** Spacing overrides only — the type scale and kicker come from the utility. */
  className?: string
}) {
  return (
    /* Same reveal as the page heading, one step quieter: the mockup puts its
       `.rise` entrance on every section head. */
    <Reveal
      variant="up"
      duration={600}
      className={cn('mb-5 flex flex-wrap items-end justify-between gap-4', className)}
    >
      <div className="min-w-0">
        {/* The kicker and its leading hairline live in the `section-eyebrow`
            utility so a page that is not using this component still gets the
            same treatment instead of re-inventing it. */}
        {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
        {/* The id sits on the heading, never on this wrapper: an anchor target
            and an `aria-labelledby` both want the heading's own text, and the
            scroll margin comes with it so the sticky header never covers it. */}
        <h2 id={id} className={cn('section-title', id && 'scroll-mt-24')}>
          {title}
        </h2>
        {description ? (
          <p className="text-ink-500 dark:text-ink-on-dark mt-1.5 max-w-2xl text-sm leading-relaxed">{description}</p>
        ) : null}
      </div>
      {action}
    </Reveal>
  )
}

type Tone = 'neutral' | 'brand' | 'mint' | 'amber' | 'rose'

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-100/90 border-ink-200 text-ink-700 dark:bg-white/5 dark:border-white/10 dark:text-ink-on-dark',
  brand: 'bg-brand-500/10 border-brand-500/30 text-brand-700 dark:text-brand-300 dark:bg-brand-500/15 dark:border-brand-400/30',
  mint: 'bg-mint-500/10 border-mint-500/30 text-mint-700 dark:text-mint-300 dark:bg-mint-500/15 dark:border-mint-400/30',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 dark:bg-amber-500/15 dark:border-amber-400/30',
  rose: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300 dark:bg-rose-500/15 dark:border-rose-400/30',
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
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
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
    <div className="card-solid border-ink-200 relative overflow-hidden p-4 sm:p-5 dark:border-white/10">
      <div className="text-ink-500 dark:text-ink-on-dark-muted mb-1 text-xs font-semibold">
        <span>{label}</span>
      </div>
      <p
        className={cn(
          'mt-1 font-display text-2xl tabular-nums',
          tone === 'mint' && 'text-mint-700 dark:text-mint-300',
          tone === 'brand' && 'text-brand-600 dark:text-brand-300',
          tone === 'amber' && 'text-amber-600 dark:text-amber-400',
          tone === 'rose' && 'text-rose-600 dark:text-rose-400',
          tone === 'neutral' && 'text-ink-900 dark:text-white',
        )}
      >
        {/* A plain count is a figure worth watching arrive; anything already
            formatted stays exactly as the caller wrote it. */}
        {typeof value === 'number' ? <CountUp value={value} duration={900} /> : value}
      </p>
      {sub ? <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-xs">{sub}</p> : null}
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
  const p = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(p)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('bg-ink-200 h-1.5 w-full overflow-hidden rounded-full dark:bg-white/10', className)}
    >
      <div
        className={cn(
          'h-full rounded-full',
          /* Draws itself in on mount, the way the score bars do. */
          'animate-bar-reveal transition-[width] duration-300',
          tone === 'brand' && 'bg-mark-500',
          tone === 'mint' && 'bg-mint-500',
          tone === 'amber' && 'bg-amber-500',
          tone === 'rose' && 'bg-rose-500',
        )}
        style={{ width: `${p}%` }}
      />
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
        {description ? <span className="text-ink-500 dark:text-ink-on-dark-muted block text-xs">{description}</span> : null}
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
          checked ? 'border-mint-600 bg-mint-500' : 'border-ink-300 bg-ink-200 dark:border-white/15 dark:bg-white/10',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4.5 rounded-full bg-white transition-transform duration-200 ease-out',
            checked ? 'translate-x-5.5' : 'translate-x-0.5',
          )}
        />
      </span>
    </label>
  )
}

/**
 * An empty state. Its title is an H2 rather than an H3: an empty state is a
 * top-level block on its route, and heading straight from the page H1 to an H3
 * leaves a screen reader navigating by heading with no level at all in between.
 */
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-start px-6 py-10 text-left">
      {icon ? <div className="text-ink-500 dark:text-ink-on-dark-muted mb-3">{icon}</div> : null}
      <h2 className="section-title">{title}</h2>
      <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1.5 max-w-sm text-sm leading-relaxed">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

/**
 * The closing call to action, shared by every content page so the ending of a
 * page is always the same shape. The mockup's finale: a solid candy-green band
 * with a rounded top and an orange action. The green is the same #3cc85e the
 * primary button uses, labelled in deep indigo (white on it is 2.2:1).
 */
export function CtaBand({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  /** The mockup's "Last thing" pill — a translucent white
   *  label that floats above the title on the green band in light mode,
   *  violet frosted pill in dark mode. */
  eyebrow?: string
  title: string
  description: string
  actions: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'cta-band relative overflow-hidden text-ink-900 px-5 pt-[96px] pb-[88px] text-center dark:text-ink-50 dark:border-t',
        className,
      )}
    >
      {/* Ambient background glow in dark mode */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(60,200,94,0.18),transparent)]"
      />
      <div className="relative z-10">
        {eyebrow ? (
          <span className="text-ink-900 inline-flex items-center rounded-full border-2 border-white/40 bg-white/20 px-[18px] py-[7px] text-[13.5px] font-extrabold uppercase tracking-[0.06em] dark:border-mint-400/30 dark:bg-mint-500/15 dark:text-mint-300">
            {eyebrow}
          </span>
        ) : null}
        <h2
          className={cn(
            'font-display text-ink-900 text-[clamp(30px,5vw,56px)] leading-[1.1] font-extrabold text-balance dark:text-white',
            eyebrow && 'mt-6',
          )}
        >
          {title}
        </h2>
        <p className="mx-auto mt-5 max-w-[58ch] text-[18px] leading-[1.65] font-semibold dark:text-ink-200">
          {description}
        </p>
        <div className="mt-[34px] flex flex-wrap justify-center gap-4">{actions}</div>
      </div>
    </section>
  )
}

/**
 * A wide band. `tone="tint"` is the page's one coloured field, `tone="plain"` a
 * second, quieter band that would otherwise repeat it. Everything inside keeps
 * the page shell's measure, so a band re-groups a page without moving a single
 * element sideways. The band utilities in index.css give these their mint and
 * lavender grounds with the mockup's big rounded tops.
 */
export function SectionBand({
  tone = 'tint',
  eyebrow,
  title,
  description,
  action,
  className,
  children,
}: {
  tone?: 'tint' | 'plain'
  eyebrow?: string
  title?: string
  description?: string
  action?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <section className={cn(tone === 'plain' ? 'band-plain' : 'band', className)}>
      {title ? (
        <SectionHeading eyebrow={eyebrow} title={title} description={description} action={action} />
      ) : null}
      {children}
    </section>
  )
}

type CalloutTone = 'brand' | 'mint' | 'amber' | 'rose'

const CALLOUT_TONE: Record<CalloutTone, string> = {
  brand: 'callout',
  mint: 'callout callout-mint',
  amber: 'callout callout-amber',
  rose: 'callout callout-rose',
}

const CALLOUT_TITLE: Record<CalloutTone, string> = {
  brand: 'callout-title',
  mint: 'callout-title callout-title-mint',
  amber: 'callout-title callout-title-amber',
  rose: 'callout-title callout-title-rose',
}

/**
 * The one tinted panel on a page that carries the thing to remember. The tone is
 * a role rather than decoration: brand for guidance, mint for a confirmed good
 * result, amber for caution, rose for the mistake being corrected.
 */
export function Callout({
  tone = 'brand',
  label,
  rule = false,
  className,
  children,
}: {
  tone?: CalloutTone
  /** The mono label above the body. Omit for a bare statement. */
  label?: string
  /** A single rule down the side instead of a full border, for a note inside a
   *  surface that already has one. */
  rule?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn(rule ? cn('callout-rule', CALLOUT_TONE[tone]) : CALLOUT_TONE[tone], className)}>
      {label ? <p className={CALLOUT_TITLE[tone]}>{label}</p> : null}
      <div className={cn('text-ink-700 dark:text-ink-100 text-sm leading-relaxed', label && 'mt-1.5')}>
        {children}
      </div>
    </div>
  )
}

/**
 * The number a section exists to state, set in the mono data voice. Label is the
 * unit or subject, note the one line of context that stops the figure being a
 * decoration.
 */
export function KeyFigure({
  value,
  label,
  note,
  className,
}: {
  value: ReactNode
  label: string
  note?: string
  className?: string
}) {
  return (
    <div className={cn('border-l-4 border-l-mark-600 pl-4 dark:border-l-mark-400', className)}>
      <p className="key-figure">
        <span className="key-figure-value">{value}</span>
        <span className="key-figure-label">{label}</span>
      </p>
      {note ? <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-xs leading-relaxed">{note}</p> : null}
    </div>
  )
}

const TICK_TONE = {
  brand: 'tick-item',
  mint: 'tick-item tick-item-mint',
  quiet: 'tick-item tick-item-quiet',
} as const

/** A list marked by a small filled dot rather than a bullet glyph. */
export function TickList({
  items,
  tone = 'brand',
  className,
}: {
  items: ReactNode[]
  tone?: keyof typeof TICK_TONE
  className?: string
}) {
  return (
    <ul className={cn('tick-list', className)}>
      {items.map((item, i) => (
        <li key={i} className={TICK_TONE[tone]}>
          {item}
        </li>
      ))}
    </ul>
  )
}

/** The square that carries a step, rank or index digit. */
export function NumMarker({
  tone = 'brand',
  className,
  children,
}: {
  tone?: 'brand' | 'mint' | 'quiet'
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'num-marker',
        tone === 'mint' && 'num-marker-mint',
        tone === 'quiet' && 'num-marker-quiet',
        className,
      )}
    >
      {children}
    </span>
  )
}
