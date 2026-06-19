import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, FileText, Plus, Printer } from 'lucide-react'
import MilestoneFilterBar from '../components/milestones/MilestoneFilterBar'
import {
  defaultFilters,
  type MilestoneFilters,
} from '../components/milestones/milestoneFilters'
import MilestoneFormModal from '../components/milestones/MilestoneFormModal'
import YearGroup from '../components/milestones/YearGroup'
import { useMilestones } from '../hooks/useMilestones'
import { useToast } from '../hooks/useToast'
import { getGrantPhase } from '../lib/grantPeriod'
import type { Milestone, MilestoneInsert } from '../lib/database.types'

// Order years deterministically: known Y1/Y2/Y3 first, then any unexpected
// values (lexicographic) so seeded data stays in narrative order.
const KNOWN_YEAR_ORDER = ['Y1', 'Y2', 'Y3'] as const

function compareYears(a: string, b: string): number {
  const ai = KNOWN_YEAR_ORDER.indexOf(a as (typeof KNOWN_YEAR_ORDER)[number])
  const bi = KNOWN_YEAR_ORDER.indexOf(b as (typeof KNOWN_YEAR_ORDER)[number])
  if (ai !== -1 && bi !== -1) return ai - bi
  if (ai !== -1) return -1
  if (bi !== -1) return 1
  return a.localeCompare(b)
}

function currentGrantYearKey(): string | null {
  const phase = getGrantPhase()
  if (phase.phase !== 'active') return null
  return `Y${phase.current.year}`
}

function applyFilters(milestones: Milestone[], filters: MilestoneFilters): Milestone[] {
  const search = filters.search.trim().toLowerCase()
  return milestones.filter((m) => {
    if (filters.status !== 'all' && m.status !== filters.status) return false
    if (filters.type !== 'all' && m.type !== filters.type) return false
    if (filters.owner !== 'all' && m.owner !== filters.owner) return false
    if (search) {
      const haystack = [
        m.title,
        m.due_description ?? '',
        m.notes ?? '',
        m.owner ?? '',
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

function groupByYear(milestones: Milestone[]): Map<string, Milestone[]> {
  const map = new Map<string, Milestone[]>()
  for (const m of milestones) {
    const key = m.year || '—'
    const list = map.get(key) ?? []
    list.push(m)
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
          <h3 className="text-sm font-semibold text-red-700">
            Couldn't load milestones
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
        <FileText className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-dusk">No milestones yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-dusk/70">
        Track donor reports, internal deliverables and key dates. Add your first
        milestone to get started.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-2 text-sm font-semibold text-shell shadow-sm hover:bg-ocean/90"
      >
        <Plus className="h-4 w-4" />
        New milestone
      </button>
    </div>
  )
}

export default function Milestones() {
  const {
    status,
    data,
    error,
    refetch,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  } = useMilestones()
  const toast = useToast()

  const [filters, setFilters] = useState<MilestoneFilters>(defaultFilters)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Milestone | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const initializedRef = useRef(false)

  // After the first successful load, expand the current grant year (or fall
  // back to the first available year). Guarded by a ref so we don't trigger
  // a setState-in-effect cascade after the user has interacted with groups.
  useEffect(() => {
    if (initializedRef.current) return
    if (status !== 'ready') return
    initializedRef.current = true
    const grouped = groupByYear(data)
    const years = Array.from(grouped.keys())
    if (years.length === 0) return
    const currentKey = currentGrantYearKey()
    const next = new Set<string>()
    if (currentKey && grouped.has(currentKey)) {
      next.add(currentKey)
    } else {
      next.add(years.sort(compareYears)[0])
    }
    setExpanded(next)
  }, [status, data])

  const filtered = useMemo(
    () => (status === 'ready' ? applyFilters(data, filters) : []),
    [status, data, filters],
  )

  const grouped = useMemo(() => groupByYear(filtered), [filtered])

  const sortedYears = useMemo(
    () => Array.from(grouped.keys()).sort(compareYears),
    [grouped],
  )

  const owners = useMemo(() => {
    if (status !== 'ready') return []
    const set = new Set<string>()
    for (const m of data) {
      if (m.owner) set.add(m.owner)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [status, data])

  function toggleYear(year: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  function expandAll() {
    setExpanded(new Set(sortedYears))
  }
  function collapseAll() {
    setExpanded(new Set())
  }

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(m: Milestone) {
    setEditing(m)
    setModalOpen(true)
    // Make sure the year of the milestone we're editing is expanded after save.
    setExpanded((prev) => {
      const next = new Set(prev)
      next.add(m.year)
      return next
    })
  }
  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleSave(input: MilestoneInsert) {
    try {
      if (editing) {
        await updateMilestone(editing.id, input)
        toast.success(`Milestone "${input.title}" updated`)
      } else {
        await createMilestone(input)
        toast.success(`Milestone "${input.title}" created`)
        // Auto-expand the year we just added a milestone to.
        setExpanded((prev) => {
          const next = new Set(prev)
          next.add(input.year)
          return next
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save milestone'
      toast.error(message)
      throw err // let the modal show its inline error too
    }
  }

  async function handleDelete(m: Milestone) {
    try {
      await deleteMilestone(m.id)
      toast.success(`Milestone "${m.title}" deleted`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete milestone'
      toast.error(message)
    }
  }

  if (status === 'loading') return <PageSkeleton />
  if (status === 'error') {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  const totalCount = data.length
  const filteredCount = filtered.length
  const isFiltering = filteredCount !== totalCount

  return (
    <div className="space-y-5">
      {/* Header / actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-dusk/60">
            {totalCount === 0
              ? 'No milestones yet'
              : isFiltering
                ? `${filteredCount} of ${totalCount} shown`
                : `${totalCount} milestone${totalCount === 1 ? '' : 's'}`}
          </p>
          <p className="text-sm text-dusk/70">
            Donor reports, internal deliverables and key dates grouped by year.
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
                  expanded.size === sortedYears.length ? collapseAll : expandAll
                }
                className="rounded-full bg-shell px-4 py-2 text-sm font-medium text-dusk shadow-sm hover:bg-mist"
              >
                {expanded.size === sortedYears.length ? 'Collapse all' : 'Expand all'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-2 text-sm font-semibold text-shell shadow-sm hover:bg-ocean/90"
          >
            <Plus className="h-4 w-4" />
            New milestone
          </button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold text-dusk">Marcos Power Eye — Milestones</h1>
        <p className="text-xs text-dusk/60">
          Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {totalCount === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <>
          <MilestoneFilterBar
            filters={filters}
            owners={owners}
            onChange={setFilters}
          />

          {filteredCount === 0 ? (
            <div className="rounded-2xl bg-shell p-10 text-center shadow-sm">
              <p className="text-sm text-dusk/70">
                No milestones match the current filters.
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
              {sortedYears.map((year) => (
                <YearGroup
                  key={year}
                  year={year}
                  milestones={grouped.get(year) ?? []}
                  expanded={expanded.has(year)}
                  onToggle={() => toggleYear(year)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      <MilestoneFormModal
        open={modalOpen}
        milestone={editing}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  )
}
