import { Search, X } from 'lucide-react'
import type { Outcome } from '../../lib/database.types'
import {
  defaultFilters,
  type OutputFilters,
  type TrackedFilter,
} from './outputFilters'

const TRACKED_OPTIONS: { value: TrackedFilter; label: string }[] = [
  { value: 'all', label: 'All targets' },
  { value: 'tracked', label: 'Has numeric target' },
  { value: 'narrative', label: 'Narrative only' },
  { value: 'cumulative', label: 'Cumulative' },
  { value: 'ongoing', label: 'Ongoing' },
]

type Props = {
  filters: OutputFilters
  outcomes: Outcome[]
  /** Whether any outputs exist without an outcome — gates the unassigned option. */
  hasUnassigned: boolean
  onChange: (next: OutputFilters) => void
}

export default function OutputFilterBar({
  filters,
  outcomes,
  hasUnassigned,
  onChange,
}: Props) {
  const hasActive =
    filters.search.trim() !== '' ||
    filters.outcome !== 'all' ||
    filters.tracked !== 'all'

  function update<K extends keyof OutputFilters>(key: K, value: OutputFilters[K]) {
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
          placeholder="Search outputs…"
          className="w-full rounded-full border border-sky bg-mist/40 py-2 pl-9 pr-3 text-sm text-dusk shadow-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/30"
          aria-label="Search outputs"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="filter-output-outcome">
          Outcome
        </label>
        <select
          id="filter-output-outcome"
          value={filters.outcome}
          onChange={(e) => update('outcome', e.target.value)}
          className={selectClass}
        >
          <option value="all">All outcomes</option>
          {outcomes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.outcome_number}. {o.title}
            </option>
          ))}
          {hasUnassigned && <option value="unassigned">Unassigned</option>}
        </select>

        <label className="sr-only" htmlFor="filter-output-tracked">
          Target type
        </label>
        <select
          id="filter-output-tracked"
          value={filters.tracked}
          onChange={(e) =>
            update('tracked', e.target.value as TrackedFilter)
          }
          className={selectClass}
        >
          {TRACKED_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
