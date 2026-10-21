import type { ReactNode } from 'react'
import { useBrand } from '../../lib/brand'
import { T, xof, type Lang, type TicketOption } from './data'

// Sticky on wide screens: what you are buying, when and where, what you pay.
export function OrderSummary({ lang, ticket, quantity }: { lang: Lang; ticket: TicketOption; quantity: number }) {
  const t = T[lang]
  const { eventName, city, edition, loading } = useBrand()
  // French dates keep the month in lower case; only the first letter takes a capital.
  const raw = edition?.event_date
    ? new Date(edition.event_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const date = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : null
  const total = ticket.price * quantity
  const presaleTotal = ticket.presale * quantity

  return (
    <aside aria-label={t.summary} className="border border-white/15 bg-white/5 p-5 lg:sticky lg:top-6 lg:self-start">
      <p className="label text-white/50">{t.summary}</p>
      <p className="mt-2 font-display text-3xl uppercase leading-none text-bone">{eventName}</p>
      <dl className="mt-4 space-y-2 text-sm">
        <Row k={t.date} v={loading ? <span className="inline-block h-4 w-32 animate-pulse bg-white/10" /> : (date ?? t.dateTbc)} />
        <Row k={t.venue} v={edition?.venue ?? city} />
        <Row k={t.hours} v={t.allDay} />
      </dl>
      <div className="mt-5 border-t border-white/15 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display text-2xl uppercase text-bone">
            {quantity > 1 ? `${quantity} ${t.tickets} ${ticket.label}` : `${t.ticket} ${ticket.label}`}
          </span>
          <span className="font-display text-3xl text-sun">{xof(total)}</span>
        </div>
        {quantity > 1 && <p className="mt-1 text-sm text-white/60">{quantity} × {xof(ticket.price)}</p>}
        <p className="mt-1 text-sm text-white/60">
          {t.presaleLine}&nbsp;: <span className="text-bone">{xof(presaleTotal)}</span>, {t.presaleApplied}
        </p>
      </div>
      <p className="mt-4 text-sm text-white/60">{t.qrNote}</p>
    </aside>
  )
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="label text-white/50">{k}</dt>
      <dd className="text-right text-bone">{v}</dd>
    </div>
  )
}
