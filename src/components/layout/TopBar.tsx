import { useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { routes } from '../../lib/routes'
import { getGrantPhase } from '../../lib/grantPeriod'
import { useAuthGate } from '../../hooks/useAuthGate'

export default function TopBar() {
  const { pathname } = useLocation()
  const { required: authRequired, signOut } = useAuthGate()
  const current = routes.find((r) =>
    r.end ? r.path === pathname : pathname === r.path || pathname.startsWith(r.path + '/'),
  )

  const phase = getGrantPhase()
  const quarterLabel =
    phase.phase === 'active' ? phase.current.label
    : phase.phase === 'pre-grant' ? 'Pre-grant'
    : 'Grant ended'

  return (
    <header className="sticky top-0 z-20 border-b border-sky/60 bg-sand/85 backdrop-blur print:hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-dusk md:text-2xl">
            {current?.label ?? 'Marcos Power Eye'}
          </h1>
          {/* subtitle slot reserved for future use */}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Mobile-only quarter badge (sidebar already shows it on desktop) */}
          <span className="md:hidden inline-flex items-center gap-1.5 rounded-full bg-sky px-3 py-1 font-mono text-[11px] text-dusk">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
            {quarterLabel}
          </span>

          {authRequired && (
            <button
              type="button"
              onClick={signOut}
              className="inline-flex h-9 min-h-0 items-center gap-1.5 rounded-full bg-shell px-3 text-xs font-medium text-dusk shadow-sm ring-1 ring-mist hover:bg-mist"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
