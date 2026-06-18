import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { Wordmark } from '../components/Wordmark'
import { useBrand } from '../lib/brand'
import type { TicketType } from '../types/db'

const OPTIONS: { type: TicketType; label: string; price: number }[] = [
  { type: 'general', label: 'Général', price: 2000 },
  { type: 'vip', label: 'VIP', price: 10000 },
]

export default function Buy() {
  const { eventName } = useBrand()
  const [type, setType] = useState<TicketType>('general')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)

  const price = OPTIONS.find((o) => o.type === type)!.price

  async function pay(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return toast.error('Nom et téléphone requis.')
    setBusy(true)
    try {
      const { data, error } = await supabase.functions.invoke('payment-init', {
        body: { holder_name: name.trim(), phone: phone.trim(), type, amount_xof: price },
      })
      if (error) throw error
      if (data?.url) {
        window.location.href = data.url // CinetPay hosted checkout (Wave / Orange Money / card)
      } else if (data?.configured === false) {
        toast.message('Paiement en ligne bientôt disponible. Contactez-nous pour un billet.')
      } else {
        throw new Error(data?.error ?? 'Réponse inattendue.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec du paiement.')
    } finally {
      setBusy(false)
    }
  }

  const field =
    'w-full border border-white/15 bg-white/5 px-4 py-3 text-bone placeholder:text-white/30 focus:border-flame focus:outline-none'

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link to="/" className="label text-white/40 hover:text-flame">
        ← Retour
      </Link>
      <Wordmark className="mt-6 block text-4xl" />
      <h1 className="mt-6 font-display text-5xl uppercase text-bone">
        Billet <span className="text-flame">{eventName}</span>
      </h1>

      <form onSubmit={pay} className="mt-8 space-y-5">
        <div className="flex gap-3">
          {OPTIONS.map((o) => (
            <button
              key={o.type}
              type="button"
              onClick={() => setType(o.type)}
              className={`flex-1 border px-4 py-4 text-left transition ${
                type === o.type ? 'border-flame bg-flame/10' : 'border-white/15'
              }`}
            >
              <div className="font-display text-2xl uppercase text-bone">{o.label}</div>
              <div className="label text-sun">{o.price.toLocaleString('fr-FR')} XOF</div>
            </button>
          ))}
        </div>

        <input className={field} placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={field} placeholder="Téléphone (Wave / Orange Money)" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <button
          disabled={busy}
          className="w-full bg-flame px-8 py-4 font-display text-3xl uppercase tracking-wide text-onyx transition hover:bg-sun disabled:opacity-50"
        >
          {busy ? 'Redirection…' : `Payer ${price.toLocaleString('fr-FR')} XOF →`}
        </button>
        <p className="label text-center text-white/30">Wave · Orange Money · Free Money · Carte — paiement sécurisé PayDunya</p>
      </form>
    </main>
  )
}
