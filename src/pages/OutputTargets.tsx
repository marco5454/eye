import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, BarChart3, Plus, Printer } from 'lucide-react'
import OutputOutcomeGroup from '../components/outputs/OutputOutcomeGroup'
import OutputFilterBar from '../components/outputs/OutputFilterBar'
import OutputFormModal from '../components/outputs/OutputFormModal'
import {
  defaultFilters,
  type OutputFilters,
} from '../components/outputs/outputFilters'
import { useOutputs } from '../hooks/useOutputs'
import { useToast } from '../hooks/useToast'
import type {
  Outcome,
  Output,
  OutputInsert,
} from '../lib/database.types'

// Special key used in the grouped Map for outputs with no outcome assigned.
const UNASSIGNED_KEY = '__unassigned__'

function applyFilters(outputs: Output[], filters: OutputFilters): Output[] {
  const search = filters.search.trim().toLowerCase()
  return outputs.filter((o) => {
    if (filters.outcome === 'unassigned') {
      if (o.outcome_id !== null) return false
    } else if (filters.outcome !== 'all') {
      if (o.outcome_id !== filters.outcome) return false
    }
    if (filters.tracked === 'tracked' && o.numeric_target == null) return false
    if (filters.tracked === 'narrative' && o.numeric_target != null) return false
    if (filters.tracked === 'ongoing' && !o.is_ongoing) return false
    if (filters.tracked === 'cumulative' && o.is_ongoing) return false
    if (search) {
      const haystack = [
        o.output_number,
        o.description,
        o.target_label,
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

function groupByOutcome(outputs: Output[]): Map<string, Output[]> {
  const map = new Map<string, Output[]>()
  for (const o of outputs) {
    const key = o.outcome_id ?? UNASSIGNED_KEY
    const list = map.get(key) ?? []
    list.push(o)
    map.set(key, list)
  }
  // Sort each group by output_number for stable rendering.
  for (const list of map.values()) {
    list.sort((a, b) =>
      a.output_number.localeCompare(b.output_number, undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    )
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
          <h3 className="text-sm font-semibold text-red-700">
            Couldn't load outputs
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-3xl bg-shell p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky text-ocean">
        <BarChart3 className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-dusk">No outputs yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-dusk/70">
        Define outputs against each outcome with numeric targets and Y1/Y2/Y3
        actuals. Add your first output to begin tracking.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-2 text-sm font-semibold text-shell shadow-sm hover:bg-ocean/90"
      >
        <Plus className="h-4 w-4" />
        New output
      </button>
    </div>
  )
}

export default function OutputTargets() {
  const {
    status,
    data,
    error,
    refetch,
    createOutput,
    updateOutput,
    deleteOutput,
  } = useOutputs()
  const toast = useToast()

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<OutputFilters>(defaultFilters)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Output | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const initializedRef = useRef(false)
  const deepLinkAppliedRef = useRef(false)

  const outputs = useMemo(
    () => (status === 'ready' ? data.outputs : []),
    [status, data],
  )
  const outcomes = useMemo(
    () => (status === 'ready' ? data.outcomes : []),
    [status, data],
  )

  // Apply ?outcome=<number> deep-link from dashboard.
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

  // Initial expansion: open all groups when data first lands.
  useEffect(() => {
    if (initializedRef.current) return
    if (status !== 'ready') return
    initializedRef.current = true
    if (outputs.length === 0) return
    const grouped = groupByOutcome(outputs)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded(new Set(grouped.keys()))
  }, [status, outputs])

  const filtered = useMemo(
    () => (status === 'ready' ? applyFilters(outputs, filters) : []),
    [status, outputs, filters],
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

  const hasUnassigned = useMemo(
    () => outputs.some((o) => o.outcome_id === null),
    [outputs],
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
  function openEdit(o: Output) {
    setEditing(o)
    setModalOpen(true)
    setExpanded((prev) => {
      const next = new Set(prev)
      next.add(o.outcome_id ?? UNASSIGNED_KEY)
      return next
    })
  }
  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleSave(input: OutputInsert) {
    try {
      if (editing) {
        await updateOutput(editing.id, input)
        toast.success(`Output ${input.output_number} updated`)
      } else {
        await createOutput(input)
        toast.success(`Output ${input.output_number} created`)
        setExpanded((prev) => {
          const next = new Set(prev)
          next.add(input.outcome_id ?? UNASSIGNED_KEY)
          return next
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save output'
      toast.error(message)
      throw err
    }
  }

  async function handleDelete(o: Output) {
    try {
      await deleteOutput(o.id)
      toast.success(`Output ${o.output_number} deleted`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete output'
      toast.error(message)
    }
  }

  if (status === 'loading') return <PageSkeleton />
  if (status === 'error') {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  const totalCount = outputs.length
  const filteredCount = filtered.length
  const isFiltering = filteredCount !== totalCount

  return (
    <div className="space-y-5">
      {/* Header / actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-dusk/60">
            {totalCount === 0
              ? 'No outputs yet'
              : isFiltering
                ? `${filteredCount} of ${totalCount} shown`
                : `${totalCount} output${totalCount === 1 ? '' : 's'}`}
          </p>
          <p className="text-sm text-dusk/70">
            Y1, Y2 and Y3 actuals tracked against numeric targets, grouped by outcome.
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
            New output
          </button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold text-dusk">
          Marcos Power Eye — Output targets
        </h1>
        <p className="text-xs text-dusk/60">
          Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {totalCount === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <>
          <OutputFilterBar
            filters={filters}
            outcomes={outcomes}
            hasUnassigned={hasUnassigned}
            onChange={setFilters}
          />

          {filteredCount === 0 ? (
            <div className="rounded-2xl bg-shell p-10 text-center shadow-sm">
              <p className="text-sm text-dusk/70">
                No outputs match the current filters.
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
                <OutputOutcomeGroup
                  key={key}
                  outcome={lookupOutcome(key)}
                  outputs={grouped.get(key) ?? []}
                  expanded={expanded.has(key)}
                  onToggle={() => toggleKey(key)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      <OutputFormModal
        open={modalOpen}
        output={editing}
        outcomes={outcomes}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  )
}
