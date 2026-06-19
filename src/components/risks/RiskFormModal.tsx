import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type {
  Risk,
  RiskInsert,
  RiskScore,
} from '../../lib/database.types'
import { CATEGORY_PRESETS, computeRiskLevel, SCORE_LABELS } from './riskMath'

type Props = {
  open: boolean
  /** When provided, modal is in edit mode; otherwise create mode. */
  risk: Risk | null
  /** Existing risks — used to derive a category datalist + auto-assign next number. */
  existing: Risk[]
  onClose: () => void
  onSave: (input: RiskInsert) => Promise<void>
  /** Provided by the page — usually `nextRiskNumber(existing)`. */
  nextNumber: number
}

type FormState = {
  risk_number: string // text -> int on save
  description: string
  category: string
  likelihood: '' | RiskScore
  impact: '' | RiskScore
  mitigation_strategy: string
  owner: string
}

const emptyForm: FormState = {
  risk_number: '',
  description: '',
  category: '',
  likelihood: '',
  impact: '',
  mitigation_strategy: '',
  owner: '',
}

function fromRisk(r: Risk): FormState {
  return {
    risk_number: String(r.risk_number),
    description: r.description,
    category: r.category,
    likelihood: r.likelihood ?? '',
    impact: r.impact ?? '',
    mitigation_strategy: r.mitigation_strategy ?? '',
    owner: r.owner ?? '',
  }
}

function toInsert(f: FormState, fallbackNumber: number): RiskInsert {
  const parsedNumber = Number(f.risk_number.trim())
  const risk_number =
    Number.isFinite(parsedNumber) && parsedNumber > 0
      ? Math.floor(parsedNumber)
      : fallbackNumber
  const likelihood: RiskScore | null = f.likelihood === '' ? null : f.likelihood
  const impact: RiskScore | null = f.impact === '' ? null : f.impact
  return {
    risk_number,
    description: f.description.trim(),
    category: f.category.trim(),
    likelihood,
    impact,
    risk_level: computeRiskLevel(likelihood, impact),
    mitigation_strategy: f.mitigation_strategy.trim() || null,
    owner: f.owner.trim() || null,
  }
}

const SCORE_OPTIONS: { value: '' | RiskScore; label: string }[] = [
  { value: '', label: '— Not scored —' },
  { value: 'H', label: 'High (H)' },
  { value: 'M', label: 'Medium (M)' },
  { value: 'L', label: 'Low (L)' },
]

export default function RiskFormModal({
  open,
  risk,
  existing,
  onClose,
  onSave,
  nextNumber,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)

  // Reset form whenever modal is opened or target risk changes — prop-sync.
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(
      risk
        ? fromRisk(risk)
        : { ...emptyForm, risk_number: String(nextNumber) },
    )
    setError(null)
    const id = window.setTimeout(() => descRef.current?.focus(), 30)
    return () => window.clearTimeout(id)
  }, [open, risk, nextNumber])

  // Escape closes the dialog.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Datalist of categories actually used in the data (in addition to presets).
  const categoryOptions = useMemo(() => {
    const set = new Set<string>(CATEGORY_PRESETS)
    for (const r of existing) {
      if (r.category) set.add(r.category)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [existing])

  // Live preview of computed level so users see the matrix outcome immediately.
  const previewLevel = useMemo(() => {
    const l = form.likelihood === '' ? null : form.likelihood
    const i = form.impact === '' ? null : form.impact
    return computeRiskLevel(l, i)
  }, [form.likelihood, form.impact])

  if (!open) return null

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.description.trim()) {
      setError('Description is required.')
      return
    }
    if (!form.category.trim()) {
      setError('Category is required.')
      return
    }
    const numberValue = Number(form.risk_number.trim())
    if (!Number.isFinite(numberValue) || numberValue <= 0) {
      setError('Risk number must be a positive integer.')
      return
    }
    // Duplicate-number guard (excluding the row being edited).
    const collision = existing.find(
      (r) => r.risk_number === Math.floor(numberValue) && r.id !== risk?.id,
    )
    if (collision) {
      setError(`Risk #${Math.floor(numberValue)} is already in use.`)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSave(toInsert(form, nextNumber))
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save risk.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = risk !== null
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-dusk/70'
  const inputClass =
    'mt-1 w-full rounded-xl border border-sky bg-mist/40 px-3 py-2 text-sm text-dusk shadow-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/30'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dusk/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-shell shadow-xl">
        <header className="flex items-center justify-between border-b border-sky px-6 py-4">
          <h2 id="risk-form-title" className="text-lg font-semibold text-dusk">
            {isEdit ? `Edit risk #${risk.risk_number}` : 'New risk'}
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
          <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
            <div>
              <label className={labelClass} htmlFor="risk-number">
                Risk #
              </label>
              <input
                id="risk-number"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={form.risk_number}
                onChange={(e) => update('risk_number', e.target.value)}
                className={`${inputClass} font-mono`}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="risk-category">
                Category <span className="text-coral">*</span>
              </label>
              <input
                id="risk-category"
                type="text"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                placeholder="e.g. Operational, Financial"
                list="risk-category-options"
                className={inputClass}
                maxLength={120}
                required
              />
              <datalist id="risk-category-options">
                {categoryOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="risk-description">
              Description <span className="text-coral">*</span>
            </label>
            <textarea
              id="risk-description"
              ref={descRef}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className={inputClass}
              maxLength={1000}
              required
            />
          </div>

          <fieldset className="rounded-2xl border border-sky bg-mist/30 px-4 py-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-dusk/70">
              Likelihood × impact
            </legend>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <label className={labelClass} htmlFor="risk-likelihood">
                  Likelihood
                </label>
                <select
                  id="risk-likelihood"
                  value={form.likelihood}
                  onChange={(e) =>
                    update('likelihood', e.target.value as '' | RiskScore)
                  }
                  className={inputClass}
                >
                  {SCORE_OPTIONS.map((opt) => (
                    <option key={`l-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="risk-impact">
                  Impact
                </label>
                <select
                  id="risk-impact"
                  value={form.impact}
                  onChange={(e) =>
                    update('impact', e.target.value as '' | RiskScore)
                  }
                  className={inputClass}
                >
                  {SCORE_OPTIONS.map((opt) => (
                    <option key={`i-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <span className={labelClass}>Computed level</span>
                <span
                  className={`mt-1 inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold ${
                    previewLevel === 'High'
                      ? 'bg-red-100 text-red-700'
                      : previewLevel === 'Medium'
                        ? 'bg-orange-100 text-coral'
                        : previewLevel === 'Low'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-mist text-dusk/60'
                  }`}
                >
                  {previewLevel ?? '—'}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-dusk/60">
              {form.likelihood && form.impact
                ? `${SCORE_LABELS[form.likelihood]} likelihood × ${SCORE_LABELS[form.impact]} impact = ${previewLevel ?? '—'}.`
                : 'Both likelihood and impact must be set to compute a level.'}
            </p>
          </fieldset>

          <div>
            <label className={labelClass} htmlFor="risk-mitigation">
              Mitigation strategy
            </label>
            <textarea
              id="risk-mitigation"
              value={form.mitigation_strategy}
              onChange={(e) => update('mitigation_strategy', e.target.value)}
              rows={3}
              className={inputClass}
              maxLength={1000}
              placeholder="What's being done to reduce likelihood or impact?"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="risk-owner">
              Owner
            </label>
            <input
              id="risk-owner"
              type="text"
              value={form.owner}
              onChange={(e) => update('owner', e.target.value)}
              placeholder="Person or team accountable"
              className={inputClass}
              maxLength={120}
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
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
