import { createContext } from 'react'

// Toast context object lives in its own file so `ToastProvider.tsx` can
// remain a pure-component module (satisfies `react-refresh/only-export-components`).

export type ToastKind = 'success' | 'error'

export type Toast = {
  id: number
  kind: ToastKind
  message: string
}

export type ToastContextValue = {
  success: (message: string) => void
  error: (message: string) => void
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
