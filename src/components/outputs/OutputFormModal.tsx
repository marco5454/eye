import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type {
  Outcome,
  Output,
  OutputInsert,
} from '../../lib/database.types'

type Props = {
  open: boolean
  /** When provided, modal is in edit mode; otherwise create mode. */
  output: Output | null
  outcomes: Outcome[]
  onClose: () => void
  onSave: (input: OutputInsert) => Promise<void>
}

type FormState = {
  outcome_id: string
  output_number: string
  description: string
  numeric_target: string // text input -> parsed to number|null on save
  target_label: string
  y1_actual: string
  y2_actual: string
  y3_actual: string
  is_ongoing: boolean
}

const emptyForm: FormState = {
  outcome_id: '',
  output_number: '',
  description: '',
  numeric_target: '',
  target_label: '',
  y1_actual: '0',
  y2_actual: '0',
  y3_actual: '0',
  is_ongoing: false,
}

function fromOutput(o: Output): FormState {
  return {
    outcome_id: o.outcome_id ?? '',
    output_number: o.output_number,
    description: o.description,
    numeric_target: o.numeric_target == null ? '' : String(o.numeric_target),
    target_label: o.target_label,
    y1_actual: String(o.y1_actual),
    y2_actual: String(o.y2_actual),
    y3_actual: String(o.y3_actual),
    is_ongoing: o.is_ongoing,
  }
}

function parseNonNegative(input: string): number {
  const n = Number(input)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

function toInsert(f: FormState): OutputInsert {
  const targetTrimmed = f.numeric_target.trim()
  const numeric_target =
    targetTrimmed === '' ? null : Math.max(0, Number(targetTrimmed))
  return {
    outcome_id: f.outcome_id || null,
    output_number: f.output_number.trim(),
    description: f.description.trim(),
    numeric_target: numeric_target == null || Number.isNaN(numeric_target) ? null : numeric_target,
    target_label: f.target_label.trim(),
    y1_actual: parseNonNegative(f.y1_actual),
    y2_actual: parseNonNegative(f.y2_actual),
    y3_actual: parseNonNegative(f.y3_actual),
    is_ongoing: f.is_ongoing,
  }
}

export default function OutputFormModal({
  open,
  output,
  outcomes,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const numberRef = useRef<HTMLInputElement>(null)

  // Reset form whenever modal is opened or output target changes — prop-sync.
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(output ? fromOutput(output) : emptyForm)
    setError(null)
    const id = window.setTimeout(() => numberRef.current?.focus(), 30)
    return () => window.clearTimeout(id)
  }, [open, output])

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
    if (!form.output_number.trim()) {
      setError('Output number is required.')
      return
    }
    if (!form.description.trim()) {
      setError('Description is required.')
      return
    }
    if (!form.target_label.trim()) {
      setError('Target label is required (e.g. "by Y3").')
      return
    }
    if (form.numeric_target.trim() !== '') {
      const n = Number(form.numeric_target)
      if (!Number.isFinite(n) || n < 0) {
        setError('Numeric target must be zero or a positive number.')
        return
      }
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSave(toInsert(form))
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save output.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = output !== null
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-dusk/70'
  const inputClass =
    'mt-1 w-full rounded-xl border border-sky bg-mist/40 px-3 py-2 text-sm text-dusk shadow-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/30'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dusk/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="output-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-shell shadow-xl">
        <header className="flex items-center justify-between border-b border-sky px-6 py-4">
          <h2 id="output-form-title" className="text-lg font-semibold text-dusk">
            {isEdit ? 'Edit output' : 'New output'}
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
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div>
              <label className={labelClass} htmlFor="output-number">
                Output # <span className="text-coral">*</span>
              </label>
              <input
                id="output-number"
                ref={numberRef}
                type="text"
                value={form.output_number}
                onChange={(e) => update('output_number', e.target.value)}
                placeholder="e.g. 1.1"
                className={`${inputClass} font-mono`}
                maxLength={20}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="output-outcome">
                Outcome
              </label>
              <select
                id="output-outcome"
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
          </div>

          <div>
            <label className={labelClass} htmlFor="output-description">
              Description <span className="text-coral">*</span>
            </label>
            <textarea
              id="output-description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
              className={inputClass}
              maxLength={500}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="output-numeric-target">
                Numeric target
              </label>
              <input
                id="output-numeric-target"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={form.numeric_target}
                onChange={(e) => update('numeric_target', e.target.value)}
                placeholder="Leave empty for narrative-only"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-dusk/60">
                Optional. When set, totals are tracked against it.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="output-target-label">
                Target label <span className="text-coral">*</span>
              </label>
              <input
                id="output-target-label"
                type="text"
                value={form.target_label}
                onChange={(e) => update('target_label', e.target.value)}
                placeholder="e.g. by Y3, annually"
                className={inputClass}
                maxLength={120}
                required
              />
            </div>
          </div>

          <fieldset className="rounded-2xl border border-sky bg-mist/30 px-4 py-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-dusk/70">
              Actuals to date
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {(['y1_actual', 'y2_actual', 'y3_actual'] as const).map(
                (key, idx) => (
                  <div key={key}>
                    <label
                      className={labelClass}
                      htmlFor={`output-${key}`}
                    >{`Year ${idx + 1}`}</label>
                    <input
                      id={`output-${key}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ),
              )}
            </div>
          </fieldset>

          <label className="flex items-center gap-3 rounded-2xl border border-sky bg-mist/30 px-4 py-3">
            <input
              type="checkbox"
              checked={form.is_ongoing}
              onChange={(e) => update('is_ongoing', e.target.checked)}
              className="h-4 w-4 rounded accent-ocean"
            />
            <span className="text-sm text-dusk">
              <span className="font-semibold">Ongoing target</span>
              <span className="ml-2 text-dusk/60">
                Tracked annually rather than as a cumulative total.
              </span>
            </span>
          </label>

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
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create output'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
