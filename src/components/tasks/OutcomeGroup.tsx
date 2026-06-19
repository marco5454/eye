import { ChevronRight } from 'lucide-react'
import type { Outcome, Task, TaskStatus } from '../../lib/database.types'
import ProgressBar from '../ui/ProgressBar'
import TaskRow from './TaskRow'

type Props = {
  /** Outcome key for unassigned bucket is `null`. */
  outcome: Outcome | null
  tasks: Task[]
  expanded: boolean
  onToggle: () => void
  onEdit: (t: Task) => void
  onDelete: (t: Task) => Promise<void>
  onQuickUpdate: (
    t: Task,
    patch: { status?: TaskStatus; percent_complete?: number },
  ) => Promise<void>
}

function summarize(tasks: Task[]): { total: number; avgPercent: number } {
  if (tasks.length === 0) return { total: 0, avgPercent: 0 }
  const sum = tasks.reduce((s, t) => s + (t.percent_complete ?? 0), 0)
  return { total: tasks.length, avgPercent: Math.round(sum / tasks.length) }
}

export default function OutcomeGroup({
  outcome,
  tasks,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onQuickUpdate,
}: Props) {
  const { total, avgPercent } = summarize(tasks)
  const accent = outcome?.color ?? '#94A3B8' // slate-400 fallback for unassigned
  const sectionId = outcome
    ? `outcome-group-${outcome.outcome_number}`
    : 'outcome-group-unassigned'
  const heading = outcome
    ? `${outcome.outcome_number}. ${outcome.title}`
    : 'Unassigned'

  return (
    <section
      className="rounded-2xl bg-shell shadow-sm print:break-inside-avoid print:shadow-none print:ring-1 print:ring-sky"
      aria-labelledby={`${sectionId}-heading`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={sectionId}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left hover:bg-mist/40 print:cursor-default print:hover:bg-transparent"
      >
        <div className="flex min-w-0 items-center gap-3">
          <ChevronRight
            className={`h-4 w-4 shrink-0 text-dusk/60 transition-transform print:hidden ${
              expanded ? 'rotate-90' : ''
            }`}
            aria-hidden
          />
          {outcome ? (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold text-white"
              style={{ backgroundColor: accent }}
              aria-hidden
            >
              {outcome.outcome_number}
            </span>
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-mist font-mono text-xs font-bold text-dusk/60">
              ?
            </span>
          )}
          <h2
            id={`${sectionId}-heading`}
            className="truncate text-base font-semibold text-dusk"
          >
            {heading}
          </h2>
          <span className="hidden shrink-0 rounded-full bg-mist px-2.5 py-0.5 font-mono text-xs text-dusk/70 sm:inline">
            {total} {total === 1 ? 'task' : 'tasks'}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden w-24 sm:block">
            <ProgressBar value={avgPercent} color={accent} size="sm" />
          </span>
          <span className="font-mono text-xs font-semibold text-dusk">
            {total === 0 ? '—' : `${avgPercent}%`}
          </span>
        </div>
      </button>

      {(expanded || total === 0) && (
        <div id={sectionId} className="border-t border-sky px-5 py-4 print:block">
          {total === 0 ? (
            <p className="rounded-xl bg-mist px-3 py-4 text-center text-sm text-dusk/60">
              No tasks {outcome ? `under ${heading}` : 'unassigned'}.
            </p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  outcome={outcome}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onQuickUpdate={onQuickUpdate}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Print-only fallback so collapsed groups still print their content. */}
      {!expanded && total > 0 && (
        <div className="hidden border-t border-sky px-5 py-4 print:block">
          <ul className="space-y-3">
            {tasks.map((t) => (
              <TaskRow
                key={`print-${t.id}`}
                task={t}
                outcome={outcome}
                onEdit={onEdit}
                onDelete={onDelete}
                onQuickUpdate={onQuickUpdate}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
