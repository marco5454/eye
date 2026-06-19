import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Risk } from '../../lib/database.types'
import { LEVEL_STYLES, SCORE_LABELS } from './riskMath'

type Props = {
  risk: Risk
  onEdit: (r: Risk) => void
  onDelete: (r: Risk) => Promise<void>
  /** Extra classes appended to the root <li> (e.g. for highlight). */
  className?: string
  /** id forwarded to the root <li> (used for scrollIntoView). */
  id?: string
}

export default function RiskRow({
  risk,
  onEdit,
  onDelete,
  className,
  id,
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirmDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onDelete(risk)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete risk.'
      setError(message)
      setDeleting(false)
      setConfirming(false)
    }
  }

  const level = risk.risk_level
  const styles = level ? LEVEL_STYLES[level] : null

  return (
    <li
      id={id}
      className={`flex flex-col gap-3 rounded-2xl bg-shell p-4 shadow-sm transition-shadow print:break-inside-avoid print:shadow-none print:ring-1 print:ring-sky${
        className ? ` ${className}` : ''
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-mist px-2 py-0.5 font-mono text-[11px] font-semibold text-dusk/80">
              R{risk.risk_number}
            </span>
            <span className="rounded-full bg-sky/60 px-2 py-0.5 text-[11px] font-medium text-dusk/80">
              {risk.category}
            </span>
            {level && styles ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles.bg} ${styles.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden />
                {level}
              </span>
            ) : (
              <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-dusk/60">
                Unscored
              </span>
            )}
            {risk.likelihood && risk.impact && (
              <span className="rounded-full bg-mist px-2 py-0.5 font-mono text-[11px] text-dusk/70">
                L:{risk.likelihood} · I:{risk.impact}
              </span>
            )}
          </div>
          <p className="text-sm text-dusk">{risk.description}</p>
          {risk.mitigation_strategy && (
            <p className="text-xs text-dusk/70">
              <span className="font-semibold text-dusk/80">Mitigation: </span>
              {risk.mitigation_strategy}
            </p>
          )}
          {(risk.owner || (risk.likelihood && risk.impact)) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dusk/60">
              {risk.owner && (
                <span>
                  <span className="font-semibold text-dusk/80">Owner: </span>
                  {risk.owner}
                </span>
              )}
              {risk.likelihood && risk.impact && (
                <span>
                  <span className="font-semibold text-dusk/80">Score: </span>
                  {SCORE_LABELS[risk.likelihood]} likelihood ×{' '}
                  {SCORE_LABELS[risk.impact]} impact
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 print:hidden">
          {!confirming ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(risk)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-dusk hover:bg-mist"
                aria-label={`Edit risk ${risk.risk_number}`}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                aria-label={`Delete risk ${risk.risk_number}`}
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
                className="rounded-full px-3 py-1.5 text-xs font-medium text-dusk hover:bg-mist disabled:opacity-50"
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

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </li>
  )
}
