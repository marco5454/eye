import { CalendarOff } from 'lucide-react'
import type { Milestone, Task } from '../../lib/database.types'

type Props = {
  tasks: Task[]
  milestones: Milestone[]
  onEditTask: (t: Task) => void
  onEditMilestone: (m: Milestone) => void
}

/**
 * Compact list of items that couldn't be placed on the grid because they have
 * no usable date or fall fully outside the grant period. Clicking opens the
 * relevant edit modal so the user can fix the dates.
 */
export default function UnscheduledList({
  tasks,
  milestones,
  onEditTask,
  onEditMilestone,
}: Props) {
  const total = tasks.length + milestones.length
  if (total === 0) return null

  return (
    <div className="rounded-2xl border border-sky/60 bg-shell/70 p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <CalendarOff className="h-4 w-4 text-dusk/60" />
        <h3 className="text-sm font-semibold text-dusk">
          Unscheduled <span className="text-dusk/60">· {total}</span>
        </h3>
      </div>
      <p className="mb-3 text-xs text-dusk/60">
        These items have no usable date in the grant period. Click any to edit.
      </p>

      <div className="flex flex-wrap gap-2">
        {tasks.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onEditTask(t)}
            className="inline-flex items-center gap-1 rounded-full bg-mist/70 px-3 py-1 text-xs font-medium text-dusk shadow-sm hover:bg-sky focus:outline-none focus:ring-2 focus:ring-ocean"
          >
            <span className="rounded-full bg-shell px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-dusk/70">
              Task
            </span>
            <span className="max-w-[16rem] truncate">{t.title}</span>
          </button>
        ))}
        {milestones.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onEditMilestone(m)}
            className="inline-flex items-center gap-1 rounded-full bg-mist/70 px-3 py-1 text-xs font-medium text-dusk shadow-sm hover:bg-sky focus:outline-none focus:ring-2 focus:ring-ocean"
          >
            <span className="rounded-full bg-shell px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-dusk/70">
              Milestone
            </span>
            <span className="max-w-[16rem] truncate">{m.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
