import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Calendar, Printer } from 'lucide-react'
import MilestoneFormModal from '../components/milestones/MilestoneFormModal'
import TaskFormModal from '../components/tasks/TaskFormModal'
import MilestoneTrack from '../components/timeline/MilestoneTrack'
import OutcomeTimelineRow from '../components/timeline/OutcomeTimelineRow'
import TimelineFilterBar from '../components/timeline/TimelineFilterBar'
import TimelineGrid from '../components/timeline/TimelineGrid'
import UnscheduledList from '../components/timeline/UnscheduledList'
import {
  defaultFilters,
  type TimelineFilters,
} from '../components/timeline/timelineFilters'
import {
  UNASSIGNED_OUTCOME_KEY,
  groupTasksByOutcome,
  milestoneMarker,
  taskQuarterSpan,
} from '../components/timeline/timelineMath'
import { useTimelineData } from '../hooks/useTimelineData'
import { useToast } from '../hooks/useToast'
import { getCurrentQuarter } from '../lib/grantPeriod'
import type {
  Milestone,
  MilestoneInsert,
  Task,
  TaskInsert,
} from '../lib/database.types'

function applyTaskFilters(tasks: Task[], filters: TimelineFilters): Task[] {
  return tasks.filter((t) => {
    if (filters.status !== 'all' && t.status !== filters.status) return false
    if (filters.outcome === 'unassigned') {
      if (t.outcome_id !== null) return false
    } else if (filters.outcome !== 'all') {
      if (t.outcome_id !== filters.outcome) return false
    }
    return true
  })
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 w-full animate-pulse rounded-2xl bg-shell" />
      <div className="h-64 w-full animate-pulse rounded-2xl bg-shell" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-shell" />
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-700">
            Couldn't load timeline
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
    <div className="rounded-3xl bg-shell p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky text-ocean">
        <Calendar className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-dusk">Nothing to schedule yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-dusk/70">
        Add tasks with start and end dates, or milestones with due dates, and
        they will appear on the Gantt grid spanning the 12 grant quarters.
      </p>
    </div>
  )
}

