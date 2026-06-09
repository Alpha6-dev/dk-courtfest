import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { getActiveEdition } from '../../lib/edition'
import type { Division, Match, MatchStatus } from '../../types/db'

const STATUSES: MatchStatus[] = ['scheduled', 'live', 'final', 'cancelled']
const statusColor: Record<MatchStatus, string> = {
  scheduled: 'text-white/50',
  live: 'text-lion',
  final: 'text-sun',
  cancelled: 'text-flame',
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [division, setDivision] = useState<Division>('3x3')
  const [round, setRound] = useState('')
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [court, setCourt] = useState('')

  async function load() {
    const [{ data: m }, { data: t }] = await Promise.all([
      supabase.from('matches').select('*').order('scheduled_at', { ascending: true, nullsFirst: false }),
      supabase.from('teams').select('name'),
    ])
    setMatches((m as Match[]) ?? [])
    setTeams(((t as { name: string }[]) ?? []).map((x) => x.name))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function addMatch(e: React.FormEvent) {
    e.preventDefault()
    if (!teamA || !teamB) return toast.error('Deux équipes requises.')
    const edition = await getActiveEdition()
    if (!edition) return toast.error('Aucune édition active.')
    const { error } = await supabase.from('matches').insert({
      edition_id: edition.id,
      division,
      round: round || null,
      team_a: teamA,
      team_b: teamB,
      court: court || null,
    })
    if (error) return toast.error(error.message)
    setRound('')
    setTeamA('')
    setTeamB('')
    setCourt('')
    load()
  }

  async function patch(id: string, fields: Partial<Match>) {
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, ...fields } : m)))
    const { error } = await supabase.from('matches').update(fields).eq('id', id)
    if (error) toast.error(error.message)
  }

  function score(m: Match, side: 'a' | 'b', delta: number) {
    const key = side === 'a' ? 'score_a' : 'score_b'
    patch(m.id, { [key]: Math.max(0, (m[key] as number) + delta) } as Partial<Match>)
  }

  const overlayUrl = (id: string) => `${window.location.origin}/overlay/scoreboard?match=${id}`
  const field = 'border border-white/15 bg-white/5 px-3 py-2 text-bone placeholder:text-white/30 focus:border-flame focus:outline-none'

  if (loading) return <p className="label text-white/40">Chargement…</p>

  return (
    <section>
      <h1 className="font-display text-5xl uppercase text-bone">
        Matchs <span className="text-flame">· {matches.length}</span>
      </h1>

      <datalist id="team-names">
        {teams.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <form onSubmit={addMatch} className="mt-6 flex flex-wrap items-center gap-3">
        <select className={field} value={division} onChange={(e) => setDivision(e.target.value as Division)}>
          <option value="3x3" className="bg-onyx">3x3</option>
          <option value="5x5" className="bg-onyx">5x5</option>
        </select>
        <input className={`${field} w-28`} placeholder="Tour (Q1, 1/4…)" value={round} onChange={(e) => setRound(e.target.value)} />
        <input list="team-names" className={field} placeholder="Équipe A" value={teamA} onChange={(e) => setTeamA(e.target.value)} />
        <input list="team-names" className={field} placeholder="Équipe B" value={teamB} onChange={(e) => setTeamB(e.target.value)} />
        <input className={`${field} w-28`} placeholder="Terrain" value={court} onChange={(e) => setCourt(e.target.value)} />
        <button className="bg-flame px-6 py-2 font-display text-xl uppercase text-onyx hover:bg-sun">+ Match</button>
      </form>

      <div className="mt-8 space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-4 border border-white/10 bg-white/5 p-4">
            <span className="label w-12 text-sun">{m.division}</span>

            <div className="flex items-center gap-2">
              <span className="font-display text-2xl text-bone">{m.team_a}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => score(m, 'a', -1)} className="h-7 w-7 border border-white/15 text-white/60 hover:border-flame">−</button>
                <span className="w-10 text-center font-display text-3xl text-flame">{m.score_a}</span>
                <button onClick={() => score(m, 'a', 1)} className="h-7 w-7 border border-white/15 text-bone hover:border-lion">+</button>
              </div>
            </div>
            <span className="label text-white/30">vs</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button onClick={() => score(m, 'b', -1)} className="h-7 w-7 border border-white/15 text-white/60 hover:border-flame">−</button>
                <span className="w-10 text-center font-display text-3xl text-flame">{m.score_b}</span>
                <button onClick={() => score(m, 'b', 1)} className="h-7 w-7 border border-white/15 text-bone hover:border-lion">+</button>
              </div>
              <span className="font-display text-2xl text-bone">{m.team_b}</span>
            </div>

            <select
              value={m.status}
              onChange={(e) => patch(m.id, { status: e.target.value as MatchStatus })}
              className={`ml-auto bg-transparent font-display text-xl uppercase focus:outline-none ${statusColor[m.status]}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-onyx text-bone">{s}</option>
              ))}
            </select>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(overlayUrl(m.id))
                toast.success('URL overlay copiée (OBS Browser Source).')
              }}
              className="label text-flame hover:text-sun"
            >
              ⧉ Overlay
            </button>
          </div>
        ))}
      </div>

      <p className="label mt-8 text-white/30">
        Overlays OBS : <span className="text-white/50">/overlay/scoreboard?match=…</span> ·{' '}
        <span className="text-white/50">/overlay/lower-third?name=…&amp;sub=…</span> · fond transparent, mise à jour en direct.
      </p>
    </section>
  )
}
