import { createContext, useContext } from 'react'

/* The toast context and its hook, kept out of toast.tsx so that file exports
   nothing but a component and stays hot-reloadable. */

export type ToastTone = 'brand' | 'mint' | 'amber' | 'rose'

export type ToastApi = {
  push: (message: string, tone?: ToastTone) => void
  success: (message: string) => void
  error: (message: string) => void
}

export const ToastContext = createContext<ToastApi>({
  push: () => {},
  success: () => {},
  error: () => {},
})

export function useToast(): ToastApi {
  return useContext(ToastContext)
}
