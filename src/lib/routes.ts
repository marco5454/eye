import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Home,
  CheckSquare,
  Calendar,
  BarChart3,
  FileText,
  AlertTriangle,
} from 'lucide-react'

import Dashboard from '../pages/Dashboard'
import TaskTracker from '../pages/TaskTracker'
import Timeline from '../pages/Timeline'
import OutputTargets from '../pages/OutputTargets'
import Milestones from '../pages/Milestones'
import RiskRegister from '../pages/RiskRegister'

export type RouteMeta = {
  path: string
  label: string
  icon: LucideIcon
  element: ComponentType
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
