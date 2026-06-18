import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBrand } from '../../lib/brand'

// OBS lower-third — transparent background, driven by query params so the
// operator can show any name without a DB round-trip.
// Usage: /overlay/lower-third?name=Momar%20Diop&sub=Point%20Guard%20·%20Lions
export default function LowerThird() {
  const { eventName, tagline } = useBrand()
  const [params] = useSearchParams()
  const name = params.get('name') ?? eventName.toUpperCase()
  const sub = params.get('sub') ?? tagline

  useEffect(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
  }, [])

  return (
    <div className="inline-block select-none">
      <div className="border-l-4 border-flame bg-onyx/95 px-6 py-3 shadow-2xl">
        <div className="font-display text-5xl uppercase leading-none text-bone">{name}</div>
        <div className="mt-1 font-mono text-xs uppercase tracking-[0.25em] text-sun">{sub}</div>
      </div>
    </div>
  )
}
