import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toError } from '../lib/errors'
import { useAsyncEffect } from './useAsyncEffect'
import type {
  Milestone,
  Outcome,
  Risk,
  Task,
} from '../lib/database.types'

// Single read-only fetch for the Dashboard. Pulls all four tables in parallel
// and returns a consolidated state. Page-specific hooks with write helpers
// (useTasks, useOutputs, useMilestones, useRisks) are introduced in later
// phases where they're actually needed.

export type DashboardData = {
  outcomes: Outcome[]
  tasks: Task[]
  milestones: Milestone[]
  risks: Risk[]
}

type State =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: DashboardData; error: null }
  | { status: 'error'; data: null; error: Error }

export type UseDashboardDataResult = State & { refetch: () => Promise<void> }

const initialState: State = { status: 'loading', data: null, error: null }

export function useDashboardData(): UseDashboardDataResult {
  const [state, setState] = useState<State>(initialState)

  const fetchAll = useCallback(async () => {
    setState(initialState)
    try {
      const [outcomesRes, tasksRes, milestonesRes, risksRes] = await Promise.all([
        supabase.from('outcomes').select('*').order('outcome_number', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: true }),
        supabase.from('milestones').select('*').order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('risks').select('*').order('risk_number', { ascending: true }),
      ])

      const firstError =
        outcomesRes.error ?? tasksRes.error ?? milestonesRes.error ?? risksRes.error
      if (firstError) throw firstError

      setState({
        status: 'ready',
        data: {
          outcomes: outcomesRes.data ?? [],
          tasks: tasksRes.data ?? [],
          milestones: milestonesRes.data ?? [],
          risks: risksRes.data ?? [],
        },
        error: null,
      })
    } catch (err) {
      const error = toError(err, 'Unknown dashboard fetch error')
      console.error('[dashboard] fetch failed:', error)
      setState({ status: 'error', data: null, error })
    }
  }, [])

  // Mount-only fetch (per spec). No window-focus refetch.
  useAsyncEffect(fetchAll, [fetchAll])

  // Spread into a new object so the discriminated union is preserved on the
  // returned type. (Returning `{ ...state, refetch }` directly would widen.)
  if (state.status === 'loading') {
    return { status: 'loading', data: null, error: null, refetch: fetchAll }
  }
  if (state.status === 'ready') {
    return { status: 'ready', data: state.data, error: null, refetch: fetchAll }
  }
  return { status: 'error', data: null, error: state.error, refetch: fetchAll }
}
