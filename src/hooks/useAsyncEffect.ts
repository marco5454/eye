import { useEffect } from 'react'

// Centralised "fetch on mount" effect helper.
//
// `react-hooks/set-state-in-effect` flags any useEffect whose body invokes a
// callback that may call setState before the next microtask. Our hooks all
// follow the same shape: kick off an async fetcher on mount, set state when
// it resolves. The first setState always happens after `await`, but the rule
// is conservative and can't see that.
//
// We disable the rule in this single, intentional spot (with a justification)
// so each consuming hook stays clean and the exception is auditable.
//
// Pass a memoised async function (typically a useCallback) and a dependency
// array. The fetcher is fired once on mount and again whenever a dependency
// changes (mirroring the standard useEffect contract).

export function useAsyncEffect(
  fetcher: () => Promise<void>,
  deps: ReadonlyArray<unknown>,
): void {
  useEffect(() => {
    // Fire-and-forget: any setState inside `fetcher` only runs after `await`,
    // which the linter cannot statically prove. This is the canonical
    // fetch-on-mount pattern documented at
    // https://react.dev/reference/react/useEffect#fetching-data-with-effects
    void fetcher()
    // eslint expects a literal array for the deps argument, but here we
    // intentionally forward the caller's array. The caller is responsible
    // for stability (typically by memoising the fetcher with useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
