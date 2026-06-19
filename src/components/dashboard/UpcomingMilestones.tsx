import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, isAfter, isToday, parseISO } from 'date-fns'
import type { Milestone, MilestoneType } from '../../lib/database.types'
import StatusBadge from '../ui/StatusBadge'

type Props = {
  milestones: Milestone[]
  /** How many to show. Default 3. */
  limit?: number
}

const TYPE_STYLES: Record<MilestoneType, string> = {
  'Donor Report': 'bg-orange-50 text-coral',
  Internal: 'bg-sky text-ocean',
  Deliverable: 'bg-emerald-50 text-emerald-700',
}

function getUpcoming(milestones: Milestone[], limit: number): Milestone[] {
  const today = new Date()
  return milestones
    .filter((m) => {
      if (!m.due_date) return false
      const d = parseISO(m.due_date)
      return isToday(d) || isAfter(d, today)
    })
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
    .slice(0, limit)
}

export default function UpcomingMilestones({ milestones, limit = 3 }: Props) {
  const upcoming = getUpcoming(milestones, limit)

  return (
    <div className="rounded-2xl bg-shell p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-ocean" />
          <h3 className="text-sm font-semibold text-dusk">Upcoming milestones</h3>
        </div>
        <Link
          to="/milestones"
          className="text-xs font-medium text-ocean hover:underline"
        >
          View all →
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <p className="rounded-xl bg-mist px-3 py-6 text-center text-sm text-dusk/60">
          No upcoming milestones.
        </p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-2 rounded-xl bg-mist/60 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-dusk">{m.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-dusk/60">
                  {m.type && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLES[m.type]}`}
                    >
                      {m.type}
                    </span>
                  )}
                  {m.due_date && (
                    <span className="font-mono">
                      {format(parseISO(m.due_date), 'd MMM yyyy')}
                    </span>
                  )}
                  {m.owner && <span>· {m.owner}</span>}
                </div>
              </div>
              <StatusBadge status={m.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
