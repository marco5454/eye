import { ChevronRight } from 'lucide-react'
import type { Outcome, Output } from '../../lib/database.types'
import ProgressBar from '../ui/ProgressBar'
import OutputRow from './OutputRow'
import { totalActuals } from './outputMath'

type Props = {
  /** Outcome key for unassigned bucket is `null`. */
  outcome: Outcome | null
  outputs: Output[]
  expanded: boolean
  onToggle: () => void
  onEdit: (o: Output) => void
  onDelete: (o: Output) => Promise<void>
}

/**
 * Summarises a group's headline progress.
 * - Outputs without a numeric_target are skipped from the percent calc.
 * - Cumulative outputs contribute total/target.
 * - Ongoing outputs contribute the average of (year_actual / annual_target).
 */
function summarize(outputs: Output[]): {
  total: number
  trackedCount: number
  avgPercent: number
} {
  const total = outputs.length
  const tracked = outputs.filter(
    (o) => o.numeric_target != null && o.numeric_target > 0,
  )
  if (tracked.length === 0) return { total, trackedCount: 0, avgPercent: 0 }

  const ratios = tracked.map((o) => {
    const target = o.numeric_target as number
    if (o.is_ongoing) {
      const yearRatios = [
        o.y1_actual / target,
        o.y2_actual / target,
        o.y3_actual / target,
      ]
      return yearRatios.reduce((a, b) => a + b, 0) / yearRatios.length
    }
    return totalActuals(o) / target
  })

  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length
  return {
    total,
    trackedCount: tracked.length,
    avgPercent: Math.max(0, Math.min(100, Math.round(avg * 100))),
  }
}

export default function OutputOutcomeGroup({
  outcome,
  outputs,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const { total, trackedCount, avgPercent } = summarize(outputs)
  const accent = outcome?.color ?? '#94A3B8' // slate-400 fallback for unassigned
  const sectionId = outcome
    ? `output-group-${outcome.outcome_number}`
    : 'output-group-unassigned'
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
            {total} {total === 1 ? 'output' : 'outputs'}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden w-24 sm:block">
            <ProgressBar value={avgPercent} color={accent} size="sm" />
          </span>
          <span className="font-mono text-xs font-semibold text-dusk">
            {trackedCount === 0 ? '—' : `${avgPercent}%`}
          </span>
        </div>
      </button>

      {(expanded || total === 0) && (
        <div id={sectionId} className="border-t border-sky px-5 py-4 print:block">
          {total === 0 ? (
            <p className="rounded-xl bg-mist px-3 py-4 text-center text-sm text-dusk/60">
              No outputs {outcome ? `under ${heading}` : 'unassigned'}.
            </p>
          ) : (
            <ul className="space-y-3">
              {outputs.map((o) => (
                <OutputRow
                  key={o.id}
                  output={o}
                  outcome={outcome}
                  onEdit={onEdit}
                  onDelete={onDelete}
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
            {outputs.map((o) => (
              <OutputRow
                key={`print-${o.id}`}
                output={o}
                outcome={outcome}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
