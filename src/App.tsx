import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/layout/Layout'
import { routes } from './lib/routes'
import { seedDatabase } from './lib/seedData'

// Module-level guard against React 19 StrictMode's effect double-invocation.
// `seedDatabase()` is already idempotent (it bails when outcomes is non-empty),
// but this avoids two simultaneous in-flight fetches on initial mount.
let seedAttempted = false

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
      <Routes>
        <Route element={<Layout />}>
          {routes.map(({ path, element: Element }) => (
            <Route key={path} path={path} element={<Element />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
