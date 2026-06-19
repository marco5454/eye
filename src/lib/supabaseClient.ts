import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail loudly and visibly at import time. Returning a "fake" client with empty
// strings hides misconfiguration behind a generic fetch failure later, which
// is much harder to diagnose in production. Throw here so the missing-env
// error reaches the React error boundary / console with a useful message.
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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
