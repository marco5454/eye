import { Search, X } from 'lucide-react'
import type { RiskLevel } from '../../lib/database.types'
import { defaultFilters, type RiskFilters } from './riskFilters'

type Props = {
  filters: RiskFilters
  /** Categories present in the loaded data (sorted). */
  categories: string[]
  /** Owners present in the loaded data (sorted). */
  owners: string[]
  /** True if at least one risk has no level set — gates the unscored option. */
  hasUnscored: boolean
  onChange: (next: RiskFilters) => void
}

const LEVEL_OPTIONS: { value: RiskLevel | 'unscored' | 'all'; label: string }[] = [
  { value: 'all', label: 'All levels' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
]

export default function RiskFilterBar({
  filters,
  categories,
  owners,
  hasUnscored,
  onChange,
}: Props) {
  const hasActive =
    filters.search.trim() !== '' ||
    filters.category !== 'all' ||
    filters.level !== 'all' ||
    filters.owner !== 'all'

  function update<K extends keyof RiskFilters>(key: K, value: RiskFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  const selectClass =
    'rounded-full border border-sky bg-shell px-3 py-1.5 text-xs font-medium text-dusk shadow-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/30'

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-shell p-4 shadow-sm print:hidden sm:flex-row sm:items-center sm:gap-3">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dusk/50" />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Search risks…"
          className="w-full rounded-full border border-sky bg-mist/40 py-2 pl-9 pr-3 text-sm text-dusk shadow-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/30"
          aria-label="Search risks"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="filter-risk-category">
          Category
        </label>
        <select
          id="filter-risk-category"
          value={filters.category}
          onChange={(e) => update('category', e.target.value)}
          className={selectClass}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-risk-level">
          Level
        </label>
        <select
          id="filter-risk-level"
          value={filters.level}
          onChange={(e) =>
            update('level', e.target.value as RiskFilters['level'])
          }
          className={selectClass}
        >
          {LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {hasUnscored && <option value="unscored">Unscored</option>}
        </select>

        <label className="sr-only" htmlFor="filter-risk-owner">
          Owner
        </label>
        <select
          id="filter-risk-owner"
          value={filters.owner}
          onChange={(e) => update('owner', e.target.value)}
          className={selectClass}
        >
          <option value="all">All owners</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>

        {hasActive && (
          <button
            type="button"
            onClick={() => onChange(defaultFilters)}
            className="inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1.5 text-xs font-medium text-dusk hover:bg-sky"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
