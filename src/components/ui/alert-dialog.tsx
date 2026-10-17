import { useEffect, useRef, type ReactNode } from 'react'
import { Dialog } from './dialog'

/* ---------------------------------------------------------------------------
   AlertDialog.

   The destructive-confirmation dialog: same shell as Dialog, but
   the primary action is the dangerous one and the safe action is
   the default. Used for "clear all history" — the one action on
   the site that cannot be walked back.
--------------------------------------------------------------------------- */

export function AlertDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  className,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: ReactNode
  confirmLabel?: string
  className?: string
}) {
  const cancel = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (open) cancel.current?.focus()
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      className={className}
      footer={
        <>
          <button ref={cancel} type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {description}
    </Dialog>
  )
}
