import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ToastContext, type ToastApi, type ToastTone } from './use-toast'

/* ---------------------------------------------------------------------------
   Toast.

   A stack of short-lived confirmations in the bottom-right corner.
   Wrap the app once in <ToastProvider>; any descendant pushes a
   toast with `useToast()`. Each toast resolves on its own after
   a few seconds, and the stack keeps at most four so a burst of
   events never covers the screen.
--------------------------------------------------------------------------- */

const TOAST_TONE: Record<ToastTone, string> = {
  brand: 'border-brand-500/40 text-brand-700 dark:text-brand-300',
  mint: 'border-mint-500/40 text-mint-700 dark:text-mint-300',
  amber: 'border-amber-500/50 text-amber-700 dark:text-amber-300',
  rose: 'border-rose-500/40 text-rose-600 dark:text-rose-300',
}

type ToastItem = { id: number; message: string; tone: ToastTone }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  // Toasts that have begun their exit. They stay mounted for
  // the 160ms exit — the door closes before the room
  // disappears — and are removed once it finishes.
  const [leaving, setLeaving] = useState<ReadonlySet<number>>(new Set())
  const nextId = useRef(1)

  const push = useCallback((message: string, tone: ToastTone = 'mint') => {
    const id = nextId.current++
    setItems((list) => [...list.slice(-3), { id, message, tone }])
    window.setTimeout(() => {
      setLeaving((s) => new Set(s).add(id))
      window.setTimeout(() => {
        setItems((list) => list.filter((t) => t.id !== id))
        setLeaving((s) => {
          const next = new Set(s)
          next.delete(id)
          return next
        })
      }, 160)
    }, 4200)
  }, [])

  // One stable object for the life of the provider. A fresh identity on
  // every render would re-render every consumer and would make `toast` an
  // unsafe dependency in any effect that calls it.
  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (m) => push(m, 'mint'),
      error: (m) => push(m, 'rose'),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-80 flex-col gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'card-solid pointer-events-auto flex items-start gap-2.5 border-l-4 p-3.5 text-sm font-semibold shadow-panel',
              leaving.has(t.id) ? 'animate-toast-out' : 'animate-toast-in',
              TOAST_TONE[t.tone],
            )}
          >
            <span className="mt-0.5 size-2 shrink-0 rounded-full bg-current" aria-hidden="true" />
            <span className="min-w-0">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
