import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Risk, RiskInsert } from '../lib/database.types'

// Page-specific hook for the Risk Register page. Loads risks ordered by
// risk_number. CRUD methods re-fetch on success, mirroring `useOutputs`.
//
// Note: `risk_number` is required and has no DB-side default. When creating
// without an explicit number, callers should let the page derive
// `nextRiskNumber(existing)` so numbering stays sequential per session.

type State =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: Risk[]; error: null }
  | { status: 'error'; data: null; error: Error }

export type UseRisksResult = State & {
  refetch: () => Promise<void>
  createRisk: (input: RiskInsert) => Promise<Risk>
  updateRisk: (id: string, patch: Partial<RiskInsert>) => Promise<Risk>
  deleteRisk: (id: string) => Promise<void>
}

const initialState: State = { status: 'loading', data: null, error: null }

export function useRisks(): UseRisksResult {
  const [state, setState] = useState<State>(initialState)

  const fetchAll = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('risks')
        .select('*')
        .order('risk_number', { ascending: true })
      if (error) throw error
      setState({ status: 'ready', data: data ?? [], error: null })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown risks fetch error')
      // eslint-disable-next-line no-console
      console.error('[risks] fetch failed:', error)
      setState({ status: 'error', data: null, error })
    }
  }, [])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const createRisk = useCallback(
    async (input: RiskInsert): Promise<Risk> => {
      const { data, error } = await supabase
        .from('risks')
        .insert(input)
        .select('*')
        .single()
      if (error) throw error
      await fetchAll()
      return data
    },
    [fetchAll],
  )

  const updateRisk = useCallback(
    async (id: string, patch: Partial<RiskInsert>): Promise<Risk> => {
      const { data, error } = await supabase
        .from('risks')
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

  const deleteRisk = useCallback(
    async (id: string): Promise<void> => {
      const { error } = await supabase.from('risks').delete().eq('id', id)
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
      createRisk,
      updateRisk,
      deleteRisk,
    }
  }
  if (state.status === 'ready') {
    return {
      status: 'ready',
      data: state.data,
      error: null,
      refetch: fetchAll,
      createRisk,
      updateRisk,
      deleteRisk,
    }
  }
  return {
    status: 'error',
    data: null,
    error: state.error,
    refetch: fetchAll,
    createRisk,
    updateRisk,
    deleteRisk,
  }
}
