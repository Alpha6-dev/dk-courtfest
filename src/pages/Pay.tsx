import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Wordmark } from '../components/Wordmark'

type State =
  | { phase: 'loading' }
  | { phase: 'redirect'; url: string; label?: string }
  | { phase: 'paid' }
  | { phase: 'offline'; label?: string; amount?: number }
  | { phase: 'error'; message: string }

// Public payment link for an academy cotisation: /pay/<membership_id>.
// Sent to guardians via WhatsApp; goes straight to Wave/Orange Money checkout.
export default function Pay() {
  const { membershipId } = useParams()
  const [state, setState] = useState<State>({ phase: 'loading' })

  useEffect(() => {
    if (!membershipId) return setState({ phase: 'error', message: 'Lien invalide.' })
    supabase.functions
      .invoke('payment-init', { body: { membership_id: membershipId } })
      .then(({ data, error }) => {
        if (error) throw error
        if (data?.already_paid) return setState({ phase: 'paid' })
        if (data?.url) {
          setState({ phase: 'redirect', url: data.url, label: data.label })
          window.location.href = data.url
          return
        }
        if (data?.configured === false)
          return setState({ phase: 'offline', label: data.label, amount: data.amount_xof })
        throw new Error(data?.error ?? 'Réponse inattendue')
      })
      .catch((e) => setState({ phase: 'error', message: e instanceof Error ? e.message : String(e) }))
  }, [membershipId])

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <Wordmark className="block text-4xl" />
      <div className="mt-10">
        {state.phase === 'loading' && <p className="label text-white/40">Préparation du paiement…</p>}
        {state.phase === 'redirect' && (
          <>
            <p className="font-display text-3xl uppercase text-bone">Redirection vers le paiement…</p>
            <a href={state.url} className="label mt-4 inline-block text-flame">
              Cliquer ici si rien ne se passe →
            </a>
          </>
        )}
        {state.phase === 'paid' && (
          <p className="font-display text-4xl uppercase text-lion">Cotisation déjà réglée ✓</p>
        )}
        {state.phase === 'offline' && (
          <>
            <p className="font-display text-3xl uppercase text-sun">Paiement en ligne bientôt disponible</p>
            <p className="mt-3 text-white/60">
              {state.label} {state.amount ? `· ${state.amount.toLocaleString('fr-FR')} XOF` : ''}
            </p>
            <p className="label mt-4 text-white/40">Réglez en espèces ou par Wave au club.</p>
          </>
        )}
        {state.phase === 'error' && <p className="text-flame">{state.message}</p>}
      </div>
      <Link to="/academy" className="label mt-12 inline-block text-white/40 hover:text-flame">
        ← DK Academy
      </Link>
    </main>
  )
}
