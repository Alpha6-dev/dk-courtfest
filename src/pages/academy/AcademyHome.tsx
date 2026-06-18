import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useBrand } from '../../lib/brand'
import type { Category } from '../../types/db'

// DK Academy — public landing. Training for all categories, year-round.
export default function AcademyHome() {
  const { eventName } = useBrand()
  const [cats, setCats] = useState<Category[]>([])

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('sort')
      .then(({ data }) => setCats((data as Category[]) ?? []))
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between">
        <span className="font-display text-3xl tracking-tight">
          <span className="text-bone">DK</span> <span className="text-flame">ACADEMY</span>
        </span>
        <Link to="/sports" className="label text-white/40 hover:text-flame">
          Alpha 6 Sports →
        </Link>
      </header>

      <section className="py-14">
        <h1 className="max-w-3xl font-display text-6xl uppercase leading-[0.95] text-bone sm:text-7xl">
          Forme la prochaine <span className="text-flame">génération</span> du basket dakarois.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/70">
          Entraînement encadré toute l'année — du mini-basket aux seniors. Coachs certifiés, vraie
          progression, esprit {eventName}.
        </p>
        <Link
          to="/academy/enroll"
          className="mt-8 inline-block bg-flame px-8 py-4 font-display text-2xl uppercase tracking-wide text-onyx transition hover:bg-sun"
        >
          Inscrire un joueur →
        </Link>
      </section>

      <section>
        <span className="label text-sun">Catégories</span>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <Link
              key={c.id}
              to={`/academy/enroll?cat=${c.id}`}
              className="group border border-white/10 bg-white/5 p-6 transition hover:border-flame"
            >
              <div className="font-display text-4xl uppercase text-bone group-hover:text-flame">{c.name}</div>
              <div className="mt-1 text-white/50">
                {c.age_min}–{c.age_max} ans · {c.schedule}
              </div>
              <div className="label mt-3 text-sun">{c.monthly_fee_xof.toLocaleString('fr-FR')} XOF / mois</div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="label mt-16 flex justify-between text-white/30">
        <Link to="/" className="hover:text-flame">{eventName}</Link>
        <span>Dakar · Sénégal</span>
      </footer>
    </main>
  )
}
