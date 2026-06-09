import { openDB } from 'idb'

// Offline-first store for the check-in PWA.
// - `tickets`: the manifest synced while online (keyed by QR token)
// - `queue`:   check-ins recorded on-device, flushed to Supabase when online
const DB_NAME = 'dkcf-checkin'
const DB_VERSION = 1

function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(d) {
      if (!d.objectStoreNames.contains('tickets')) d.createObjectStore('tickets', { keyPath: 'token' })
      if (!d.objectStoreNames.contains('queue')) d.createObjectStore('queue', { keyPath: 'client_id' })
    },
  })
}

export interface CachedTicket {
  token: string
  holder: string
  type: string
  status: string
}

export interface QueueItem {
  client_id: string
  token: string
  gate: string
  scanned_at: string
  holder: string
}

export function uid() {
  return 'ci_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── Ticket manifest ──────────────────────────────────────────────────────────
export async function cacheTickets(rows: CachedTicket[]) {
  const d = await db()
  const tx = d.transaction('tickets', 'readwrite')
  await tx.store.clear()
  for (const r of rows) await tx.store.put(r)
  await tx.done
}

export async function ticketCount(): Promise<number> {
  return (await db()).count('tickets')
}

export async function localFind(token: string): Promise<CachedTicket | undefined> {
  return (await db()).get('tickets', token)
}

export async function markLocalUsed(token: string) {
  const d = await db()
  const t = (await d.get('tickets', token)) as CachedTicket | undefined
  if (t) {
    t.status = 'used'
    await d.put('tickets', t)
  }
}

// ── Pending check-in queue ───────────────────────────────────────────────────
export async function enqueue(item: QueueItem) {
  await (await db()).put('queue', item)
}

export async function queueAll(): Promise<QueueItem[]> {
  return (await db()).getAll('queue')
}

export async function queueCount(): Promise<number> {
  return (await db()).count('queue')
}

export async function dequeue(ids: string[]) {
  const d = await db()
  const tx = d.transaction('queue', 'readwrite')
  for (const id of ids) await tx.store.delete(id)
  await tx.done
}
