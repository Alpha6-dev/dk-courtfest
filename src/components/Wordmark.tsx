import { useBrand } from '../lib/brand'

// The locked CourtFest wordmark. "CourtFest" is the fixed brand (COURT in Bone,
// FEST in Sun). A host-city monogram prefixes it — the last letter of the code
// is always Flame (#FF5C00), the rest Bone — so DK becomes ABJ, DKR, … as the
// event travels (see chart p.06). Pass `cityCode` to override the active city.
export function Wordmark({ className = '', cityCode }: { className?: string; cityCode?: string }) {
  const brand = useBrand()
  const code = (cityCode ?? brand.cityCode).toUpperCase()
  const head = code.slice(0, -1)
  const tail = code.slice(-1)

  return (
    <span className={`font-display leading-none tracking-tight ${className}`}>
      {head && <span className="text-bone">{head}</span>}
      <span className="text-flame">{tail}</span>
      <span className="mx-[0.15em]" />
      <span className="text-bone">COURT</span>
      <span className="text-sun">FEST</span>
    </span>
  )
}
