import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Marquee.

   An infinite scrolling strip — the ticker
   that carries a claim across the width of
   the page. The row is rendered twice and
   translated by exactly half its width, so
   the loop is seamless. Pauses on hover so a
   reader can catch an item, and never arms
   under reduced motion (the row simply sits
   still, still readable).
--------------------------------------------------------------------------- */

export function Marquee({
  items,
  separator = '•',
  className,
  slow = false,
}: {
  items: ReactNode[]
  separator?: ReactNode
  className?: string
  slow?: boolean
}) {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-5">{item}</span>
          <span aria-hidden="true" className="opacity-40">
            {separator}
          </span>
        </span>
      ))}
    </div>
  )

  return (
    <div className={cn('marquee overflow-hidden', className)} aria-hidden="true">
      <div className={cn('marquee-track flex w-max', slow && 'marquee-slow')}>
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}
