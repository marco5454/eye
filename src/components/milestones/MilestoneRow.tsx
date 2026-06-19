import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Milestone, MilestoneType } from '../../lib/database.types'
import StatusBadge from '../ui/StatusBadge'

type Props = {
  milestone: Milestone
  onEdit: (m: Milestone) => void
  onDelete: (m: Milestone) => Promise<void>
}

const TYPE_STYLES: Record<MilestoneType, string> = {
  'Donor Report': 'bg-orange-50 text-coral',
  Internal: 'bg-sky text-ocean',
  Deliverable: 'bg-emerald-50 text-emerald-700',
}

export default function MilestoneRow({ milestone, onEdit, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirmDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onDelete(milestone)
      // No need to reset state — row will unmount.
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete milestone.'
      setError(message)
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-mist/60 p-4 sm:flex-row sm:items-start sm:justify-between print:break-inside-avoid">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {milestone.type && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLES[milestone.type]}`}
            >
              {milestone.type}
            </span>
          )}
          <StatusBadge status={milestone.status} />
        </div>
        <p className="text-sm font-medium text-dusk">{milestone.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dusk/60">
          {milestone.due_date && (
            <span className="font-mono">
              {format(parseISO(milestone.due_date), 'd MMM yyyy')}
            </span>
          )}
          {milestone.due_description && <span>· {milestone.due_description}</span>}
          {milestone.owner && <span>· {milestone.owner}</span>}
        </div>
        {milestone.notes && (
          <p className="text-xs text-dusk/70 whitespace-pre-line">{milestone.notes}</p>
        )}
        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 print:hidden">
        {!confirming ? (
          <>
            <button
              type="button"
              onClick={() => onEdit(milestone)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-dusk hover:bg-shell"
              aria-label={`Edit ${milestone.title}`}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              aria-label={`Delete ${milestone.title}`}
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
    </li>
  )
}
