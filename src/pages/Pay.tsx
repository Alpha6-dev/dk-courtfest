import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Copy, Smartphone, CreditCard, MessageCircle, ShieldCheck, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Wordmark } from '../components/Wordmark'

// Public payment link for an academy cotisation: /pay/<membership_id>, sent to
// guardians on WhatsApp. payment-init returns the hosted checkout URL when a
// gateway is live; otherwise the page shows the direct Wave / Orange Money /
// WhatsApp channels. Layout from the AI Studio pass of 21 Oct 2026, reviewed:
// the amount only comes from the membership row, never from a default.

type State =
  | { phase: 'loading' }
  | { phase: 'redirect'; url: string; label?: string }
  | { phase: 'paid'; label?: string; amount?: number }
  | { phase: 'offline'; label?: string; amount?: number }
  | { phase: 'error'; message: string }

type Rail = 'wave' | 'orange_money' | 'whatsapp'

const MERCHANT_PHONE = '+221 77 284 26 50'
const WHATSAPP_DIGITS = '221772842650'
const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`

export default function Pay() {
  const { membershipId } = useParams()
  const [state, setState] = useState<State>({ phase: 'loading' })
  const [rail, setRail] = useState<Rail>('wave')

  useEffect(() => {
    if (!membershipId) {
      setState({ phase: 'error', message: 'Lien de paiement invalide.' })
      return
    }
    supabase.functions
      .invoke('payment-init', { body: { membership_id: membershipId } })
      .then(({ data, error }) => {
        if (error) throw error
        if (data?.already_paid) return setState({ phase: 'paid', label: data.label, amount: data.amount_xof })
        if (data?.url) {
          setState({ phase: 'redirect', url: data.url, label: data.label })
          window.location.href = data.url
          return
        }
        setState({ phase: 'offline', label: data?.label, amount: data?.amount_xof })
      })
      .catch((e) => {
        // The gateway is unreachable: still let the family pay directly, without inventing an amount.
        console.warn('payment-init', e)
        setState({ phase: 'offline' })
      })
  }, [membershipId])

  function copy(text: string, what: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast.success(`${what} copié.`),
      () => toast.error('Copie impossible, note-le à la main.'),
    )
  }

  const code = membershipId ? membershipId.slice(0, 8).toUpperCase() : ''
  const amount = state.phase === 'offline' || state.phase === 'paid' ? state.amount : undefined
  const label = (state.phase === 'offline' || state.phase === 'paid') && state.label ? state.label : 'Cotisation DK Academy'
  const amountText = amount ? fcfa(amount) : 'montant communiqué par le club'
  const waText = `Bonjour DK Academy, je règle la cotisation (${label}, ${amountText}) pour le dossier ${code} par ${
    rail === 'wave' ? 'Wave' : rail === 'orange_money' ? 'Orange Money' : 'WhatsApp'
  }.`
  const waHref = `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(waText)}`

  const railBtn = (active: boolean, color: string) =>
    `flex flex-col items-center justify-center border p-3 text-center transition ${
      active ? `${color} text-bone` : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
    }`

  return (
    <div className="min-h-screen bg-onyx text-bone antialiased">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-onyx/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
          <Link to="/academy" className="group inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50 transition hover:text-flame">
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" aria-hidden="true" />
            <span>DK Academy</span>
          </Link>
          <Wordmark className="text-2xl" />
          <span className="text-xs font-mono text-white/40">Dakar</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        {state.phase === 'loading' && (
          <div role="status" aria-live="polite" className="space-y-4 border border-white/10 bg-white/5 p-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-flame border-t-transparent" aria-hidden="true" />
            <h2 className="font-display text-2xl uppercase tracking-tight text-bone">Chargement de ta cotisation</h2>
            <p className="text-xs text-white/50">Quelques instants.</p>
          </div>
        )}

        {state.phase === 'redirect' && (
          <div className="space-y-4 border border-flame/30 bg-white/5 p-8 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-flame/10 text-flame" aria-hidden="true">
              <CreditCard className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl uppercase text-bone">Redirection vers le paiement</h2>
            <p className="text-xs text-white/60">Si la page ne s'ouvre pas, clique ci-dessous.</p>
            <a href={state.url} className="inline-block bg-flame px-6 py-3 font-display text-lg uppercase text-onyx transition hover:bg-sun">
              Accéder au paiement
            </a>
          </div>
        )}

        {state.phase === 'paid' && (
          <div className="space-y-5 border border-lion/30 bg-white/5 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lion/20 text-lion" aria-hidden="true">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display text-3xl uppercase tracking-tight text-bone">Cotisation déjà réglée</h2>
              <p className="mt-1 text-sm text-white/60">
                {label}
                {amount ? ` · ${fcfa(amount)}` : ''}
              </p>
            </div>
            <dl className="space-y-1.5 border border-white/10 bg-white/5 p-4 text-left text-xs">
              <div className="flex justify-between">
                <dt className="text-white/40">Dossier</dt>
                <dd className="font-mono font-bold text-bone">{code}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/40">Statut</dt>
                <dd className="font-semibold text-lion">Validé</dd>
              </div>
            </dl>
            <Link to="/academy" className="inline-block bg-white/10 px-6 py-3 text-xs font-mono uppercase tracking-wider text-bone hover:bg-white/15">
              Retour à l'académie
            </Link>
          </div>
        )}

        {state.phase === 'offline' && (
          <div className="space-y-6 border border-white/15 bg-white/5 p-6 sm:p-8">
            <div className="border-b border-white/10 pb-5">
              <span className="text-xs font-mono uppercase tracking-wider text-sun">DK Academy · Cotisation</span>
              <h1 className="mt-1 font-display text-3xl uppercase tracking-tight text-bone">{label}</h1>
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <span className="text-xs text-white/50">
                  Dossier : <strong className="font-mono text-bone">{code}</strong>
                </span>
                <span className="font-mono text-2xl font-bold text-flame">{amount ? fcfa(amount) : 'Montant à confirmer'}</span>
              </div>
              {!amount && <p className="mt-2 text-xs text-white/50">Le club te confirme le montant sur WhatsApp avant le transfert.</p>}
            </div>

            <fieldset className="space-y-3">
              <legend className="text-xs font-mono uppercase tracking-wider text-white/60">Choisis ton moyen de paiement</legend>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setRail('wave')} aria-pressed={rail === 'wave'} className={railBtn(rail === 'wave', 'border-lion bg-lion/15')}>
                  <Smartphone className="mb-1 h-5 w-5 text-lion" aria-hidden="true" />
                  <span className="text-xs font-bold">Wave</span>
                </button>
                <button type="button" onClick={() => setRail('orange_money')} aria-pressed={rail === 'orange_money'} className={railBtn(rail === 'orange_money', 'border-flame bg-flame/15')}>
                  <Zap className="mb-1 h-5 w-5 text-flame" aria-hidden="true" />
                  <span className="text-xs font-bold">Orange Money</span>
                </button>
                <button type="button" onClick={() => setRail('whatsapp')} aria-pressed={rail === 'whatsapp'} className={railBtn(rail === 'whatsapp', 'border-lion bg-lion/15')}>
                  <MessageCircle className="mb-1 h-5 w-5 text-lion" aria-hidden="true" />
                  <span className="text-xs font-bold">WhatsApp</span>
                </button>
              </div>

              {(rail === 'wave' || rail === 'orange_money') && (
                <div className="space-y-3 border border-white/15 bg-white/5 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-white/40">Numéro {rail === 'wave' ? 'Wave' : 'Orange Money'}</div>
                      <div className="mt-0.5 font-mono text-lg font-bold text-bone">{MERCHANT_PHONE}</div>
                      <div className="text-xs text-white/50">Mouhamadou Lamine Diop · Alpha 6 Sports</div>
                    </div>
                    <button type="button" onClick={() => copy(MERCHANT_PHONE, 'Numéro')} className="inline-flex items-center gap-1.5 border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-flame hover:bg-white/10">
                      <Copy className="h-3 w-3" aria-hidden="true" />
                      Copier
                    </button>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                    <div>
                      <span className="text-white/40">Référence à mentionner : </span>
                      <span className="font-mono font-bold text-sun">COTIS-{code}</span>
                    </div>
                    <button type="button" onClick={() => copy(`COTIS-${code}`, 'Référence')} className="text-xs text-flame hover:underline">
                      Copier
                    </button>
                  </div>
                </div>
              )}

              {rail === 'whatsapp' && (
                <p className="border border-white/10 bg-white/5 p-4 text-xs text-white/70">Le secrétariat du club te répond sur WhatsApp pour régler la cotisation.</p>
              )}
            </fieldset>

            <div className="space-y-3 pt-2">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 bg-flame px-6 py-4 font-display text-xl uppercase tracking-wider text-onyx transition hover:bg-sun"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Confirmer sur WhatsApp
              </a>
              <div className="flex items-center justify-center gap-2 text-center text-xs text-white/40">
                <ShieldCheck className="h-4 w-4 text-lion" aria-hidden="true" />
                <span>Validation par le club après réception</span>
              </div>
            </div>
          </div>
        )}

        {state.phase === 'error' && (
          <div role="alert" className="space-y-4 border border-flame/40 bg-white/5 p-8 text-center">
            <h2 className="font-display text-2xl uppercase text-flame">Lien invalide</h2>
            <p className="text-xs text-white/60">{state.message}</p>
            <Link to="/academy" className="inline-block bg-white/10 px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-bone hover:bg-white/15">
              Retour
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
