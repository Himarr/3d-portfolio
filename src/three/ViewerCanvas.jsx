import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Model from './Model.jsx'
import FitToUnit from './FitToUnit.jsx'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'

export default function ViewerCanvas({ url, toon }) {
  const reduced = usePrefersReducedMotion()
  return (
    <Canvas camera={{ position: [0, 0.6, 3], fov: 40 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <Suspense fallback={null}>
        <FitToUnit>
          <Model url={url} toon={toon} />
        </FitToUnit>
      </Suspense>
      <OrbitControls
        autoRotate={!reduced}
        enablePan={false}
        minDistance={1.5}
        maxDistance={6}
      />
    </Canvas>
  )
}
