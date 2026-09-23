import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Wordmark } from '../components/Wordmark'
import { supabase } from '../lib/supabase'
import { track } from '../lib/analytics'
import { getActiveEdition, type Edition } from '../lib/edition'
import type { RosterCategory } from '../types/db'

// Public registration for the active edition: one player, one category, written
// to the rosters table through the register_player RPC (migration 0015). This
// mirrors how the event is organised (one game per category) and how the
// WhatsApp community groups are set up. Full teams use /register/equipe.
const CATEGORIES: { value: RosterCategory; label: string; hint: string }[] = [
  { value: 'elite_men', label: 'Hommes élite', hint: 'Elite Men’s game' },
  { value: 'elite_women', label: 'Femmes élite', hint: 'Elite Women’s game' },
  { value: 'veterans', label: 'Vétérans et célébrités', hint: 'Veterans / Celebrity game' },
  { value: 'youth', label: 'Jeunes · La Relève', hint: 'Youth game' },
]
const POSITIONS = ['Meneur', 'Arrière', 'Ailier', 'Ailier fort', 'Pivot']

function eventDate(edition: Edition | null): string {
  if (!edition?.event_date) return ''
  const d = new Date(edition.event_date + 'T12:00:00')
  const weekday = d.toLocaleDateString('fr-FR', { weekday: 'long' })
  const day = d.getDate() === 1 ? '1er' : String(d.getDate())
  const month = d.toLocaleDateString('fr-FR', { month: 'long' })
  return `${weekday} ${day} ${month} ${d.getFullYear()}`
}

export default function Register() {
  const [edition, setEdition] = useState<Edition | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ name: string; category: string } | null>(null)

  const [category, setCategory] = useState<RosterCategory | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [position, setPosition] = useState('')
  const [club, setClub] = useState('')

  useEffect(() => {
    getActiveEdition().then(setEdition)
  }, [])

  function reset() {
    setDone(null)
    setCategory(null)
    setFullName('')
    setPhone('')
    setBirthYear('')
    setPosition('')
    setClub('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!edition) return toast.error('Aucune édition active. Réessayez plus tard.')
    if (!category) return toast.error('Choisis ta catégorie.')
    if (fullName.trim().length < 2) return toast.error('Ton nom complet est requis.')
    if (phone.replace(/\D/g, '').length < 9) return toast.error('Un numéro WhatsApp valide est requis.')
    if (category === 'youth' && !/^(19|20)\d{2}$/.test(birthYear.trim())) return toast.error("L'année de naissance est requise pour les jeunes.")

    const notes = [
      position && `Poste : ${position}`,
      club.trim() && `Club / quartier : ${club.trim()}`,
      birthYear.trim() && `Année de naissance : ${birthYear.trim()}`,
    ]
      .filter(Boolean)
      .join(' · ')

    setSubmitting(true)
    try {
      const { error } = await supabase.rpc('register_player', {
        p_edition_id: edition.id,
        p_category: category,
        p_full_name: fullName.trim(),
        p_phone: phone.trim(),
        p_notes: notes || null,
      })
      if (error) throw error
      track('player_register', { category })
      const label = CATEGORIES.find((c) => c.value === category)?.label ?? category
      setDone({ name: fullName.trim(), category: label })
    } catch (err) {
      console.error(err)
      toast.error("Échec de l'inscription. " + (err instanceof Error ? err.message : ''))
    } finally {
      setSubmitting(false)
    }
  }

  const fieldCls =
    'w-full bg-white/5 border border-white/15 px-4 py-3 text-bone placeholder:text-white/30 focus:border-flame focus:outline-none'
  const dateLine = eventDate(edition)

  if (done) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Wordmark className="block text-4xl" />
        <h1 className="mt-8 font-display text-5xl uppercase text-bone">
          C’est noté, <span className="text-flame">{done.name.split(' ')[0]}</span>.
        </h1>
        <p className="mt-4 text-lg text-white/70">
          Tu es inscrit(e) dans la catégorie <span className="text-sun">{done.category}</span> pour {edition?.name ?? 'Courtfest'}
          {dateLine ? `, ${dateLine}` : ''}, à Dakar. On te confirme ta place sur WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={reset} className="bg-flame px-6 py-3 font-display text-2xl uppercase text-onyx hover:bg-sun">
            Inscrire un autre joueur
          </button>
          <Link to="/buy" className="border border-white/20 px-6 py-3 font-display text-2xl uppercase text-bone hover:border-flame">
            Billets pour tes supporters
          </Link>
          <Link to="/evenements" className="label self-center text-white/40 hover:text-flame">
            Retour au site
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/evenements" className="label text-white/40 hover:text-flame">
        Retour
      </Link>
      <Wordmark className="mt-6 block text-4xl" />
      <h1 className="mt-6 font-display text-5xl uppercase text-bone">
        Je <span className="text-flame">joue</span>
      </h1>
      <p className="mt-2 text-white/60">
        {edition ? edition.name : 'Courtfest'}
        {dateLine ? ` · ${dateLine}` : ''} · Dakar · toute la journée. Une inscription par joueur, dans une catégorie. Place confirmée sur WhatsApp.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div className="space-y-4">
          <span className="label text-sun">01 · Catégorie</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`border px-4 py-4 text-left transition ${
                  category === c.value ? 'border-flame bg-flame/10' : 'border-white/15 hover:border-white/40'
                }`}
              >
                <div className="font-display text-2xl uppercase text-bone">{c.label}</div>
                <div className="label text-white/40">{c.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <span className="label text-sun">02 · Toi</span>
          <input className={fieldCls} placeholder="Nom complet *" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          <input
            className={fieldCls}
            placeholder="Numéro WhatsApp * (ex. 77 123 45 67)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
          <div className="flex gap-3">
            <select value={position} onChange={(e) => setPosition(e.target.value)} className={fieldCls}>
              <option value="" className="bg-onyx">
                Poste (optionnel)
              </option>
              {POSITIONS.map((p) => (
                <option key={p} value={p} className="bg-onyx">
                  {p}
                </option>
              ))}
            </select>
            <input
              className={`${fieldCls} w-40`}
              placeholder={category === 'youth' ? 'Année de naissance *' : 'Année de naissance'}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <input className={fieldCls} placeholder="Club ou quartier (optionnel)" value={club} onChange={(e) => setClub(e.target.value)} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-flame px-8 py-4 font-display text-3xl uppercase tracking-wide text-onyx transition hover:bg-sun disabled:opacity-50"
        >
          {submitting ? 'Envoi…' : 'Je m’inscris'}
        </button>
      </form>

      <p className="mt-8 text-sm text-white/50">
        Vous venez en équipe complète (3×3 ou 5×5) ?{' '}
        <Link to="/register/equipe" className="text-sun hover:text-flame">
          Inscrire une équipe
        </Link>
        . Les open runs restent gratuits et ouverts à tous ; les places par catégorie sont confirmées par l’organisation.
      </p>
    </main>
  )
}
