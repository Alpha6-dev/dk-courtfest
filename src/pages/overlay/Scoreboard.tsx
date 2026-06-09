import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Match } from '../../types/db'

// OBS Browser Source overlay — transparent background, updates live via
// Supabase Realtime when the admin changes the score in /admin/matches.
// Usage: /overlay/scoreboard?match=<id>   (or omit to track the live match)
export default function Scoreboard() {
  const [params] = useSearchParams()
  const matchId = params.get('match')
  const [m, setM] = useState<Match | null>(null)

  useEffect(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
  }, [])

  useEffect(() => {
    let active = true

    async function initial() {
      const q = supabase.from('matches').select('*')
      const { data } = matchId
        ? await q.eq('id', matchId).maybeSingle()
        : await q.eq('status', 'live').order('scheduled_at', { ascending: false }).limit(1).maybeSingle()
      if (active) setM((data as Match) ?? null)
    }
    initial()

    const channel = supabase
      .channel('scoreboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          const row = payload.new as Match
          if (!row?.id) return
          if (matchId ? row.id === matchId : row.status === 'live') setM(row)
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [matchId])

  if (!m) return <div className="p-6 font-mono text-sm text-white/40">En attente d'un match…</div>

  return (
    <div className="inline-flex select-none items-stretch overflow-hidden rounded-md shadow-2xl font-display">
      {/* Team A */}
      <div className="flex flex-col justify-center bg-onyx px-6 py-3">
        <span className="text-3xl uppercase leading-none text-bone">{m.team_a}</span>
      </div>
      {/* Score A */}
      <div className="flex items-center bg-flame px-5 text-5xl leading-none text-onyx">{m.score_a}</div>
      {/* Score B */}
      <div className="flex items-center bg-bone px-5 text-5xl leading-none text-onyx">{m.score_b}</div>
      {/* Team B */}
      <div className="flex flex-col justify-center bg-onyx px-6 py-3">
        <span className="text-3xl uppercase leading-none text-bone">{m.team_b}</span>
      </div>
      {/* Period / round */}
      <div className="flex flex-col items-center justify-center bg-sun px-4 text-onyx">
        <span className="text-2xl leading-none">{m.round || m.division}</span>
        {m.status === 'live' && <span className="mt-1 text-[10px] font-mono uppercase tracking-widest">● live</span>}
      </div>
    </div>
  )
}
