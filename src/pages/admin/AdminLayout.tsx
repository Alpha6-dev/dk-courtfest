import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { Wordmark } from '../../components/Wordmark'

export default function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/admin' },
    })
    if (error) toast.error(error.message)
    else toast.success('Lien de connexion envoyé. Vérifiez votre email.')
  }

  if (!ready) return <div className="p-10 label text-white/40">Chargement…</div>

  if (!session) {
    return (
      <main className="mx-auto max-w-sm px-6 py-24">
        <Wordmark className="block text-4xl" />
        <h1 className="mt-8 font-display text-4xl uppercase text-bone">Admin · Connexion</h1>
        <form onSubmit={sendLink} className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="email@dkcourtfest.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-white/15 bg-white/5 px-4 py-3 text-bone placeholder:text-white/30 focus:border-flame focus:outline-none"
          />
          <button className="w-full bg-flame px-6 py-3 font-display text-2xl uppercase text-onyx hover:bg-sun">
            Envoyer le lien
          </button>
        </form>
        <Link to="/" className="label mt-6 inline-block text-white/40 hover:text-flame">
          ← Site
        </Link>
      </main>
    )
  }

  const tab = ({ isActive }: { isActive: boolean }) =>
    `font-display text-2xl uppercase tracking-wide transition ${isActive ? 'text-flame' : 'text-white/50 hover:text-bone'}`

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <Wordmark className="text-3xl" />
        <nav className="flex gap-6">
          <NavLink to="/admin" end className={tab}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/teams" className={tab}>
            Équipes
          </NavLink>
          <NavLink to="/admin/tickets" className={tab}>
            Billets
          </NavLink>
          <NavLink to="/admin/checkin" className={tab}>
            Check-in
          </NavLink>
          <NavLink to="/admin/contacts" className={tab}>
            Contacts
          </NavLink>
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="label text-white/40 hover:text-flame">
          Déconnexion
        </button>
      </header>
      <div className="py-8">
        <Outlet />
      </div>
    </div>
  )
}
