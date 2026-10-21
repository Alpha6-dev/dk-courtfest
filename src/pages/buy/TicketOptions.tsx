import { TICKETS, QTY_MAX, T, xof, type Lang, type TicketOption } from './data'
import type { TicketType } from '../../types/db'

interface Props {
  lang: Lang
  value: TicketType
  onChange: (t: TicketType) => void
  quantity: number
  onQuantity: (q: number) => void
}

// Real radio inputs (keyboard and screen readers get a group for free); the
// visible card is the label. The selected card carries the flame border.
export function TicketOptions({ lang, value, onChange, quantity, onQuantity }: Props) {
  const t = T[lang]
  return (
    <fieldset className="border-0 p-0">
      <legend className="label text-white/50">{t.step1}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {TICKETS.map((o) => (
          <Option key={o.type} lang={lang} option={o} checked={value === o.type} onChange={onChange} />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border border-white/15 bg-white/5 px-4 py-3">
        <span id="qty-label" className="label text-white/70">{t.quantity}</span>
        <div className="flex items-center gap-3" role="group" aria-labelledby="qty-label">
          <button
            type="button"
            onClick={() => onQuantity(quantity - 1)}
            disabled={quantity <= 1}
            aria-label={t.fewer}
            className="h-10 w-10 border border-white/20 font-display text-2xl text-bone transition hover:border-flame disabled:cursor-not-allowed disabled:opacity-40"
          >
            -
          </button>
          <output aria-live="polite" className="w-8 text-center font-display text-3xl text-sun">{quantity}</output>
          <button
            type="button"
            onClick={() => onQuantity(quantity + 1)}
            disabled={quantity >= QTY_MAX}
            aria-label={t.more}
            className="h-10 w-10 border border-white/20 font-display text-2xl text-bone transition hover:border-flame disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm text-white/60">{t.presaleNote}</p>
    </fieldset>
  )
}

function Option({ lang, option, checked, onChange }: { lang: Lang; option: TicketOption; checked: boolean; onChange: (t: TicketType) => void }) {
  const t = T[lang]
  const id = `ticket-${option.type}`
  return (
    <label
      htmlFor={id}
      className={`relative block cursor-pointer border p-4 transition focus-within:ring-2 focus-within:ring-sun ${
        checked ? 'border-flame bg-flame/10' : 'border-white/15 hover:border-white/40'
      }`}
    >
      <input id={id} type="radio" name="ticket" value={option.type} checked={checked} onChange={() => onChange(option.type)} className="sr-only" />
      <div className="flex items-start justify-between gap-3">
        <span className="font-display text-3xl uppercase leading-none text-bone">{option.label}</span>
        <span className="label bg-sun px-2 py-1 text-onyx">
          {t.presaleBadge} {option.presale.toLocaleString('fr-FR')}
        </span>
      </div>
      <div className="mt-3 font-display text-2xl text-sun">{xof(option.price)}</div>
      <p className="mt-1 pr-16 text-sm text-white/70">{option.blurb[lang]}</p>
      {checked && <span className="label absolute bottom-4 right-4 text-flame">{t.chosen}</span>}
    </label>
  )
}
