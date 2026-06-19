import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type {
  Outcome,
  Task,
  TaskInsert,
  TaskStatus,
} from '../../lib/database.types'

const STATUS_OPTIONS: TaskStatus[] = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Completed',
]

const YEAR_RANGE_PRESETS = [
  'Y1',
  'Y2',
  'Y3',
  'Y1–Y2',
  'Y2–Y3',
  'Y1–Y3',
] as const

type Props = {
  open: boolean
  /** When provided, modal is in edit mode; otherwise create mode. */
  task: Task | null
  outcomes: Outcome[]
  onClose: () => void
  onSave: (input: TaskInsert) => Promise<void>
}

type FormState = {
  outcome_id: string
  title: string
  description: string
  owner: string
  year_range: string
  target_kpi: string
  start_date: string
  end_date: string
  percent_complete: number
  status: TaskStatus
  notes: string
}

const emptyForm: FormState = {
  outcome_id: '',
  title: '',
  description: '',
  owner: '',
  year_range: '',
  target_kpi: '',
  start_date: '',
  end_date: '',
  percent_complete: 0,
  status: 'Not Started',
  notes: '',
}

function fromTask(t: Task): FormState {
  return {
    outcome_id: t.outcome_id ?? '',
    title: t.title,
    description: t.description ?? '',
    owner: t.owner ?? '',
    year_range: t.year_range ?? '',
    target_kpi: t.target_kpi ?? '',
    start_date: t.start_date ?? '',
    end_date: t.end_date ?? '',
    percent_complete: t.percent_complete,
    status: t.status,
    notes: t.notes ?? '',
  }
}

function toInsert(f: FormState): TaskInsert {
  return {
    outcome_id: f.outcome_id || null,
    title: f.title.trim(),
    description: f.description.trim() || null,
    owner: f.owner.trim() || null,
    year_range: f.year_range.trim() || null,
    target_kpi: f.target_kpi.trim() || null,
    start_date: f.start_date || null,
    end_date: f.end_date || null,
    percent_complete: Math.max(0, Math.min(100, Math.round(f.percent_complete))),
    status: f.status,
    notes: f.notes.trim() || null,
  }
}

export default function TaskFormModal({
  open,
  task,
  outcomes,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  // Reset form whenever modal is opened or task target changes — prop-sync.
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(task ? fromTask(task) : emptyForm)
    setError(null)
    const id = window.setTimeout(() => titleRef.current?.focus(), 30)
    return () => window.clearTimeout(id)
  }, [open, task])

  // Escape closes the dialog.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Auto-mirror percent_complete <-> status to keep them coherent. We only
  // nudge when status changes (user-initiated) so manual percent edits stay.
  function handleStatusChange(next: TaskStatus) {
    setForm((prev) => {
      let pct = prev.percent_complete
      if (next === 'Completed') pct = 100
      else if (next === 'Not Started' && prev.percent_complete === 100) pct = 0
      else if (next === 'In Progress' && prev.percent_complete === 0) pct = 10
      return { ...prev, status: next, percent_complete: pct }
    })
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setError('End date must be after start date.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSave(toInsert(form))
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save task.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = task !== null
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-dusk/70'
  const inputClass =
    'mt-1 w-full rounded-xl border border-sky bg-mist/40 px-3 py-2 text-sm text-dusk shadow-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/30'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dusk/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-shell shadow-xl">
        <header className="flex items-center justify-between border-b border-sky px-6 py-4">
          <h2 id="task-form-title" className="text-lg font-semibold text-dusk">
            {isEdit ? 'Edit task' : 'New task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-dusk/60 hover:bg-mist hover:text-dusk"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className={labelClass} htmlFor="task-title">
              Title <span className="text-coral">*</span>
            </label>
            <input
              id="task-title"
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={inputClass}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="task-description">
              Description
            </label>
            <textarea
              id="task-description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
              className={inputClass}
              maxLength={1000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="task-outcome">
                Outcome
              </label>
              <select
                id="task-outcome"
                value={form.outcome_id}
                onChange={(e) => update('outcome_id', e.target.value)}
                className={inputClass}
              >
                <option value="">— Unassigned —</option>
                {outcomes.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.outcome_number}. {o.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="task-owner">
                Owner
              </label>
              <input
                id="task-owner"
                type="text"
                value={form.owner}
                onChange={(e) => update('owner', e.target.value)}
                placeholder="e.g. Programs Lead"
                className={inputClass}
                maxLength={120}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="task-year-range">
                Year range
              </label>
              <input
                id="task-year-range"
                type="text"
                value={form.year_range}
                onChange={(e) => update('year_range', e.target.value)}
                placeholder="e.g. Y1–Y3"
                className={inputClass}
                list="year-range-presets"
                maxLength={20}
              />
              <datalist id="year-range-presets">
                {YEAR_RANGE_PRESETS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={labelClass} htmlFor="task-status">
                Status
              </label>
              <select
                id="task-status"
                value={form.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="task-start-date">
                Start date
              </label>
              <input
                id="task-start-date"
                type="date"
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="task-end-date">
                End date
              </label>
              <input
                id="task-end-date"
                type="date"
                value={form.end_date}
                onChange={(e) => update('end_date', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="task-target-kpi">
              Target KPI
            </label>
            <input
              id="task-target-kpi"
              type="text"
              value={form.target_kpi}
              onChange={(e) => update('target_kpi', e.target.value)}
              placeholder="e.g. 600,000 individuals reached"
              className={inputClass}
              maxLength={300}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={labelClass} htmlFor="task-percent">
                Progress
              </label>
              <span className="font-mono text-sm font-semibold text-dusk">
                {form.percent_complete}%
              </span>
            </div>
            <input
              id="task-percent"
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.percent_complete}
              onChange={(e) =>
                update('percent_complete', Number(e.target.value))
              }
              className="mt-2 w-full accent-ocean"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="task-notes">
              Notes
            </label>
            <textarea
              id="task-notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className={inputClass}
              maxLength={1000}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full px-4 py-2 text-sm font-medium text-dusk hover:bg-mist disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-ocean px-5 py-2 text-sm font-semibold text-shell shadow-sm hover:bg-ocean/90 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
