import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import Moon from './Moon.jsx'
import Alien from './Alien.jsx'
import OutlineLayer from './OutlineLayer.jsx'
import { moonRadiusPx } from './moonFraming.js'
import { OUTLINE_THICKNESS_CSS_PX, POSTER_DISPLAY_CSS_PX } from './celConstants.js'

// Dev-only: renders the moon in its default pose into a fixed 1200x1200
// transparent canvas and downloads hero-planet-poster.png. The cel-shaded moon and
// its silhouette outline are both drawn; the outline is scaled up so that, once the
// poster is shown at POSTER_DISPLAY_CSS_PX, it measures OUTLINE_THICKNESS_CSS_PX.
const SIZE = 1200
// /?capture-poster=alien renders only the alien (hero-alien-poster.png), filling
// ALIEN_FILL of the square; Hero sizes its poster box from the same value.
const ALIEN = location.search.includes('capture-poster=alien')
const ALIEN_FILL = 0.8
const POSTER_OUTLINE_PX = OUTLINE_THICKNESS_CSS_PX / (POSTER_DISPLAY_CSS_PX / SIZE)
const GL_OPTIONS = { alpha: true, preserveDrawingBuffer: true }
const CAMERA = { position: [0, 0, 1000], near: 1, far: 4000, zoom: 1 }
const BOX_STYLE = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: SIZE,
  height: SIZE,
  zIndex: 9999,
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()))

function CaptureOnReady() {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    let done = false
    const capture = async () => {
      // Frames run the outline relayout and the mask pass; wait for them to settle.
      invalidate()
      for (let i = 0; i < 4; i++) {
        await nextFrame()
        invalidate()
      }
      const canvas = gl.domElement
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = ALIEN ? 'hero-alien-poster.png' : 'hero-planet-poster.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      const dataUrl = canvas.toDataURL('image/png')
      window.__posterDataUrl = dataUrl
      return dataUrl
    }
    window.__capturePoster = capture
    capture().then(() => {
      done = true
    })
    return () => {
      if (!done) window.__capturePoster = undefined
    }
  }, [gl, invalidate])

  return null
}

export default function PosterCapture() {
  const placeRef = useRef(null)
  return (
    <div style={BOX_STYLE}>
      <Canvas
        orthographic
        dpr={1}
        flat
        frameloop="demand"
        gl={GL_OPTIONS}
        camera={CAMERA}
        resize={{ scroll: false }}
      >
        <Suspense fallback={null}>
          <group ref={placeRef} scale={ALIEN ? (SIZE * ALIEN_FILL) / 2 : moonRadiusPx(SIZE)}>
            {ALIEN ? <Alien /> : <Moon />}
          </group>
          <OutlineLayer anchorRef={placeRef} thicknessCssPx={POSTER_OUTLINE_PX} />
          <CaptureOnReady />
        </Suspense>
      </Canvas>
    </div>
  )
}
