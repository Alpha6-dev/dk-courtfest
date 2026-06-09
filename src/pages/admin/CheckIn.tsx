import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'

interface Verdict {
  ok: boolean
  reason?: string
  holder?: string
  type?: string
  already?: boolean
}

// Phase 3 starter: online check-in. Manual token entry always works; camera
// scanning uses the browser BarcodeDetector when available (Chrome/Android).
// The full offline-first PWA (local cache + queued sync) is the next iteration.
export default function CheckIn() {
  const [token, setToken] = useState('')
  const [last, setLast] = useState<Verdict | null>(null)
  const [count, setCount] = useState(0)
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  async function validate(raw: string) {
    const t = raw.trim()
    if (!t) return
    const { data, error } = await supabase.rpc('check_in_ticket', { p_token: t, p_gate: 'main' })
    if (error) return toast.error(error.message)
    const v = data as Verdict
    setLast(v)
    setToken('')
    if (v.ok && !v.already) {
      setCount((c) => c + 1)
      toast.success(`Entrée — ${v.holder}`)
    } else if (v.ok && v.already) {
      toast.warning(`Déjà scanné — ${v.holder}`)
    } else {
      toast.error(v.reason === 'not_found' ? 'Billet inconnu' : `Refusé — ${v.reason}`)
    }
  }

  async function startScan() {
    const Detector = (window as any).BarcodeDetector
    if (!Detector) return toast.error('Scanner non supporté ici — saisissez le code manuellement.')
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
          if (codes.length) {
            await validate(codes[0].rawValue)
          }
        } catch {
          /* ignore frame errors */
        }
        if (streamRef.current) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    } catch {
      toast.error("Accès caméra refusé.")
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
      <h1 className="font-display text-5xl uppercase text-bone">
        Check-in <span className="text-lion">· {count}</span>
      </h1>
      <p className="label mt-1 text-white/30">Entrées validées cette session</p>

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
