import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Outcome, Task, TaskInsert } from '../lib/database.types'

// Page-specific hook for the Task Tracker page. Loads both `tasks` and
// `outcomes` (we display outcome titles/colors next to each task) and exposes
// CRUD that re-fetches afterwards, mirroring `useMilestones`.

type Loaded = {
  tasks: Task[]
  outcomes: Outcome[]
}

type State =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: Loaded; error: null }
  | { status: 'error'; data: null; error: Error }

export type UseTasksResult = State & {
  refetch: () => Promise<void>
  createTask: (input: TaskInsert) => Promise<Task>
  updateTask: (id: string, patch: Partial<TaskInsert>) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
}

const initialState: State = { status: 'loading', data: null, error: null }

export function useTasks(): UseTasksResult {
  const [state, setState] = useState<State>(initialState)

  const fetchAll = useCallback(async () => {
    try {
      const [tasksRes, outcomesRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('outcomes')
          .select('*')
          .order('outcome_number', { ascending: true }),
      ])
      if (tasksRes.error) throw tasksRes.error
      if (outcomesRes.error) throw outcomesRes.error
      setState({
        status: 'ready',
        data: {
          tasks: tasksRes.data ?? [],
          outcomes: outcomesRes.data ?? [],
        },
        error: null,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown tasks fetch error')
      // eslint-disable-next-line no-console
      console.error('[tasks] fetch failed:', error)
      setState({ status: 'error', data: null, error })
    }
  }, [])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const createTask = useCallback(
    async (input: TaskInsert): Promise<Task> => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(input)
        .select('*')
        .single()
      if (error) throw error
      await fetchAll()
      return data
    },
    [fetchAll],
  )

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

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      await fetchAll()
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
      createTask,
      updateTask,
      deleteTask,
    }
  }
  if (state.status === 'ready') {
    return {
      status: 'ready',
      data: state.data,
      error: null,
      refetch: fetchAll,
      createTask,
      updateTask,
      deleteTask,
    }
  }
  return {
    status: 'error',
    data: null,
    error: state.error,
    refetch: fetchAll,
    createTask,
    updateTask,
    deleteTask,
  }
}
