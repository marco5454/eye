import { createContext } from 'react'

// Auth gate context lives in its own file so `AuthProvider.tsx` can
// remain a pure-component module (satisfies `react-refresh/only-export-components`).

export type AuthContextValue = {
  /** True when a build-time password is configured. */
  required: boolean
  /** True when the user has either entered the password or the gate is disabled. */
  unlocked: boolean
  /** Clear stored unlock and force the login screen on next render. */
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
