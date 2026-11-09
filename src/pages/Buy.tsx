import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useBrand } from '../lib/brand'
import { track } from '../lib/analytics'
import type { TicketType } from '../types/db'
import { TICKETS, HELLOTIX_URL, QTY_MAX, T, xof, orderTotal, readLang, saveLang, type Lang } from './buy/data'
import { TicketOptions } from './buy/TicketOptions'
import { OrderSummary } from './buy/OrderSummary'
import { PaymentMethods, type Method } from './buy/PaymentMethods'

// The same type and colours as the landing pages (Anton, Archivo, the landing orange),
// applied to this page only; the rest of the app keeps its own theme.
const SCOPE = {
  fontFamily: 'var(--font-body)',
  '--font-display': '"Anton", sans-serif',
  '--font-body': '"Archivo", sans-serif',
  '--font-mono': '"Archivo", sans-serif',
  '--color-flame': '#FF6A1A',
  '--color-sun': '#F6B43C',
  '--color-onyx': '#0B0B0C',
  '--color-bone': '#F4EFE7',
} as CSSProperties

// Ticket checkout: choose, identify, pay. Wave and card go through the
// Hello-Tix checkout; Orange Money is a transfer confirmed on WhatsApp (PAYMENTS.md).
export default function Buy() {
  const { eventName } = useBrand()
  const [lang, setLang] = useState<Lang>(readLang)
  const [type, setType] = useState<TicketType>('general')
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [method, setMethod] = useState<Method | null>(null)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  const t = T[lang]
  const ticket = TICKETS.find((o) => o.type === type)!
  const total = ticket.price * quantity

  function toggleLang() {
    const next: Lang = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
    saveLang(next)
  }

  function pick(m: Method) {
    const next: typeof errors = {}
    if (!name.trim()) next.name = t.nameError
    if (!/\d{7,}/.test(phone.replace(/\s/g, ''))) next.phone = t.phoneError
    setErrors(next)
    if (next.name || next.phone) {
      setMethod(null)
      document.getElementById(next.name ? 'buyer-name' : 'buyer-phone')?.focus()
      return
    }
    setMethod(m)
    track(m === 'hellotix' ? 'buy_hellotix' : 'buy_orange_money', { type, quantity })
    if (m === 'hellotix') window.open(HELLOTIX_URL, '_blank', 'noopener')
  }

  const field = (bad: boolean) =>
    `w-full border bg-white/5 px-4 py-3 text-bone placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-sun ${
      bad ? 'border-flame' : 'border-white/15'
    }`

  return (
    <main style={SCOPE} className="mx-auto max-w-5xl px-6 py-10 pb-32 lg:pb-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="label text-white/40 hover:text-flame">
          {t.back}
        </Link>
        <button
          type="button"
          onClick={toggleLang}
          aria-label={t.langAria}
          className="label border border-white/20 px-3 py-1 text-white/70 transition hover:border-flame hover:text-flame"
        >
          {t.langSwitch}
        </button>
      </div>
      <Link to="/" aria-label="Courtfest Basketball" className="mt-6 inline-flex items-baseline gap-[10px] text-bone focus:outline-none focus:ring-2 focus:ring-sun">
        <span className="font-display text-[28px] leading-none tracking-[0.04em]">COURTFEST</span>
        <span className="rounded-[3px] bg-flame px-2 py-[3px] text-[11px] font-bold leading-none tracking-[0.22em] text-onyx">BASKETBALL</span>
      </Link>
      <p className="label mt-6 text-white/50">{t.eyebrow}</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none text-bone sm:text-6xl">
        {t.title} <span className="text-flame">{t.titleAccent}</span>
      </h1>
      <p className="mt-3 max-w-xl text-lg text-white/70">{t.lede}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          <TicketOptions
            lang={lang}
            value={type}
            onChange={(v) => { setType(v); setMethod(null) }}
            quantity={quantity}
            onQuantity={(q) => { setQuantity(Math.min(QTY_MAX, Math.max(1, q))); setMethod(null) }}
          />

          <section aria-labelledby="who-title" className="space-y-4">
            <h2 id="who-title" className="label text-white/50">{t.step2}</h2>
            <div>
              <label htmlFor="buyer-name" className="label block text-white/70">{t.name}</label>
              <input
                id="buyer-name"
                className={`mt-2 ${field(!!errors.name)}`}
                placeholder={t.namePlaceholder}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'buyer-name-err' : undefined}
              />
              {errors.name && <p id="buyer-name-err" role="alert" className="mt-1 text-sm text-flame">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="buyer-phone" className="label block text-white/70">{t.phone}</label>
              <input
                id="buyer-phone"
                type="tel"
                inputMode="tel"
                className={`mt-2 ${field(!!errors.phone)}`}
                placeholder="77 000 00 00"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'buyer-phone-err' : undefined}
              />
              {errors.phone && <p id="buyer-phone-err" role="alert" className="mt-1 text-sm text-flame">{errors.phone}</p>}
            </div>
          </section>

          <PaymentMethods
            lang={lang}
            ticket={ticket}
            quantity={quantity}
            eventName={eventName}
            name={name.trim()}
            phone={phone.trim()}
            method={method}
            onPick={pick}
          />
        </div>

        <OrderSummary lang={lang} ticket={ticket} quantity={quantity} />

        <div role="region" aria-label={t.summary} className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-onyx/95 px-6 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-display text-xl uppercase leading-none text-bone">
                {quantity > 1 ? `${quantity} ${t.tickets} ${ticket.label}` : `${t.ticket} ${ticket.label}`}
              </p>
              <p className="mt-1 font-display text-2xl leading-none text-sun">{xof(total)}</p>
            </div>
            <a
              href="#pay-title"
              className="inline-flex h-11 shrink-0 items-center bg-flame px-5 font-display text-xl uppercase tracking-wide text-onyx transition hover:bg-sun focus:outline-none focus:ring-2 focus:ring-sun"
            >
              {t.payNow}
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
