import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import type { Contact, ContactType } from '../../types/db'

const TYPES: ContactType[] = ['lead', 'sponsor', 'partner', 'media', 'volunteer', 'vip']

const blank = { type: 'sponsor' as ContactType, full_name: '', org_name: '', email: '', phone: '' }

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [form, setForm] = useState(blank)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    setContacts((data as Contact[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name) return toast.error('Nom requis.')
    const { error } = await supabase.from('contacts').insert({
      type: form.type,
      full_name: form.full_name,
      org_name: form.org_name || null,
      email: form.email || null,
      phone: form.phone || null,
    })
    if (error) return toast.error(error.message)
    toast.success('Contact ajouté.')
    setForm(blank)
    load()
  }

  const field = 'border border-white/15 bg-white/5 px-3 py-2 text-bone placeholder:text-white/30 focus:border-flame focus:outline-none'

  return (
    <section>
      <h1 className="font-display text-5xl uppercase text-bone">
        Contacts <span className="text-flame">· {contacts.length}</span>
      </h1>

      <form onSubmit={add} className="mt-6 flex flex-wrap gap-3">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContactType })} className={field}>
          {TYPES.map((t) => (
            <option key={t} value={t} className="bg-onyx">
              {t}
            </option>
          ))}
        </select>
        <input className={field} placeholder="Nom *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input className={field} placeholder="Organisation" value={form.org_name} onChange={(e) => setForm({ ...form, org_name: e.target.value })} />
        <input className={field} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className={field} placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button className="bg-flame px-6 font-display text-xl uppercase text-onyx hover:bg-sun">+ Ajouter</button>
      </form>

      {loading ? (
        <p className="label mt-8 text-white/40">Chargement…</p>
      ) : (
        <table className="mt-8 w-full border-collapse text-left">
          <thead>
            <tr className="label text-white/40">
              <th className="border-b border-white/10 py-3">Type</th>
              <th className="border-b border-white/10 py-3">Nom</th>
              <th className="border-b border-white/10 py-3">Organisation</th>
              <th className="border-b border-white/10 py-3">Contact</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="text-bone/90">
                <td className="border-b border-white/5 py-3">
                  <span className="label text-sun">{c.type}</span>
                </td>
                <td className="border-b border-white/5 py-3 font-display text-xl">{c.full_name}</td>
                <td className="border-b border-white/5 py-3 text-white/60">{c.org_name ?? '—'}</td>
                <td className="border-b border-white/5 py-3 text-sm text-white/50">
                  {c.email ?? ''} {c.phone ? `· ${c.phone}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
