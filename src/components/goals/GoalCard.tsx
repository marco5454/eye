import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CheckSquare,
  CircleDashed,
  Pause,
  PlayCircle,
} from 'lucide-react'
import type { Outcome } from '../../lib/database.types'
import ProgressBar from '../ui/ProgressBar'
import type { GoalRollup } from './goalsMath'

type Props = {
  outcome: Outcome
  rollup: GoalRollup
}

function formatPercent(value: number | null): string {
  return value == null ? '—' : `${value}%`
}

export default function GoalCard({ outcome, rollup }: Props) {
  const accent = outcome.color ?? '#0EA5C9'
  const { tasks, outputs, compositePercent } = rollup

  return (
    <article
      className="rounded-2xl bg-shell shadow-sm print:break-inside-avoid print:shadow-none print:ring-1 print:ring-sky"
      aria-labelledby={`goal-${outcome.outcome_number}-heading`}
    >
      {/* Header band */}
      <header className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-mono text-base font-bold text-white"
            style={{ backgroundColor: accent }}
            aria-hidden
          >
            {outcome.outcome_number}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id={`goal-${outcome.outcome_number}-heading`}
              className="text-base font-semibold text-dusk sm:text-lg"
            >
              {outcome.title}
            </h2>
            {outcome.description && (
              <p className="mt-1 text-sm text-dusk/70">{outcome.description}</p>
            )}
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <div className="text-xs uppercase tracking-wide text-dusk/50">
              Overall
            </div>
            <div
              className="font-mono text-2xl font-semibold"
              style={{ color: accent }}
            >
              {formatPercent(compositePercent)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar
              value={compositePercent ?? 0}
              color={accent}
              size="md"
            />
          </div>
          <div className="font-mono text-sm font-semibold text-dusk sm:hidden">
            {formatPercent(compositePercent)}
          </div>
        </div>
      </header>

      {/* Two rollup panels */}
      <div className="grid gap-4 border-t border-sky px-5 py-5 sm:grid-cols-2 sm:gap-6 sm:p-6">
        {/* Tasks panel */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-dusk">
              <CheckSquare className="h-4 w-4 text-ocean" aria-hidden />
              Tasks
            </h3>
            <span className="font-mono text-sm text-dusk/70">
              {tasks.total === 0
                ? 'None yet'
                : `${formatPercent(tasks.avgPercent)} · ${tasks.total} total`}
            </span>
          </div>

          {tasks.total === 0 ? (
            <p className="rounded-xl bg-mist/60 px-3 py-3 text-xs text-dusk/60">
              No tasks linked to this goal yet.
            </p>
          ) : (
            <>
              <ProgressBar
                value={tasks.avgPercent ?? 0}
                color={accent}
                size="sm"
              />
              <ul className="grid grid-cols-2 gap-2 text-xs">
                <StatusPill
                  icon={CheckCircle2}
                  label="Completed"
                  count={tasks.completed}
                  iconClass="text-emerald-600"
                />
                <StatusPill
                  icon={PlayCircle}
                  label="In progress"
                  count={tasks.inProgress}
                  iconClass="text-ocean"
                />
                <StatusPill
                  icon={CircleDashed}
                  label="Not started"
                  count={tasks.notStarted}
                  iconClass="text-dusk/50"
                />
                <StatusPill
                  icon={Pause}
                  label="On hold"
                  count={tasks.onHold}
                  iconClass="text-coral"
                />
              </ul>
            </>
          )}

          <Link
            to={`/tasks?outcome=${outcome.outcome_number}`}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ocean hover:underline print:hidden"
          >
            View tasks
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </section>

        {/* Outputs panel */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-dusk">
              <BarChart3 className="h-4 w-4 text-ocean" aria-hidden />
              Outputs
            </h3>
            <span className="font-mono text-sm text-dusk/70">
              {outputs.total === 0
                ? 'None yet'
                : `${formatPercent(outputs.avgPercent)} · ${outputs.total} total`}
            </span>
          </div>

          {outputs.total === 0 ? (
            <p className="rounded-xl bg-mist/60 px-3 py-3 text-xs text-dusk/60">
              No outputs linked to this goal yet.
            </p>
          ) : (
            <>
              <ProgressBar
                value={outputs.avgPercent ?? 0}
                color={accent}
                size="sm"
              />
              <ul className="flex flex-wrap gap-2 text-xs">
                <SummaryChip
                  label="Tracked"
                  count={outputs.trackedCount}
                  hint="have a numeric target"
                />
                <SummaryChip
                  label="Narrative"
                  count={outputs.narrativeCount}
                  hint="no numeric target"
                />
                <SummaryChip
                  label="Ongoing"
                  count={outputs.ongoingCount}
                  hint="annual / recurring"
                />
              </ul>
              {outputs.trackedCount === 0 && (
                <p className="text-xs text-dusk/60">
                  Outputs are narrative-only. Add a numeric target to start tracking percent progress.
                </p>
              )}
            </>
          )}

          <Link
            to={`/outputs?outcome=${outcome.outcome_number}`}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ocean hover:underline print:hidden"
          >
            View outputs
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </section>
      </div>
    </article>
  )
}

type StatusPillProps = {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  count: number
  iconClass: string
}

function StatusPill({ icon: Icon, label, count, iconClass }: StatusPillProps) {
  return (
    <li className="flex items-center justify-between rounded-xl bg-mist/60 px-3 py-2">
      <span className="flex items-center gap-1.5 text-dusk/80">
        <Icon className={`h-3.5 w-3.5 ${iconClass}`} aria-hidden />
        {label}
      </span>
      <span className="font-mono text-sm font-semibold text-dusk">{count}</span>
    </li>
  )
}

type SummaryChipProps = {
  label: string
  count: number
  hint: string
}

function SummaryChip({ label, count, hint }: SummaryChipProps) {
  return (
    <li
      className="rounded-full bg-mist/60 px-3 py-1.5 text-dusk/80"
      title={hint}
    >
      <span className="font-mono font-semibold text-dusk">{count}</span>{' '}
      <span>{label}</span>
    </li>
  )
}
