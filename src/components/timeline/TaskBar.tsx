import { format, parseISO } from 'date-fns'
import type { Outcome, Task } from '../../lib/database.types'
import type { TaskSpan } from './timelineMath'

const OUTCOME_FALLBACK = '#94A3B8' // slate

type Props = {
  task: Task
  outcome: Outcome | null
  span: TaskSpan
  onClick: () => void
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  try {
    return format(parseISO(value), 'd MMM yyyy')
  } catch {
    return null
  }
}

export default function TaskBar({ task, outcome, span, onClick }: Props) {
  const color = outcome?.color ?? OUTCOME_FALLBACK
  const tooltipParts = [
    task.title,
    outcome ? `${outcome.outcome_number}. ${outcome.title}` : 'Unassigned',
    `Status: ${task.status}`,
    `Progress: ${task.percent_complete}%`,
  ]
  const startStr = formatDate(task.start_date)
  const endStr = formatDate(task.end_date)
  if (startStr || endStr) {
    tooltipParts.push(`${startStr ?? '—'} → ${endStr ?? '—'}`)
  }
  if (span.clampedStart || span.clampedEnd) {
    tooltipParts.push('Clamped to grant period')
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltipParts.join('\n')}
      aria-label={`Edit task: ${task.title}`}
      className="group relative flex h-7 min-w-0 items-center gap-1 overflow-hidden rounded-md px-2 text-left text-[11px] font-semibold text-shell shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-1 print:shadow-none"
      style={{
        gridColumn: `${span.start} / ${span.end + 1}`,
        backgroundColor: color,
      }}
    >
      {/* Subtle progress overlay so completed tasks read "filled" at a glance */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 bg-white/25"
        style={{ width: `${task.percent_complete}%` }}
      />
      {span.clampedStart && (
        <span
          aria-hidden="true"
          className="relative shrink-0 text-shell/80"
          title="Starts before grant"
        >
          ‹
        </span>
      )}
      <span className="relative truncate">{task.title}</span>
      {task.percent_complete > 0 && (
        <span className="relative ml-auto shrink-0 text-shell/90 tabular-nums">
          {task.percent_complete}%
        </span>
      )}
      {span.clampedEnd && (
        <span
          aria-hidden="true"
          className="relative shrink-0 text-shell/80"
          title="Ends after grant"
        >
          ›
        </span>
      )}
    </button>
  )
}
