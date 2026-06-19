import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toError } from '../lib/errors'
import { useAsyncEffect } from './useAsyncEffect'
import type { Outcome, Output, OutputInsert } from '../lib/database.types'

// Page-specific hook for the Output Targets page. Loads both `outputs` and
// `outcomes` (we group outputs by their parent outcome) and exposes CRUD that
// re-fetches afterwards, mirroring `useTasks`.

type Loaded = {
  outputs: Output[]
  outcomes: Outcome[]
}

type State =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: Loaded; error: null }
  | { status: 'error'; data: null; error: Error }

export type UseOutputsResult = State & {
  refetch: () => Promise<void>
  createOutput: (input: OutputInsert) => Promise<Output>
  updateOutput: (id: string, patch: Partial<OutputInsert>) => Promise<Output>
  deleteOutput: (id: string) => Promise<void>
}

const initialState: State = { status: 'loading', data: null, error: null }

export function useOutputs(): UseOutputsResult {
  const [state, setState] = useState<State>(initialState)

  const fetchAll = useCallback(async () => {
    try {
      const [outputsRes, outcomesRes] = await Promise.all([
        supabase
          .from('outputs')
          .select('*')
          .order('output_number', { ascending: true }),
        supabase
          .from('outcomes')
          .select('*')
          .order('outcome_number', { ascending: true }),
      ])
      if (outputsRes.error) throw outputsRes.error
      if (outcomesRes.error) throw outcomesRes.error
      setState({
        status: 'ready',
        data: {
          outputs: outputsRes.data ?? [],
          outcomes: outcomesRes.data ?? [],
        },
        error: null,
      })
    } catch (err) {
      const error = toError(err, 'Unknown outputs fetch error')
      console.error('[outputs] fetch failed:', error)
      setState({ status: 'error', data: null, error })
    }
  }, [])

  useAsyncEffect(fetchAll, [fetchAll])

  const createOutput = useCallback(
    async (input: OutputInsert): Promise<Output> => {
      const { data, error } = await supabase
        .from('outputs')
        .insert(input)
        .select('*')
        .single()
      if (error) throw error
      await fetchAll()
      return data
    },
    [fetchAll],
  )

  const updateOutput = useCallback(
    async (id: string, patch: Partial<OutputInsert>): Promise<Output> => {
      const { data, error } = await supabase
        .from('outputs')
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

  const deleteOutput = useCallback(
    async (id: string): Promise<void> => {
      const { error } = await supabase.from('outputs').delete().eq('id', id)
      if (error) throw error
      await fetchAll()
    },
    [fetchAll],
  )

  if (state.status === 'loading') {
    return {
      status: 'loading',
      data: null,
      error: null,
      refetch: fetchAll,
      createOutput,
      updateOutput,
      deleteOutput,
    }
  }
  if (state.status === 'ready') {
    return {
      status: 'ready',
      data: state.data,
      error: null,
      refetch: fetchAll,
      createOutput,
      updateOutput,
      deleteOutput,
    }
  }
  return {
    status: 'error',
    data: null,
    error: state.error,
    refetch: fetchAll,
    createOutput,
    updateOutput,
    deleteOutput,
  }
}
