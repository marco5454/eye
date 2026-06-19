import { ChevronRight } from 'lucide-react'
import type { Milestone } from '../../lib/database.types'
import MilestoneRow from './MilestoneRow'

type Props = {
  year: string
  milestones: Milestone[]
  expanded: boolean
  onToggle: () => void
  onEdit: (m: Milestone) => void
  onDelete: (m: Milestone) => Promise<void>
}

function summarize(milestones: Milestone[]): {
  total: number
  completed: number
  inProgress: number
} {
  let completed = 0
  let inProgress = 0
  for (const m of milestones) {
    if (m.status === 'Completed') completed++
    else if (m.status === 'In Progress' || m.status === 'Submitted') inProgress++
  }
  return { total: milestones.length, completed, inProgress }
}

export default function YearGroup({
  year,
  milestones,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const { total, completed, inProgress } = summarize(milestones)
  const sectionId = `year-group-${year}`

  return (
    <section
      className="rounded-2xl bg-shell shadow-sm print:break-inside-avoid print:shadow-none print:ring-1 print:ring-sky"
      aria-labelledby={`${sectionId}-heading`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={sectionId}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left hover:bg-mist/40 print:cursor-default print:hover:bg-transparent"
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            className={`h-4 w-4 text-dusk/60 transition-transform print:hidden ${
              expanded ? 'rotate-90' : ''
            }`}
            aria-hidden
          />
          <h2 id={`${sectionId}-heading`} className="text-base font-semibold text-dusk">
            {year}
          </h2>
          <span className="rounded-full bg-mist px-2.5 py-0.5 font-mono text-xs text-dusk/70">
            {total} {total === 1 ? 'milestone' : 'milestones'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-dusk/60">
          <span className="hidden sm:inline">
            {completed} done · {inProgress} active
          </span>
          <span className="sm:hidden">
            {completed}/{total} done
          </span>
        </div>
      </button>

      {(expanded || total === 0) && (
        <div id={sectionId} className="border-t border-sky px-5 py-4 print:block">
          {total === 0 ? (
            <p className="rounded-xl bg-mist px-3 py-4 text-center text-sm text-dusk/60">
              No milestones in {year}.
            </p>
          ) : (
            <ul className="space-y-3">
              {milestones.map((m) => (
                <MilestoneRow
                  key={m.id}
                  milestone={m}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Print-only fallback: ensures collapsed groups still print their content */}
      {!expanded && total > 0 && (
        <div className="hidden border-t border-sky px-5 py-4 print:block">
          <ul className="space-y-3">
            {milestones.map((m) => (
              <MilestoneRow
                key={`print-${m.id}`}
                milestone={m}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
