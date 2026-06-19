import type { Risk, RiskScore } from '../../lib/database.types'
import { computeRiskLevel, LEVEL_STYLES } from './riskMath'

type Props = {
  risks: Risk[]
  /** Called when a risk pill inside a cell is clicked. */
  onSelect: (risk: Risk) => void
}

// Rows = likelihood (top to bottom: H, M, L).
// Cols = impact     (left to right: L, M, H).
// This puts the High/High cell in the top-right corner — convention used in
// most operational risk matrices.
const ROWS: RiskScore[] = ['H', 'M', 'L']
const COLS: RiskScore[] = ['L', 'M', 'H']

const ROW_LABEL: Record<RiskScore, string> = {
  H: 'High',
  M: 'Medium',
  L: 'Low',
}
const COL_LABEL: Record<RiskScore, string> = {
  H: 'High',
  M: 'Medium',
  L: 'Low',
}

export default function RiskMatrix({ risks, onSelect }: Props) {
  // Bucket scored risks by [likelihood][impact]; unscored go into a side list.
  const buckets: Record<RiskScore, Record<RiskScore, Risk[]>> = {
    H: { H: [], M: [], L: [] },
    M: { H: [], M: [], L: [] },
    L: { H: [], M: [], L: [] },
  }
  const unscored: Risk[] = []
  for (const r of risks) {
    if (r.likelihood && r.impact) {
      buckets[r.likelihood][r.impact].push(r)
    } else {
      unscored.push(r)
    }
  }
  // Stable order inside each cell.
  for (const l of ROWS) {
    for (const i of COLS) {
      buckets[l][i].sort((a, b) => a.risk_number - b.risk_number)
    }
  }

  return (
    <div className="rounded-2xl bg-shell p-5 shadow-sm print:break-inside-avoid print:shadow-none print:ring-1 print:ring-sky">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-dusk">Risk matrix</h2>
        <p className="text-xs text-dusk/60">Likelihood × impact</p>
      </div>

      {/* Grid: leading axis label column + 3 impact columns; first row is header. */}
      <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1.5">
        {/* Header row: blank + impact labels (L, M, H). */}
        <div />
        {COLS.map((c) => (
          <div
            key={`head-${c}`}
            className="text-center text-[10px] font-semibold uppercase tracking-wider text-dusk/60"
          >
            Impact: {COL_LABEL[c]}
          </div>
        ))}

        {/* Body rows. */}
        {ROWS.map((row) => (
          <MatrixRow
            key={row}
            row={row}
            cols={COLS}
            buckets={buckets[row]}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Legend + axis hint. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-dusk/60">
          Rows = likelihood (top: high). Columns = impact (right: high).
        </p>
        <div className="flex items-center gap-3 text-[11px] text-dusk/70">
          {(['High', 'Medium', 'Low'] as const).map((lvl) => (
            <span key={lvl} className="inline-flex items-center gap-1">
              <span
                className={`h-2 w-2 rounded-full ${LEVEL_STYLES[lvl].dot}`}
                aria-hidden
              />
              {lvl}
            </span>
          ))}
        </div>
      </div>

      {unscored.length > 0 && (
        <div className="mt-4 rounded-xl bg-mist/60 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-dusk/60">
            Unscored ({unscored.length})
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {unscored.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r)}
                className="rounded-full bg-shell px-2 py-0.5 font-mono text-[11px] text-dusk/80 shadow-sm hover:bg-mist"
                title={r.description}
              >
                R{r.risk_number}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type RowProps = {
  row: RiskScore
  cols: RiskScore[]
  buckets: Record<RiskScore, Risk[]>
  onSelect: (risk: Risk) => void
}

function MatrixRow({ row, cols, buckets, onSelect }: RowProps) {
  return (
    <>
      <div className="flex items-center justify-end pr-2 text-[10px] font-semibold uppercase tracking-wider text-dusk/60">
        L: {ROW_LABEL[row]}
      </div>
      {cols.map((col) => {
        const cellRisks = buckets[col]
        const level = computeRiskLevel(row, col)
        const styles = level ? LEVEL_STYLES[level] : null
        return (
          <div
            key={`${row}-${col}`}
            className={`flex min-h-[78px] flex-col gap-1 rounded-xl border p-2 ${
              styles ? styles.cell : 'bg-mist border-sky'
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  styles ? styles.text : 'text-dusk/60'
                }`}
              >
                {level ?? '—'}
              </span>
              <span className="font-mono text-xs font-bold text-dusk">
                {cellRisks.length}
              </span>
            </div>
            {cellRisks.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cellRisks.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelect(r)}
                    title={r.description}
                    className="rounded-full bg-shell/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-dusk shadow-sm hover:bg-shell"
                  >
                    R{r.risk_number}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
