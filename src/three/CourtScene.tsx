import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * « Le Terrain » — procedural Dakar street court (blueprint P1).
 * Everything is generated at runtime (canvas textures, primitive geometry):
 * zero asset downloads, and per-city re-skins are palette changes, not remodels.
 * Palette sampled from the Juneteenth court photos: worn teal paint, pink key,
 * bleached lines, rusted flame hoop, whitewashed wall, dusty golden air.
 */

function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const c = cv.getContext('2d')!
  draw(c)
  const tex = new THREE.CanvasTexture(cv)
  tex.anisotropy = 4
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function useCourtTexture() {
  return useMemo(
    () =>
      canvasTexture(1024, 640, (c) => {
        // worn teal base
        c.fillStyle = '#1c5a50'
        c.fillRect(0, 0, 1024, 640)
        // sun-bleach + wear blotches
        for (let i = 0; i < 260; i++) {
          const x = Math.random() * 1024
          const y = Math.random() * 640
          const r = 8 + Math.random() * 46
          c.fillStyle = `rgba(${200 + Math.random() * 40}, ${170 + Math.random() * 40}, ${130 + Math.random() * 30}, ${0.03 + Math.random() * 0.08})`
          c.beginPath()
          c.arc(x, y, r, 0, Math.PI * 2)
          c.fill()
        }
        // pink key (la raquette) like the Juneteenth court
        c.fillStyle = 'rgba(190, 105, 110, 0.75)'
        c.fillRect(392, 0, 240, 190)
        // painted lines, slightly worn
        c.strokeStyle = 'rgba(238, 231, 218, 0.85)'
        c.lineWidth = 6
        c.strokeRect(24, 24, 976, 592)
        c.strokeRect(392, 0, 240, 190) // key box
        c.beginPath() // free-throw arc
        c.arc(512, 190, 120, 0, Math.PI)
        c.stroke()
        c.beginPath() // center circle (half visible)
        c.arc(512, 640, 150, Math.PI, Math.PI * 2)
        c.stroke()
        // three-point arc
        c.beginPath()
        c.arc(512, 60, 400, 0.25, Math.PI - 0.25)
        c.stroke()
      }),
    [],
  )
}

function useFenceTexture() {
  return useMemo(
    () =>
      canvasTexture(256, 256, (c) => {
        c.clearRect(0, 0, 256, 256)
        c.strokeStyle = 'rgba(160, 160, 158, 0.9)'
        c.lineWidth = 3
        const s = 32
        for (let i = -8; i < 16; i++) {
          c.beginPath()
          c.moveTo(i * s, 0)
          c.lineTo(i * s + 256, 256)
          c.stroke()
          c.beginPath()
          c.moveTo(i * s + 256, 0)
          c.lineTo(i * s, 256)
          c.stroke()
        }
      }),
    [],
  )
}

function useSkyTexture() {
  return useMemo(
    () =>
      canvasTexture(64, 512, (c) => {
        const g = c.createLinearGradient(0, 0, 0, 512)
        g.addColorStop(0, '#241318')
        g.addColorStop(0.45, '#5a2c14')
        g.addColorStop(0.72, '#c96a1e')
        g.addColorStop(0.88, '#f0a03c')
        g.addColorStop(1, '#f7c96a')
        c.fillStyle = g
        c.fillRect(0, 0, 64, 512)
      }),
    [],
  )
}

function useSilhouetteTexture() {
  return useMemo(
    () =>
      canvasTexture(128, 256, (c) => {
        c.clearRect(0, 0, 128, 256)
        c.fillStyle = 'rgba(12, 9, 8, 0.92)'
        c.beginPath() // head
        c.arc(64, 52, 26, 0, Math.PI * 2)
        c.fill()
        c.beginPath() // shoulders/torso
        c.moveTo(14, 256)
        c.quadraticCurveTo(16, 110, 64, 96)
        c.quadraticCurveTo(112, 110, 114, 256)
        c.closePath()
        c.fill()
      }),
    [],
  )
}

function Hoop({ position }: { position: [number, number, number] }) {
  const steel = <meshStandardMaterial color="#b8471c" roughness={0.55} metalness={0.35} />
  return (
    <group position={position}>
      <mesh position={[0, 1.55, -0.55]}>{/* pole */}
        <cylinderGeometry args={[0.07, 0.09, 3.1, 12]} />
        {steel}
      </mesh>
      <mesh position={[0, 3.05, -0.28]} rotation={[0.3, 0, 0]}>{/* arm */}
        <cylinderGeometry args={[0.05, 0.05, 0.62, 8]} />
        {steel}
      </mesh>
      <mesh position={[0, 3.28, 0]}>{/* backboard */}
        <boxGeometry args={[1.8, 1.15, 0.06]} />
        <meshStandardMaterial color="#e6dfd2" roughness={0.85} />
      </mesh>
      <mesh position={[0, 2.9, 0.24]} rotation={[Math.PI / 2, 0, 0]}>{/* rim */}
        <torusGeometry args={[0.26, 0.025, 10, 28]} />
        {steel}
      </mesh>
      <mesh position={[0, 2.68, 0.24]} rotation={[Math.PI, 0, 0]}>{/* chain net */}
        <coneGeometry args={[0.24, 0.42, 12, 1, true]} />
        <meshStandardMaterial color="#c8c8c6" roughness={0.4} metalness={0.6} transparent opacity={0.45} side={THREE.DoubleSide} wireframe />
      </mesh>
    </group>
  )
}

