import { Target, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isAfter, parseISO } from 'date-fns'
import type { Task } from '../../lib/database.types'
import { getCurrentQuarter, quarterDateRange } from '../../lib/grantPeriod'
import ProgressBar from '../ui/ProgressBar'

type Props = {
  tasks: Task[]
}

function isActiveInRange(task: Task, start: Date, end: Date): boolean {
  // Start <= rangeEnd AND End >= rangeStart. Missing dates fall back to "open".
  const taskStart = task.start_date ? parseISO(task.start_date) : null
  const taskEnd = task.end_date ? parseISO(task.end_date) : null
  if (taskStart && isAfter(taskStart, end)) return false
  if (taskEnd && isAfter(start, taskEnd)) return false
  // If the task has no dates at all, treat it as untracked for this widget.
  if (!taskStart && !taskEnd) return false
  return true
}

function isOverdue(task: Task, today: Date): boolean {
  if (task.status === 'Completed') return false
  if (!task.end_date) return false
  return isAfter(today, parseISO(task.end_date))
}

export default function QuarterFocus({ tasks }: Props) {
  const quarter = getCurrentQuarter()

  if (!quarter) {
    return (
      <div className="rounded-2xl bg-shell p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-ocean" />
          <h3 className="text-sm font-semibold text-dusk">Quarter focus</h3>
        </div>
        <p className="rounded-xl bg-mist px-3 py-6 text-center text-sm text-dusk/60">
          Outside the active grant period.
        </p>
      </div>
    )
  }

  const range = quarterDateRange(quarter.index)!
  const activeTasks = tasks.filter((t) => isActiveInRange(t, range.start, range.end))
  const totalActive = activeTasks.length
  const completed = activeTasks.filter((t) => t.status === 'Completed').length
  const inProgress = activeTasks.filter((t) => t.status === 'In Progress').length
  const today = new Date()
  const overdue = tasks.filter((t) => isOverdue(t, today)).length
  const completionPercent =
    totalActive === 0
      ? 0
      : Math.round(
          activeTasks.reduce((sum, t) => sum + (t.percent_complete ?? 0), 0) / totalActive,
        )

  return (
    <div className="rounded-2xl bg-shell p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-ocean" />
          <h3 className="text-sm font-semibold text-dusk">Quarter focus</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky px-2.5 py-0.5 text-xs font-medium text-ocean">
          <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
          {quarter.label}
        </span>
      </div>

      {totalActive === 0 ? (
        <p className="rounded-xl bg-mist px-3 py-6 text-center text-sm text-dusk/60">
          No tasks scheduled for this quarter.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-mist/60 p-3">
              <div className="font-mono text-2xl font-bold text-dusk">{totalActive}</div>
              <div className="text-[11px] text-dusk/60">Active</div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <div className="font-mono text-2xl font-bold text-emerald-700">{completed}</div>
              <div className="text-[11px] text-emerald-700/70">Done</div>
            </div>
            <div className="rounded-xl bg-orange-50 p-3">
              <div className="font-mono text-2xl font-bold text-coral">{inProgress}</div>
              <div className="text-[11px] text-coral/80">In progress</div>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-dusk/60">Completion</span>
              <span className="font-mono text-sm font-semibold text-dusk">
                {completionPercent}%
              </span>
            </div>
            <ProgressBar value={completionPercent} size="sm" className="mt-1.5" />
          </div>

          {overdue > 0 && (
            <Link
              to="/tasks"
              className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="flex-1">
                {overdue} task{overdue === 1 ? '' : 's'} past due across the grant
              </span>
              <span className="text-red-700/70">Open →</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
