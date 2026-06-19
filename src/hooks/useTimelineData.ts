import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toError } from '../lib/errors'
import { useAsyncEffect } from './useAsyncEffect'
import type {
  Milestone,
  MilestoneInsert,
  Outcome,
  Task,
  TaskInsert,
} from '../lib/database.types'

// Page-specific hook for the Timeline page. Loads `outcomes`, `tasks` and
// `milestones` in parallel so we can render a Gantt grid with outcome colors,
// task spans and milestone markers. Exposes update helpers for both tasks and
// milestones (no create/delete here — those happen on their dedicated pages
// or via the form modals reused on this page).

type Loaded = {
  outcomes: Outcome[]
  tasks: Task[]
  milestones: Milestone[]
}

type State =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: Loaded; error: null }
  | { status: 'error'; data: null; error: Error }

export type UseTimelineDataResult = State & {
  refetch: () => Promise<void>
  updateTask: (id: string, patch: Partial<TaskInsert>) => Promise<Task>
  updateMilestone: (
    id: string,
    patch: Partial<MilestoneInsert>,
  ) => Promise<Milestone>
}

const initialState: State = { status: 'loading', data: null, error: null }

export function useTimelineData(): UseTimelineDataResult {
  const [state, setState] = useState<State>(initialState)

  const fetchAll = useCallback(async () => {
    try {
      const [outcomesRes, tasksRes, milestonesRes] = await Promise.all([
        supabase
          .from('outcomes')
          .select('*')
          .order('outcome_number', { ascending: true }),
        supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('milestones')
          .select('*')
          .order('due_date', { ascending: true, nullsFirst: false }),
      ])
      if (outcomesRes.error) throw outcomesRes.error
      if (tasksRes.error) throw tasksRes.error
      if (milestonesRes.error) throw milestonesRes.error
      setState({
        status: 'ready',
        data: {
          outcomes: outcomesRes.data ?? [],
          tasks: tasksRes.data ?? [],
          milestones: milestonesRes.data ?? [],
        },
        error: null,
      })
    } catch (err) {
      const error = toError(err, 'Unknown timeline fetch error')
      console.error('[timeline] fetch failed:', error)
      setState({ status: 'error', data: null, error })
    }
  }, [])

  useAsyncEffect(fetchAll, [fetchAll])

  const updateTask = useCallback(
    async (id: string, patch: Partial<TaskInsert>): Promise<Task> => {
      const { data, error } = await supabase
        .from('tasks')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      await fetchAll()
      return data
    },
    [fetchAll],
  )

  const updateMilestone = useCallback(
    async (id: string, patch: Partial<MilestoneInsert>): Promise<Milestone> => {
      const { data, error } = await supabase
        .from('milestones')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      await fetchAll()
      return data
    },
    [fetchAll],
  )

  // Preserve discriminated union shape when returning.
  if (state.status === 'loading') {
    return {
      status: 'loading',
      data: null,
      error: null,
      refetch: fetchAll,
      updateTask,
      updateMilestone,
    }
  }
  if (state.status === 'ready') {
    return {
      status: 'ready',
      data: state.data,
      error: null,
      refetch: fetchAll,
      updateTask,
      updateMilestone,
    }
  }
  return {
    status: 'error',
    data: null,
    error: state.error,
    refetch: fetchAll,
    updateTask,
    updateMilestone,
  }
}