function Dust() {
  const ref = useRef<THREE.Points>(null)
  const { positions, seeds } = useMemo(() => {
    const n = 140
    const positions = new Float32Array(n * 3)
    const seeds = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      positions[i * 3] = -4 + Math.random() * 10 // biased into the sun shaft
      positions[i * 3 + 1] = 0.2 + Math.random() * 3.2
      positions[i * 3 + 2] = -6 + Math.random() * 14
      seeds[i] = Math.random() * Math.PI * 2
    }
    return { positions, seeds }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const p = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined
    if (!p) return
    for (let i = 0; i < seeds.length; i++) {
      p.array[i * 3] += Math.sin(t * 0.25 + seeds[i]) * 0.0012
      p.array[i * 3 + 1] += Math.cos(t * 0.2 + seeds[i]) * 0.0008
    }
    p.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f4be7a" size={0.035} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  )
}

export default function CourtScene({ sunRef }: { sunRef?: React.Ref<THREE.DirectionalLight> }) {
  const court = useCourtTexture()
  const fence = useFenceTexture()
  const sky = useSkyTexture()
  const silhouette = useSilhouetteTexture()

  const crowd = useMemo(
    () =>
      [
        [-7.5, -2], [-6.3, -4.5], [-8, 1], [7.6, -3], [6.9, -0.5], [8.2, 2], [-6.8, 3.5], [7.3, 4.6],
      ].map(([x, z], i) => ({ x, z, s: 1.5 + (i % 3) * 0.14 })),
    [],
  )

  return (
    <group>
      {/* sunset sky backdrop + skyline silhouettes */}
      <mesh position={[0, 5.4, -20]}>
        <planeGeometry args={[60, 16]} />
        <meshBasicMaterial map={sky} fog={false} />
      </mesh>
      {[[-14, 2.2, 4, 4.4], [-9, 1.5, 3, 3], [9.5, 2.6, 3.4, 5.2], [15, 1.8, 5, 3.6], [3, 1.2, 2.2, 2.4]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, -17.5]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color="#160d08" fog={false} />
        </mesh>
      ))}

      {/* the court */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 10]} />
        <meshStandardMaterial map={court} roughness={0.94} />
      </mesh>
      {/* dusty asphalt apron around the court */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#4a3a2c" roughness={1} />
      </mesh>

      <Hoop position={[0, 0, -4.4]} />

      {/* whitewashed low wall behind the hoop */}
      <mesh position={[0, 0.9, -7.6]}>
        <boxGeometry args={[18, 1.8, 0.3]} />
        <meshStandardMaterial color="#cfc6b4" roughness={0.95} />
      </mesh>

      {/* chain-link fence with an open gate (camera enters through the gap) */}
      {[[-6.05, 3.1], [4.55, 8.1]].map(([cx, w], i) => (
        <mesh key={i} position={[cx, 1.5, 9.6]}>
          <planeGeometry args={[w, 3]} />
          <meshBasicMaterial map={fence} transparent alphaTest={0.35} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[-7.6, -4.5, -2.4, 0.55, 8.6].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 9.6]}>
          <cylinderGeometry args={[0.045, 0.045, 3, 8]} />
          <meshStandardMaterial color="#6d6a64" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}

      {/* crowd silhouettes at the edges, warm-lit */}
      {crowd.map(({ x, z, s }, i) => (
        <mesh key={i} position={[x, s / 2 - 0.02, z]}>
          <planeGeometry args={[s * 0.55, s]} />
          <meshBasicMaterial map={silhouette} transparent alphaTest={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* narrator ball */}
      <mesh name="cf-ball" position={[1.15, 0.24, 3.3]} castShadow>
        <sphereGeometry args={[0.24, 28, 28]} />
        <meshStandardMaterial color="#c2571f" roughness={0.72} />
      </mesh>

      {/* golden-hour light system */}
      <directionalLight ref={sunRef} position={[-11, 3.4, -1]} intensity={2.6} color="#ffa04f" />
      <hemisphereLight args={['#5a3a22', '#0d0906', 0.75]} />
      <Dust />
    </group>
  )
}
