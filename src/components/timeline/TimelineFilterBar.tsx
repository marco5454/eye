import { X } from 'lucide-react'
import type { Outcome, TaskStatus } from '../../lib/database.types'
import { defaultFilters, type TimelineFilters } from './timelineFilters'

const STATUS_OPTIONS: TaskStatus[] = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Completed',
]

type Props = {
  filters: TimelineFilters
  outcomes: Outcome[]
  hasUnassigned: boolean
  onChange: (next: TimelineFilters) => void
}

export default function TimelineFilterBar({
  filters,
  outcomes,
  hasUnassigned,
  onChange,
}: Props) {
  const hasActive =
    filters.outcome !== 'all' ||
    filters.status !== 'all' ||
    filters.showMilestones !== defaultFilters.showMilestones

  function update<K extends keyof TimelineFilters>(
    key: K,
    value: TimelineFilters[K],
  ) {
    onChange({ ...filters, [key]: value })
  }

  const selectClass =
    'rounded-full border border-sky bg-shell px-3 py-1.5 text-xs font-medium text-dusk shadow-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/30'

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-shell p-4 shadow-sm print:hidden sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="filter-timeline-outcome">
          Outcome
        </label>
        <select
          id="filter-timeline-outcome"
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

        <label className="sr-only" htmlFor="filter-timeline-status">
          Task status
        </label>
        <select
          id="filter-timeline-status"
          value={filters.status}
          onChange={(e) =>
            update('status', e.target.value as TimelineFilters['status'])
          }
          className={selectClass}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-mist/40 px-3 py-1.5 text-xs font-medium text-dusk shadow-sm">
          <input
            type="checkbox"
            checked={filters.showMilestones}
            onChange={(e) => update('showMilestones', e.target.checked)}
            className="h-3.5 w-3.5 rounded border-sky text-ocean focus:ring-ocean"
          />
          Show milestones
        </label>

        {hasActive && (
          <button
            type="button"
            onClick={() => onChange(defaultFilters)}
            className="inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1.5 text-xs font-medium text-dusk hover:bg-sky"
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
