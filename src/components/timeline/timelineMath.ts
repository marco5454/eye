import { differenceInCalendarDays, parseISO } from 'date-fns'
import {
  GRANT_END,
  GRANT_START,
  QUARTER_DAYS,
} from '../../lib/grantPeriod'
import type { Milestone, Task } from '../../lib/database.types'

// ---- Date → quarter mapping ----------------------------------------------
// All dates are clamped into the 1..12 grant-quarter range. Dates that fall
// completely outside the grant period are marked as out-of-range so they can
// be surfaced separately in the unscheduled list rather than silently pinned
// to the first/last column.

export const QUARTER_COUNT = 12

/** Indexes 1..12, used for column layout. */
export const QUARTER_INDEXES: number[] = Array.from(
  { length: QUARTER_COUNT },
  (_, i) => i + 1,
)

/** Shared CSS grid template for any 12-column timeline row. */
export const TIMELINE_COL_TEMPLATE = `repeat(${QUARTER_COUNT}, minmax(72px, 1fr))`

export type QuarterMapping =
  | { kind: 'in-range'; index: number }
  | { kind: 'before' }
  | { kind: 'after' }

/**
 * Map an arbitrary calendar date into its grant-quarter index (1..12).
 * Dates strictly before GRANT_START → `before`, on/after GRANT_END → `after`.
 */
export function mapDateToQuarter(date: Date): QuarterMapping {
  if (date < GRANT_START) return { kind: 'before' }
  if (date >= GRANT_END) return { kind: 'after' }
  const days = differenceInCalendarDays(date, GRANT_START)
  const raw = Math.floor(days / QUARTER_DAYS) + 1
  const index = Math.min(QUARTER_COUNT, Math.max(1, raw))
  return { kind: 'in-range', index }
}

function safeParseISO(value: string | null): Date | null {
  if (!value) return null
  try {
    const d = parseISO(value)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

// ---- Tasks ---------------------------------------------------------------

export type TaskSpan = {
  /** Inclusive starting column 1..12. */
  start: number
  /** Inclusive ending column 1..12 (>= start). */
  end: number
  /** True if the start was clamped because the date was before GRANT_START. */
  clampedStart: boolean
  /** True if the end was clamped because the date was on/after GRANT_END. */
  clampedEnd: boolean
}

/**
 * Resolve a single date into a column index 1..12, with a clamp flag.
 * Returns `null` when the date is fully unusable (outside the grant period
 * with no other date to anchor against).
 */
function resolveBound(
  mapped: QuarterMapping | null,
  fallback: number | null,
): { index: number; clamped: boolean } | null {
  if (!mapped) {
    if (fallback === null) return null
    return { index: fallback, clamped: false }
  }
  if (mapped.kind === 'in-range') return { index: mapped.index, clamped: false }
  if (mapped.kind === 'before') return { index: 1, clamped: true }
  return { index: QUARTER_COUNT, clamped: true }
}

/**
 * Compute the inclusive grant-quarter span for a task, given its `start_date`
 * and/or `end_date`. Returns `null` when neither date is usable inside the
 * grant period (the task should be listed as unscheduled).
 *
 * Rules:
 *  - Both dates present → span from start quarter to end quarter.
 *  - Only one date present → single-quarter span at that quarter.
 *  - Both dates outside the grant in the same direction → unscheduled.
 *  - end before start → unscheduled (caller can flag invalid range).
 */
export function taskQuarterSpan(task: Task): TaskSpan | null {
  const startDate = safeParseISO(task.start_date)
  const endDate = safeParseISO(task.end_date)
  if (!startDate && !endDate) return null

  const startMap = startDate ? mapDateToQuarter(startDate) : null
  const endMap = endDate ? mapDateToQuarter(endDate) : null

  // Both dates fully outside the grant on the same side → unschedulable.
  if (
    (startMap?.kind === 'before' || startMap === null) &&
    endMap?.kind === 'before'
  ) {
    return null
  }
  if (
    (endMap?.kind === 'after' || endMap === null) &&
    startMap?.kind === 'after'
  ) {
    return null
  }

  // Need at least one in-range anchor to use as a fallback for the missing
  // bound. If neither side is in-range, derive a sensible default from
  // whichever side IS resolvable.
  const inRangeIndex =
    startMap?.kind === 'in-range'
      ? startMap.index
      : endMap?.kind === 'in-range'
        ? endMap.index
        : null

  const startBound = resolveBound(startMap, inRangeIndex ?? 1)
  const endBound = resolveBound(endMap, inRangeIndex ?? QUARTER_COUNT)
  if (!startBound || !endBound) return null
  if (endBound.index < startBound.index) return null

  return {
    start: startBound.index,
    end: endBound.index,
    clampedStart: startBound.clamped,
    clampedEnd: endBound.clamped,
  }
}

// ---- Milestones ----------------------------------------------------------

export type MilestoneMarker =
  | { kind: 'quarter'; index: number; clamped: boolean }
  /** Year-only milestones (no due_date): pin under the year header band. */
  | { kind: 'year'; year: 1 | 2 | 3 }
  | { kind: 'unscheduled' }

const YEAR_RE = /^Y([1-3])$/i

/**
 * Map a milestone to a position on the grid.
 *  - If `due_date` is present and in the grant period → quarter index.
 *  - If only `year` is present (Y1/Y2/Y3) → year band marker.
 *  - Otherwise → unscheduled.
 */
export function milestoneMarker(m: Milestone): MilestoneMarker {
  const date = safeParseISO(m.due_date)
  if (date) {
    const mapped = mapDateToQuarter(date)
    if (mapped.kind === 'in-range') {
      return { kind: 'quarter', index: mapped.index, clamped: false }
    }
    // Out-of-range date but the milestone clearly has a target — pin to the
    // nearest column and mark as clamped so the UI can hint at the truth.
    if (mapped.kind === 'before') {
      return { kind: 'quarter', index: 1, clamped: true }
    }
    return { kind: 'quarter', index: QUARTER_COUNT, clamped: true }
  }
  const yearMatch = m.year?.match(YEAR_RE)
  if (yearMatch) {
    const y = Number(yearMatch[1]) as 1 | 2 | 3
    return { kind: 'year', year: y }
  }
  return { kind: 'unscheduled' }
}

// ---- Grouping ------------------------------------------------------------

export const UNASSIGNED_OUTCOME_KEY = '__unassigned__'

/** Group tasks by outcome_id, with a fallback bucket for unassigned tasks. */
export function groupTasksByOutcome(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = t.outcome_id ?? UNASSIGNED_OUTCOME_KEY
    const list = map.get(key) ?? []
    list.push(t)
    map.set(key, list)
  }
  return map
}

// ---- Year bands ----------------------------------------------------------

export type YearBand = { year: 1 | 2 | 3; startCol: number; endCol: number }

/** Y1 spans cols 1–4, Y2 cols 5–8, Y3 cols 9–12. */
export const YEAR_BANDS: YearBand[] = [
  { year: 1, startCol: 1, endCol: 4 },
  { year: 2, startCol: 5, endCol: 8 },
  { year: 3, startCol: 9, endCol: 12 },
]
