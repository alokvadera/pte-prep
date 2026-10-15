import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Popover.

   A small interactive card that opens on click and closes on outside
   click or Escape. "Tooltips inform, popovers enable interaction" — so
   this one takes real children (filters, mini forms, details), not
   just a label.
--------------------------------------------------------------------------- */

export function Popover({
  trigger,
  children,
  align = 'end',
  className,
  label,
}: {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
  /** Accessible name for the trigger button. */
  label: string
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className={cn(
            'card-solid absolute z-50 w-64 p-4 animate-pop-in',
            align === 'start' ? 'left-0 top-full mt-2' : align === 'center' ? 'left-1/2 top-full mt-2 -translate-x-1/2' : 'right-0 top-full mt-2',
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
