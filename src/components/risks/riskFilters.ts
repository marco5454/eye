import type { RiskLevel } from '../../lib/database.types'

export type RiskFilters = {
  search: string
  category: string | 'all'
  level: RiskLevel | 'unscored' | 'all'
  owner: string | 'all'
}

export const defaultFilters: RiskFilters = {
  search: '',
  category: 'all',
  level: 'all',
  owner: 'all',
}
