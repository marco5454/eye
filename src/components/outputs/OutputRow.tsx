import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Outcome, Output } from '../../lib/database.types'
import ProgressBar from '../ui/ProgressBar'
import { formatNumber, totalActuals } from './outputMath'

type Props = {
  output: Output
  outcome: Outcome | null
  /** Show the outcome chip (skipped when grouped under that outcome). */
  showOutcomeChip?: boolean
  onEdit: (o: Output) => void
  onDelete: (o: Output) => Promise<void>
}

export default function OutputRow({
  output,
  outcome,
  showOutcomeChip = false,
  onEdit,
  onDelete,
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirmDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onDelete(output)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete output.'
      setError(message)
      setDeleting(false)
      setConfirming(false)
    }
  }

  const accent = outcome?.color ?? '#0EA5C9'
  const total = totalActuals(output)

  // Per-year ratio for the bar overlay. When ongoing, each year is judged
  // against the (annual) numeric_target. When cumulative, the trio of bars
  // each show that year's contribution to a single shared denominator.
  const target = output.numeric_target
  const yearValues: { label: string; value: number }[] = [
    { label: 'Y1', value: output.y1_actual },
    { label: 'Y2', value: output.y2_actual },
    { label: 'Y3', value: output.y3_actual },
  ]
  const denom = target == null || target === 0 ? null : target
  const denomLabel = denom == null ? null : formatNumber(denom)

  // Headline progress: cumulative -> total/target; ongoing -> avg(year/target).
  let headlinePct: number | null = null
  if (denom != null) {
    if (output.is_ongoing) {
      const ratios = yearValues.map((y) => y.value / denom)
      headlinePct = Math.round(
        (ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100,
      )
    } else {
      headlinePct = Math.round((total / denom) * 100)
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-mist/60 p-4 print:break-inside-avoid">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {output.output_number}
            </span>
            {showOutcomeChip && outcome && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                style={{ backgroundColor: accent }}
              >
                {outcome.outcome_number}. {outcome.title}
              </span>
            )}
            {output.is_ongoing && (
              <span className="rounded-full bg-shell px-2 py-0.5 text-[11px] font-medium text-dusk/70">
                Ongoing · annual
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-dusk">{output.description}</p>
          <p className="text-xs text-dusk/60">
            <span className="font-semibold text-dusk/80">Target: </span>
            {denom != null ? (
              <>
                <span className="font-mono">{denomLabel}</span> {output.target_label}
              </>
            ) : (
              output.target_label
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 print:hidden">
          {!confirming ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(output)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-dusk hover:bg-shell"
                aria-label={`Edit output ${output.output_number}`}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                aria-label={`Delete output ${output.output_number}`}
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

      {/* Per-year breakdown */}
      <div className="grid gap-2 sm:grid-cols-3">
        {yearValues.map((y) => {
          const ratio =
            denom != null && denom > 0
              ? Math.max(0, Math.min(100, Math.round((y.value / denom) * 100)))
              : null
          return (
            <div
              key={y.label}
              className="rounded-lg bg-shell px-3 py-2"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-dusk/60">
                  {y.label}
                </span>
                <span className="font-mono text-sm font-semibold text-dusk">
                  {formatNumber(y.value)}
                </span>
              </div>
              {ratio != null ? (
                <div className="mt-1.5">
                  <ProgressBar value={ratio} color={accent} size="sm" />
                </div>
              ) : (
                <div className="mt-1.5 text-[11px] text-dusk/50">
                  No numeric target
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Headline summary line. */}
      {denom != null ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dusk/70">
          {output.is_ongoing ? (
            <>
              <span>
                <span className="font-semibold text-dusk/80">Avg vs annual:</span>{' '}
                <span className="font-mono text-dusk">{headlinePct}%</span>
              </span>
            </>
          ) : (
            <>
              <span>
                <span className="font-semibold text-dusk/80">To date:</span>{' '}
                <span className="font-mono text-dusk">{formatNumber(total)}</span>{' '}
                / <span className="font-mono">{denomLabel}</span>{' '}
                <span className="font-mono text-dusk">({headlinePct}%)</span>
              </span>
            </>
          )}
        </div>
      ) : (
        <div className="text-xs text-dusk/60">
          <span className="font-semibold text-dusk/80">Total to date:</span>{' '}
          <span className="font-mono text-dusk">{formatNumber(total)}</span>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </li>
  )
}
