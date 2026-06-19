import { useLocation } from 'react-router-dom'
import { routes } from '../../lib/routes'
import { getGrantPhase } from '../../lib/grantPeriod'

export default function TopBar() {
  const { pathname } = useLocation()
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

        {/* Mobile-only quarter badge (sidebar already shows it on desktop) */}
        <span className="md:hidden inline-flex items-center gap-1.5 rounded-full bg-sky px-3 py-1 font-mono text-[11px] text-dusk">
          <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
          {quarterLabel}
        </span>
      </div>
    </header>
  )
}
