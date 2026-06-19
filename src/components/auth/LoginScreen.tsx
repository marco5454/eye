import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'

type Props = {
  /**
   * Returns true when the password matched. The screen surfaces an inline
   * error when it returns false; on success the parent decides what to do
   * (the AuthProvider toggles `unlocked` and re-renders the routes).
   */
  onUnlock: (password: string, remember: boolean) => boolean
}

export default function LoginScreen({ onUnlock }: Props) {
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Autofocus the password field shortly after mount so keyboard users
  // don't have to tab into it.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password.length === 0) {
      setError('Enter the access password to continue.')
      return
    }
    const ok = onUnlock(password, remember)
    if (!ok) {
      setError('That password is not correct. Try again.')
      setPassword('')
      inputRef.current?.focus()
      return
    }
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand block */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ocean text-shell shadow-sm">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-dusk">
            Marcos Power Eye
          </h1>
          <p className="mt-1 text-sm text-dusk/70">
            Kadoorie Foundation grant tracker
          </p>
        </div>

        {/* Login card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-shell p-6 shadow-sm ring-1 ring-mist sm:p-8"
        >
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold uppercase tracking-wider text-dusk/60"
          >
            Access password
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-sky bg-mist/40 px-3 py-2 focus-within:border-ocean focus-within:bg-shell">
            <Lock className="h-4 w-4 shrink-0 text-dusk/50" aria-hidden />
            <input
              ref={inputRef}
              id="login-password"
              type={reveal ? 'text' : 'password'}
              autoComplete="current-password"
              spellCheck={false}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(null)
              }}
              className="min-w-0 flex-1 bg-transparent text-base text-dusk placeholder:text-dusk/40 focus:outline-none"
              placeholder="Enter password"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'login-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? 'Hide password' : 'Show password'}
              aria-pressed={reveal}
              className="-mr-1 inline-flex h-8 min-h-0 w-8 items-center justify-center rounded-full text-dusk/60 hover:bg-sky/60 hover:text-dusk"
            >
              {reveal ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-dusk/80">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-sky text-ocean focus:ring-ocean"
            />
            <span>Remember me on this device</span>
          </label>

          {error && (
            <p
              id="login-error"
              role="alert"
              className="mt-4 rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-ocean px-4 py-3 text-base font-semibold text-shell shadow-sm transition hover:bg-ocean/90 focus:outline-none focus:ring-2 focus:ring-ocean/50"
          >
            Unlock
          </button>

          <p className="mt-4 text-center text-xs text-dusk/50">
            Shared password access — please don&apos;t share with anyone outside
            the project team.
          </p>
        </form>
      </div>
    </div>
  )
}
