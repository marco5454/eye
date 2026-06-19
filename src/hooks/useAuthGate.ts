import { useContext } from 'react'
import { AuthContext } from '../components/auth/authContext'
import type { AuthContextValue } from '../components/auth/authContext'

/**
 * Access the auth gate state. Must be called from inside `<AuthProvider>`
 * (mounted in `App.tsx`).
 *
 * ```tsx
 * const { required, signOut } = useAuthGate()
 * if (required) return <button onClick={signOut}>Sign out</button>
 * ```
 */
export function useAuthGate(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthGate must be called within an <AuthProvider>')
  }
  return ctx
}
