import type { TaskStatus } from '../../lib/database.types'

// Filter state for the Task Tracker page. Lives in its own module so
// TaskFilterBar can stay a clean component-only export (Vite fast refresh
// requires component files to export only components).

export type TaskFilters = {
  search: string
  status: TaskStatus | 'all'
  /** outcome_id, 'unassigned', or 'all'. */
  outcome: string | 'unassigned' | 'all'
  owner: string | 'all'
}

export const defaultFilters: TaskFilters = {
  search: '',
  status: 'all',
  outcome: 'all',
  owner: 'all',
}
