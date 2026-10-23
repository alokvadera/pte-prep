import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   HoverCard.

   A richer tooltip: a card that opens after a short hover delay and
   carries real content — a definition, a preview, a few stats. It
   closes when the pointer leaves the card itself, so the visitor can
   move onto it and read.

   The card holds real content, so it is a dialog rather than a tooltip:
   a tooltip may not contain focusable children, and the trigger points
   at the card with aria-describedby so the two are related.
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
  const id = useId()

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

  // The trigger is the visitor's own element, so it is cloned rather than
  // wrapped: it gains the link to the card and the state it is in.
  const triggerNode = isValidElement<Record<string, unknown>>(trigger)
    ? cloneElement(trigger, {
        'aria-describedby': open ? id : undefined,
        'aria-expanded': open,
      })
    : trigger

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={openSoon}
      onMouseLeave={closeSoon}
      onFocus={openSoon}
      onBlur={closeSoon}
    >
      {triggerNode}
      {open ? (
        <div
          id={id}
          role="dialog"
          aria-label="Details"
          className="card-solid absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 p-4 animate-pop-in"
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
