import { Canvas } from '@react-three/fiber'

/**
 * « Le Terrain » — 3D stage (blueprint P0: grey-box scaffold).
 * Mounts fixed behind the DOM sections (which stay the source of truth).
 * P0 ships a placeholder court so ?v3d=1 proves the pipeline end to end:
 * tier gate → lazy chunk → canvas → lit scene. Art + camera spline are P1/P3.
 * This module is lazy-imported: zero cost for the flat tier.
 */
export default function Stage() {
  return (
    <div
      aria-hidden
      data-cf-stage
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    >
      <Canvas
        frameloop="demand"
        dpr={Math.min(window.devicePixelRatio, window.innerWidth < 900 ? 1.5 : 2)}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 1.6, 8], fov: 50 }}
        onCreated={({ gl }) => {
          // QA hook for the launch checklist
          ;(window as unknown as Record<string, unknown>).__cf3d = {
            tier: '3d',
            renderer: gl.getContext().getParameter(gl.getContext().VERSION),
          }
        }}
      >
        <color attach="background" args={['#0B0B0C']} />
        <fog attach="fog" args={['#1a120c', 12, 30]} />
        {/* golden-hour key + fill (placeholder values from the blueprint light system) */}
        <directionalLight position={[-6, 3, 4]} intensity={2.2} color="#ffb45c" />
        <hemisphereLight args={['#3a2a1f', '#0B0B0C', 0.6]} />
        {/* grey-box court: ground + hoop mass */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[16, 10]} />
          <meshStandardMaterial color="#173f3a" roughness={0.95} />
        </mesh>
        <group position={[0, 0, -4]}>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 3.2]} />
            <meshStandardMaterial color="#b8441a" roughness={0.6} />
          </mesh>
          <mesh position={[0, 3.2, 0.1]}>
            <boxGeometry args={[1.8, 1.1, 0.05]} />
            <meshStandardMaterial color="#e8e2d6" roughness={0.8} />
          </mesh>
        </group>
        {/* narrator ball placeholder */}
        <mesh position={[1.2, 0.24, 1.5]}>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial color="#c2571f" roughness={0.7} />
        </mesh>
      </Canvas>
    </div>
  )
}