export default function Timeline() {
  const { status, data, error, refetch, updateTask, updateMilestone } =
    useTimelineData()
  const toast = useToast()

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<TimelineFilters>(defaultFilters)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)

  // Apply ?outcome=N deep-link from dashboard once.
  const outcomes = useMemo(
    () => (status === 'ready' ? data.outcomes : []),
    [status, data],
  )
  const allTasks = useMemo(
    () => (status === 'ready' ? data.tasks : []),
    [status, data],
  )
  const allMilestones = useMemo(
    () => (status === 'ready' ? data.milestones : []),
    [status, data],
  )

  // Deep-link: translate ?outcome=<number> to outcome_id then strip the param.
  // Mirrors TaskTracker / OutputTargets pattern.
  const deepLinkAppliedRef = useRef(false)
  useEffect(() => {
    if (status !== 'ready') return
    if (deepLinkAppliedRef.current) return
    const param = searchParams.get('outcome')
    if (!param) {
      deepLinkAppliedRef.current = true
      return
    }
    const num = Number(param)
    const match = outcomes.find((o) => o.outcome_number === num)
    if (match) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters((prev) => ({ ...prev, outcome: match.id }))
    }
    deepLinkAppliedRef.current = true
    const next = new URLSearchParams(searchParams)
    next.delete('outcome')
    setSearchParams(next, { replace: true })
  }, [status, outcomes, searchParams, setSearchParams])

  const filteredTasks = useMemo(
    () => applyTaskFilters(allTasks, filters),
    [allTasks, filters],
  )

  // Partition by scheduled vs unscheduled.
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const scheduled: Task[] = []
    const unscheduled: Task[] = []
    for (const t of filteredTasks) {
      if (taskQuarterSpan(t)) scheduled.push(t)
      else unscheduled.push(t)
    }
    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled }
  }, [filteredTasks])

  const tasksByOutcome = useMemo(
    () => groupTasksByOutcome(scheduledTasks),
    [scheduledTasks],
  )

  // Stable order: outcomes by outcome_number, then unassigned bucket last.
  const orderedKeys = useMemo(() => {
    const keys: string[] = []
    for (const o of outcomes) {
      if (tasksByOutcome.has(o.id)) keys.push(o.id)
    }
    if (tasksByOutcome.has(UNASSIGNED_OUTCOME_KEY)) {
      keys.push(UNASSIGNED_OUTCOME_KEY)
    }
    return keys
  }, [outcomes, tasksByOutcome])

  const hasUnassigned = useMemo(
    () => allTasks.some((t) => t.outcome_id === null),
    [allTasks],
  )

  // Milestones partitioned for unscheduled bucket. Outcome filter doesn't
  // apply to milestones (they aren't outcome-scoped in the schema).
  const { scheduledMilestones, unscheduledMilestones } = useMemo(() => {
    if (!filters.showMilestones) {
      return { scheduledMilestones: [] as Milestone[], unscheduledMilestones: [] as Milestone[] }
    }
    const scheduled: Milestone[] = []
    const unscheduled: Milestone[] = []
    for (const m of allMilestones) {
      const marker = milestoneMarker(m)
      if (marker.kind === 'unscheduled') unscheduled.push(m)
      else scheduled.push(m)
    }
    return { scheduledMilestones: scheduled, unscheduledMilestones: unscheduled }
  }, [allMilestones, filters.showMilestones])

  const currentQuarter = useMemo(() => {
    const q = getCurrentQuarter()
    return q ? q.index : null
  }, [])

  function lookupOutcome(key: string) {
    if (key === UNASSIGNED_OUTCOME_KEY) return null
    return outcomes.find((o) => o.id === key) ?? null
  }

  async function handleSaveTask(input: TaskInsert) {
    if (!editingTask) return
    try {
      await updateTask(editingTask.id, input)
      toast.success(`Task "${input.title}" updated`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task'
      toast.error(message)
      throw err
    }
  }
  async function handleSaveMilestone(input: MilestoneInsert) {
    if (!editingMilestone) return
    try {
      await updateMilestone(editingMilestone.id, input)
      toast.success(`Milestone "${input.title}" updated`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update milestone'
      toast.error(message)
      throw err
    }
  }

  if (status === 'loading') return <PageSkeleton />
  if (status === 'error') {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  const totalScheduled = scheduledTasks.length + scheduledMilestones.length
  const totalUnscheduled = unscheduledTasks.length + unscheduledMilestones.length
  const totalAll = allTasks.length + allMilestones.length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-dusk/60">
            {totalAll === 0
              ? 'No items yet'
              : `${totalScheduled} on grid · ${totalUnscheduled} unscheduled`}
          </p>
          <p className="text-sm text-dusk/70">
            Tasks span quarters by date; milestones pin to their due quarter.
            Coloured by outcome.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {totalAll > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-shell px-4 py-2 text-sm font-medium text-dusk shadow-sm hover:bg-mist"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          )}
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold text-dusk">
          Marcos Power Eye — Timeline
        </h1>
        <p className="text-xs text-dusk/60">
          Generated {new Date().toLocaleDateString()}
          {currentQuarter !== null
            ? ` · Current: Y${Math.floor((currentQuarter - 1) / 4) + 1}Q${
                ((currentQuarter - 1) % 4) + 1
              }`
            : ''}
        </p>
      </div>

      {totalAll === 0 ? (
        <EmptyState />
      ) : (
        <>
          <TimelineFilterBar
            filters={filters}
            outcomes={outcomes}
            hasUnassigned={hasUnassigned}
            onChange={setFilters}
          />

          {totalScheduled === 0 ? (
            <div className="rounded-2xl bg-shell p-10 text-center shadow-sm">
              <p className="text-sm text-dusk/70">
                Nothing matches the current filters or has dates inside the
                grant period.
              </p>
              <button
                type="button"
                onClick={() => setFilters(defaultFilters)}
                className="mt-3 rounded-full bg-mist px-4 py-1.5 text-xs font-medium text-dusk hover:bg-sky"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <TimelineGrid currentQuarter={currentQuarter}>
              {orderedKeys.map((key) => (
                <OutcomeTimelineRow
                  key={key}
                  outcome={lookupOutcome(key)}
                  tasks={tasksByOutcome.get(key) ?? []}
                  onEditTask={setEditingTask}
                />
              ))}

              {filters.showMilestones && scheduledMilestones.length > 0 && (
                <section className="border-t border-sky/40 bg-mist/30 px-1.5 py-3 print:break-inside-avoid">
                  <div className="px-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-dusk/70">
                    Milestones
                  </div>
                  <MilestoneTrack
                    milestones={scheduledMilestones}
                    onEdit={setEditingMilestone}
                  />
                </section>
              )}
            </TimelineGrid>
          )}

          <UnscheduledList
            tasks={unscheduledTasks}
            milestones={filters.showMilestones ? unscheduledMilestones : []}
            onEditTask={setEditingTask}
            onEditMilestone={setEditingMilestone}
          />

          <p className="text-[11px] text-dusk/60 print:hidden">
            Tip: drag horizontally on small screens to scroll the grid. Click a
            bar or pill to edit.
          </p>
        </>
      )}

      <TaskFormModal
        open={editingTask !== null}
        task={editingTask}
        outcomes={outcomes}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
      />
      <MilestoneFormModal
        open={editingMilestone !== null}
        milestone={editingMilestone}
        onClose={() => setEditingMilestone(null)}
        onSave={handleSaveMilestone}
      />
    </div>
  )
}
