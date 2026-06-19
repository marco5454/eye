import { NavLink } from 'react-router-dom'
import { routes } from '../../lib/routes'

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-sky/60 bg-shell/95 backdrop-blur print:hidden"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-6">
        {routes.map(({ path, label, icon: Icon, end }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={end}
              className={({ isActive }) =>
                [
                  'relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-ocean' : 'text-dusk/60 hover:text-dusk',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {/* Coral dot indicator above icon when active */}
                  <span
                    className={[
                      'absolute top-1 h-1.5 w-1.5 rounded-full transition-opacity',
                      isActive ? 'bg-coral opacity-100' : 'opacity-0',
                    ].join(' ')}
                    aria-hidden
                  />
                  <Icon className="h-5 w-5" />
                  {/* Label visible only on the active tab */}
                  <span
                    className={[
                      'leading-none transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      {/* Safe-area padding for iOS home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
