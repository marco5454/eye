// Grant period helpers for Marcos Power Eye.
// Grant runs June 15 2026 -> June 15 2029 (1096 days; 12 quarters).
//
// We treat the grant as 12 equal quarters of 91.25 days, anchored to
// GRANT_START. This is good enough for a UI label and avoids calendar-quarter
// mismatch (the grant doesn't start on a calendar Q boundary).

import { differenceInCalendarDays } from 'date-fns'

export const GRANT_START = new Date('2026-06-15T00:00:00Z')
export const GRANT_END = new Date('2029-06-15T00:00:00Z')
export const GRANT_TOTAL_DAYS = differenceInCalendarDays(GRANT_END, GRANT_START) // 1096
export const QUARTER_DAYS = GRANT_TOTAL_DAYS / 12 // 91.333...

export type GrantQuarter = {
  year: 1 | 2 | 3
  quarter: 1 | 2 | 3 | 4
  /** e.g. 'Y1 · Q2' */
  label: string
  /** 1..12, useful for Gantt column index */
  index: number
}

export type GrantPhase =
  | { phase: 'pre-grant' }
  | { phase: 'active'; current: GrantQuarter }
  | { phase: 'ended' }

/**
 * Returns the current grant quarter, or `null` if `now` is outside the grant period.
 */
export function getCurrentQuarter(now: Date = new Date()): GrantQuarter | null {
  const phase = getGrantPhase(now)
  return phase.phase === 'active' ? phase.current : null
}

export function getGrantPhase(now: Date = new Date()): GrantPhase {
  if (now < GRANT_START) return { phase: 'pre-grant' }
  if (now >= GRANT_END) return { phase: 'ended' }

  const daysIn = differenceInCalendarDays(now, GRANT_START)
  // Clamp index to 1..12 (defensive against floating-point edge cases).
  const rawIndex = Math.floor(daysIn / QUARTER_DAYS) + 1
  const index = Math.min(12, Math.max(1, rawIndex))

  const year = (Math.floor((index - 1) / 4) + 1) as 1 | 2 | 3
  const quarter = (((index - 1) % 4) + 1) as 1 | 2 | 3 | 4

  return {
    phase: 'active',
    current: {
      year,
      quarter,
      index,
      label: `Y${year} · Q${quarter}`,
    },
  }
}

/**
 * Days remaining until GRANT_END.
 *  - 0 once the grant has ended.
 *  - GRANT_TOTAL_DAYS if called before GRANT_START (treats pre-grant as full term remaining).
 */
export function getDaysRemaining(now: Date = new Date()): number {
  if (now >= GRANT_END) return 0
  if (now < GRANT_START) return GRANT_TOTAL_DAYS
  return differenceInCalendarDays(GRANT_END, now)
}

/**
 * Percentage of grant period elapsed (0..100). Useful for the dashboard ring.
 *  - 0 before GRANT_START.
 *  - 100 after GRANT_END.
 */
export function getGrantProgressPercent(now: Date = new Date()): number {
  if (now <= GRANT_START) return 0
  if (now >= GRANT_END) return 100
  const elapsed = differenceInCalendarDays(now, GRANT_START)
  return Math.min(100, Math.max(0, (elapsed / GRANT_TOTAL_DAYS) * 100))
}

/**
 * Quarter label for an arbitrary 1..12 index. Used by the Timeline page.
 */
export function quarterLabelFromIndex(index: number): string {
  if (index < 1 || index > 12) return ''
  const year = Math.floor((index - 1) / 4) + 1
  const quarter = ((index - 1) % 4) + 1
  return `Y${year}Q${quarter}`
}

/**
 * Inclusive [start, end] dates of a given grant quarter (1..12). Returns null
 * for out-of-range indices. Used by the dashboard quarter-focus widget to
 * decide whether a task is active in the current quarter.
 *
 * The end date is the day BEFORE the next quarter starts so the ranges tile
 * without overlap.
 */
export function quarterDateRange(index: number): { start: Date; end: Date } | null {
  if (index < 1 || index > 12) return null
  const startOffset = (index - 1) * QUARTER_DAYS
  const endOffset = index * QUARTER_DAYS
  const start = new Date(GRANT_START.getTime() + startOffset * 86400000)
  const end = new Date(GRANT_START.getTime() + endOffset * 86400000 - 86400000)
  return { start, end }
}
