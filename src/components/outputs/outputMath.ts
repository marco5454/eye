import type { Output } from '../../lib/database.types'

/** Sum of Y1+Y2+Y3 actuals — the "to date" total for cumulative outputs. */
export function totalActuals(o: Output): number {
  return o.y1_actual + o.y2_actual + o.y3_actual
}

/** Locale-grouped, sensible decimal trim. */
export function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString()
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}
