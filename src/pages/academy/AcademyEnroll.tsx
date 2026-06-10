import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../types/db'

// Public enrollment. Guardian fields appear automatically for minors.
export default function AcademyEnroll() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [cats, setCats] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState(params.get('cat') ?? '')
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [dob, setDob] = useState('')
  const [gName, setGName] = useState('')
  const [gPhone, setGPhone] = useState('')
  const [gEmail, setGEmail] = useState('')
  const [medical, setMedical] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('sort')
      .then(({ data }) => {
        const rows = (data as Category[]) ?? []
        setCats(rows)
        if (!categoryId && rows[0]) setCategoryId(rows[0].id)
      })
  }, [])

  const isMinor = useMemo(() => {
    if (!dob) return true
    const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)
    return age < 18
  }, [dob])

  const cat = cats.find((c) => c.id === categoryId)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!first.trim() || !last.trim()) return toast.error('Prénom et nom requis.')
    if (isMinor && !gPhone.trim()) return toast.error('Téléphone du responsable requis pour un mineur.')
    setBusy(true)
    try {
      const { error } = await supabase.rpc('enroll_athlete', {
        p_first: first.trim(),
        p_last: last.trim(),
        p_dob: dob || null,
        p_category_id: categoryId || null,
        p_guardian_name: gName || null,
        p_guardian_phone: gPhone || null,
        p_guardian_email: gEmail || null,
        p_medical: medical || null,
      })
      if (error) throw error
      toast.success('Inscription envoyée ! L\'académie vous recontacte. Jërëjëf.')
      navigate('/academy')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de l\'inscription.')
    } finally {
      setBusy(false)
    }
  }

  const field =
    'w-full border border-white/15 bg-white/5 px-4 py-3 text-bone placeholder:text-white/30 focus:border-flame focus:outline-none'

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/academy" className="label text-white/40 hover:text-flame">
        ← DK Academy
      </Link>
      <h1 className="mt-6 font-display text-5xl uppercase text-bone">
        Inscription <span className="text-flame">académie</span>
      </h1>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <div className="space-y-4">
          <span className="label text-sun">01 · Catégorie</span>
          <select className={field} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {cats.map((c) => (
              <option key={c.id} value={c.id} className="bg-onyx">
                {c.name} · {c.age_min}–{c.age_max} ans · {c.monthly_fee_xof.toLocaleString('fr-FR')} XOF/mois
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <span className="label text-sun">02 · Joueur</span>
          <div className="flex gap-3">
            <input className={field} placeholder="Prénom *" value={first} onChange={(e) => setFirst(e.target.value)} />
            <input className={field} placeholder="Nom *" value={last} onChange={(e) => setLast(e.target.value)} />
          </div>
          <label className="label block text-white/40">Date de naissance</label>
          <input type="date" className={field} value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>

        {isMinor && (
          <div className="space-y-4">
            <span className="label text-sun">03 · Responsable légal</span>
            <input className={field} placeholder="Nom du responsable" value={gName} onChange={(e) => setGName(e.target.value)} />
            <div className="flex gap-3">
              <input className={field} placeholder="Téléphone *" value={gPhone} onChange={(e) => setGPhone(e.target.value)} />
              <input className={field} placeholder="Email" value={gEmail} onChange={(e) => setGEmail(e.target.value)} />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <span className="label text-sun">{isMinor ? '04' : '03'} · Santé</span>
          <textarea className={field} placeholder="Notes médicales (allergies, etc.) — optionnel" value={medical} onChange={(e) => setMedical(e.target.value)} />
        </div>

        {cat && (
          <p className="label text-white/40">
            {cat.name} · {cat.schedule} · <span className="text-sun">{cat.monthly_fee_xof.toLocaleString('fr-FR')} XOF / mois</span>
          </p>
        )}

        <button
          disabled={busy}
          className="w-full bg-flame px-8 py-4 font-display text-3xl uppercase tracking-wide text-onyx transition hover:bg-sun disabled:opacity-50"
        >
          {busy ? 'Envoi…' : 'Envoyer l\'inscription →'}
        </button>
      </form>
    </main>
  )
}
