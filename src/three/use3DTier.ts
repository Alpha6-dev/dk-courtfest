import { useEffect, useState } from 'react'
import { getGPUTier } from 'detect-gpu'

/**
 * Tier gate for the 3D layer (blueprint P0).
 * P0 policy: OPT-IN ONLY — the canvas mounts exclusively with ?v3d=1.
 * Even then we refuse on reduced-motion, tiny viewports or missing WebGL.
 * GPU tiering: detect-gpu when its benchmark data loads fast enough
 * (it fetches from a CDN), else a 2 s timeout falls back to a WebGL2
 * heuristic — the gate must never hang on a network dependency.
 * When the 3D tier ships for real (P1+), the default flips to
 * capability-based with the same guards.
 */
export function use3DTier(): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const flag = new URLSearchParams(window.location.search).get('v3d')
    if (flag !== '1') return // P0: opt-in only
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.innerWidth < 360) return

    const probe = document.createElement('canvas')
    const gl2 = probe.getContext('webgl2')
    const gl = gl2 ?? probe.getContext('webgl')
    if (!gl) return

    const cached = sessionStorage.getItem('cf_gpu_tier')
    if (cached !== null) {
      setEnabled(Number(cached) >= 2)
      return
    }

    let cancelled = false
    const decide = (tier: number) => {
      sessionStorage.setItem('cf_gpu_tier', String(tier))
      if (!cancelled) setEnabled(tier >= 2)
    }
    // WebGL2 support is a reasonable "mid-tier or better" proxy when the
    // benchmark lookup is slow or unreachable.
    const fallbackTier = gl2 ? 2 : 1

    Promise.race([
      getGPUTier().then((r) => r.tier),
      new Promise<number>((resolve) => setTimeout(() => resolve(fallbackTier), 2000)),
    ])
      .then(decide)
      .catch(() => decide(fallbackTier))

    return () => {
      cancelled = true
    }
  }, [])

  return enabled
}
