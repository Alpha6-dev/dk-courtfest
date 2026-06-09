import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Stat {
  label: string
  value: number | null
  accent: string
}

async function count(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) {
    console.error('[dashboard]', table, error.message)
    return 0
  }
  return count ?? 0
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Équipes', value: null, accent: 'text-flame' },
    { label: 'Joueurs', value: null, accent: 'text-sun' },
    { label: 'Billets', value: null, accent: 'text-bone' },
    { label: 'Présents', value: null, accent: 'text-lion' },
    { label: 'Contacts', value: null, accent: 'text-white/70' },
  ])

  useEffect(() => {
    Promise.all([
      count('teams'),
      count('players'),
      count('tickets'),
      count('check_ins'),
      count('contacts'),
    ]).then(([teams, players, tickets, checkins, contacts]) =>
      setStats([
        { label: 'Équipes', value: teams, accent: 'text-flame' },
        { label: 'Joueurs', value: players, accent: 'text-sun' },
        { label: 'Billets', value: tickets, accent: 'text-bone' },
        { label: 'Présents', value: checkins, accent: 'text-lion' },
        { label: 'Contacts', value: contacts, accent: 'text-white/70' },
      ]),
    )
  }, [])

  return (
    <section>
      <h1 className="font-display text-5xl uppercase text-bone">Tableau de bord</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="border border-white/10 bg-white/5 p-6">
            <span className="label text-white/40">{s.label}</span>
            <div className={`mt-2 font-display text-6xl ${s.accent}`}>{s.value ?? '—'}</div>
          </div>
        ))}
      </div>
      <p className="label mt-10 text-white/30">Live counts · présence + paiements (cash) actifs · passerelle mobile money à venir</p>
    </section>
  )
}
