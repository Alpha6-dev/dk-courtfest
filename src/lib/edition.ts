import { supabase } from './supabase'

export interface Edition {
  id: string
  name: string
  season: string
  event_date: string | null
  venue: string | null
  status: string
  // Host-city brand fields (migration 0008 — NOT NULL with Dakar defaults).
  city: string
  country: string
  city_code: string
}

/**
 * Resolve the active edition: an explicit VITE_EDITION_ID if set,
 * otherwise the most recently created edition row.
 */
export async function getActiveEdition(): Promise<Edition | null> {
  const pinned = import.meta.env.VITE_EDITION_ID
  const query = supabase.from('editions').select('*')

  const { data, error } = pinned
    ? await query.eq('id', pinned).maybeSingle()
    : await query.order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (error) {
    console.error('[dk-courtfest] getActiveEdition', error.message)
    return null
  }
  return data as Edition | null
}
