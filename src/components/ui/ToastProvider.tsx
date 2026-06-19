import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'

import { ToastContext } from './toastContext'
import type { Toast, ToastContextValue, ToastKind } from './toastContext'

// Lightweight toast system. No external deps; tied to the project's
// existing palette and motion conventions.

const DEFAULT_DURATION = 4000

type Props = {
  children: ReactNode
}

export default function ToastProvider({ children }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idCounter = useRef(0)
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const enqueue = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++idCounter.current
      setToasts((prev) => [...prev, { id, kind, message }])
      const timer = setTimeout(() => dismiss(id), DEFAULT_DURATION)
      timersRef.current.set(id, timer)
    },
    [dismiss],
  )

  // Clear all pending timers on unmount so we don't dispatch into a
  // torn-down provider.
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message: string) => enqueue('success', message),
      error: (message: string) => enqueue('error', message),
      dismiss,
    }),
    [enqueue, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: number) => void
}) {
  if (toasts.length === 0) return null
  return (
    <div
      // Top-of-document live region so screen readers announce each toast
      // as it appears. Visual layout pinned bottom-right (above mobile nav).
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end print:hidden"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: number) => void
}) {
  const isSuccess = toast.kind === 'success'
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle
  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      aria-live={isSuccess ? 'polite' : 'assertive'}
      className={[
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg ring-1',
        'animate-[toast-in_180ms_ease-out]',
        isSuccess
          ? 'bg-shell text-dusk ring-seafoam'
          : 'bg-shell text-dusk ring-coral',
      ].join(' ')}
    >
      <Icon
        className={[
          'mt-0.5 h-4 w-4 shrink-0',
          isSuccess ? 'text-emerald-600' : 'text-coral',
        ].join(' ')}
        aria-hidden
      />
      <p className="min-w-0 flex-1 break-words leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-m-1 inline-flex h-6 min-h-0 w-6 items-center justify-center rounded-full text-dusk/60 hover:bg-mist hover:text-dusk"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  )
}
