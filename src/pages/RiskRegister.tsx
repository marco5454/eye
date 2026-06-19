import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, Plus, Printer } from 'lucide-react'
import RiskFilterBar from '../components/risks/RiskFilterBar'
import RiskFormModal from '../components/risks/RiskFormModal'
import RiskMatrix from '../components/risks/RiskMatrix'
import RiskRow from '../components/risks/RiskRow'
import {
  defaultFilters,
  type RiskFilters,
} from '../components/risks/riskFilters'
import { nextRiskNumber, sortRisks } from '../components/risks/riskMath'
import { useRisks } from '../hooks/useRisks'
import { useToast } from '../hooks/useToast'
import type { Risk, RiskInsert } from '../lib/database.types'

function applyFilters(risks: Risk[], filters: RiskFilters): Risk[] {
  const search = filters.search.trim().toLowerCase()
  return risks.filter((r) => {
    if (filters.category !== 'all' && r.category !== filters.category) return false
    if (filters.level === 'unscored') {
      if (r.risk_level !== null) return false
    } else if (filters.level !== 'all') {
      if (r.risk_level !== filters.level) return false
    }
    if (filters.owner !== 'all' && (r.owner ?? '') !== filters.owner) return false
    if (search) {
      const haystack = [
        `R${r.risk_number}`,
        r.description,
        r.category,
        r.mitigation_strategy ?? '',
        r.owner ?? '',
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 w-full animate-pulse rounded-2xl bg-shell" />
      <div className="h-48 w-full animate-pulse rounded-2xl bg-shell" />
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
            Couldn't load risks
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
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-dusk">No risks logged yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-dusk/70">
        Capture programmatic, financial and operational risks. Set likelihood
        and impact and the level is computed for you.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-2 text-sm font-semibold text-shell shadow-sm hover:bg-ocean/90"
      >
        <Plus className="h-4 w-4" />
        New risk
      </button>
    </div>
  )
}

export default function RiskRegister() {
  const { status, data, error, refetch, createRisk, updateRisk, deleteRisk } =
    useRisks()
  const toast = useToast()

  const [filters, setFilters] = useState<RiskFilters>(defaultFilters)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Risk | null>(null)
  const [matrixVisible, setMatrixVisible] = useState(true)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const highlightTimerRef = useRef<number | null>(null)

  const risks = useMemo(
    () => (status === 'ready' ? data : []),
    [status, data],
  )

  const sorted = useMemo(() => sortRisks(risks), [risks])
  const filtered = useMemo(
    () => applyFilters(sorted, filters),
    [sorted, filters],
  )

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const r of risks) if (r.category) set.add(r.category)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [risks])
  const owners = useMemo(() => {
    const set = new Set<string>()
    for (const r of risks) if (r.owner) set.add(r.owner)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [risks])
  const hasUnscored = useMemo(
    () => risks.some((r) => r.risk_level === null),
    [risks],
  )

  // Cleanup any pending highlight timer on unmount.
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(r: Risk) {
    setEditing(r)
    setModalOpen(true)
  }
  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleSave(input: RiskInsert) {
    try {
      if (editing) {
        await updateRisk(editing.id, input)
        toast.success(`Risk R${input.risk_number} updated`)
      } else {
        await createRisk(input)
        toast.success(`Risk R${input.risk_number} added`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save risk'
      toast.error(message)
      throw err
    }
  }

  async function handleDelete(r: Risk) {
    try {
      await deleteRisk(r.id)
      toast.success(`Risk R${r.risk_number} deleted`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete risk'
      toast.error(message)
    }
  }

  // Clicking a risk pill in the matrix scrolls to its row and flashes it.
  function handleSelectFromMatrix(r: Risk) {
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current)
    }
    setHighlightId(r.id)
    // Wait a tick so the element is mounted/visible if filters change.
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`risk-row-${r.id}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightId(null)
      highlightTimerRef.current = null
    }, 1800)
  }

  if (status === 'loading') return <PageSkeleton />
  if (status === 'error') {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  const totalCount = risks.length
  const filteredCount = filtered.length
  const isFiltering = filteredCount !== totalCount
  const nextNumber = nextRiskNumber(risks)

  return (
    <div className="space-y-5">
      {/* Header / actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-dusk/60">
            {totalCount === 0
              ? 'No risks logged'
              : isFiltering
                ? `${filteredCount} of ${totalCount} shown`
                : `${totalCount} risk${totalCount === 1 ? '' : 's'}`}
          </p>
          <p className="text-sm text-dusk/70">
            Capture risks with likelihood × impact; level is auto-computed.
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
                onClick={() => setMatrixVisible((v) => !v)}
                aria-pressed={matrixVisible}
                className="rounded-full bg-shell px-4 py-2 text-sm font-medium text-dusk shadow-sm hover:bg-mist"
              >
                {matrixVisible ? 'Hide matrix' : 'Show matrix'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-2 text-sm font-semibold text-shell shadow-sm hover:bg-ocean/90"
          >
            <Plus className="h-4 w-4" />
            New risk
          </button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold text-dusk">
          Marcos Power Eye — Risk register
        </h1>
        <p className="text-xs text-dusk/60">
          Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {totalCount === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <>
          {/* Matrix is built from the full sorted set, not the filtered list,
              so users keep an overview even when the list is filtered. The
              hidden state still prints. */}
          <div className={matrixVisible ? '' : 'hidden print:block'}>
            <RiskMatrix risks={sorted} onSelect={handleSelectFromMatrix} />
          </div>

          <RiskFilterBar
            filters={filters}
            categories={categories}
            owners={owners}
            hasUnscored={hasUnscored}
            onChange={setFilters}
          />

          {filteredCount === 0 ? (
            <div className="rounded-2xl bg-shell p-10 text-center shadow-sm">
              <p className="text-sm text-dusk/70">
                No risks match the current filters.
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
            <ul className="space-y-3">
              {filtered.map((r) => (
                <RiskRow
                  key={r.id}
                  id={`risk-row-${r.id}`}
                  risk={r}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  className={
                    highlightId === r.id ? 'ring-2 ring-ocean/40 shadow-lg' : ''
                  }
                />
              ))}
            </ul>
          )}
        </>
      )}

      <RiskFormModal
        open={modalOpen}
        risk={editing}
        existing={risks}
        nextNumber={nextNumber}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  )
}
