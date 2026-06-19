import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckSquare, Plus, Printer } from 'lucide-react'
import OutcomeGroup from '../components/tasks/OutcomeGroup'
import TaskFilterBar from '../components/tasks/TaskFilterBar'
import TaskFormModal from '../components/tasks/TaskFormModal'
import { defaultFilters, type TaskFilters } from '../components/tasks/taskFilters'
import { useTasks } from '../hooks/useTasks'
import type {
  Outcome,
  Task,
  TaskInsert,
  TaskStatus,
} from '../lib/database.types'

// Special key used in the grouped Map for tasks with no outcome assigned.
const UNASSIGNED_KEY = '__unassigned__'

function applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
  const search = filters.search.trim().toLowerCase()
  return tasks.filter((t) => {
    if (filters.status !== 'all' && t.status !== filters.status) return false
    if (filters.outcome === 'unassigned') {
      if (t.outcome_id !== null) return false
    } else if (filters.outcome !== 'all') {
      if (t.outcome_id !== filters.outcome) return false
    }
    if (filters.owner !== 'all' && t.owner !== filters.owner) return false
    if (search) {
      const haystack = [
        t.title,
        t.description ?? '',
        t.target_kpi ?? '',
        t.year_range ?? '',
        t.notes ?? '',
        t.owner ?? '',
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

function groupByOutcome(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = t.outcome_id ?? UNASSIGNED_KEY
    const list = map.get(key) ?? []
    list.push(t)
    map.set(key, list)
  }
  return map
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 w-full animate-pulse rounded-2xl bg-shell" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-shell" />
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-700">Couldn't load tasks</h3>
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-3xl bg-shell p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky text-ocean">
        <CheckSquare className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-dusk">No tasks yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-dusk/70">
        Track activities under each outcome with owners, KPIs, dates and progress.
        Add your first task to get started.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-2 text-sm font-semibold text-shell shadow-sm hover:bg-ocean/90"
      >
        <Plus className="h-4 w-4" />
        New task
      </button>
    </div>
  )
}

export default function TaskTracker() {
  const {
    status,
    data,
    error,
    refetch,
    createTask,
    updateTask,
    deleteTask,
  } = useTasks()

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const initializedRef = useRef(false)
  const deepLinkAppliedRef = useRef(false)

  // Stable references when status is not 'ready' (or `data` hasn't changed) so
  // dependent effects/memos don't re-run on every render.
  const tasks = useMemo(
    () => (status === 'ready' ? data.tasks : []),
    [status, data],
  )
  const outcomes = useMemo(
    () => (status === 'ready' ? data.outcomes : []),
    [status, data],
  )

  // Apply ?outcome=<number> deep-link from dashboard. Translate the
  // outcome_number to outcome_id once both data and the param are present.
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
    // Drop the query param so the URL reflects the now-applied filter.
    const next = new URLSearchParams(searchParams)
    next.delete('outcome')
    setSearchParams(next, { replace: true })
  }, [status, outcomes, searchParams, setSearchParams])

  // Initial expansion: expand all outcomes the first time data lands so the
  // user immediately sees their tasks. Subsequent renders preserve user choice.
  useEffect(() => {
    if (initializedRef.current) return
    if (status !== 'ready') return
    initializedRef.current = true
    if (tasks.length === 0) return
    const grouped = groupByOutcome(tasks)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded(new Set(grouped.keys()))
  }, [status, tasks])

  const filtered = useMemo(
    () => (status === 'ready' ? applyFilters(tasks, filters) : []),
    [status, tasks, filters],
  )

  const grouped = useMemo(() => groupByOutcome(filtered), [filtered])

  // Stable key order: outcomes by outcome_number, then unassigned last.
  const orderedKeys = useMemo(() => {
    const keys: string[] = []
    for (const o of outcomes) {
      if (grouped.has(o.id)) keys.push(o.id)
    }
    if (grouped.has(UNASSIGNED_KEY)) keys.push(UNASSIGNED_KEY)
    return keys
  }, [outcomes, grouped])

  const owners = useMemo(() => {
    const set = new Set<string>()
    for (const t of tasks) {
      if (t.owner) set.add(t.owner)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [tasks])

  const hasUnassigned = useMemo(
    () => tasks.some((t) => t.outcome_id === null),
    [tasks],
  )

  function lookupOutcome(key: string): Outcome | null {
    if (key === UNASSIGNED_KEY) return null
    return outcomes.find((o) => o.id === key) ?? null
  }

  function toggleKey(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function expandAll() {
    setExpanded(new Set(orderedKeys))
  }
  function collapseAll() {
    setExpanded(new Set())
  }

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(t: Task) {
    setEditing(t)
    setModalOpen(true)
    // Make sure the group of the task we're editing is expanded after save.
    setExpanded((prev) => {
      const next = new Set(prev)
      next.add(t.outcome_id ?? UNASSIGNED_KEY)
      return next
    })
  }
  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleSave(input: TaskInsert) {
    if (editing) {
      await updateTask(editing.id, input)
    } else {
      await createTask(input)
      setExpanded((prev) => {
        const next = new Set(prev)
        next.add(input.outcome_id ?? UNASSIGNED_KEY)
        return next
      })
    }
  }

  async function handleDelete(t: Task) {
    await deleteTask(t.id)
  }

  async function handleQuickUpdate(
    t: Task,
    patch: { status?: TaskStatus; percent_complete?: number },
  ) {
    // Mirror the form modal's status<->percent coupling for quick edits so a
    // user marking a task Completed via the dropdown also pegs progress to 100.
    const merged: Partial<TaskInsert> = { ...patch }
    if (patch.status !== undefined && patch.percent_complete === undefined) {
      if (patch.status === 'Completed' && t.percent_complete !== 100) {
        merged.percent_complete = 100
      } else if (patch.status === 'Not Started' && t.percent_complete === 100) {
        merged.percent_complete = 0
      }
    }
    await updateTask(t.id, merged)
  }

  if (status === 'loading') return <PageSkeleton />
  if (status === 'error') {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  const totalCount = tasks.length
  const filteredCount = filtered.length
  const isFiltering = filteredCount !== totalCount

  return (
    <div className="space-y-5">
      {/* Header / actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-dusk/60">
            {totalCount === 0
              ? 'No tasks yet'
              : isFiltering
                ? `${filteredCount} of ${totalCount} shown`
                : `${totalCount} task${totalCount === 1 ? '' : 's'}`}
          </p>
          <p className="text-sm text-dusk/70">
            Activities grouped by outcome with progress and quick edits.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {totalCount > 0 && (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full bg-shell px-4 py-2 text-sm font-medium text-dusk shadow-sm hover:bg-mist"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                type="button"
                onClick={
                  expanded.size === orderedKeys.length ? collapseAll : expandAll
                }
                className="rounded-full bg-shell px-4 py-2 text-sm font-medium text-dusk shadow-sm hover:bg-mist"
              >
                {expanded.size === orderedKeys.length
                  ? 'Collapse all'
                  : 'Expand all'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-2 text-sm font-semibold text-shell shadow-sm hover:bg-ocean/90"
          >
            <Plus className="h-4 w-4" />
            New task
          </button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold text-dusk">Marcos Power Eye — Task tracker</h1>
        <p className="text-xs text-dusk/60">
          Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {totalCount === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <>
          <TaskFilterBar
            filters={filters}
            outcomes={outcomes}
            owners={owners}
            hasUnassigned={hasUnassigned}
            onChange={setFilters}
          />

          {filteredCount === 0 ? (
            <div className="rounded-2xl bg-shell p-10 text-center shadow-sm">
              <p className="text-sm text-dusk/70">
                No tasks match the current filters.
              </p>
              <button
                type="button"
                onClick={() => setFilters(defaultFilters)}
                className="mt-3 rounded-full bg-mist px-4 py-1.5 text-xs font-medium text-dusk hover:bg-sky"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orderedKeys.map((key) => (
                <OutcomeGroup
                  key={key}
                  outcome={lookupOutcome(key)}
                  tasks={grouped.get(key) ?? []}
                  expanded={expanded.has(key)}
                  onToggle={() => toggleKey(key)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onQuickUpdate={handleQuickUpdate}
                />
              ))}
            </div>
          )}
        </>
      )}

      <TaskFormModal
        open={modalOpen}
        task={editing}
        outcomes={outcomes}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  )
}
