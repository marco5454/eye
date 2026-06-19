import type { Milestone } from '../../lib/database.types'
import MilestoneMarker from './MilestoneMarker'
import {
  TIMELINE_COL_TEMPLATE,
  YEAR_BANDS,
  milestoneMarker,
} from './timelineMath'

type Props = {
  milestones: Milestone[]
  onEdit: (m: Milestone) => void
}

type ResolvedMilestone =
  | {
      kind: 'quarter'
      milestone: Milestone
      column: number
      clamped: boolean
    }
  | { kind: 'year'; milestone: Milestone; year: 1 | 2 | 3 }

/**
 * Renders milestones as rows of pills aligned to the 12-column grid. Year-only
 * milestones (no due_date but year set to Y1/Y2/Y3) span the year band so they
 * read as "anywhere in this year".
 */
export default function MilestoneTrack({ milestones, onEdit }: Props) {
  const resolved: ResolvedMilestone[] = milestones
    .map((m): ResolvedMilestone | null => {
      const marker = milestoneMarker(m)
      if (marker.kind === 'quarter') {
        return {
          kind: 'quarter',
          milestone: m,
          column: marker.index,
          clamped: marker.clamped,
        }
      }
      if (marker.kind === 'year') {
        return { kind: 'year', milestone: m, year: marker.year }
      }
      return null
    })
    .filter((x): x is ResolvedMilestone => x !== null)

  if (resolved.length === 0) return null

  // Group by column (or year band) so we can stack them per quarter without
  // overflowing the cell. Sort by due_date then title to keep order stable.
  type Stack = ResolvedMilestone[]
  const columnStacks = new Map<number, Stack>() // column → list
  const yearStacks = new Map<1 | 2 | 3, Stack>() // year → list

  for (const r of resolved) {
    if (r.kind === 'quarter') {
      const list = columnStacks.get(r.column) ?? []
      list.push(r)
      columnStacks.set(r.column, list)
    } else {
      const list = yearStacks.get(r.year) ?? []
      list.push(r)
      yearStacks.set(r.year, list)
    }
  }

  const sortFn = (a: ResolvedMilestone, b: ResolvedMilestone): number => {
    const da = a.milestone.due_date ?? ''
    const db = b.milestone.due_date ?? ''
    if (da !== db) return da.localeCompare(db)
    return a.milestone.title.localeCompare(b.milestone.title)
  }
  for (const list of columnStacks.values()) list.sort(sortFn)
  for (const list of yearStacks.values()) list.sort(sortFn)

  const maxStack = Math.max(
    1,
    ...Array.from(columnStacks.values()).map((s) => s.length),
    ...Array.from(yearStacks.values()).map((s) => s.length),
  )

  // Render `maxStack` rows so multiple per-quarter milestones don't overlap.
  const rows: ResolvedMilestone[][] = Array.from(
    { length: maxStack },
    (_, i) => {
      const row: ResolvedMilestone[] = []
      for (const list of columnStacks.values()) {
        if (list[i]) row.push(list[i])
      }
      for (const list of yearStacks.values()) {
        if (list[i]) row.push(list[i])
      }
      return row
    },
  )

  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid items-center gap-1"
          style={{
            gridTemplateColumns: TIMELINE_COL_TEMPLATE,
          }}
        >
          {row.map((r) => {
            if (r.kind === 'quarter') {
              return (
                <MilestoneMarker
                  key={r.milestone.id}
                  milestone={r.milestone}
                  column={r.column}
                  clamped={r.clamped}
                  onClick={() => onEdit(r.milestone)}
                />
              )
            }
            const band = YEAR_BANDS.find((b) => b.year === r.year)
            if (!band) return null
            return (
              <div
                key={r.milestone.id}
                className="flex justify-center"
                style={{
                  gridColumn: `${band.startCol} / ${band.endCol + 1}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => onEdit(r.milestone)}
                  title={`${r.milestone.title}\n${r.milestone.type ?? 'Milestone'}\nY${r.year} (no specific date)`}
                  aria-label={`Edit milestone: ${r.milestone.title}`}
                  className="inline-flex h-6 max-w-full items-center gap-1 rounded-full bg-mist px-3 text-[10px] font-semibold text-dusk shadow-sm hover:bg-sky focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-1"
                >
                  <span className="truncate">
                    Y{r.year} · {r.milestone.title}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
