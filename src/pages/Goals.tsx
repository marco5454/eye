import { useMemo } from 'react'
import { AlertCircle, Printer, Target } from 'lucide-react'
import GoalCard from '../components/goals/GoalCard'
import { buildGoalRollup } from '../components/goals/goalsMath'
import { useGoalsData } from '../hooks/useGoalsData'
import type { Outcome, Output, Task } from '../lib/database.types'

// The Goals page rolls each outcome up into a single card showing combined
// task and output progress. Schema-honest: milestones and risks are not
// linked to outcomes, so they're not surfaced here.

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded-full bg-mist" />
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-2xl bg-mist/70"
          />
        ))}
      </div>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-700">
            Couldn't load goals
          </h3>
          <p className="mt-1 text-sm text-red-700/80">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-full bg-shell px-4 py-1.5 text-xs font-medium text-dusk shadow-sm hover:bg-mist"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-shell p-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-ocean">
        <Target className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-semibold text-dusk">
        No goals defined yet
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-dusk/70">
        Goals come from the outcomes table. Once outcomes are seeded,
        each one will appear here as a card with rolled-up progress.
      </p>
    </div>
  )
}

function groupByOutcome<T extends { outcome_id: string | null }>(
  items: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    if (!item.outcome_id) continue
    const list = map.get(item.outcome_id) ?? []
    list.push(item)
    map.set(item.outcome_id, list)
  }
  return map
}

export default function Goals() {
  const { status, data, error, refetch } = useGoalsData()

  const cards = useMemo(() => {
    if (status !== 'ready') return [] as Array<{
      outcome: Outcome
      tasks: Task[]
      outputs: Output[]
    }>
    const tasksByOutcome = groupByOutcome(data.tasks)
    const outputsByOutcome = groupByOutcome(data.outputs)
    return data.outcomes.map((outcome) => ({
      outcome,
      tasks: tasksByOutcome.get(outcome.id) ?? [],
      outputs: outputsByOutcome.get(outcome.id) ?? [],
    }))
  }, [status, data])

  if (status === 'loading') {
    return <PageSkeleton />
  }

  if (status === 'error') {
    return <ErrorState message={error.message} onRetry={refetch} />
  }

  const hasOutcomes = cards.length > 0
  const today = new Date()
  const generated = today.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold text-dusk">
          Marcos Power Eye — Goals
        </h1>
        <p className="text-xs text-dusk/60">Generated {generated}</p>
      </div>

      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-dusk sm:text-2xl">
            Goals
          </h1>
          <p className="mt-1 text-sm text-dusk/70">
            Each goal rolls up its tasks and outputs into a single progress
            view. Click into a goal to see the underlying tasks or outputs.
          </p>
        </div>
        {hasOutcomes && (
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-shell px-4 py-2 text-sm font-medium text-dusk shadow-sm ring-1 ring-mist hover:bg-mist"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print
          </button>
        )}
      </div>

      {!hasOutcomes ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4">
          {cards.map(({ outcome, tasks, outputs }) => (
            <GoalCard
              key={outcome.id}
              outcome={outcome}
              rollup={buildGoalRollup(tasks, outputs)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
