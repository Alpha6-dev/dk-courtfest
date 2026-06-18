import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getActiveEdition, type Edition } from './edition'

// CourtFest is the fixed brand; the host city travels with the event. This
// context resolves the active city once at the app root so the wordmark and
// copy stay in sync everywhere without each page re-fetching the edition.
export interface Brand {
  /** Short monogram code shown before "CourtFest", e.g. DK, ABJ, DKR. */
  cityCode: string
  /** Full host-city name, e.g. Dakar, Abidjan. */
  city: string
  /** ISO 3166-1 alpha-2 country, e.g. SN. */
  country: string
  /** Event lockup as plain text, e.g. "DK CourtFest". */
  eventName: string
  /** Standing tagline, e.g. "Dakar · Basket · Culture". */
  tagline: string
  edition: Edition | null
  loading: boolean
}

// The founding Dakar edition — used before the active edition loads and as a
// fallback if Supabase is unreachable, so the brand never renders blank.
const DEFAULTS = { cityCode: 'DK', city: 'Dakar', country: 'SN' }

const BrandContext = createContext<Brand>({
  ...DEFAULTS,
  eventName: `${DEFAULTS.cityCode} CourtFest`,
  tagline: `${DEFAULTS.city} · Basket · Culture`,
  edition: null,
  loading: true,
})

export function BrandProvider({ children }: { children: ReactNode }) {
  const [edition, setEdition] = useState<Edition | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveEdition()
      .then(setEdition)
      .finally(() => setLoading(false))
  }, [])

  const cityCode = edition?.city_code?.trim() || DEFAULTS.cityCode
  const city = edition?.city?.trim() || DEFAULTS.city
  const country = edition?.country?.trim() || DEFAULTS.country
  const eventName = `${cityCode} CourtFest`
  const tagline = `${city} · Basket · Culture`

  // Keep the browser tab in sync with the active host city.
  useEffect(() => {
    document.title = `${eventName} — ${tagline}`
  }, [eventName, tagline])

  return (
    <BrandContext.Provider value={{ cityCode, city, country, eventName, tagline, edition, loading }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  return useContext(BrandContext)
}
