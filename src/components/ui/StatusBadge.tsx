import type { MilestoneStatus, TaskStatus } from '../../lib/database.types'

type AnyStatus = TaskStatus | MilestoneStatus

type Props = {
  status: AnyStatus
  className?: string
}

// Background + text color pairs. Values draw from the brief's status palette.
const STATUS_STYLES: Record<AnyStatus, { bg: string; text: string; dot: string }> = {
  'Not Started': { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  'In Progress': { bg: 'bg-orange-50', text: 'text-coral', dot: 'bg-coral' },
  'On Hold': { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  Submitted: { bg: 'bg-sky', text: 'text-ocean', dot: 'bg-ocean' },
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-seafoam' },
}

export default function StatusBadge({ status, className = '' }: Props) {
  const style = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {status}
    </span>
  )
}
