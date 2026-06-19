import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toError } from '../lib/errors'
import { useAsyncEffect } from './useAsyncEffect'
import type {
  Milestone,
  MilestoneInsert,
} from '../lib/database.types'

// Page-specific hook for the Milestones page. Provides read + write helpers
// with optimistic-ish refresh (we re-fetch after each mutation to keep things
// honest with whatever DB-side defaults / triggers may exist).

type State =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: Milestone[]; error: null }
  | { status: 'error'; data: null; error: Error }

export type UseMilestonesResult = State & {
  refetch: () => Promise<void>
  createMilestone: (input: MilestoneInsert) => Promise<Milestone>
  updateMilestone: (id: string, patch: Partial<MilestoneInsert>) => Promise<Milestone>
  deleteMilestone: (id: string) => Promise<void>
}

const initialState: State = { status: 'loading', data: null, error: null }

export function useMilestones(): UseMilestonesResult {
  const [state, setState] = useState<State>(initialState)

  const fetchAll = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .order('year', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      setState({ status: 'ready', data: data ?? [], error: null })
    } catch (err) {
      const error = toError(err, 'Unknown milestones fetch error')
      console.error('[milestones] fetch failed:', error)
      setState({ status: 'error', data: null, error })
    }
  }, [])

  useAsyncEffect(fetchAll, [fetchAll])

  const createMilestone = useCallback(
    async (input: MilestoneInsert): Promise<Milestone> => {
      const { data, error } = await supabase
        .from('milestones')
        .insert(input)
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

  const deleteMilestone = useCallback(
    async (id: string): Promise<void> => {
      const { error } = await supabase.from('milestones').delete().eq('id', id)
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
      createMilestone,
      updateMilestone,
      deleteMilestone,
    }
  }
  if (state.status === 'ready') {
    return {
      status: 'ready',
      data: state.data,
      error: null,
      refetch: fetchAll,
      createMilestone,
      updateMilestone,
      deleteMilestone,
    }
  }
  return {
    status: 'error',
    data: null,
    error: state.error,
    refetch: fetchAll,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  }
}
