import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Wordmark } from '../components/Wordmark'
import { supabase } from '../lib/supabase'
import { getActiveEdition, type Edition } from '../lib/edition'
import type { Division, PlayerDraft } from '../types/db'

// Team registration (3x3 or 5x5 roster with a captain), kept for groups that
// come as a full team. Individual players register by category on /register.
const emptyPlayer = (): PlayerDraft => ({ first_name: '', last_name: '', jersey_no: '', position: '' })

export default function RegisterTeam() {
  const navigate = useNavigate()
  const [edition, setEdition] = useState<Edition | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [division, setDivision] = useState<Division>('5x5')
  const [category, setCategory] = useState('')
  const [captainName, setCaptainName] = useState('')
  const [captainPhone, setCaptainPhone] = useState('')
  const [captainEmail, setCaptainEmail] = useState('')
  const [players, setPlayers] = useState<PlayerDraft[]>([emptyPlayer(), emptyPlayer(), emptyPlayer(), emptyPlayer(), emptyPlayer()])

  useEffect(() => {
    getActiveEdition().then(setEdition)
  }, [])

  function setPlayer(i: number, patch: Partial<PlayerDraft>) {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!edition) return toast.error('Aucune édition active. Réessayez plus tard.')
    if (!name || !captainName || !captainPhone) return toast.error('Champs requis manquants.')

    const named = players.filter((p) => p.first_name.trim() && p.last_name.trim())
    const min = division === '3x3' ? 3 : 5
    if (named.length < min) return toast.error(`Minimum ${min} joueurs pour le ${division}.`)

    setSubmitting(true)
    try {
      const { error } = await supabase.rpc('register_team', {
        p_edition_id: edition.id,
        p_name: name,
        p_division: division,
        p_category: category || null,
        p_captain_name: captainName,
        p_captain_phone: captainPhone,
        p_captain_email: captainEmail || null,
        p_players: named.map((p) => ({
          first_name: p.first_name.trim(),
          last_name: p.last_name.trim(),
          jersey_no: p.jersey_no || '',
          position: p.position || '',
        })),
      })
      if (error) throw error

      toast.success('Équipe inscrite ! On vous recontacte. Bu nekk fi.')
      navigate('/')
    } catch (err) {
      console.error(err)
      toast.error("Échec de l'inscription. " + (err instanceof Error ? err.message : ''))
    } finally {
      setSubmitting(false)
    }
  }

  const fieldCls =
    'w-full bg-white/5 border border-white/15 px-4 py-3 text-bone placeholder:text-white/30 focus:border-flame focus:outline-none'

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/register" className="label text-white/40 hover:text-flame">
        Inscription individuelle
      </Link>
      <Wordmark className="mt-6 block text-4xl" />
      <h1 className="mt-6 font-display text-5xl uppercase text-bone">
        Inscription <span className="text-flame">équipe</span>
      </h1>
      <p className="mt-2 text-white/60">Pour les groupes qui viennent en équipe complète. Un joueur seul s'inscrit par catégorie sur la page précédente.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div className="space-y-4">
          <span className="label text-sun">01 · Équipe</span>
          <input className={fieldCls} placeholder="Nom de l'équipe *" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex gap-3">
            {(['3x3', '5x5'] as Division[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDivision(d)}
                className={`flex-1 border px-4 py-3 font-display text-2xl uppercase transition ${
                  division === d ? 'border-flame bg-flame text-onyx' : 'border-white/15 text-bone'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <input className={fieldCls} placeholder="Catégorie (ex. U18, Open, Femmes)" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>

        <div className="space-y-4">
          <span className="label text-sun">02 · Capitaine</span>
          <input className={fieldCls} placeholder="Nom complet *" value={captainName} onChange={(e) => setCaptainName(e.target.value)} />
          <div className="flex gap-3">
            <input className={fieldCls} placeholder="Téléphone *" value={captainPhone} onChange={(e) => setCaptainPhone(e.target.value)} />
            <input className={fieldCls} placeholder="Email" value={captainEmail} onChange={(e) => setCaptainEmail(e.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="label text-sun">03 · Joueurs</span>
            <button type="button" onClick={() => setPlayers((p) => [...p, emptyPlayer()])} className="label text-flame hover:text-sun">
              + Ajouter
            </button>
          </div>
          {players.map((p, i) => (
            <div key={i} className="flex gap-3">
              <input className={fieldCls} placeholder={`Prénom ${i + 1}`} value={p.first_name} onChange={(e) => setPlayer(i, { first_name: e.target.value })} />
              <input className={fieldCls} placeholder="Nom" value={p.last_name} onChange={(e) => setPlayer(i, { last_name: e.target.value })} />
              <input className={`${fieldCls} w-20`} placeholder="#" value={p.jersey_no} onChange={(e) => setPlayer(i, { jersey_no: e.target.value })} />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-flame px-8 py-4 font-display text-3xl uppercase tracking-wide text-onyx transition hover:bg-sun disabled:opacity-50"
        >
          {submitting ? 'Envoi…' : 'Inscrire l’équipe'}
        </button>
      </form>
    </main>
  )
}
