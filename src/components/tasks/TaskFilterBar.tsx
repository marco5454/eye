import { Search, X } from 'lucide-react'
import type { Outcome, TaskStatus } from '../../lib/database.types'
import { defaultFilters, type TaskFilters } from './taskFilters'

const STATUS_OPTIONS: TaskStatus[] = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Completed',
]

type Props = {
  filters: TaskFilters
  outcomes: Outcome[]
  owners: string[]
  /** Whether any tasks exist without an outcome — gates the unassigned option. */
  hasUnassigned: boolean
  onChange: (next: TaskFilters) => void
}

export default function TaskFilterBar({
  filters,
  outcomes,
  owners,
  hasUnassigned,
  onChange,
}: Props) {
  const hasActive =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.outcome !== 'all' ||
    filters.owner !== 'all'

  function update<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) {
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
          placeholder="Search tasks…"
          className="w-full rounded-full border border-sky bg-mist/40 py-2 pl-9 pr-3 text-sm text-dusk shadow-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/30"
          aria-label="Search tasks"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="filter-task-outcome">
          Outcome
        </label>
        <select
          id="filter-task-outcome"
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

        <label className="sr-only" htmlFor="filter-task-status">
          Status
        </label>
        <select
          id="filter-task-status"
          value={filters.status}
          onChange={(e) => update('status', e.target.value as TaskFilters['status'])}
          className={selectClass}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {owners.length > 0 && (
          <>
            <label className="sr-only" htmlFor="filter-task-owner">
              Owner
            </label>
            <select
              id="filter-task-owner"
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
          </>
        )}

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
