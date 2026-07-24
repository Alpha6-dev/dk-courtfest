import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import CourtScene from './CourtScene'
import CameraRig from './CameraRig'

gsap.registerPlugin(ScrollTrigger)

/**
 * « Le Terrain » — 3D stage (blueprint P1: hero station).
 * Mounts fixed behind the DOM sections; while mounted the <html> element
 * carries .cf-3d so CSS can hide the flat-tier hero video and let the canvas
 * be the hero background. Also owns the DOM hero choreography (Hero Engine):
 * headline lines rise, CTA pops, hero content parallaxes out on scroll —
 * and Lenis smooth scrolling for the 3D tier only.
 */

/** Wrap each <br>-separated headline line for the line-rise animation. */
function splitHeadline(h1: HTMLElement): HTMLElement[] {
  if (h1.dataset.cfSplit) return Array.from(h1.querySelectorAll('[data-cf-line]'))
  const parts = h1.innerHTML.split(/<br\s*\/?>/i)
  h1.innerHTML = parts
    .map(
      (p) =>
        `<span style="display:block;overflow:hidden"><span data-cf-line style="display:block">${p}</span></span>`,
    )
    .join('')
  h1.dataset.cfSplit = '1'
  return Array.from(h1.querySelectorAll('[data-cf-line]'))
}

export default function Stage() {
  const sunRef = useRef<THREE.DirectionalLight | null>(null)

  // Flat-tier suppression + Lenis + DOM choreography
  useEffect(() => {
    document.documentElement.classList.add('cf-3d')

    const lenis = new Lenis({ autoRaf: false, lerp: 0.11 })
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    lenis.on('scroll', ScrollTrigger.update)

    const ctx = gsap.context(() => {
      const hero = document.querySelector<HTMLElement>('#top')
      const h1 = hero?.querySelector<HTMLElement>('h1')
      const content = hero?.querySelector<HTMLElement>('div[style*="z-index:3"]')
      if (!hero || !h1 || !content) return

      const lines = splitHeadline(h1)
      const eyebrow = content.children[0]
      const sub = hero.querySelector('p')
      const cta = content.querySelector('a[href="/register"]')

      // --- entrance (synced to the camera dolly: text lands as the camera settles) ---
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.set(content, { autoAlpha: 1 })
        .from(lines, { yPercent: 115, duration: 0.8, stagger: 0.06 }, 1.0)
        .from(eyebrow, { autoAlpha: 0, y: 14, duration: 0.5 }, 1.5)
        .from(sub, { autoAlpha: 0, y: 18, duration: 0.55 }, 1.65)
        .from(cta, { autoAlpha: 0, scale: 0.96, y: 10, duration: 0.4, ease: 'back.out(2)' }, 2.0)
      const skip = () => tl.progress(1)
      window.addEventListener('wheel', skip, { once: true, passive: true })
      window.addEventListener('touchmove', skip, { once: true, passive: true })

      // --- scroll: hero content parallaxes out at 0.6x and fades ---
      gsap.to(content, {
        y: -90,
        autoAlpha: 0.25,
        ease: 'none',
        scrollTrigger: { start: 0, end: () => window.innerHeight * 0.9, scrub: 0.6 },
      })

      return () => {
        window.removeEventListener('wheel', skip)
        window.removeEventListener('touchmove', skip)
      }
    })

    return () => {
      ctx.revert()
      gsap.ticker.remove(raf)
      lenis.destroy()
      document.documentElement.classList.remove('cf-3d')
    }
  }, [])

  return (
    <div
      aria-hidden
      data-cf-stage
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    >
      <Canvas
        dpr={Math.min(window.devicePixelRatio, window.innerWidth < 900 ? 1.5 : 2)}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [2.6, 1.7, 13.8], fov: 50 }}
        onCreated={({ gl }) => {
          ;(window as unknown as Record<string, unknown>).__cf3d = {
            tier: '3d',
            phase: 'P1',
            renderer: gl.getContext().getParameter(gl.getContext().VERSION),
          }
        }}
      >
        <color attach="background" args={['#120a06']} />
        <fog attach="fog" args={['#241206', 14, 34]} />
        <CourtScene sunRef={sunRef} />
        <CameraRig sun={sunRef} />
      </Canvas>
    </div>
  )
}
