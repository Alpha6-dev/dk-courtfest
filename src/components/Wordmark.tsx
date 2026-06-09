// The locked DK CourtFest wordmark — the K is always Flame (#FF5C00),
// COURT in Bone, FEST in Sun. Do not re-color (see chart p.06).
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display leading-none tracking-tight ${className}`}>
      <span className="text-bone">D</span>
      <span className="text-flame">K</span>
      <span className="mx-[0.15em]" />
      <span className="text-bone">COURT</span>
      <span className="text-sun">FEST</span>
    </span>
  )
}
