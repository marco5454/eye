import { format, parseISO } from 'date-fns'
import { Flag } from 'lucide-react'
import type { Milestone, MilestoneType } from '../../lib/database.types'

const TYPE_STYLES: Record<MilestoneType, string> = {
  'Donor Report': 'bg-coral text-shell',
  Internal: 'bg-sky text-ocean',
  Deliverable: 'bg-seafoam text-emerald-900',
}

const DEFAULT_STYLE = 'bg-dusk text-shell'

function formatDate(value: string | null): string | null {
  if (!value) return null
  try {
    return format(parseISO(value), 'd MMM yyyy')
  } catch {
    return null
  }
}

type Props = {
  milestone: Milestone
  /** Inclusive 1..12 column to render in. */
  column: number
  clamped: boolean
  onClick: () => void
}

export default function MilestoneMarker({
  milestone,
  column,
  clamped,
  onClick,
}: Props) {
  const style = milestone.type ? TYPE_STYLES[milestone.type] : DEFAULT_STYLE
  const dateStr = formatDate(milestone.due_date)
  const tooltipParts = [
    milestone.title,
    milestone.type ?? 'Milestone',
    `Status: ${milestone.status}`,
  ]
  if (dateStr) tooltipParts.push(dateStr)
  else if (milestone.due_description) tooltipParts.push(milestone.due_description)
  if (clamped) tooltipParts.push('Date outside grant — pinned')

  return (
    <div
      className="flex justify-center"
      style={{ gridColumn: `${column} / ${column + 1}` }}
    >
      <button
        type="button"
        onClick={onClick}
        title={tooltipParts.join('\n')}
        aria-label={`Edit milestone: ${milestone.title}`}
        className={`inline-flex h-6 max-w-full items-center gap-1 rounded-full px-2 text-[10px] font-semibold shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-1 print:shadow-none ${style} ${clamped ? 'ring-1 ring-coral' : ''}`}
      >
        <Flag aria-hidden="true" className="h-3 w-3 shrink-0" />
        <span className="truncate">{milestone.title}</span>
      </button>
    </div>
  )
}
