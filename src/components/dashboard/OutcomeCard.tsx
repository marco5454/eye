import { Link } from 'react-router-dom'
import type { Outcome, Task } from '../../lib/database.types'
import ProgressBar from '../ui/ProgressBar'

type Props = {
  outcome: Outcome
  tasks: Task[]
}

export default function OutcomeCard({ outcome, tasks }: Props) {
  const taskCount = tasks.length
  const avgPercent =
    taskCount === 0
      ? 0
      : Math.round(
          tasks.reduce((sum, t) => sum + (t.percent_complete ?? 0), 0) / taskCount,
        )

  const accent = outcome.color ?? '#0EA5C9'

  return (
    <Link
      to={`/tasks?outcome=${outcome.outcome_number}`}
      className="group flex h-full flex-col rounded-2xl bg-shell p-5 shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-mono text-sm font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {outcome.outcome_number}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-dusk">{outcome.title}</h3>
          {outcome.description && (
            <p className="mt-1 line-clamp-2 text-xs text-dusk/70">{outcome.description}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-xs text-dusk/60">
          {taskCount === 0
            ? 'No tasks yet'
            : `${taskCount} task${taskCount === 1 ? '' : 's'}`}
        </span>
        <span className="font-mono text-sm font-semibold text-dusk">
          {taskCount === 0 ? '—' : `${avgPercent}%`}
        </span>
      </div>
      <ProgressBar value={avgPercent} color={accent} size="sm" className="mt-2" />

      <span className="mt-4 text-xs font-medium text-ocean opacity-70 transition group-hover:opacity-100">
        View tasks →
      </span>
    </Link>
  )
}
