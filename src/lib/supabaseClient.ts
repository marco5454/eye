import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Some hosting providers (Vercel/Netlify UIs) accidentally append a newline,
// CR, or trailing whitespace when pasting long values like JWTs. Headers.set()
// then throws an opaque "TypeError: Invalid value" deep inside fetch. We
// pre-clean here so a mis-pasted env var either auto-recovers or fails with
// a precise message.
function readEnv(name: string): string | undefined {
  const raw = import.meta.env[name as keyof ImportMetaEnv]
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function assertHeaderSafe(name: string, value: string): void {
  // RFC 7230 forbids CR/LF/NUL inside header field values. Browsers also
  // disallow most non-ASCII. If the env var contains any of these, fail
  // loudly with the offending character index instead of letting fetch throw
  // a generic "Invalid value".
  const offending = value.match(/[\r\n\0\t]|[^\x20-\x7E]/)
  if (offending) {
    const code = offending[0].charCodeAt(0)
    const where = value.indexOf(offending[0])
    throw new Error(
      `[supabase] ${name} contains an invalid character (code ${code}) at index ${where}. ` +
        'This usually happens when a value is pasted with a trailing newline or smart quote. ' +
        'Re-copy the value from the Supabase dashboard (use the copy button) and re-save it ' +
        'in your hosting provider, then redeploy.',
    )
  }
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = readEnv('VITE_SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
    !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
  ]
    .filter(Boolean)
    .join(', ')
  const message =
    `[supabase] Missing required environment variable(s): ${missing}. ` +
    'Set them in your hosting provider (Vercel: Project → Settings → Environment Variables) ' +
    'or in a local .env file (see .env.example), then redeploy / restart the dev server.'
  console.error(message)
  throw new Error(message)
}

assertHeaderSafe('VITE_SUPABASE_URL', supabaseUrl)
assertHeaderSafe('VITE_SUPABASE_ANON_KEY', supabaseAnonKey)

// Strip any accidental trailing slash on the URL so /rest/v1/... composes cleanly.
const normalisedUrl = supabaseUrl.replace(/\/+$/, '')

export const supabase = createClient<Database>(normalisedUrl, supabaseAnonKey)
