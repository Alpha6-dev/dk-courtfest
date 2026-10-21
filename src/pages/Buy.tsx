import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wordmark } from '../components/Wordmark'
import { useBrand } from '../lib/brand'
import { track } from '../lib/analytics'
import type { TicketType } from '../types/db'
import { TICKETS, HELLOTIX_URL, QTY_MAX, T, readLang, saveLang, type Lang } from './buy/data'
import { TicketOptions } from './buy/TicketOptions'
import { OrderSummary } from './buy/OrderSummary'
import { PaymentMethods, type Method } from './buy/PaymentMethods'

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
    <main className="mx-auto max-w-5xl px-6 py-10">
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
      <Wordmark className="mt-6 block text-4xl" />
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
      </div>
    </main>
  )
}
