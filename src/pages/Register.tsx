import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Trash2, ShieldCheck, Trophy, Globe } from 'lucide-react'
import { Wordmark } from '../components/Wordmark'
import { supabase } from '../lib/supabase'
import { getActiveEdition, type Edition } from '../lib/edition'
import { useBrand } from '../lib/brand'
import type { Division, PlayerDraft } from '../types/db'

// Team registration (layout from the AI Studio pass of 21 Oct 2026, reviewed):
// format and category, captain, roster, FR/EN toggle shared with /buy via cf_lang.

const emptyPlayer = (): PlayerDraft => ({ first_name: '', last_name: '', jersey_no: '', position: '' })

type Lang = 'fr' | 'en'

const CATEGORIES = [
  { id: 'open', fr: 'Open Hommes (Élite)', en: 'Open Men (Elite)' },
  { id: 'women', fr: 'Open Femmes', en: 'Open Women' },
  { id: 'u18', fr: 'Jeunes U18', en: 'Youth U18' },
  { id: 'veterans', fr: 'Vétérans (35+)', en: 'Veterans (35+)' },
]

function formatEventDate(iso: string | null | undefined, lang: Lang) {
  if (!iso) return null
  const raw = new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export default function Register() {
  const navigate = useNavigate()
  const { eventName, city } = useBrand()
  const [lang, setLang] = useState<Lang>('fr')
  const [edition, setEdition] = useState<Edition | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [division, setDivision] = useState<Division>('3x3')
  const [category, setCategory] = useState('open')
  const [captainName, setCaptainName] = useState('')
  const [captainPhone, setCaptainPhone] = useState('')
  const [captainEmail, setCaptainEmail] = useState('')
  const [players, setPlayers] = useState<PlayerDraft[]>([emptyPlayer(), emptyPlayer(), emptyPlayer()])

  useEffect(() => {
    getActiveEdition().then(setEdition)
    try {
      const saved = localStorage.getItem('cf_lang')
      if (saved === 'en' || saved === 'fr') setLang(saved)
    } catch {
      /* storage unavailable */
    }
  }, [])

  function toggleLang() {
    const next: Lang = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
    try {
      localStorage.setItem('cf_lang', next)
    } catch {
      /* storage unavailable */
    }
  }

  const minPlayers = division === '3x3' ? 3 : 5

  function handleDivisionChange(div: Division) {
    setDivision(div)
    const required = div === '3x3' ? 3 : 5
    if (players.length < required) {
      const added = Array.from({ length: required - players.length }, () => emptyPlayer())
      setPlayers((prev) => [...prev, ...added])
    }
  }

  function setPlayer(i: number, patch: Partial<PlayerDraft>) {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }

  function addPlayer() {
    if (players.length >= 10) {
      toast.error(lang === 'fr' ? 'Maximum 10 joueurs par équipe.' : 'Maximum 10 players per team.')
      return
    }
    setPlayers((prev) => [...prev, emptyPlayer()])
  }

  function removePlayer(idx: number) {
    if (players.length <= minPlayers) {
      toast.error(
        lang === 'fr'
          ? `Minimum ${minPlayers} joueurs requis pour le ${division}.`
          : `Minimum ${minPlayers} players required for ${division}.`,
      )
      return
    }
    setPlayers((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!edition) {
      toast.error(lang === 'fr' ? 'Aucune édition active. Réessaie plus tard.' : 'No active edition. Try again later.')
      return
    }
    if (!name.trim()) {
      toast.error(lang === 'fr' ? "Nom de l'équipe requis." : 'Team name required.')
      return
    }
    if (!captainName.trim() || !captainPhone.trim()) {
      toast.error(lang === 'fr' ? 'Nom et téléphone du capitaine requis.' : 'Captain name and phone required.')
      return
    }
    const named = players.filter((p) => p.first_name.trim() && p.last_name.trim())
    if (named.length < minPlayers) {
      toast.error(
        lang === 'fr'
          ? `Renseigne au moins ${minPlayers} joueurs avec prénom et nom.`
          : `Enter at least ${minPlayers} players with first and last names.`,
      )
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.rpc('register_team', {
        p_edition_id: edition.id,
        p_name: name.trim(),
        p_division: division,
        p_category: category || null,
        p_captain_name: captainName.trim(),
        p_captain_phone: captainPhone.trim(),
        p_captain_email: captainEmail.trim() || null,
        p_players: named.map((p) => ({
          first_name: p.first_name.trim(),
          last_name: p.last_name.trim(),
          jersey_no: p.jersey_no.trim() || '',
          position: p.position.trim() || '',
        })),
      })
      if (error) throw error
      toast.success(
        lang === 'fr'
          ? 'Équipe inscrite. On te recontacte sur WhatsApp pour la confirmation.'
          : 'Team registered. We will contact you on WhatsApp to confirm.',
      )
      navigate('/')
    } catch (err) {
      // Never pretend it worked: the team is not in the database.
      console.error('register_team', err)
      toast.error(
        (lang === 'fr' ? "Échec de l'inscription. " : 'Registration failed. ') +
          (err instanceof Error ? err.message : ''),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const eventDate = formatEventDate(edition?.event_date, lang)
  const t = {
    back: lang === 'fr' ? 'Retour' : 'Back',
    title: lang === 'fr' ? 'Inscrire une équipe' : 'Register a team',
    subtitle: [lang === 'fr' ? `Tournois ${eventName}` : `${eventName} tournaments`, eventDate, city].filter(Boolean).join(' · '),
    step1: lang === 'fr' ? '1 · Format et catégorie' : '1 · Format and category',
    teamName: lang === 'fr' ? "Nom de l'équipe" : 'Team name',
    teamPlaceholder: lang === 'fr' ? 'Ex. Dakar Ballers' : 'e.g. Dakar Ballers',
    categoryLabel: lang === 'fr' ? 'Catégorie' : 'Category',
    step2: lang === 'fr' ? '2 · Capitaine et contact' : '2 · Captain and contact',
    captainName: lang === 'fr' ? 'Prénom et nom du capitaine' : 'Captain full name',
    captainPhone: lang === 'fr' ? 'Téléphone WhatsApp' : 'WhatsApp phone',
    captainEmail: lang === 'fr' ? 'Email (optionnel)' : 'Email (optional)',
    step3: lang === 'fr' ? '3 · Liste des joueurs' : '3 · Player roster',
    listed: lang === 'fr' ? 'inscrits' : 'listed',
    addPlayer: lang === 'fr' ? '+ Ajouter un joueur' : '+ Add a player',
    firstName: lang === 'fr' ? 'Prénom' : 'First name',
    lastName: lang === 'fr' ? 'Nom' : 'Last name',
    remove: lang === 'fr' ? 'Retirer le joueur' : 'Remove player',
    minNote:
      lang === 'fr'
        ? `Format ${division} : minimum ${minPlayers} joueurs avec prénom et nom.`
        : `${division} format: minimum ${minPlayers} players with first and last name.`,
    submit: lang === 'fr' ? "Valider l'inscription" : 'Submit the registration',
    submitting: lang === 'fr' ? 'Enregistrement...' : 'Registering...',
    reassurance: lang === 'fr' ? 'Inscription officielle · Tirage des poules communiqué sur WhatsApp' : 'Official registration · Brackets announced on WhatsApp',
    selected: lang === 'fr' ? 'Format choisi' : 'Selected',
    half: lang === 'fr' ? 'Demi-terrain · min. 3 joueurs' : 'Half court · min. 3 players',
    full: lang === 'fr' ? 'Plein terrain · min. 5 joueurs' : 'Full court · min. 5 players',
  }

  const field =
    'w-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-bone placeholder:text-white/30 transition focus:border-flame focus:outline-none focus:ring-2 focus:ring-sun'

  return (
    <div className="min-h-screen bg-onyx text-bone antialiased">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-onyx/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link to="/" className="group inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50 transition hover:text-flame">
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" aria-hidden="true" />
            <span>{t.back}</span>
          </Link>
          <Wordmark className="text-2xl" />
          <button
            type="button"
            onClick={toggleLang}
            aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
            className="inline-flex items-center gap-1.5 border border-white/20 bg-white/5 px-3 py-1 text-xs font-mono uppercase text-white/80 transition hover:border-flame hover:text-flame"
          >
            <Globe className="h-3 w-3" aria-hidden="true" />
            <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-sun">
            <Trophy className="h-3.5 w-3.5 text-flame" aria-hidden="true" />
            <span>Tournois 3×3 et 5×5</span>
          </div>
          <h1 className="font-display text-4xl uppercase tracking-tight text-bone sm:text-5xl">{t.title}</h1>
          <p className="mt-2 text-sm text-white/60">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-sun">{t.step1}</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['3x3', '5x5'] as Division[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDivisionChange(d)}
                  aria-pressed={division === d}
                  className={`flex flex-col justify-between border p-4 text-left transition ${
                    division === d ? 'border-flame bg-flame/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="font-display text-2xl uppercase tracking-tight text-bone">{d === '3x3' ? 'Tournoi 3×3' : 'Tournoi 5×5'}</div>
                    <p className="mt-1 text-xs text-white/60">{d === '3x3' ? t.half : t.full}</p>
                  </div>
                  {division === d && <span className="mt-3 text-xs font-bold text-flame">{t.selected}</span>}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="team-name" className="mb-1 block text-xs text-white/60">{t.teamName}</label>
              <input id="team-name" type="text" required placeholder={t.teamPlaceholder} value={name} onChange={(e) => setName(e.target.value)} className={field} />
            </div>

            <fieldset>
              <legend className="mb-1 block text-xs text-white/60">{t.categoryLabel}</legend>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    aria-pressed={category === cat.id}
                    className={`border px-3 py-2.5 text-left text-xs transition ${
                      category === cat.id ? 'border-sun bg-sun/15 font-semibold text-bone' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    }`}
                  >
                    {lang === 'fr' ? cat.fr : cat.en}
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-sun">{t.step2}</h2>
            <div>
              <label htmlFor="captain-name" className="mb-1 block text-xs text-white/60">{t.captainName}</label>
              <input id="captain-name" type="text" required autoComplete="name" value={captainName} onChange={(e) => setCaptainName(e.target.value)} className={field} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="captain-phone" className="mb-1 block text-xs text-white/60">{t.captainPhone}</label>
                <input id="captain-phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="77 000 00 00" value={captainPhone} onChange={(e) => setCaptainPhone(e.target.value)} className={field} />
              </div>
              <div>
                <label htmlFor="captain-email" className="mb-1 block text-xs text-white/60">{t.captainEmail}</label>
                <input id="captain-email" type="email" autoComplete="email" placeholder="capitaine@exemple.com" value={captainEmail} onChange={(e) => setCaptainEmail(e.target.value)} className={field} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-wider text-sun">
                {t.step3} ({players.length} {t.listed})
              </h2>
              <button type="button" onClick={addPlayer} className="text-xs font-mono text-flame transition hover:text-sun">
                {t.addPlayer}
              </button>
            </div>
            <div className="space-y-2.5">
              {players.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center font-mono text-xs text-white/40" aria-hidden="true">{i + 1}</span>
                  <input type="text" required={i < minPlayers} aria-label={`${t.firstName} ${i + 1}`} placeholder={t.firstName} value={p.first_name} onChange={(e) => setPlayer(i, { first_name: e.target.value })} className={`${field} flex-1 px-3 py-2.5`} />
                  <input type="text" required={i < minPlayers} aria-label={`${t.lastName} ${i + 1}`} placeholder={t.lastName} value={p.last_name} onChange={(e) => setPlayer(i, { last_name: e.target.value })} className={`${field} flex-1 px-3 py-2.5`} />
                  <input type="text" aria-label={`N° ${i + 1}`} placeholder="N°" value={p.jersey_no} onChange={(e) => setPlayer(i, { jersey_no: e.target.value })} className={`${field} w-14 px-2 py-2.5 text-center font-mono`} />
                  {players.length > minPlayers && (
                    <button type="button" onClick={() => removePlayer(i)} aria-label={`${t.remove} ${i + 1}`} className="p-2 text-white/40 transition hover:text-flame">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="pt-1 text-xs text-white/50">{t.minNote}</p>
          </section>

          <div className="space-y-4 border-t border-white/10 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-flame px-6 py-4 font-display text-2xl uppercase tracking-wider text-onyx transition hover:bg-sun disabled:opacity-50"
            >
              {submitting ? t.submitting : t.submit}
            </button>
            <div className="flex items-center justify-center gap-2 text-center text-xs text-white/40">
              <ShieldCheck className="h-4 w-4 text-lion" aria-hidden="true" />
              <span>{t.reassurance}</span>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
