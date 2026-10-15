import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   HoverCard.

   A richer tooltip: a card that opens after a short hover delay and
   carries real content — a definition, a preview, a few stats. It
   closes when the pointer leaves the card itself, so the visitor can
   move onto it and read.
--------------------------------------------------------------------------- */

export function HoverCard({
  trigger,
  children,
  className,
}: {
  trigger: ReactNode
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const timer = useRef<number | null>(null)
  const root = useRef<HTMLDivElement | null>(null)

  const openSoon = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(true), 200)
  }
  const closeSoon = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(false), 120)
  }
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  return (
    <div
      ref={root}
      className={cn('relative inline-block', className)}
      onMouseEnter={openSoon}
      onMouseLeave={closeSoon}
      onFocus={openSoon}
      onBlur={closeSoon}
    >
      {trigger}
      {open ? (
        <div
          role="tooltip"
          className="card-solid absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 p-4 animate-pop-in"
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
