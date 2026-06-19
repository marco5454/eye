import { CalendarClock, CheckSquare, Flag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { differenceInCalendarDays, format, isAfter, isToday, parseISO } from 'date-fns'
import type { Milestone, MilestoneType, Task } from '../../lib/database.types'
import StatusBadge from '../ui/StatusBadge'

type Props = {
  tasks: Task[]
  milestones: Milestone[]
  /** Total deadlines to surface (across both kinds). Default 5. */
  limit?: number
  /** Tasks must be ending within this many days. Default 60. */
  taskHorizonDays?: number
}

const TYPE_STYLES: Record<MilestoneType, string> = {
  'Donor Report': 'bg-orange-50 text-coral',
  Internal: 'bg-sky text-ocean',
  Deliverable: 'bg-emerald-50 text-emerald-700',
}

type Deadline =
  | {
      kind: 'task'
      id: string
      date: string
      task: Task
    }
  | {
      kind: 'milestone'
      id: string
      date: string
      milestone: Milestone
    }

function isUpcomingDate(d: Date, today: Date): boolean {
  return isToday(d) || isAfter(d, today)
}

function buildDeadlines(
  tasks: Task[],
  milestones: Milestone[],
  taskHorizonDays: number,
): Deadline[] {
  const today = new Date()
  const horizonCutoff = new Date(today.getTime() + taskHorizonDays * 86400000)

  const taskItems: Deadline[] = tasks
    .filter((t) => {
      if (!t.end_date) return false
      if (t.status === 'Completed') return false
      const d = parseISO(t.end_date)
      return isUpcomingDate(d, today) && !isAfter(d, horizonCutoff)
    })
    .map((t) => ({ kind: 'task', id: `task-${t.id}`, date: t.end_date as string, task: t }))

  const milestoneItems: Deadline[] = milestones
    .filter((m) => {
      if (!m.due_date) return false
      if (m.status === 'Completed' || m.status === 'Submitted') return false
      const d = parseISO(m.due_date)
      return isUpcomingDate(d, today)
    })
    .map((m) => ({
      kind: 'milestone',
      id: `milestone-${m.id}`,
      date: m.due_date as string,
      milestone: m,
    }))

  return [...taskItems, ...milestoneItems].sort((a, b) => a.date.localeCompare(b.date))
}

function relativeDateLabel(iso: string): string {
  const today = new Date()
  const days = differenceInCalendarDays(parseISO(iso), today)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 7) return `${days} days`
  if (days <= 30) return `${days} days`
  return format(parseISO(iso), 'd MMM')
}

export default function UpcomingDeadlines({
  tasks,
  milestones,
  limit = 5,
  taskHorizonDays = 60,
}: Props) {
  const deadlines = buildDeadlines(tasks, milestones, taskHorizonDays).slice(0, limit)

  return (
    <div className="rounded-2xl bg-shell p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-ocean" />
          <h3 className="text-sm font-semibold text-dusk">Upcoming deadlines</h3>
        </div>
        <Link to="/timeline" className="text-xs font-medium text-ocean hover:underline">
          View timeline →
        </Link>
      </div>

      {deadlines.length === 0 ? (
        <p className="rounded-xl bg-mist px-3 py-6 text-center text-sm text-dusk/60">
          Nothing due soon. Everything looks under control.
        </p>
      ) : (
        <ul className="space-y-3">
          {deadlines.map((d) => (
            <li
              key={d.id}
              className="flex flex-col gap-2 rounded-xl bg-mist/60 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  {d.kind === 'task' ? (
                    <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ocean" aria-hidden />
                  ) : (
                    <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" aria-hidden />
                  )}
                  <p className="truncate text-sm font-medium text-dusk">
                    {d.kind === 'task' ? d.task.title : d.milestone.title}
                  </p>
                </div>
                <div className="mt-1 ml-5 flex flex-wrap items-center gap-2 text-xs text-dusk/60">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      d.kind === 'task'
                        ? 'bg-sky text-ocean'
                        : d.milestone.type
                          ? TYPE_STYLES[d.milestone.type]
                          : 'bg-mist text-dusk'
                    }`}
                  >
                    {d.kind === 'task' ? 'Task' : (d.milestone.type ?? 'Milestone')}
                  </span>
                  <span className="font-mono">{relativeDateLabel(d.date)}</span>
                  <span className="font-mono text-dusk/50">
                    {format(parseISO(d.date), 'd MMM')}
                  </span>
                  {d.kind === 'task' && d.task.owner && <span>· {d.task.owner}</span>}
                  {d.kind === 'milestone' && d.milestone.owner && (
                    <span>· {d.milestone.owner}</span>
                  )}
                </div>
              </div>
              <StatusBadge status={d.kind === 'task' ? d.task.status : d.milestone.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
