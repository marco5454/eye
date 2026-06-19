import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Risk, RiskLevel } from '../../lib/database.types'

type Props = {
  risks: Risk[]
}

const TIERS: ReadonlyArray<{
  level: RiskLevel
  label: string
  dotClass: string
  textClass: string
  bgClass: string
}> = [
  {
    level: 'High',
    label: 'High',
    dotClass: 'bg-red-500',
    textClass: 'text-red-600',
    bgClass: 'bg-red-50',
  },
  {
    level: 'Medium',
    label: 'Medium',
    dotClass: 'bg-coral',
    textClass: 'text-coral',
    bgClass: 'bg-orange-50',
  },
  {
    level: 'Low',
    label: 'Low',
    dotClass: 'bg-seafoam',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
  },
]

export default function RiskSnapshot({ risks }: Props) {
  const counts: Record<RiskLevel, number> = { High: 0, Medium: 0, Low: 0 }
  for (const r of risks) {
    if (r.risk_level) counts[r.risk_level] += 1
  }

  return (
    <div className="rounded-2xl bg-shell p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-ocean" />
          <h3 className="text-sm font-semibold text-dusk">Risk snapshot</h3>
        </div>
        <Link to="/risks" className="text-xs font-medium text-ocean hover:underline">
          View all →
        </Link>
      </div>

      {risks.length === 0 ? (
        <p className="rounded-xl bg-mist px-3 py-6 text-center text-sm text-dusk/60">
          No risks logged yet.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {TIERS.map((tier) => (
            <div
              key={tier.level}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-4 ${tier.bgClass}`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${tier.dotClass}`} aria-hidden />
                <span className={`text-xs font-medium ${tier.textClass}`}>
                  {tier.label}
                </span>
              </div>
              <span className="font-mono text-2xl font-bold text-dusk">
                {counts[tier.level]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
