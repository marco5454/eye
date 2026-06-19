import { useContext } from 'react'
import { ToastContext } from '../components/ui/toastContext'
import type { ToastContextValue } from '../components/ui/toastContext'

/**
 * Access the toast dispatcher. Must be called from inside `<ToastProvider>`
 * (mounted in `App.tsx`).
 *
 * ```tsx
 * const toast = useToast()
 * toast.success('Milestone created')
 * toast.error('Failed to delete: ' + err.message)
 * ```
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be called within a <ToastProvider>')
  }
  return ctx
}
