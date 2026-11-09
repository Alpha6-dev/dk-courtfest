import { useEffect, useRef, useState, type ReactNode } from 'react'
import { track } from '../../lib/analytics'
import { GROUP_MIN, HELLOTIX_URL, ORANGE_MONEY_HOLDER, ORANGE_MONEY_NUMBER, WHATSAPP_DIGITS, orderTotal, T, xof, type Lang, type TicketOption } from './data'

export type Method = 'hellotix' | 'orange'

interface Props {
  lang: Lang
  ticket: TicketOption
  quantity: number
  eventName: string
  name: string
  phone: string
  method: Method | null
  onPick: (m: Method) => void
}

export function PaymentMethods({ lang, ticket, quantity, eventName, name, phone, method, onPick }: Props) {
  const t = T[lang]
  const total = orderTotal(ticket.price, quantity)
  const priceNotes = [quantity >= GROUP_MIN ? t.waGroup : null, ticket.presale !== undefined ? t.waPresale : null].filter(Boolean).join(', ')
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (method === 'orange') panelRef.current?.focus()
  }, [method])

  const waText = [
    `${t.waIntro} ${quantity} ${quantity > 1 ? t.waTickets : t.waTicket} ${ticket.label} ${t.waFor} ${eventName}.`,
    `${t.waName} : ${name}`,
    `${t.waPhone} : ${phone}`,
    `${t.waPay} ${ORANGE_MONEY_NUMBER} (${xof(total)}${priceNotes ? `, ${priceNotes}` : ''}).`,
    t.waProof,
  ].join('\n')
  const waHref = `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(waText)}`

  const card = (active: boolean, disabled = false) =>
    `block w-full border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-sun ${
      disabled ? 'cursor-not-allowed border-white/10 opacity-50' : active ? 'border-flame bg-flame/10' : 'border-white/15 hover:border-white/40'
    }`

  return (
    <section aria-labelledby="pay-title">
      <h2 id="pay-title" className="label text-white/50">{t.step3}</h2>
      <div className="mt-3 grid gap-3">
        <button type="button" onClick={() => onPick('hellotix')} disabled={!HELLOTIX_URL} aria-describedby="hellotix-note" className={card(method === 'hellotix', !HELLOTIX_URL)}>
          <span className="font-display text-2xl uppercase text-bone">{t.waveCard}</span>
          <span id="hellotix-note" className="mt-1 block text-sm text-white/70">{HELLOTIX_URL ? t.waveOn : t.waveOff}</span>
        </button>

        <button type="button" onClick={() => onPick('orange')} className={card(method === 'orange')}>
          <span className="font-display text-2xl uppercase text-bone">{t.orange}</span>
          <span className="mt-1 block text-sm text-white/70">{t.orangeNote}</span>
        </button>
      </div>

      {method === 'orange' && (
        <div ref={panelRef} tabIndex={-1} className="mt-4 border border-flame/50 bg-flame/5 p-5 focus:outline-none">
          <ol className="space-y-4">
            <Step n={1} title={t.sendTitle}>
              <span className="font-display text-2xl text-sun">{xof(total)}</span> {t.sendBy}{' '}
              <span className="font-mono text-bone">{ORANGE_MONEY_NUMBER}</span> <CopyNumber lang={lang} /> ({ORANGE_MONEY_HOLDER}). {t.presaleCheck}
            </Step>
            <Step n={2} title={t.confirmTitle}>
              {t.confirmBody} {name}.
            </Step>
          </ol>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('buy_orange_money_whatsapp', { type: ticket.type, quantity })}
            className="mt-5 block bg-flame px-6 py-4 text-center font-display text-2xl uppercase tracking-wide text-onyx transition hover:bg-sun focus:outline-none focus:ring-2 focus:ring-sun"
          >
            {t.confirmBtn}
          </a>
        </div>
      )}
      <p className="mt-6 text-sm text-white/60">
        {t.help}{' '}
        <a
          href={`https://wa.me/${WHATSAPP_DIGITS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-bone underline underline-offset-4 hover:text-flame focus:outline-none focus:ring-2 focus:ring-sun"
        >
          {t.helpLink}
        </a>
      </p>
    </section>
  )
}

// Copies the Orange Money number without spaces, ready to paste into the payment app.
function CopyNumber({ lang }: { lang: Lang }) {
  const t = T[lang]
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(ORANGE_MONEY_NUMBER.replace(/\s/g, ''))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable: the number stays visible to copy by hand */
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="ml-1 inline-flex h-11 items-center border border-white/25 px-3 text-xs text-bone transition hover:border-flame focus:outline-none focus:ring-2 focus:ring-sun"
      >
        {t.copy}
      </button>
      <span role="status" aria-live="polite" className="ml-2 text-xs text-sun">
        {copied ? t.copied : ''}
      </span>
    </>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center border border-sun font-display text-xl text-sun">
        {n}
      </span>
      <div>
        <p className="font-display text-xl uppercase text-bone">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-white/80">{children}</p>
      </div>
    </li>
  )
}
