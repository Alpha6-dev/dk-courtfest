import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Station 0 camera choreography (Hero Engine spec):
 *  - entrance: street-side behind the fence → dolly through the gate → settle
 *    at mid-court eye level (~2.6 s, any scroll input skips to the end state)
 *  - scroll: first viewport of scroll eases the camera laterally and starts
 *    the day→night arc (sun dims/cools slightly)
 *  - pointer parallax: ±1.5°, damped, desktop only
 */
export default function CameraRig({ sun }: { sun: React.RefObject<THREE.DirectionalLight | null> }) {
  const { camera, scene } = useThree()
  const look = useRef(new THREE.Vector3(0, 2.1, -4.4))
  const parallax = useRef({ x: 0, y: 0 })
  const scrollShift = useRef({ x: 0, y: 0 })
  const settled = useRef(false) // entrance timeline owns the camera until true

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    // start: street level, right of the gate, behind the fence
    cam.position.set(2.6, 1.7, 13.8)
    look.current.set(0, 2.3, -4.4)

    const ctx = gsap.context(() => {
      // --- entrance: through the gate, settle at mid-court ---
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onComplete: () => {
          settled.current = true
        },
      })
      tl.to(cam.position, { x: 2.45, z: 11.2, duration: 0.9 }, 0)
        .to(cam.position, { x: 0.85, y: 1.6, z: 7.6, duration: 1.7 }, 0.9)
        .to(look.current, { x: 0, y: 1.85, z: -4.2, duration: 1.7 }, 0.9)
      // ball heartbeat-bounce as the camera settles
      const ball = scene.getObjectByName('cf-ball')
      if (ball) {
        tl.fromTo(ball.position, { y: 1.4 }, { y: 0.24, duration: 0.55, ease: 'bounce.out' }, 1.95)
      }
      // any scroll input skips the entrance (never make a returning visitor wait)
      const skip = () => tl.progress(1)
      window.addEventListener('wheel', skip, { once: true, passive: true })
      window.addEventListener('touchmove', skip, { once: true, passive: true })

      // --- scroll scrub: station 0 → toward chapter 1, sun begins its arc ---
      const scrub = { p: 0 }
      gsap.to(scrub, {
        p: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: () => window.innerHeight, scrub: 0.8 },
        onUpdate: () => {
          scrollShift.current.x = scrub.p * -1.6
          scrollShift.current.y = scrub.p * 0.5
          if (sun.current) {
            sun.current.intensity = 2.6 - scrub.p * 0.9
            sun.current.color.setHSL(0.07 - scrub.p * 0.015, 0.9, 0.62 - scrub.p * 0.1)
          }
        },
      })

      return () => {
        window.removeEventListener('wheel', skip)
        window.removeEventListener('touchmove', skip)
      }
    })

    // pointer parallax (desktop pointers only)
    const fine = window.matchMedia('(pointer: fine)').matches
    const onMove = (e: PointerEvent) => {
      if (!fine) return
      parallax.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      parallax.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      ctx.revert()
      window.removeEventListener('pointermove', onMove)
    }
  }, [camera, scene, sun])

  const lookTarget = useRef(new THREE.Vector3())
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera
    if (!settled.current) {
      // entrance: the timeline drives position/look — just aim the camera
      cam.lookAt(look.current)
      return
    }
    // settled: compose scroll shift + damped pointer parallax
    lookTarget.current.set(
      look.current.x + parallax.current.x * 0.35,
      look.current.y - parallax.current.y * 0.2,
      look.current.z,
    )
    cam.position.x += (0.85 + scrollShift.current.x + parallax.current.x * 0.12 - cam.position.x) * 0.06
    cam.position.y += (1.6 + scrollShift.current.y - cam.position.y) * 0.06
    cam.lookAt(lookTarget.current)
  })

  return null
}
