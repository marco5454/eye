import type { MilestoneStatus, MilestoneType } from '../../lib/database.types'

// Filter state for the Milestones page. Lives in its own module so
// MilestoneFilterBar can stay a clean component-only export (Vite fast refresh
// requires component files to export only components).

export type MilestoneFilters = {
  search: string
  status: MilestoneStatus | 'all'
  type: MilestoneType | 'all'
  owner: string | 'all'
}

export const defaultFilters: MilestoneFilters = {
  search: '',
  status: 'all',
  type: 'all',
  owner: 'all',
}
