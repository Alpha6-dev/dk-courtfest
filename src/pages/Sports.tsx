import { Link } from 'react-router-dom'
import { useBrand } from '../lib/brand'

export default function Sports() {
  const { eventName, city } = useBrand()

  // Alpha 6 Sports — umbrella / B2B hub tying the brands together. The CourtFest
  // event travels with its host city; Academy & League are Dakar-rooted.
  const PRODUCTS = [
    { to: '/', tag: 'Événement', title: eventName, desc: `Le festival street-basket de ${city}. 3×3 · 5×5 · culture.`, accent: 'text-flame' },
    { to: '/academy', tag: 'Formation', title: 'DK Academy', desc: 'Entraînement encadré toute l\'année, du mini-basket aux seniors.', accent: 'text-sun' },
    { to: '/sports', tag: 'Bientôt', title: 'DK League', desc: 'Championnat inter-quartiers — la suite logique du pipeline.', accent: 'text-lion' },
  ]

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between">
        <span className="font-display text-3xl tracking-tight text-bone">
          ALPHA <span className="text-flame">6</span> SPORTS
        </span>
        <a href="mailto:hello@courtfest.com" className="label text-white/40 hover:text-flame">Partenariat →</a>
      </header>

      <section className="py-16">
        <h1 className="max-w-3xl font-display text-6xl uppercase leading-[0.95] text-bone sm:text-7xl">
          On construit la culture basket à Dakar — de la <span className="text-flame">rue</span> à
          l'<span className="text-sun">académie</span> à la <span className="text-lion">scène</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/70">
          Alpha 6 Sports opère un événement phare, une filière de formation et un vivier de talents —
          un seul écosystème, une seule ambition.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {PRODUCTS.map((p) => (
          <Link key={p.title} to={p.to} className="group border border-white/10 bg-white/5 p-6 transition hover:border-flame">
            <span className="label text-white/40">{p.tag}</span>
            <div className={`mt-2 font-display text-4xl uppercase text-bone group-hover:${p.accent}`}>{p.title}</div>
            <p className="mt-2 text-white/60">{p.desc}</p>
            <span className={`label mt-4 inline-block ${p.accent}`}>Découvrir →</span>
          </Link>
        ))}
      </section>

      <section className="mt-16 border-t border-white/10 pt-10">
        <span className="label text-sun">Pour les sponsors</span>
        <h2 className="mt-2 max-w-2xl font-display text-4xl uppercase text-bone">
          Une audience jeune, urbaine, engagée — sur le terrain et en ligne.
        </h2>
        <a
          href="mailto:hello@courtfest.com?subject=Partenariat%20Alpha%206%20Sports"
          className="mt-6 inline-block bg-flame px-8 py-4 font-display text-2xl uppercase tracking-wide text-onyx transition hover:bg-sun"
        >
          Devenir partenaire →
        </a>
      </section>

      <footer className="label mt-16 flex flex-wrap justify-between gap-3 text-white/30">
        <span>Alpha 6 · RCCM 2026 M 7847 · Dakar, Sénégal</span>
        <span>hello@courtfest.com</span>
      </footer>
    </main>
  )
}
