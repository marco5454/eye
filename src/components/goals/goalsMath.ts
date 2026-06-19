import type { Output, Task, TaskStatus } from '../../lib/database.types'
import { totalActuals } from '../outputs/outputMath'

// Per-outcome rollup math for the Goals page.
//
// Composite progress per goal blends two equally weighted streams:
//   - Tasks: average percent_complete across the outcome's tasks
//   - Outputs: weighted progress against numeric targets, mirroring the
//     OutputOutcomeGroup math (cumulative = totalActuals/target,
//     ongoing = avg of yearly ratios against the annual target)
//
// If only one stream has data, the composite reflects that stream alone.
// If neither has trackable data, composite is null (rendered as '—').

export type TaskStatusBreakdown = Record<TaskStatus, number>

export type TaskRollup = {
  total: number
  completed: number
  inProgress: number
  notStarted: number
  onHold: number
  /** Average percent_complete across all tasks (0-100). null when total = 0. */
  avgPercent: number | null
  statusBreakdown: TaskStatusBreakdown
}

export type OutputRollup = {
  total: number
  trackedCount: number
  narrativeCount: number
  ongoingCount: number
  /** Weighted average of target progress across tracked outputs (0-100). null when nothing tracked. */
  avgPercent: number | null
}

export type GoalRollup = {
  tasks: TaskRollup
  outputs: OutputRollup
  /** Composite of task and output averages. null when both streams are empty/untracked. */
  compositePercent: number | null
}

const EMPTY_STATUS: TaskStatusBreakdown = {
  'Not Started': 0,
  'In Progress': 0,
  'On Hold': 0,
  'Completed': 0,
}

export function rollupTasks(tasks: Task[]): TaskRollup {
  const total = tasks.length
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      onHold: 0,
      avgPercent: null,
      statusBreakdown: { ...EMPTY_STATUS },
    }
  }

  const statusBreakdown: TaskStatusBreakdown = { ...EMPTY_STATUS }
  let percentSum = 0
  for (const t of tasks) {
    statusBreakdown[t.status] = (statusBreakdown[t.status] ?? 0) + 1
    percentSum += t.percent_complete ?? 0
  }

  return {
    total,
    completed: statusBreakdown['Completed'],
    inProgress: statusBreakdown['In Progress'],
    notStarted: statusBreakdown['Not Started'],
    onHold: statusBreakdown['On Hold'],
    avgPercent: Math.round(percentSum / total),
    statusBreakdown,
  }
}

export function rollupOutputs(outputs: Output[]): OutputRollup {
  const total = outputs.length
  const tracked = outputs.filter(
    (o) => o.numeric_target != null && o.numeric_target > 0,
  )
  const ongoingCount = outputs.filter((o) => o.is_ongoing).length
  const narrativeCount = total - tracked.length

  if (tracked.length === 0) {
    return {
      total,
      trackedCount: 0,
      narrativeCount,
      ongoingCount,
      avgPercent: null,
    }
  }

  const ratios = tracked.map((o) => {
    const target = o.numeric_target as number
    if (o.is_ongoing) {
      const yearRatios = [
        o.y1_actual / target,
        o.y2_actual / target,
        o.y3_actual / target,
      ]
      return yearRatios.reduce((a, b) => a + b, 0) / yearRatios.length
    }
    return totalActuals(o) / target
  })

  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length
  return {
    total,
    trackedCount: tracked.length,
    narrativeCount,
    ongoingCount,
    avgPercent: Math.max(0, Math.min(100, Math.round(avg * 100))),
  }
}

export function buildGoalRollup(tasks: Task[], outputs: Output[]): GoalRollup {
  const taskRollup = rollupTasks(tasks)
  const outputRollup = rollupOutputs(outputs)

  // Composite blends whatever stream has signal. Equal weights so a goal
  // with strong task progress but no output data still reads honestly.
  const components: number[] = []
  if (taskRollup.avgPercent != null) components.push(taskRollup.avgPercent)
  if (outputRollup.avgPercent != null) components.push(outputRollup.avgPercent)

  const compositePercent =
    components.length === 0
      ? null
      : Math.round(components.reduce((a, b) => a + b, 0) / components.length)

  return {
    tasks: taskRollup,
    outputs: outputRollup,
    compositePercent,
  }
}
