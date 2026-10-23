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
    /* v8 ignore next -- the ref is attached before any effect runs */
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
        if (e.target === ref.current) {
          const rect = ref.current.getBoundingClientRect()
          const isInDialog = (
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width
          )
          if (!isInDialog) {
            onClose()
          }
        }
      }}
      className={cn(
        'fixed inset-0 m-auto',
        'w-[min(460px,calc(100vw-2rem))] max-h-[calc(100vh-4rem)] overflow-y-auto',
        'rounded-2xl border-2 border-ink-200 bg-white p-0 text-ink-900 shadow-lift-lg',
        'dark:border-white/10 dark:bg-ink-850 dark:text-ink-50 dark:shadow-glass-strong',
        'open:animate-modal-enter',
        // The ::backdrop is the only way to tint the native scrim.
        '[&::backdrop]:bg-ink-950/50 [&::backdrop]:backdrop-blur-sm [&[open]::backdrop]:animate-fade-in',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-6 py-4 dark:border-white/10">
        <h2 id={titleId} className="font-display text-lg font-extrabold text-ink-900 dark:text-ink-50">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-on-dark-muted dark:hover:bg-white/10 dark:hover:text-white cursor-pointer transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-5 text-sm leading-relaxed text-ink-700 dark:text-ink-100">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-3 border-t border-ink-100 px-6 py-4 dark:border-white/10">{footer}</div>
      ) : null}
    </dialog>
  )
}
