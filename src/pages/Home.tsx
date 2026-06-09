import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wordmark } from '../components/Wordmark'
import { getActiveEdition, type Edition } from '../lib/edition'

export default function Home() {
  const [edition, setEdition] = useState<Edition | null>(null)

  useEffect(() => {
    getActiveEdition().then(setEdition)
  }, [])

  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-between px-6 py-10">
      <header className="flex items-center justify-between">
        <span className="label text-flame">● Dakar · Basket · Culture</span>
        <span className="label text-white/40">Vol. 01</span>
      </header>

      <section className="py-16">
        <Wordmark className="text-7xl sm:text-8xl" />
        <h1 className="mt-8 max-w-2xl font-display text-5xl uppercase leading-[0.95] text-bone sm:text-6xl">
          Talent exists. <span className="text-sun">Exposure</span> and{' '}
          <span className="text-flame">structure</span> do not.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/70">
          The premier street basketball event in Dakar. 3×3 and 5×5. Live DJ. Elite players.
          {edition?.event_date && (
            <>
              {' '}
              <span className="text-bone">
                {new Date(edition.event_date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              {edition.venue && <> · {edition.venue}</>}.
            </>
          )}
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/register"
            className="bg-flame px-8 py-4 font-display text-2xl uppercase tracking-wide text-onyx transition hover:bg-sun"
          >
            Are you ready? →
          </Link>
          <Link
            to="/buy"
            className="border border-sun/60 px-8 py-4 font-display text-2xl uppercase tracking-wide text-sun transition hover:bg-sun hover:text-onyx"
          >
            Billetterie
          </Link>
          <Link
            to="/admin"
            className="border border-white/20 px-8 py-4 font-display text-2xl uppercase tracking-wide text-bone transition hover:border-flame"
          >
            Admin
          </Link>
        </div>
      </section>

      <footer className="label flex items-center justify-between text-white/30">
        <span>hello@dkcourtfest.com</span>
        <span>14.69°N · 17.45°W</span>
      </footer>
    </main>
  )
}
