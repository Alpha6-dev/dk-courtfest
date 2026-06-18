import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QR } from '../components/QR'
import { Wordmark } from '../components/Wordmark'
import { useBrand } from '../lib/brand'

interface TicketView {
  holder_name: string
  type: string
  status: string
  edition_name: string
  event_date: string | null
  venue: string | null
}

export default function Ticket() {
  const { tagline } = useBrand()
  const { token = '' } = useParams()
  const [ticket, setTicket] = useState<TicketView | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .rpc('get_ticket', { p_token: token })
      .then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data
        setTicket((row as TicketView) ?? null)
        setLoading(false)
      })
  }, [token])

  if (loading) return <div className="p-10 label text-white/40">Chargement…</div>

  if (!ticket)
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <Wordmark className="block text-4xl" />
        <p className="mt-8 text-white/60">Billet introuvable.</p>
        <Link to="/" className="label mt-6 inline-block text-flame">
          ← Accueil
        </Link>
      </main>
    )

  const used = ticket.status === 'used'
  const dateStr = ticket.event_date
    ? new Date(ticket.event_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <div className="overflow-hidden border border-white/15 bg-white/5">
        <div className="bg-flame px-6 py-4">
          <Wordmark className="text-3xl !text-onyx" />
          <div className="label text-onyx/80">Billet officiel</div>
        </div>
        <div className="flex flex-col items-center gap-4 p-8">
          <QR value={token} size={220} />
          <div className="text-center">
            <div className="font-display text-4xl uppercase text-bone">{ticket.holder_name}</div>
            <div className="label mt-1 text-sun">
              {ticket.type} · <span className={used ? 'text-flame' : 'text-lion'}>{ticket.status}</span>
            </div>
          </div>
          <div className="mt-2 text-center text-white/60">
            <div className="font-display text-2xl text-bone">{ticket.edition_name}</div>
            {dateStr && <div>{dateStr}</div>}
            {ticket.venue && <div className="text-sm">{ticket.venue}</div>}
          </div>
        </div>
        <div className="label border-t border-white/10 px-6 py-3 text-center text-white/30">
          {tagline}
        </div>
      </div>
    </main>
  )
}
