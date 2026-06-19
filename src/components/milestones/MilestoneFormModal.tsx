import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type {
  Milestone,
  MilestoneInsert,
  MilestoneStatus,
  MilestoneType,
} from '../../lib/database.types'

const STATUS_OPTIONS: MilestoneStatus[] = [
  'Not Started',
  'In Progress',
  'Submitted',
  'Completed',
]
const TYPE_OPTIONS: MilestoneType[] = ['Donor Report', 'Internal', 'Deliverable']
const YEAR_OPTIONS = ['Y1', 'Y2', 'Y3'] as const

type Props = {
  open: boolean
  /** When provided, modal is in edit mode; otherwise create mode. */
  milestone: Milestone | null
  onClose: () => void
  onSave: (input: MilestoneInsert) => Promise<void>
}

type FormState = {
  year: string
  title: string
  type: MilestoneType | ''
  due_description: string
  due_date: string
  owner: string
  status: MilestoneStatus
  notes: string
}

const emptyForm: FormState = {
  year: 'Y1',
  title: '',
  type: '',
  due_description: '',
  due_date: '',
  owner: '',
  status: 'Not Started',
  notes: '',
}

function fromMilestone(m: Milestone): FormState {
  return {
    year: m.year,
    title: m.title,
    type: m.type ?? '',
    due_description: m.due_description ?? '',
    due_date: m.due_date ?? '',
    owner: m.owner ?? '',
    status: m.status,
    notes: m.notes ?? '',
  }
}

function toInsert(f: FormState): MilestoneInsert {
  return {
    year: f.year.trim(),
    title: f.title.trim(),
    type: f.type === '' ? null : f.type,
    due_description: f.due_description.trim() || null,
    due_date: f.due_date || null,
    owner: f.owner.trim() || null,
    status: f.status,
    notes: f.notes.trim() || null,
  }
}

export default function MilestoneFormModal({ open, milestone, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  // Reset form whenever modal is opened or milestone target changes. This
  // syncs state with an external prop (`open`) and is the canonical use case
  // for an effect — `react-hooks/set-state-in-effect` flags it but the rule
  // doesn't cover prop-synchronization, which is what we're doing.
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(milestone ? fromMilestone(milestone) : emptyForm)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    // Focus title shortly after open so the dialog is mounted.
    const id = window.setTimeout(() => titleRef.current?.focus(), 30)
    return () => window.clearTimeout(id)
  }, [open, milestone])

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    if (!form.year.trim()) {
      setError('Year is required.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSave(toInsert(form))
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save milestone.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = milestone !== null
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-dusk/70'
  const inputClass =
    'mt-1 w-full rounded-xl border border-sky bg-mist/40 px-3 py-2 text-sm text-dusk shadow-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/30'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dusk/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-shell shadow-xl">
        <header className="flex items-center justify-between border-b border-sky px-6 py-4">
          <h2 id="milestone-form-title" className="text-lg font-semibold text-dusk">
            {isEdit ? 'Edit milestone' : 'New milestone'}
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
            <label className={labelClass} htmlFor="milestone-title">
              Title <span className="text-coral">*</span>
            </label>
            <input
              id="milestone-title"
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={inputClass}
              maxLength={200}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="milestone-year">
                Year <span className="text-coral">*</span>
              </label>
              <select
                id="milestone-year"
                value={form.year}
                onChange={(e) => update('year', e.target.value)}
                className={inputClass}
                required
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="milestone-type">
                Type
              </label>
              <select
                id="milestone-type"
                value={form.type}
                onChange={(e) => update('type', e.target.value as MilestoneType | '')}
                className={inputClass}
              >
                <option value="">— None —</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="milestone-due-date">
                Due date
              </label>
              <input
                id="milestone-due-date"
                type="date"
                value={form.due_date}
                onChange={(e) => update('due_date', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="milestone-due-description">
                Due description
              </label>
              <input
                id="milestone-due-description"
                type="text"
                value={form.due_description}
                onChange={(e) => update('due_description', e.target.value)}
                placeholder="e.g. Q2 — early September"
                className={inputClass}
                maxLength={120}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="milestone-owner">
                Owner
              </label>
              <input
                id="milestone-owner"
                type="text"
                value={form.owner}
                onChange={(e) => update('owner', e.target.value)}
                placeholder="e.g. Programs Lead"
                className={inputClass}
                maxLength={120}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="milestone-status">
                Status
              </label>
              <select
                id="milestone-status"
                value={form.status}
                onChange={(e) => update('status', e.target.value as MilestoneStatus)}
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

          <div>
            <label className={labelClass} htmlFor="milestone-notes">
              Notes
            </label>
            <textarea
              id="milestone-notes"
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
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
