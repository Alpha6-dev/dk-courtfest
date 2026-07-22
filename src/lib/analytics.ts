import { supabase } from './supabase'

/**
 * First-party, cookie-less analytics. Beacons go to the site_events table via
 * the capture_event security-definer RPC (insert-only for anon; no reads).
 * Session id lives in sessionStorage only — no cookies, no PII, no banner.
 */
const SID_KEY = 'cf_sid'

function sid(): string {
  try {
    let s = sessionStorage.getItem(SID_KEY)
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem(SID_KEY, s)
    }
    return s
  } catch {
    return 'no-storage'
  }
}

const onceSeen = new Set<string>()

/** Fire-and-forget event beacon. `onceKey` dedupes per session-page-load. */
export function track(event: string, meta?: Record<string, unknown>, onceKey?: string) {
  if (onceKey) {
    if (onceSeen.has(onceKey)) return
    onceSeen.add(onceKey)
  }
  supabase
    .rpc('capture_event', {
      p_event: event,
      p_path: window.location.pathname,
      p_session: sid(),
      p_meta: meta ?? null,
    })
    .then(({ error }) => {
      if (error) console.debug('[cf] track failed', error.message)
    })
}
