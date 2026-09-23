import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { getActiveEdition, type Edition } from '../../lib/edition'
import type { Roster, RosterCategory, RosterStatus } from '../../types/db'

// Players registered by category for the active edition (WhatsApp community
// groups or manual entries), separate from the teams of /register.
const CATEGORIES: { value: RosterCategory; label: string }[] = [
  { value: 'elite_men', label: 'Hommes élite' },
  { value: 'elite_women', label: 'Femmes élite' },
  { value: 'veterans', label: 'Vétérans / célébrités' },
  { value: 'youth', label: 'Jeunes (La Relève)' },
  { value: 'open', label: 'Open' },
]
const STATUSES: RosterStatus[] = ['registered', 'confirmed', 'withdrawn']
const STATUS_LABEL: Record<RosterStatus, string> = { registered: 'inscrit', confirmed: 'confirmé', withdrawn: 'retiré' }

const blank = { category: 'elite_men' as RosterCategory, full_name: '', phone: '' }

export default function Rosters() {
  const [edition, setEdition] = useState<Edition | null>(null)
  const [rows, setRows] = useState<Roster[]>([])
  const [form, setForm] = useState(blank)
  const [loading, setLoading] = useState(true)

  async function load(ed: Edition) {
    const { data, error } = await supabase
      .from('rosters')
      .select('*')
      .eq('edition_id', ed.id)
      .order('category')
      .order('full_name')
    if (error) toast.error(error.message)
    setRows((data as Roster[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    getActiveEdition().then((ed) => {
      setEdition(ed)
      if (ed) load(ed)
      else setLoading(false)
    })
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!edition) return toast.error('Aucune édition active.')
    if (!form.full_name.trim()) return toast.error('Nom requis.')
    const { error } = await supabase.from('rosters').insert({
      edition_id: edition.id,
      category: form.category,
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      source: 'manual',
    })
    if (error) return toast.error(error.message)
    toast.success('Joueur ajouté.')
    setForm(blank)
    load(edition)
  }

  async function update(id: string, patch: Partial<Roster>) {
    const { error } = await supabase.from('rosters').update(patch).eq('id', id)
    if (error) return toast.error(error.message)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const field = 'border border-white/15 bg-white/5 px-3 py-2 text-bone placeholder:text-white/30 focus:border-flame focus:outline-none'
  const active = rows.filter((r) => r.status !== 'withdrawn')

  return (
    <section>
      <h1 className="font-display text-5xl uppercase text-bone">
        Joueurs <span className="text-flame">· {active.length}</span>
      </h1>
      <p className="label mt-2 text-white/40">
        {edition ? `${edition.name} · inscriptions par catégorie` : 'Aucune édition active'}
      </p>

      <form onSubmit={add} className="mt-6 flex flex-wrap gap-3">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as RosterCategory })} className={field}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value} className="bg-onyx">
              {c.label}
            </option>
          ))}
        </select>
        <input className={field} placeholder="Nom *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input className={field} placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button className="bg-flame px-6 font-display text-xl uppercase text-onyx hover:bg-sun">+ Ajouter</button>
      </form>

      {loading ? (
        <p className="label mt-8 text-white/40">Chargement…</p>
      ) : (
        CATEGORIES.map((c) => {
          const list = rows.filter((r) => r.category === c.value)
          if (list.length === 0) return null
          const count = list.filter((r) => r.status !== 'withdrawn').length
          return (
            <div key={c.value} className="mt-10">
              <h2 className="font-display text-3xl uppercase text-bone">
                {c.label} <span className="text-sun">· {count}</span>
              </h2>
              <table className="mt-3 w-full border-collapse text-left">
                <thead>
                  <tr className="label text-white/40">
                    <th className="border-b border-white/10 py-2">Nom</th>
                    <th className="border-b border-white/10 py-2">Téléphone</th>
                    <th className="border-b border-white/10 py-2">Source</th>
                    <th className="border-b border-white/10 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className={r.status === 'withdrawn' ? 'text-white/30 line-through' : 'text-bone/90'}>
                      <td className="border-b border-white/5 py-2 font-display text-xl">{r.full_name}</td>
                      <td className="border-b border-white/5 py-2">
                        <input
                          className={`${field} w-44 py-1 text-sm`}
                          placeholder="+221 …"
                          defaultValue={r.phone ?? ''}
                          onBlur={(e) => {
                            const phone = e.target.value.trim() || null
                            if (phone !== (r.phone ?? null)) update(r.id, { phone })
                          }}
                        />
                      </td>
                      <td className="border-b border-white/5 py-2 text-sm text-white/50">
                        {r.source}
                        {r.whatsapp_group ? ` · ${r.whatsapp_group}` : ''}
                      </td>
                      <td className="border-b border-white/5 py-2">
                        <select
                          value={r.status}
                          onChange={(e) => update(r.id, { status: e.target.value as RosterStatus })}
                          className={`${field} py-1 text-sm`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-onyx">
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })
      )}
    </section>
  )
}
