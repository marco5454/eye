import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toError } from '../lib/errors'
import { useAsyncEffect } from './useAsyncEffect'
import type { Outcome, Output, Task } from '../lib/database.types'

// Read-only fetch for the Goals page. Pulls the three tables we need to
// roll up progress per outcome (outcomes, tasks, outputs). Milestones and
// risks are not linked to outcomes in the current schema, so they're
// intentionally not loaded here.

export type GoalsData = {
  outcomes: Outcome[]
  tasks: Task[]
  outputs: Output[]
}

type State =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: GoalsData; error: null }
  | { status: 'error'; data: null; error: Error }

export type UseGoalsDataResult = State & { refetch: () => Promise<void> }

const initialState: State = { status: 'loading', data: null, error: null }

export function useGoalsData(): UseGoalsDataResult {
  const [state, setState] = useState<State>(initialState)

  const fetchAll = useCallback(async () => {
    setState(initialState)
    try {
      const [outcomesRes, tasksRes, outputsRes] = await Promise.all([
        supabase.from('outcomes').select('*').order('outcome_number', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: true }),
        supabase.from('outputs').select('*').order('output_number', { ascending: true }),
      ])

      const firstError = outcomesRes.error ?? tasksRes.error ?? outputsRes.error
      if (firstError) throw firstError

      setState({
        status: 'ready',
        data: {
          outcomes: outcomesRes.data ?? [],
          tasks: tasksRes.data ?? [],
          outputs: outputsRes.data ?? [],
        },
        error: null,
      })
    } catch (err) {
      const error = toError(err, 'Unknown goals fetch error')
      console.error('[goals] fetch failed:', error)
      setState({ status: 'error', data: null, error })
    }
  }, [])

  useAsyncEffect(fetchAll, [fetchAll])

  if (state.status === 'loading') {
    return { status: 'loading', data: null, error: null, refetch: fetchAll }
  }
  if (state.status === 'ready') {
    return { status: 'ready', data: state.data, error: null, refetch: fetchAll }
  }
  return { status: 'error', data: null, error: state.error, refetch: fetchAll }
}
