import { Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import Layout from './components/layout/Layout'
import AuthProvider from './components/auth/AuthProvider'
import ToastProvider from './components/ui/ToastProvider'
import { routes } from './lib/routes'
import { seedDatabase } from './lib/seedData'

// Module-level guard against React 19 StrictMode's effect double-invocation.
// `seedDatabase()` is already idempotent (it bails when outcomes is non-empty),
// but this avoids two simultaneous in-flight fetches on initial mount.
let seedAttempted = false

// Lightweight fallback shown while a lazy route chunk is downloading.
// Sized to roughly match the first paint of every page so the layout
// shell does not jump when the chunk resolves.
function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <span className="inline-flex items-center gap-2 rounded-full bg-shell px-4 py-2 text-sm text-dusk shadow-sm ring-1 ring-mist">
        <Loader2 className="h-4 w-4 animate-spin text-ocean" aria-hidden />
        Loading…
      </span>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    if (seedAttempted) return
    seedAttempted = true

    seedDatabase()
      .then((seeded) => {
        if (seeded) {
          // eslint-disable-next-line no-console
          console.info('[seed] Database seeded with outcomes and reference tasks.')
        } else {
          // eslint-disable-next-line no-console
          console.info('[seed] Database already populated; skipped seeding.')
        }
      })
      .catch((err) => {
        seedAttempted = false // allow retry on next mount if it failed
        // eslint-disable-next-line no-console
        console.error('[seed] Seeding failed:', err)
      })
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<Layout />}>
              {routes.map(({ path, element: Element }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <Element />
                    </Suspense>
                  }
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
