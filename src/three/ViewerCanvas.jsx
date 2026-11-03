import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import Model from './Model.jsx'
import FitToUnit from './FitToUnit.jsx'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'

export default function ViewerCanvas({ url, toon }) {
  const reduced = usePrefersReducedMotion()
  return (
    <Canvas camera={{ position: [0, 0.6, 3], fov: 40 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <directionalLight position={[-4, 1, -3]} intensity={0.5} />
      {!toon && (
        <Environment resolution={64}>
          <Lightformer form="rect" intensity={1} color="#ffffff" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
          <Lightformer form="rect" intensity={0.6} color="#ffffff" position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
          <Lightformer form="rect" intensity={0.6} color="#ffffff" position={[5, 1, -2]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
          <Lightformer form="rect" intensity={0.4} color="#ffffff" position={[0, 1, -6]} scale={[10, 4, 1]} />
        </Environment>
      )}
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
