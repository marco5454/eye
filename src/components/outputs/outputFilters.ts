export type TrackedFilter = 'all' | 'tracked' | 'narrative' | 'ongoing' | 'cumulative'

export type OutputFilters = {
  search: string
  outcome: string | 'unassigned' | 'all'
  tracked: TrackedFilter
}

export const defaultFilters: OutputFilters = {
  search: '',
  outcome: 'all',
  tracked: 'all',
}
