import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   Dialog.

   A centred modal on the native <dialog> element, so focus
   trapping, Escape-to-close and the backdrop come from the
   platform rather than from hand-rolled listeners. Backdrop
   clicks close it (a click on the dialog itself lands on the
   dialog's own box, a click outside lands on the wrapper).
--------------------------------------------------------------------------- */

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDialogElement | null>(null)
  // The native dialog is announced by its heading, so the two are linked —
  // otherwise a screen reader opens an unlabelled modal.
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // A click that lands on the dialog's own transparent
        // padding edge is a backdrop click.
        if (e.target === ref.current) onClose()
      }}
      className={cn(
        'card-solid w-[min(440px,calc(100vw-2rem))] rounded-2xl border-2 border-ink-200 p-0 shadow-lift-lg dark:border-white/10 dark:shadow-glass-strong',
        'open:animate-modal-enter',
        // The ::backdrop is the only way to tint the native scrim.
        '[&::backdrop]:bg-ink-950/50 [&::backdrop]:backdrop-blur-sm [&[open]::backdrop]:animate-fade-in',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4 dark:border-white/10">
        <h2 id={titleId} className="font-display text-lg font-extrabold text-ink-900 dark:text-ink-50">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-500 hover:text-ink-800 dark:text-ink-on-dark-muted dark:hover:text-white cursor-pointer text-xl leading-none"
        >
          ×
        </button>
      </div>
      <div className="px-6 py-5 text-sm leading-relaxed text-ink-700 dark:text-ink-100">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-3 border-t border-ink-100 px-6 py-4 dark:border-white/10">{footer}</div>
      ) : null}
    </dialog>
  )
}
