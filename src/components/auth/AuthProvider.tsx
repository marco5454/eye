import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import {
  AUTH_STORAGE_KEY,
  AUTH_UNLOCKED_VALUE,
  getGatePassword,
  isGateEnabled,
} from '../../lib/authConfig'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'
import LoginScreen from './LoginScreen'

// Reads the unlock flag from session/local storage on first mount. Wrapped
// in try/catch because storage access can throw in private/restricted modes.
function readPersistedUnlock(): boolean {
  if (!isGateEnabled()) return true
  try {
    if (sessionStorage.getItem(AUTH_STORAGE_KEY) === AUTH_UNLOCKED_VALUE) return true
    if (localStorage.getItem(AUTH_STORAGE_KEY) === AUTH_UNLOCKED_VALUE) return true
  } catch {
    // Storage unavailable — force re-login each visit.
  }
  return false
}

type Props = {
  children: ReactNode
}

export default function AuthProvider({ children }: Props) {
  const required = isGateEnabled()
  const [unlocked, setUnlocked] = useState<boolean>(() => readPersistedUnlock())

  const handleUnlock = useCallback((password: string, remember: boolean): boolean => {
    const expected = getGatePassword()
    if (expected === null) {
      // Defensive: if the gate isn't configured, treat any submission as a pass.
      setUnlocked(true)
      return true
    }
    if (password !== expected) return false
    try {
      const storage = remember ? localStorage : sessionStorage
      storage.setItem(AUTH_STORAGE_KEY, AUTH_UNLOCKED_VALUE)
      // Clear the other store so toggling "remember" doesn't leave stale data.
      const other = remember ? sessionStorage : localStorage
      other.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // Ignore storage failures; user will simply have to re-enter on reload.
    }
    setUnlocked(true)
    return true
  }, [])

  const signOut = useCallback(() => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // ignore
    }
    setUnlocked(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ required, unlocked, signOut }),
    [required, unlocked, signOut],
  )

  return (
    <AuthContext.Provider value={value}>
      {unlocked ? children : <LoginScreen onUnlock={handleUnlock} />}
    </AuthContext.Provider>
  )
}
