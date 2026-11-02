import { Suspense, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import Moon from './Moon.jsx'
import Alien from './Alien.jsx'
import { alienPlacement } from './alienPlacement.js'
import OutlineLayer from './OutlineLayer.jsx'
import StarLayer, { STAR_OPACITY } from './StarLayer.jsx'
import { getMoonRadius } from '../lib/moonSize.js'
import { moonIntro } from '../lib/moonIntro.js'
import { usePointerTarget } from './usePointerTarget.js'
import { useHeroMetrics } from './useHeroMetrics.js'
import { starCountFor, STAR_DENSITY_PER_MPX } from './starfield.js'
import { starOffsets, STAR_SCROLL_PARALLAX_FACTOR } from './starScroll.js'
import { scrollSource } from '../lib/scrollSource.js'
import { devStats } from './devStats.js'

const DRIFT_PX_PER_SEC = 3
const STAR_POINTER_SHIFT_PX = 8
const POINTER_MAX = 0.15
const POINTER_SMOOTHING = 4
const SPIN_RAD_PER_SEC = (2 * Math.PI) / 90
const MAX_DELTA = 0.1
// Outline region radius in moon radii: covers the moon and the alien beside or below it.
const OUTLINE_REGION_RADII = 1.5
// Star fade-in once the canvas is live; matches the 700 ms poster fade.
const STAR_FADE_S = 0.7
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Marks the moon as loaded once the Suspense boundary reveals it. Placement is
// applied every frame, so nothing else is needed on reveal.
function MoonReady({ moonReadyRef }) {
  useEffect(() => {
    moonReadyRef.current = true
    return () => {
      moonReadyRef.current = false
    }
  }, [moonReadyRef])
  return null
}

export default function PageScene({ starCount: starCap, epoch, pageRef, onLive }) {
  const size = useThree((s) => s.size)

  const layerRef = useRef(null)
  const copiesRef = useRef(null)
  const offsets = useRef({ dx: 0, dy: 0 }).current
  // starCount from PageCanvas is the cap; the drawn count follows the canvas size.
  const visibleStars = starCountFor(
    size.width,
    size.height,
    starCap,
    STAR_DENSITY_PER_MPX,
  )
  const starCountRef = useRef(visibleStars)
  useEffect(() => {
    starCountRef.current = visibleStars
  }, [visibleStars])
  const placeRef = useRef(null)
  const rigRef = useRef(null)
  const spinRef = useRef(null)
  const alienPlaceRef = useRef(null)
  const alienRigRef = useRef(null)
  const alienPos = useRef({ x: 0, y: 0, z: 0, height: 0 }).current
  const moonReadyRef = useRef(false)
  const motion = useRef({ px: 0, py: 0, drift: 0, frames: 0, fade: 0 })
  const widthRef = useRef(size.width)

  const pointer = usePointerTarget()
  const hero = useHeroMetrics(pageRef)

  useEffect(() => {
    widthRef.current = size.width
  }, [size.width])

  // Restart the live-frame count after a context restore.
  useEffect(() => {
    motion.current.frames = 0
    motion.current.fade = 0
  }, [epoch])

  useFrame((state, delta) => {
    const m = motion.current
    const dt = Math.min(delta, MAX_DELTA)
    const k = 1 - Math.exp(-dt * POINTER_SMOOTHING)
    m.px += (pointer.current.x - m.px) * k
    m.py += (pointer.current.y - m.py) * k

    // stars: drift wraps in [0, 1); scroll parallax wraps in [0, H). Four copies at
    // (dx, dy), (dx-W, dy), (dx, dy-H), (dx-W, dy-H) cover the viewport. Positions are
    // in normalised units (the group is scaled to W x H), so divide by W and H.
    const W = state.size.width
    const H = state.size.height
    m.drift += (dt * DRIFT_PX_PER_SEC) / widthRef.current
    if (m.drift >= 1) m.drift -= 1
    starOffsets(scrollSource.y, STAR_SCROLL_PARALLAX_FACTOR, W, H, m.drift, offsets)
    const nx = offsets.dx / W
    const ny = offsets.dy / H
    const copies = copiesRef.current.children
    copies[0].position.set(nx, ny, 0)
    copies[1].position.set(nx - 1, ny, 0)
    copies[2].position.set(nx, ny - 1, 0)
    copies[3].position.set(nx - 1, ny - 1, 0)

    // pointer shift on the outer layer
    layerRef.current.position.x = -m.px * STAR_POINTER_SHIFT_PX
    layerRef.current.position.y = m.py * STAR_POINTER_SHIFT_PX

    // moon: anchored to the Hero every frame from cached metrics and the scroll
    // value Lenis applied this tick (no layout reads, no allocation).
    // Canvas world units: 1 unit = 1 CSS px, origin at centre, +Y up.
    const h = hero.current
    const place = placeRef.current
    const radius = getMoonRadius()
    if (place) {
      place.position.x = h.cxVp - state.size.width / 2
      place.position.y = state.size.height / 2 - (h.cyDoc - scrollSource.y)
      place.scale.setScalar(radius * moonIntro.scale)
      place.userData.regionRadius = radius * OUTLINE_REGION_RADII
    }
    const alienPlace = alienPlaceRef.current
    if (place && alienPlace) {
      alienPlacement(
        {
          moonX: place.position.x,
          moonY: place.position.y,
          radius,
          introScale: moonIntro.scale,
          viewportWidth: W,
          viewportHeight: H,
          timeS: state.clock.elapsedTime,
        },
        alienPos,
      )
      alienPlace.position.set(alienPos.x, alienPos.y, alienPos.z)
      alienPlace.scale.setScalar(alienPos.height / 2)
    }

    // only the hero's moon does work, and only while the hero is in view
    const visible = h.inView
    if (place && place.visible !== visible) place.visible = visible
    if (alienPlace && alienPlace.visible !== visible) alienPlace.visible = visible
    const moonReady = moonReadyRef.current
    const moonActive = visible && moonReady
    if (moonActive) {
      spinRef.current.rotation.y += dt * SPIN_RAD_PER_SEC
      rigRef.current.rotation.x = m.py * POINTER_MAX
      rigRef.current.rotation.y = m.px * POINTER_MAX
      if (alienRigRef.current) {
        alienRigRef.current.rotation.x = m.py * POINTER_MAX
        alienRigRef.current.rotation.y = m.px * POINTER_MAX
      }
    }

    // stars: opacity 0 until the canvas is live (2 frames with the moon), then ramp
    const mat = copies[0].material
    if (mat) {
      if (m.frames >= 2) m.fade = Math.min(1, m.fade + dt / STAR_FADE_S)
      mat.opacity =
        STAR_OPACITY * (m.fade >= 1 || prefersReducedMotion() ? 1 : m.fade)
    }

    // live report, counted regardless of hero visibility
    if (moonReady && ++m.frames === 2) onLive()

    if (import.meta.env.DEV) {
      devStats.frames++
      if (moonActive) devStats.moonFrames++
      devStats.starCount = starCountRef.current
      devStats.moonRadius = radius
      devStats.introScale = moonIntro.scale
      if (place) devStats.moonCyViewport = state.size.height / 2 - place.position.y
    }
  }, -1)

  return (
    <>
      <group ref={layerRef}>
        <StarLayer
          cap={starCap}
          count={visibleStars}
          width={size.width}
          height={size.height}
          copiesRef={copiesRef}
        />
      </group>
      <Suspense fallback={null}>
        <group ref={placeRef}>
          <Moon rigRef={rigRef} spinRef={spinRef} />
        </group>
        <group ref={alienPlaceRef}>
          <Alien rigRef={alienRigRef} />
        </group>
        <MoonReady moonReadyRef={moonReadyRef} />
        <OutlineLayer anchorRef={placeRef} />
      </Suspense>
    </>
  )
}
