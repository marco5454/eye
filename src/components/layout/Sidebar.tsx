import { NavLink } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { routes } from '../../lib/routes'
import { getGrantPhase } from '../../lib/grantPeriod'

export default function Sidebar() {
  const phase = getGrantPhase()
  const quarterLabel =
    phase.phase === 'active' ? phase.current.label
    : phase.phase === 'pre-grant' ? 'Pre-grant'
    : 'Grant ended'

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:shrink-0 bg-mist border-r border-sky/60">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ocean text-white shadow-sm">
          <Eye className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-dusk">Marcos</p>
          <p className="text-sm font-bold leading-tight text-dusk">Power Eye</p>
        </div>
      </div>

      {/* Quarter badge */}
      <div className="px-6 pb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky px-3 py-1 font-mono text-xs text-dusk">
          <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
          {quarterLabel}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-6">
        <ul className="space-y-1">
          {routes.map(({ path, label, icon: Icon, end }) => (
            <li key={path}>
              <NavLink
                to={path}
                end={end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-ocean text-white shadow-sm'
                      : 'text-dusk/80 hover:bg-sky/70 hover:text-dusk',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Decorative wave footer */}
      <div className="px-6 pb-6 text-xs text-dusk/40">
        <p className="font-mono">3-year grant</p>
        <p>Jun 2026 – Jun 2029</p>
      </div>
    </aside>
  )
}
