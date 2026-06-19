import type { Outcome, Task } from '../../lib/database.types'
import TaskBar from './TaskBar'
import {
  TIMELINE_COL_TEMPLATE,
  taskQuarterSpan,
  type TaskSpan,
} from './timelineMath'

const OUTCOME_FALLBACK_COLOR = '#94A3B8' // slate

type Props = {
  outcome: Outcome | null
  tasks: Task[]
  onEditTask: (t: Task) => void
}

type ScheduledTask = { task: Task; span: TaskSpan }

/**
 * Renders one section of the timeline: an outcome header band plus one row per
 * scheduled task. Tasks without a usable date are filtered out at the page
 * level and surfaced via UnscheduledList.
 */
export default function OutcomeTimelineRow({
  outcome,
  tasks,
  onEditTask,
}: Props) {
  const scheduled: ScheduledTask[] = tasks
    .map((task) => {
      const span = taskQuarterSpan(task)
      return span ? { task, span } : null
    })
    .filter((x): x is ScheduledTask => x !== null)
    // Stable visual order: earliest start first, then earliest end.
    .sort((a, b) => {
      if (a.span.start !== b.span.start) return a.span.start - b.span.start
      return a.span.end - b.span.end
    })

  if (scheduled.length === 0) return null

  const color = outcome?.color ?? OUTCOME_FALLBACK_COLOR
  const heading = outcome
    ? `Outcome ${outcome.outcome_number}. ${outcome.title}`
    : 'Unassigned tasks'

  return (
    <section className="border-b border-sky/40 last:border-b-0 print:break-inside-avoid">
      {/* Outcome header band */}
      <div className="flex items-center gap-2 bg-mist/40 px-3 py-2">
        <span
          aria-hidden="true"
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="text-sm font-semibold text-dusk">{heading}</h3>
        <span className="ml-auto text-[11px] text-dusk/60">
          {scheduled.length} task{scheduled.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Task rows */}
      <div className="space-y-1.5 px-1.5 py-2">
        {scheduled.map(({ task, span }) => (
          <div
            key={task.id}
            className="grid items-center gap-1"
            style={{ gridTemplateColumns: TIMELINE_COL_TEMPLATE }}
          >
            <TaskBar
              task={task}
              outcome={outcome}
              span={span}
              onClick={() => onEditTask(task)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
