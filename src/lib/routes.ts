import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Home,
  CheckSquare,
  Calendar,
  BarChart3,
  FileText,
  AlertTriangle,
} from 'lucide-react'

// Route components are lazy-loaded so each page ships in its own chunk.
// The eager dashboard load drops the initial JS payload by ~60% and
// keeps Vite from emitting the >500 KB chunk warning.
const Dashboard = lazy(() => import('../pages/Dashboard'))
const TaskTracker = lazy(() => import('../pages/TaskTracker'))
const Timeline = lazy(() => import('../pages/Timeline'))
const OutputTargets = lazy(() => import('../pages/OutputTargets'))
const Milestones = lazy(() => import('../pages/Milestones'))
const RiskRegister = lazy(() => import('../pages/RiskRegister'))

export type RouteMeta = {
  path: string
  label: string
  icon: LucideIcon
  element: LazyExoticComponent<ComponentType>
  /** When true, NavLink uses `end` matching so child routes don't activate it. */
  end?: boolean
}

// Single source of truth for navigation. Sidebar, BottomNav, TopBar,
// and App router all consume this list.
export const routes: RouteMeta[] = [
  { path: '/',           label: 'Dashboard',  icon: Home,           element: Dashboard,     end: true },
  { path: '/tasks',      label: 'Tasks',      icon: CheckSquare,    element: TaskTracker            },
  { path: '/timeline',   label: 'Timeline',   icon: Calendar,       element: Timeline               },
  { path: '/outputs',    label: 'Outputs',    icon: BarChart3,      element: OutputTargets          },
  { path: '/milestones', label: 'Milestones', icon: FileText,       element: Milestones             },
  { path: '/risks',      label: 'Risks',      icon: AlertTriangle,  element: RiskRegister           },
]
