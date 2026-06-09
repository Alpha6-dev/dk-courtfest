import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import type { Team, TeamStatus } from '../../types/db'

type TeamRow = Team & { players: { count: number }[] }

const STATUSES: TeamStatus[] = ['pending', 'confirmed', 'waitlist', 'withdrawn']

const statusColor: Record<TeamStatus, string> = {
  pending: 'text-white/50',
  confirmed: 'text-lion',
  waitlist: 'text-sun',
  withdrawn: 'text-flame',
}

export default function Teams() {
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data, error } = await supabase
      .from('teams')
      .select('*, players(count)')
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    setTeams((data as TeamRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function setStatus(id: string, status: TeamStatus) {
    const { error } = await supabase.from('teams').update({ status }).eq('id', id)
    if (error) return toast.error(error.message)
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  if (loading) return <p className="label text-white/40">Chargement…</p>

  return (
    <section>
      <h1 className="font-display text-5xl uppercase text-bone">
        Équipes <span className="text-flame">· {teams.length}</span>
      </h1>

      {teams.length === 0 ? (
        <p className="mt-6 text-white/50">Aucune équipe inscrite pour l’instant.</p>
      ) : (
        <table className="mt-8 w-full border-collapse text-left">
          <thead>
            <tr className="label text-white/40">
              <th className="border-b border-white/10 py-3">Équipe</th>
              <th className="border-b border-white/10 py-3">Div.</th>
              <th className="border-b border-white/10 py-3">Joueurs</th>
              <th className="border-b border-white/10 py-3">Capitaine</th>
              <th className="border-b border-white/10 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} className="text-bone/90">
                <td className="border-b border-white/5 py-3 font-display text-2xl">{t.name}</td>
                <td className="border-b border-white/5 py-3">{t.division}</td>
                <td className="border-b border-white/5 py-3">{t.players?.[0]?.count ?? 0}</td>
                <td className="border-b border-white/5 py-3 text-white/60">
                  {t.captain_name}
                  <br />
                  <span className="text-sm text-white/40">{t.captain_phone}</span>
                </td>
                <td className="border-b border-white/5 py-3">
                  <select
                    value={t.status}
                    onChange={(e) => setStatus(t.id, e.target.value as TeamStatus)}
                    className={`bg-transparent font-display text-xl uppercase focus:outline-none ${statusColor[t.status]}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-onyx text-bone">
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
