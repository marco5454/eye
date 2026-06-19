// Build-time configuration for the shared-password gate.
// `VITE_APP_PASSWORD` is inlined by Vite at build time, so this is a soft
// gate ("don't share with strangers"), not a security boundary. If you need
// real auth, wire up Supabase Auth + RLS instead.
//
// Behaviour:
//   - When the env var is missing or empty, the gate is disabled. The app
//     renders without prompting (this is the default for a fresh clone).
//   - When the env var is set, every visitor must enter the password before
//     the routes mount. The success state persists in sessionStorage by
//     default, or localStorage if the user opts in to "remember me".

const RAW_PASSWORD = import.meta.env.VITE_APP_PASSWORD

export function getGatePassword(): string | null {
  if (typeof RAW_PASSWORD !== 'string') return null
  const trimmed = RAW_PASSWORD.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function isGateEnabled(): boolean {
  return getGatePassword() !== null
}

// Storage key shared by both session and local storage.
export const AUTH_STORAGE_KEY = 'mpe.auth.unlocked'
// Stored value is just a sentinel; the password is never persisted.
export const AUTH_UNLOCKED_VALUE = '1'
