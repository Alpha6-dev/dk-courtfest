import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Fail loud in dev so a missing .env is obvious.
  console.warn(
    '[dk-courtfest] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.',
  )
}

// Placeholders keep the app rendering (with offline fallbacks) when .env is missing,
// instead of throwing at import time and leaving a blank page.
export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder-anon-key')
