import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import PageScene from './PageScene.jsx'
import CanvasGuard from './CanvasGuard.jsx'
import DprController from './DprController.jsx'
import FrameDriver from './FrameDriver.jsx'
import CanvasErrorBoundary from './CanvasErrorBoundary.jsx'
import { probeWebGL2 } from './webgl.js'
import { useDocumentVisible } from './useDocumentVisible.js'
import { PIXEL_BUDGET_COARSE, PIXEL_BUDGET_DESKTOP } from './bufferLimits.js'

const GL_OPTIONS = {
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
}
const CAMERA = { position: [0, 0, 1000], near: 1, far: 4000, zoom: 1 }
const RESIZE = { scroll: false }
const CANVAS_STYLE = { pointerEvents: 'none' }

// Dev-only poster capture (/?capture-poster); dead-code-eliminated in production.
const PosterCapture =
  import.meta.env.DEV && location.search.includes('capture-poster')
    ? lazy(() => import('./PosterCapture.jsx'))
    : null

export default function PageCanvas(props) {
  if (import.meta.env.DEV && PosterCapture) {
    return (
      <Suspense fallback={null}>
        <PosterCapture />
      </Suspense>
    )
  }
  return <PageCanvasLayer {...props} />
}

// Viewport-fixed orthographic canvas (1 world unit = 1 CSS px) behind all sections.
function PageCanvasLayer({ pageRef, onStatus }) {
  const [probe] = useState(() => probeWebGL2())
  const [coarse] = useState(
    () =>
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768,
  )
  const [starCount] = useState(() => (coarse ? 800 : 2000))
  const [pixelBudget] = useState(() =>
    coarse ? PIXEL_BUDGET_COARSE : PIXEL_BUDGET_DESKTOP,
  )
  const [lost, setLost] = useState(false)
  const [failed, setFailed] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [dpr, setDpr] = useState(1)
  const [live, setLive] = useState(false)
  const failedRef = useRef(false)

  const visible = useDocumentVisible()
  const active = visible && !lost && !failed

  // FrameDriver reads this each tick (frameloop is always "never").
  const activeRef = useRef(active)
  useEffect(() => {
    activeRef.current = active
  }, [active])

  const report = useCallback(
    (s) => {
      setLive(s === 'live')
      onStatus(s)
    },
    [onStatus],
  )

  const fail = useCallback(() => {
    if (failedRef.current) return
    failedRef.current = true
    setFailed(true)
    setLive(false)
    onStatus('fallback')
  }, [onStatus])

  // No WebGL2: tell the page once, render nothing.
  useEffect(() => {
    if (!probe) fail()
  }, [probe, fail])

  const handleLost = useCallback(() => {
    setLost(true)
    report('fallback')
  }, [report])
  const handleRestored = useCallback(() => {
    setLost(false)
    setEpoch((e) => e + 1)
  }, [])
  const handleLive = useCallback(() => report('live'), [report])

  if (!probe || failed) return null

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 -z-10 h-svh w-screen transition-opacity duration-700 motion-reduce:transition-none ${
        live ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <CanvasErrorBoundary onError={fail}>
        <Canvas
          orthographic
          dpr={dpr}
          flat
          resize={RESIZE}
          events={null}
          gl={GL_OPTIONS}
          camera={CAMERA}
          frameloop="never"
          style={CANVAS_STYLE}
        >
          <FrameDriver activeRef={activeRef} />
          <CanvasGuard
            onLost={handleLost}
            onRestored={handleRestored}
            onShaderError={fail}
          />
          <DprController
            maxDim={probe.maxDim}
            pixelBudget={pixelBudget}
            onDpr={setDpr}
            onUnfit={fail}
          />
          <PageScene
            starCount={starCount}
            epoch={epoch}
            pageRef={pageRef}
            onLive={handleLive}
          />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}
