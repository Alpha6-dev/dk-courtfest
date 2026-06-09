import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import {
  cacheTickets,
  ticketCount,
  localFind,
  markLocalUsed,
  enqueue,
  queueAll,
  queueCount,
  dequeue,
  uid,
  type CachedTicket,
} from '../../lib/offline'

interface Verdict {
  ok: boolean
  reason?: string
  holder?: string
  type?: string
  already?: boolean
}

// Offline-first check-in. Sync the ticket manifest once online, then validate
// QR codes locally (no network) and queue scans; they flush to Supabase when
// the connection returns. Built for the patchy signal at the venue.
export default function CheckIn() {
  const [token, setToken] = useState('')
  const [last, setLast] = useState<Verdict | null>(null)
  const [session, setSession] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)
  const [cached, setCached] = useState(0)
  const [pending, setPending] = useState(0)
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  async function refreshCounts() {
    setCached(await ticketCount())
    setPending(await queueCount())
  }

  useEffect(() => {
    refreshCounts()
    const up = () => {
      setOnline(true)
      flushQueue()
    }
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  // Download the ticket manifest to this device (requires login + network).
  async function syncTickets() {
    if (!navigator.onLine) return toast.error('Hors-ligne — connexion requise pour synchroniser.')
    const { data, error } = await supabase.from('tickets').select('qr_token, holder_name, type, status')
    if (error) return toast.error(error.message)
    const rows: CachedTicket[] = (data ?? []).map((t) => ({
      token: t.qr_token as string,
      holder: t.holder_name as string,
      type: t.type as string,
      status: t.status as string,
    }))
    await cacheTickets(rows)
    await refreshCounts()
    toast.success(`${rows.length} billets synchronisés sur l'appareil.`)
  }

  // Push queued offline scans to the server (idempotent via client_id).
  async function flushQueue() {
    const items = await queueAll()
    if (!items.length || !navigator.onLine) return
    const { data, error } = await supabase.rpc('sync_check_ins', {
      p_rows: items.map((i) => ({
        token: i.token,
        gate: i.gate,
        scanned_at: i.scanned_at,
        client_id: i.client_id,
        device: 'pwa',
      })),
    })
    if (error) return // stay queued, retry next time
    await dequeue(items.map((i) => i.client_id))
    await refreshCounts()
    const r = data as { inserted: number }
    if (r?.inserted) toast.success(`${r.inserted} entrées synchronisées.`)
  }

  async function validate(raw: string) {
    const t = raw.trim()
    if (!t) return
    setToken('')

    const local = await localFind(t)
    if (local) {
      if (local.status === 'used') {
        setLast({ ok: true, already: true, holder: local.holder, type: local.type })
        toast.warning(`Déjà scanné — ${local.holder}`)
        return
      }
      // Accept locally, record to queue, optimistic mark used.
      await markLocalUsed(t)
      await enqueue({
        client_id: uid(),
        token: t,
        gate: 'main',
        scanned_at: new Date().toISOString(),
        holder: local.holder,
      })
      await refreshCounts()
      setSession((c) => c + 1)
      setLast({ ok: true, holder: local.holder, type: local.type })
      toast.success(`Entrée — ${local.holder}`)
      if (navigator.onLine) flushQueue()
      return
    }

    // Not in local cache.
    if (navigator.onLine) {
      const { data, error } = await supabase.rpc('check_in_ticket', { p_token: t, p_gate: 'main' })
      if (error) return toast.error(error.message)
      const v = data as Verdict
      setLast(v)
      if (v.ok && !v.already) {
        setSession((c) => c + 1)
        toast.success(`Entrée — ${v.holder}`)
      } else if (v.ok) toast.warning(`Déjà scanné — ${v.holder}`)
      else toast.error(v.reason === 'not_found' ? 'Billet inconnu' : `Refusé — ${v.reason}`)
    } else {
      setLast({ ok: false, reason: 'non-synchronisé' })
      toast.error('Billet inconnu hors-ligne — synchronisez d’abord.')
    }
  }

  async function startScan() {
    const Detector = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector
    if (!Detector) return toast.error('Scanner non supporté — saisissez le code manuellement.')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanning(true)
      const detector = new Detector({ formats: ['qr_code'] })
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length) await validate(codes[0].rawValue)
        } catch {
          /* ignore frame errors */
        }
        if (streamRef.current) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    } catch {
      toast.error('Accès caméra refusé.')
    }
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  useEffect(() => () => stopScan(), [])

  return (
    <section className="max-w-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-5xl uppercase text-bone">
          Check-in <span className="text-lion">· {session}</span>
        </h1>
        <span className={`label ${online ? 'text-lion' : 'text-flame'}`}>
          ● {online ? 'En ligne' : 'Hors-ligne'}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button onClick={syncTickets} className="label text-flame hover:text-sun">
          ⟳ Synchroniser les billets
        </button>
        <span className="label text-white/40">{cached} en cache</span>
        {pending > 0 && (
          <button onClick={flushQueue} className="label text-sun hover:text-bone">
            {pending} en attente ↑
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          validate(token)
        }}
        className="mt-6 flex gap-3"
      >
        <input
          autoFocus
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Coller / scanner le code du billet"
          className="flex-1 border border-white/15 bg-white/5 px-4 py-3 font-mono text-bone placeholder:text-white/30 focus:border-flame focus:outline-none"
        />
        <button className="bg-flame px-6 font-display text-2xl uppercase text-onyx hover:bg-sun">Valider</button>
      </form>

      <div className="mt-4">
        {scanning ? (
          <button onClick={stopScan} className="label text-flame">
            ■ Arrêter le scan
          </button>
        ) : (
          <button onClick={startScan} className="label text-lion hover:text-bone">
            ▶ Scanner avec la caméra
          </button>
        )}
        <video ref={videoRef} className={`mt-3 w-full max-w-sm rounded ${scanning ? '' : 'hidden'}`} muted playsInline />
      </div>

      {last && (
        <div
          className={`mt-8 border p-6 ${
            last.ok ? (last.already ? 'border-sun/40 bg-sun/5' : 'border-lion/40 bg-lion/5') : 'border-flame/40 bg-flame/5'
          }`}
        >
          <div className="font-display text-3xl uppercase text-bone">
            {last.ok ? (last.already ? 'Déjà entré' : 'Bienvenue') : 'Refusé'}
          </div>
          {last.holder && <div className="mt-1 text-bone/80">{last.holder}</div>}
          {last.type && <div className="label text-sun">{last.type}</div>}
          {!last.ok && last.reason && <div className="label text-flame">{last.reason}</div>}
        </div>
      )}
    </section>
  )
}
