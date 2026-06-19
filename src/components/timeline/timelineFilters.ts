import type { TaskStatus } from '../../lib/database.types'

export type TimelineFilters = {
  outcome: string | 'unassigned' | 'all'
  status: TaskStatus | 'all'
  showMilestones: boolean
}

export const defaultFilters: TimelineFilters = {
  outcome: 'all',
  status: 'all',
  showMilestones: true,
}
