import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import type { Task } from '../../lib/database.types'
import { GRANT_START, getGrantPhase } from '../../lib/grantPeriod'

type Props = {
  tasks: Task[]
  /** Average percent_complete across all tasks. */
  overallPercent: number
}

type Banner = {
  message: string
  /** Tailwind classes applied to the banner card. */
  tone: 'neutral' | 'info' | 'progress' | 'success' | 'warning'
  /** Optional CTA shown to the right (mobile: below). */
  cta?: { label: string; to: string }
}

const TONE_CLASSES: Record<Banner['tone'], string> = {
  neutral: 'bg-mist text-dusk',
  info: 'bg-sky text-ocean',
  progress: 'bg-orange-50 text-coral',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-red-50 text-red-700',
}

function buildBanner(tasks: Task[], overallPercent: number): Banner {
  const phase = getGrantPhase()
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'Completed').length
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length

  if (phase.phase === 'pre-grant') {
    return {
      message: `Grant period begins ${format(GRANT_START, 'd MMM yyyy')}. Setup phase.`,
      tone: 'info',
    }
  }

  if (phase.phase === 'ended') {
    if (overallPercent >= 100) {
      return {
        message: 'Grant period complete. All tracked work delivered.',
        tone: 'success',
      }
    }
    return {
      message: 'Grant period ended. Review outstanding items in Task Tracker.',
      tone: 'warning',
      cta: { label: 'Open Task Tracker', to: '/tasks' },
    }
  }

  // Active phase
  if (total === 0) {
    return {
      message: 'No tasks tracked yet. Add tasks to begin reporting progress.',
      tone: 'neutral',
      cta: { label: 'Open Task Tracker', to: '/tasks' },
    }
  }

  if (overallPercent === 0) {
    return {
      message: 'Grant active. No task progress recorded yet.',
      tone: 'info',
    }
  }

  if (overallPercent < 25) {
    return {
      message: 'Early execution phase. Track progress as activities ramp up.',
      tone: 'info',
    }
  }

  if (overallPercent < 50) {
    return {
      message: `Implementation underway. ${inProgress} of ${total} task${total === 1 ? '' : 's'} in progress.`,
      tone: 'progress',
    }
  }

  if (overallPercent < 70) {
    return {
      message: 'Mid-grant milestone reached. Maintain delivery cadence.',
      tone: 'progress',
    }
  }

  if (overallPercent < 90) {
    return {
      message: `Strong delivery pace. ${completed} of ${total} task${total === 1 ? '' : 's'} complete.`,
      tone: 'progress',
    }
  }

  if (overallPercent < 100) {
    return {
      message: 'Final stretch. Close out remaining deliverables.',
      tone: 'progress',
    }
  }

  return {
    message: 'All tracked tasks complete ahead of grant end.',
    tone: 'success',
  }
}

export default function StatusBanner({ tasks, overallPercent }: Props) {
  const banner = buildBanner(tasks, overallPercent)
  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${TONE_CLASSES[banner.tone]}`}
      role="status"
    >
      <p className="font-medium">{banner.message}</p>
      {banner.cta && (
        <Link
          to={banner.cta.to}
          className="self-start rounded-full bg-shell/80 px-3 py-1 text-xs font-medium text-dusk shadow-sm transition hover:bg-shell sm:self-auto"
        >
          {banner.cta.label} →
        </Link>
      )}
    </div>
  )
}
