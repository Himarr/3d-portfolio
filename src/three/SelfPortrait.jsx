import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import alienPosedUrl from '../assets/3D/AlienPosed.glb'
import FitToUnit from './FitToUnit.jsx'
import Model from './Model.jsx'
import OutlineLayer from './OutlineLayer.jsx'
import { CAMERA } from './camera.js'
import { usePointerTarget } from './usePointerTarget.js'
import { portraitTilt } from './selfPortraitTilt.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'

const GL_OPTIONS = { antialias: true, alpha: true }
const POINTER_SMOOTHING = 4
const MAX_DELTA = 0.1

function Scene() {
  const anchor = useRef(null)
  const rig = useRef(null)
  const pointer = usePointerTarget()
  const reduced = usePrefersReducedMotion()
  const smooth = useRef({ x: 0, y: 0 }).current
  const tilt = useRef({ x: 0, y: 0 }).current

  useFrame((state, delta) => {
    // Fitted model has unit radius: scale = half the shorter side of the frame.
    const { width, height } = state.size
    anchor.current.scale.setScalar(Math.min(width, height) / 2)

    if (reduced) {
      rig.current.rotation.set(0, 0, 0)
      return
    }
    const k = 1 - Math.exp(-Math.min(delta, MAX_DELTA) * POINTER_SMOOTHING)
    smooth.x += (pointer.current.x - smooth.x) * k
    smooth.y += (pointer.current.y - smooth.y) * k
    portraitTilt(smooth.x, smooth.y, tilt)
    rig.current.rotation.set(tilt.x, tilt.y, 0)
  }, -1)

  return (
    <Suspense fallback={null}>
      <group ref={anchor}>
        <group ref={rig}>
          <FitToUnit>
            <Model url={alienPosedUrl} toon outline />
          </FitToUnit>
        </group>
      </group>
      <OutlineLayer anchorRef={anchor} />
    </Suspense>
  )
}

export default function SelfPortrait() {
  return (
    <Canvas
      orthographic
      flat
      events={null}
      gl={GL_OPTIONS}
      camera={CAMERA}
      style={{ pointerEvents: 'none' }}
    >
      <Scene />
    </Canvas>
  )
}
