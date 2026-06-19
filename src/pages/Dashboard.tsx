import { useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import CountdownRing from '../components/dashboard/CountdownRing'
import OutcomeCard from '../components/dashboard/OutcomeCard'
import QuarterFocus from '../components/dashboard/QuarterFocus'
import RiskSnapshot from '../components/dashboard/RiskSnapshot'
import StatusBanner from '../components/dashboard/StatusBanner'
import UpcomingDeadlines from '../components/dashboard/UpcomingDeadlines'
import { useDashboardData } from '../hooks/useDashboardData'
import { getCurrentQuarter } from '../lib/grantPeriod'
import type { Task } from '../lib/database.types'

function calcOverallPercent(tasks: Task[]): number {
  if (tasks.length === 0) return 0
  const sum = tasks.reduce((acc, t) => acc + (t.percent_complete ?? 0), 0)
  return Math.round(sum / tasks.length)
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-shell p-5 shadow-sm ${className}`}
      aria-hidden
    >
      <div className="h-4 w-1/3 rounded bg-sky/70" />
      <div className="mt-3 h-3 w-2/3 rounded bg-sky/50" />
      <div className="mt-2 h-3 w-1/2 rounded bg-sky/50" />
      <div className="mt-5 h-2.5 w-full rounded-full bg-sky/60" />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex h-64 items-center justify-center rounded-2xl bg-shell shadow-sm">
          <div className="h-44 w-44 animate-pulse rounded-full bg-sky/70" />
        </div>
        <div className="rounded-2xl bg-shell p-5 shadow-sm">
          <div className="h-4 w-1/3 animate-pulse rounded bg-sky/70" />
          <div className="mt-4 h-10 w-1/2 animate-pulse rounded bg-sky/50" />
          <div className="mt-6 h-12 w-full animate-pulse rounded-2xl bg-sky/40" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-700">Couldn't load dashboard data</h3>
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

export default function Dashboard() {
  const { status, data, error, refetch } = useDashboardData()

  const overallPercent = useMemo(
    () => (data ? calcOverallPercent(data.tasks) : 0),
    [data],
  )

  const tasksByOutcome = useMemo(() => {
    const map = new Map<string, Task[]>()
    if (!data) return map
    for (const t of data.tasks) {
      if (!t.outcome_id) continue
      const list = map.get(t.outcome_id) ?? []
      list.push(t)
      map.set(t.outcome_id, list)
    }
    return map
  }, [data])

  const currentQuarter = getCurrentQuarter()

  if (status === 'loading') return <DashboardSkeleton />
  if (status === 'error') {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  const totalTasks = data.tasks.length
  const overallLabel = totalTasks === 0 ? '—' : `${overallPercent}%`

  return (
    <div className="space-y-6">
      {/* Top row — countdown + overall completion */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-shell p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-dusk">Grant countdown</h2>
          <div className="mt-4">
            <CountdownRing />
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl bg-shell p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-dusk">Overall completion</h2>
              <p className="mt-1 text-xs text-dusk/60">
                Average across {totalTasks} task{totalTasks === 1 ? '' : 's'}
              </p>
            </div>
            {currentQuarter && (
              <span className="inline-flex items-center gap-2 rounded-full bg-sky px-3 py-1 text-xs font-medium text-ocean">
                <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
                {currentQuarter.label}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-mono text-5xl font-bold text-dusk">{overallLabel}</span>
            <span className="text-xs text-dusk/60">grant-wide</span>
          </div>

          <StatusBanner tasks={data.tasks} overallPercent={overallPercent} />
        </div>
      </div>

      {/* Outcomes grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-dusk">Outcomes</h2>
        {data.outcomes.length === 0 ? (
          <div className="rounded-2xl bg-shell p-6 text-center text-sm text-dusk/60 shadow-sm">
            No outcomes seeded. Check the Supabase connection.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.outcomes.map((outcome) => (
              <OutcomeCard
                key={outcome.id}
                outcome={outcome}
                tasks={tasksByOutcome.get(outcome.id) ?? []}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom row — quarter focus + upcoming deadlines + risks */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <QuarterFocus tasks={data.tasks} />
        <UpcomingDeadlines tasks={data.tasks} milestones={data.milestones} />
        <RiskSnapshot risks={data.risks} />
      </div>
    </div>
  )
}
