// Coerce anything thrown / rejected into a real Error with a useful message.
//
// Supabase's PostgrestError is a plain object with shape
//   { message: string; code?: string; details?: string; hint?: string }
// It is NOT an instance of Error, so a naive `err instanceof Error ? err :
// new Error('Unknown')` loses all detail and surfaces "Unknown ... error" in
// the UI. This helper preserves the underlying message and tags structured
// metadata onto the resulting Error for downstream logging.

type Indexable = Record<string, unknown>

function isObject(value: unknown): value is Indexable {
  return typeof value === 'object' && value !== null
}

function readString(obj: Indexable, key: string): string | undefined {
  const value = obj[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function toError(err: unknown, fallback: string): Error {
  if (err instanceof Error) return err

  if (typeof err === 'string' && err.length > 0) return new Error(err)

  if (isObject(err)) {
    const message = readString(err, 'message')
    const code = readString(err, 'code')
    const details = readString(err, 'details')
    const hint = readString(err, 'hint')
    const parts = [message, code ? `[${code}]` : null, details, hint]
      .filter(Boolean)
      .join(' — ')
    if (parts) {
      const wrapped = new Error(parts)
      // Preserve structured fields for logs/devtools.
      Object.assign(wrapped, { code, details, hint, original: err })
      return wrapped
    }
  }

  return new Error(fallback)
}
