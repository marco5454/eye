import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Outcome, Task, TaskStatus } from '../../lib/database.types'
import StatusBadge from '../ui/StatusBadge'
import ProgressBar from '../ui/ProgressBar'

const STATUS_OPTIONS: TaskStatus[] = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Completed',
]

type Props = {
  task: Task
  outcome: Outcome | null
  /** Show the outcome chip (skipped when grouped under that outcome). */
  showOutcomeChip?: boolean
  onEdit: (t: Task) => void
  onDelete: (t: Task) => Promise<void>
  /** Inline updates (status / percent). Returns when DB write completes. */
  onQuickUpdate: (
    t: Task,
    patch: { status?: TaskStatus; percent_complete?: number },
  ) => Promise<void>
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  const fmt = (d: string) => format(parseISO(d), 'd MMM yyyy')
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

export default function TaskRow({
  task,
  outcome,
  showOutcomeChip = false,
  onEdit,
  onDelete,
  onQuickUpdate,
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Track in-flight quick updates so we can disable controls without
  // waiting for refetch latency.
  const [savingField, setSavingField] = useState<'status' | 'percent' | null>(null)
  // Optimistic display values so the UI snaps before refetch.
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus | null>(null)
  const [optimisticPercent, setOptimisticPercent] = useState<number | null>(null)

  const status = optimisticStatus ?? task.status
  const percent = optimisticPercent ?? task.percent_complete

  async function handleConfirmDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onDelete(task)
      // Row will unmount after refetch.
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete task.'
      setError(message)
      setDeleting(false)
      setConfirming(false)
    }
  }

  async function handleStatusChange(next: TaskStatus) {
    if (next === task.status) return
    setSavingField('status')
    setOptimisticStatus(next)
    setError(null)
    try {
      await onQuickUpdate(task, { status: next })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update status.'
      setError(message)
      setOptimisticStatus(null)
    } finally {
      setSavingField(null)
    }
  }

  async function handlePercentCommit(next: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(next)))
    if (clamped === task.percent_complete) return
    setSavingField('percent')
    setError(null)
    try {
      await onQuickUpdate(task, { percent_complete: clamped })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update progress.'
      setError(message)
      setOptimisticPercent(null)
    } finally {
      setSavingField(null)
    }
  }

  const accent = outcome?.color ?? '#0EA5C9'
  const dateRange = formatDateRange(task.start_date, task.end_date)

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-mist/60 p-4 print:break-inside-avoid">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {showOutcomeChip && outcome && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                style={{ backgroundColor: accent }}
              >
                {outcome.outcome_number}. {outcome.title}
              </span>
            )}
            <StatusBadge status={status} />
            {task.year_range && (
              <span className="rounded-full bg-shell px-2 py-0.5 font-mono text-[11px] text-dusk/70">
                {task.year_range}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-dusk">{task.title}</p>
          {task.description && (
            <p className="text-xs text-dusk/70">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dusk/60">
            {task.owner && <span>{task.owner}</span>}
            {dateRange && (
              <>
                {task.owner && <span aria-hidden>·</span>}
                <span className="font-mono">{dateRange}</span>
              </>
            )}
          </div>
          {task.target_kpi && (
            <p className="text-xs text-dusk/70">
              <span className="font-semibold text-dusk/80">KPI: </span>
              {task.target_kpi}
            </p>
          )}
          {task.notes && (
            <p className="text-xs text-dusk/70 whitespace-pre-line">{task.notes}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 print:hidden">
          {!confirming ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-dusk hover:bg-shell"
                aria-label={`Edit ${task.title}`}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                aria-label={`Delete ${task.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-dusk hover:bg-shell disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-shell shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress + inline status — visible in print as plain text. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex-1">
            <ProgressBar value={percent} color={accent} size="sm" />
          </div>
          <span className="font-mono text-xs font-semibold text-dusk">
            {percent}%
          </span>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={percent}
            onChange={(e) => setOptimisticPercent(Number(e.target.value))}
            onMouseUp={(e) =>
              void handlePercentCommit(Number((e.target as HTMLInputElement).value))
            }
            onTouchEnd={(e) =>
              void handlePercentCommit(Number((e.target as HTMLInputElement).value))
            }
            onKeyUp={(e) => {
              if (
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === 'Home' ||
                e.key === 'End' ||
                e.key === 'PageUp' ||
                e.key === 'PageDown'
              ) {
                void handlePercentCommit(
                  Number((e.target as HTMLInputElement).value),
                )
              }
            }}
            disabled={savingField === 'percent'}
            className="w-32 accent-ocean disabled:opacity-50"
            aria-label={`Progress for ${task.title}`}
          />
          <select
            value={status}
            onChange={(e) => void handleStatusChange(e.target.value as TaskStatus)}
            disabled={savingField === 'status'}
            className="rounded-full border border-sky bg-shell px-2 py-1 text-xs font-medium text-dusk shadow-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/30 disabled:opacity-50"
            aria-label={`Status for ${task.title}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </li>
  )
}
