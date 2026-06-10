import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../types/db'

interface SessionRow {
  id: string
  starts_at: string | null
  location: string | null
  category_id: string | null
  categories: { name: string } | null
}
interface Roster {
  id: string
  first_name: string
  last_name: string
}

export default function Sessions() {
  const [cats, setCats] = useState<Category[]>([])
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [location, setLocation] = useState('')
  const [open, setOpen] = useState<SessionRow | null>(null)
  const [roster, setRoster] = useState<Roster[]>([])
  const [present, setPresent] = useState<Record<string, boolean>>({})

  async function load() {
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from('categories').select('*').order('sort'),
      supabase.from('sessions').select('id, starts_at, location, category_id, categories(name)').order('starts_at', { ascending: false }),
    ])
    const cc = (c as Category[]) ?? []
    setCats(cc)
    if (!categoryId && cc[0]) setCategoryId(cc[0].id)
    setSessions((s as unknown as SessionRow[]) ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('sessions').insert({
      category_id: categoryId || null,
      starts_at: startsAt || null,
      location: location || null,
    })
    if (error) return toast.error(error.message)
    setStartsAt('')
    setLocation('')
    load()
  }

  async function openAttendance(s: SessionRow) {
    setOpen(s)
    const [{ data: athletes }, { data: marks }] = await Promise.all([
      supabase.from('athletes').select('id, first_name, last_name').eq('category_id', s.category_id).order('last_name'),
      supabase.from('session_attendance').select('athlete_id, present').eq('session_id', s.id),
    ])
    setRoster((athletes as Roster[]) ?? [])
    const m: Record<string, boolean> = {}
    ;((marks as { athlete_id: string; present: boolean }[]) ?? []).forEach((x) => (m[x.athlete_id] = x.present))
    setPresent(m)
  }

  async function toggle(athleteId: string) {
    if (!open) return
    const next = !present[athleteId]
    setPresent((p) => ({ ...p, [athleteId]: next }))
    const { error } = await supabase
      .from('session_attendance')
      .upsert({ session_id: open.id, athlete_id: athleteId, present: next }, { onConflict: 'session_id,athlete_id' })
    if (error) toast.error(error.message)
  }

  const field = 'border border-white/15 bg-white/5 px-3 py-2 text-bone placeholder:text-white/30 focus:border-flame focus:outline-none'
  const presentCount = Object.values(present).filter(Boolean).length

  return (
    <section>
      <h1 className="font-display text-5xl uppercase text-bone">Séances</h1>

      <form onSubmit={add} className="mt-6 flex flex-wrap items-center gap-3">
        <select className={field} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {cats.map((c) => (
            <option key={c.id} value={c.id} className="bg-onyx">{c.name}</option>
          ))}
        </select>
        <input type="datetime-local" className={field} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        <input className={field} placeholder="Lieu" value={location} onChange={(e) => setLocation(e.target.value)} />
        <button className="bg-flame px-6 py-2 font-display text-xl uppercase text-onyx hover:bg-sun">+ Séance</button>
      </form>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => openAttendance(s)}
              className={`block w-full border p-4 text-left transition ${open?.id === s.id ? 'border-flame' : 'border-white/10 hover:border-white/30'}`}
            >
              <div className="font-display text-2xl uppercase text-bone">{s.categories?.name ?? '—'}</div>
              <div className="label text-white/40">
                {s.starts_at ? new Date(s.starts_at).toLocaleString('fr-FR') : 'date à définir'} {s.location ? `· ${s.location}` : ''}
              </div>
            </button>
          ))}
        </div>

        {open && (
          <div className="border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <span className="label text-sun">Présence · {open.categories?.name}</span>
              <span className="label text-lion">{presentCount} présents</span>
            </div>
            <div className="mt-4 space-y-1">
              {roster.length === 0 && <p className="text-white/40">Aucun joueur dans cette catégorie.</p>}
              {roster.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-3 py-1">
                  <input type="checkbox" checked={!!present[a.id]} onChange={() => toggle(a.id)} className="h-5 w-5 accent-[#FF5C00]" />
                  <span className={present[a.id] ? 'text-bone' : 'text-white/50'}>
                    {a.first_name} {a.last_name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
