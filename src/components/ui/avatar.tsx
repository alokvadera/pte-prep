import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Avatar.

   A initials circle for the account chip. The letter comes
   from the name (or email, when no name is set) and the
   tone comes from the account state: mint when signed in,
   brand when local-only. Deliberately no images — the app
   has no avatar upload, so a photo would be a lie.
--------------------------------------------------------------------------- */

export function Avatar({
  name,
  email,
  tone = 'brand',
  size = 'md',
  className,
}: {
  name?: string | null
  email?: string | null
  tone?: 'brand' | 'mint' | 'amber' | 'rose'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const initial = (name?.trim() || email?.trim() || '?').charAt(0).toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-display font-extrabold',
        size === 'sm' && 'size-7 text-xs',
        size === 'md' && 'size-9 text-sm',
        size === 'lg' && 'size-12 text-lg',
        tone === 'mint' && 'bg-mint-500/15 text-mint-700 ring-2 ring-mint-500/30 dark:text-mint-300',
        tone === 'brand' && 'bg-brand-500/15 text-brand-700 ring-2 ring-brand-500/30 dark:text-brand-300',
        tone === 'amber' && 'bg-amber-500/15 text-amber-700 ring-2 ring-amber-500/30 dark:text-amber-300',
        tone === 'rose' && 'bg-rose-500/15 text-rose-600 ring-2 ring-rose-500/30 dark:text-rose-300',
        className,
      )}
    >
      {initial}
    </span>
  )
}
