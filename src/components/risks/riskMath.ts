import type { Risk, RiskLevel, RiskScore } from '../../lib/database.types'
import { computeRiskLevel } from '../../lib/seedData'

export { computeRiskLevel }

// Curated category presets — used in the filter bar select and as a datalist
// in the form modal. Free-text is allowed in the modal so this list isn't
// authoritative; sortable categories that appear in the data are added at
// runtime by the page.
export const CATEGORY_PRESETS: readonly string[] = [
  'Operational',
  'Financial',
  'Programmatic',
  'Compliance',
  'Reputational',
  'Security',
  'External',
  'Strategic',
] as const

export const SCORE_LABELS: Record<RiskScore, string> = {
  H: 'High',
  M: 'Medium',
  L: 'Low',
}

export const LEVEL_ORDER: Record<RiskLevel, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
}

/** Tailwind-class triplets per risk level (badge / dot / surface). */
export const LEVEL_STYLES: Record<
  RiskLevel,
  { dot: string; text: string; bg: string; ring: string; cell: string }
> = {
  High: {
    dot: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
    ring: 'ring-red-200',
    cell: 'bg-red-100/70 border-red-200',
  },
  Medium: {
    dot: 'bg-coral',
    text: 'text-coral',
    bg: 'bg-orange-50',
    ring: 'ring-orange-200',
    cell: 'bg-orange-50 border-orange-200',
  },
  Low: {
    dot: 'bg-seafoam',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    cell: 'bg-emerald-50 border-emerald-200',
  },
}

/** Returns the lowest unused integer >= 1 across the existing risks. */
export function nextRiskNumber(risks: Pick<Risk, 'risk_number'>[]): number {
  const used = new Set(risks.map((r) => r.risk_number))
  let n = 1
  while (used.has(n)) n += 1
  return n
}

/** Sort risks: level High > Medium > Low > unscored, then by risk_number. */
export function sortRisks(risks: Risk[]): Risk[] {
  return [...risks].sort((a, b) => {
    const la = a.risk_level ? LEVEL_ORDER[a.risk_level] : 99
    const lb = b.risk_level ? LEVEL_ORDER[b.risk_level] : 99
    if (la !== lb) return la - lb
    return a.risk_number - b.risk_number
  })
}
