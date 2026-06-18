import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { getActiveEdition } from '../../lib/edition'
import { useBrand } from '../../lib/brand'
import { QR } from '../../components/QR'
import type { Ticket, TicketType } from '../../types/db'

const TYPES: TicketType[] = ['general', 'vip', 'player', 'staff']
const DEFAULT_PRICE: Record<TicketType, number> = { general: 2000, vip: 10000, player: 0, staff: 0 }

function waLink(phone: string | null, token: string, eventName: string) {
  const digits = (phone ?? '').replace(/[^\d]/g, '')
  const url = `${window.location.origin}/ticket/${token}`
  const msg = `${eventName} — votre billet est prêt ! Présentez ce QR à l'entrée : ${url}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
}

export default function Tickets() {
  const { eventName } = useBrand()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [holder, setHolder] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<TicketType>('general')
  const [price, setPrice] = useState<number>(DEFAULT_PRICE.general)
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('issued_at', { ascending: false })
    if (error) toast.error(error.message)
    setTickets((data as Ticket[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function issue(e: React.FormEvent) {
    e.preventDefault()
    if (!holder.trim()) return toast.error('Nom du détenteur requis.')
    setBusy(true)
    try {
      const edition = await getActiveEdition()
      if (!edition) throw new Error('Aucune édition active.')
      const { data, error } = await supabase
        .from('tickets')
        .insert({ edition_id: edition.id, holder_name: holder.trim(), phone: phone || null, type, price_xof: price })
        .select()
        .single()
      if (error) throw error
      // Record a cash payment line if priced (feeds reporting / ledger).
      if (price > 0) {
        await supabase.from('payments').insert({
          edition_id: edition.id,
          provider: 'cash',
          amount_xof: price,
          status: 'paid',
          ticket_id: (data as Ticket).id,
        })
      }
      toast.success('Billet émis.')
      setHolder('')
      setPhone('')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec.')
    } finally {
      setBusy(false)
    }
  }

  const field =
    'border border-white/15 bg-white/5 px-3 py-2 text-bone placeholder:text-white/30 focus:border-flame focus:outline-none'

  return (
    <section>
      <h1 className="font-display text-5xl uppercase text-bone">
        Billets <span className="text-flame">· {tickets.length}</span>
      </h1>

      <form onSubmit={issue} className="mt-6 flex flex-wrap items-center gap-3">
        <input className={field} placeholder="Détenteur *" value={holder} onChange={(e) => setHolder(e.target.value)} />
        <input className={field} placeholder="Téléphone (WhatsApp)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <select
          className={field}
          value={type}
          onChange={(e) => {
            const t = e.target.value as TicketType
            setType(t)
            setPrice(DEFAULT_PRICE[t])
          }}
        >
          {TYPES.map((t) => (
            <option key={t} value={t} className="bg-onyx">
              {t}
            </option>
          ))}
        </select>
        <input
          type="number"
          className={`${field} w-32`}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="XOF"
        />
        <button disabled={busy} className="bg-flame px-6 py-2 font-display text-xl uppercase text-onyx hover:bg-sun disabled:opacity-50">
          {busy ? '…' : '+ Émettre'}
        </button>
      </form>
      <p className="label mt-3 text-white/30">Paiement cash/manuel · passerelle Wave/Orange Money → voir PAYMENTS.md</p>

      {loading ? (
        <p className="label mt-8 text-white/40">Chargement…</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => (
            <div key={t.id} className="flex gap-4 border border-white/10 bg-white/5 p-4">
              <QR value={t.qr_token} size={96} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-2xl text-bone">{t.holder_name}</div>
                <div className="label text-sun">
                  {t.type} · {t.price_xof.toLocaleString('fr-FR')} XOF
                </div>
                <div className={`label mt-1 ${t.status === 'used' ? 'text-white/30' : 'text-lion'}`}>
                  {t.status}
                </div>
                <div className="mt-2 flex gap-3 text-sm">
                  <a href={`/ticket/${t.qr_token}`} target="_blank" className="text-flame hover:underline">
                    Voir
                  </a>
                  {t.phone && (
                    <a href={waLink(t.phone, t.qr_token, eventName)} target="_blank" className="text-lion hover:underline">
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
