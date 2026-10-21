import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Color,
  HalfFloatType,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  WebGLRenderTarget,
} from 'three'
import {
  OUTLINE_BOUNDS_FACTOR,
  OUTLINE_INNER_EDGES,
  OUTLINE_MAX_TEXELS,
  OUTLINE_PAD_CSS_PX,
  OUTLINE_RT_SCALE,
  OUTLINE_THICKNESS_CSS_PX,
  OUTLINE_Z_FACTOR,
  OUTLINE_Z_MAX,
} from './celConstants.js'
import { OUTLINE_LAYER } from './outlineLayers.js'
import { createInnerEdgeMaterial, createMaskMaterial, createRingMaterial } from './outlineMaterials.js'
import { computeOutlineRegion } from './outlineRegion.js'
import { devStats } from './devStats.js'

// Everything created here is released in the useEffect cleanup below:
// render target, mask material, ring material, optional inner-edge material, plane
// geometry (the meshes own no other resource).
function createResources() {
  const rt = new WebGLRenderTarget(2, 2, {
    type: HalfFloatType,
    format: RGBAFormat,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthBuffer: true,
    generateMipmaps: false,
  })

  // Sees only OUTLINE_LAYER: stars and other layer-0 meshes are never drawn into the mask.
  const maskCamera = new OrthographicCamera(-1, 1, 1, -1, 1, 4000)
  maskCamera.layers.set(OUTLINE_LAYER)

  const mask = createMaskMaterial()
  const ring = createRingMaterial()
  ring.uniforms.uMask.value = rt.texture

  const geometry = new PlaneGeometry(1, 1)
  // Stays on layer 0 only, so the mask camera never draws the ring into the mask.
  const ringMesh = new Mesh(geometry, ring)
  ringMesh.frustumCulled = false
  ringMesh.visible = false

  // Inner edges: optional second quad over the same region, drawn in front of the model.
  let inner = null
  let innerMesh = null
  if (OUTLINE_INNER_EDGES) {
    inner = createInnerEdgeMaterial()
    inner.uniforms.uMask.value = rt.texture
    innerMesh = new Mesh(geometry, inner)
    innerMesh.frustumCulled = false
    innerMesh.visible = false
    innerMesh.renderOrder = 10
  }

  return {
    rt,
    maskCamera,
    mask,
    ring,
    geometry,
    ringMesh,
    inner,
    innerMesh,
    // Cached inputs of the last resize / reposition; NaN forces the first one.
    cache: {
      x: NaN,
      y: NaN,
      z: NaN,
      radius: NaN,
      regionRadius: NaN,
      dpr: NaN,
      thickness: NaN,
      bounds: NaN,
      width: NaN,
      height: NaN,
    },
    // Preallocated inputs and output of computeOutlineRegion (filled in place).
    params: {
      x: 0,
      y: 0,
      radius: 0,
      boundsFactor: 0,
      thicknessCssPx: 0,
      padCssPx: OUTLINE_PAD_CSS_PX,
      dpr: 1,
      rtScale: OUTLINE_RT_SCALE,
      maxTexels: OUTLINE_MAX_TEXELS,
      canvasWidth: 0,
      canvasHeight: 0,
    },
    region: {
      centerX: 0,
      centerY: 0,
      halfCss: 0,
      texels: 0,
      rtDpr: 1,
      thicknessDev: 0,
    },
    // Preallocated scratch for the clear colour save/restore.
    savedClear: new Color(),
    maskClear: new Color(0, 0, 0),
  }
}

// Fills r.region for the current anchor position and region radius, in place.
function fillRegion(r, x, y, regionRadius, dpr, thickness, bounds, width, height) {
  const p = r.params
  p.x = x
  p.y = y
  p.radius = regionRadius
  p.boundsFactor = bounds
  p.thicknessCssPx = thickness
  p.dpr = dpr
  p.canvasWidth = width
  p.canvasHeight = height
  return computeOutlineRegion(p, r.region)
}

// Region size changed (final radius, DPR, thickness, bounds or canvas size): resizes
// the render target, the mask frustum and the quad scales. Not run for anchor moves
// or for the intro scale (the region is sized from the final radius).
function resize(r, camera, x, y, regionRadius, dpr, thickness, bounds, width, height) {
  const { halfCss, texels, thicknessDev } = fillRegion(
    r,
    x,
    y,
    regionRadius,
    dpr,
    thickness,
    bounds,
    width,
    height,
  )

  r.rt.setSize(texels, texels)

  // Mask camera frustum: framed on the region so mask texels map 1:1 to canvas
  // device pixels (the position is set in reposition).
  const cam = r.maskCamera
  cam.left = -halfCss
  cam.right = halfCss
  cam.top = halfCss
  cam.bottom = -halfCss
  cam.near = camera.near
  cam.far = camera.far
  cam.updateProjectionMatrix()

  r.ringMesh.scale.set(2 * halfCss, 2 * halfCss, 1)

  const u = r.ring.uniforms
  u.uTexelSize.value.set(1 / texels, 1 / texels)
  u.uThicknessDev.value = thicknessDev

  if (r.inner) {
    r.innerMesh.scale.set(2 * halfCss, 2 * halfCss, 1)
    const iu = r.inner.uniforms
    iu.uTexelSize.value.set(1 / texels, 1 / texels)
    iu.uThicknessDev.value = thicknessDev
  }

  const c = r.cache
  c.regionRadius = regionRadius
  c.dpr = dpr
  c.thickness = thickness
  c.bounds = bounds
  c.width = width
  c.height = height

  if (import.meta.env.DEV) {
    devStats.outlineRtWidth = texels
    devStats.outlineRtHeight = texels
  }
}

// Anchor moved (or its radius changed): snaps the region centre to a texel and moves
// the mask camera and the quads. Cheap: no render target change, no allocation.
function reposition(r, camera, x, y, z, radius, regionRadius, dpr, thickness, bounds, width, height) {
  const { centerX, centerY } = fillRegion(
    r,
    x,
    y,
    regionRadius,
    dpr,
    thickness,
    bounds,
    width,
    height,
  )

  const cam = r.maskCamera
  cam.position.set(centerX, centerY, camera.position.z)
  cam.updateMatrixWorld()

  // Normalise mask depth: reference = view depth of the anchor, unit = radius.
  r.mask.uniforms.uDepthRef.value = camera.position.z - z
  r.mask.uniforms.uRadius.value = radius

  // Ring quad: exactly the mask region, behind the model so the model covers it.
  const zOffset = Math.min(OUTLINE_Z_FACTOR * radius, OUTLINE_Z_MAX)
  r.ringMesh.position.set(centerX, centerY, z - zOffset)
  // Inner-edge quad: same region, in front of the model (still inside the main frustum).
  if (r.inner) r.innerMesh.position.set(centerX, centerY, z + zOffset)

  const c = r.cache
  c.x = x
  c.y = y
  c.z = z
  c.radius = radius
}

// One frame of the outline: relayout on change, then the mask pass. Lives outside
// the component so the hot path is plain code on preallocated state.
function runFrame(r, gl, scene, camera, anchorRef, dpr, thicknessCssPx, boundsFactor, width, height) {
  const anchor = anchorRef.current
  if (!anchor || anchor.visible === false) {
    r.ringMesh.visible = false
    if (r.innerMesh) r.innerMesh.visible = false
    return
  }

  // World transform of the anchor: position = centre, scale = radius (CSS px).
  anchor.updateWorldMatrix(true, false)
  const e = anchor.matrixWorld.elements
  const x = e[12]
  const y = e[13]
  const z = e[14]
  const radius = Math.hypot(e[0], e[1], e[2])
  if (!(radius > 0)) {
    r.ringMesh.visible = false
    if (r.innerMesh) r.innerMesh.visible = false
    return
  }

  // Region sized from the final radius, so the intro scale never resizes the target.
  const regionRadius = anchor.userData.regionRadius ?? radius

  const c = r.cache
  let resized = false
  if (
    c.regionRadius !== regionRadius ||
    c.dpr !== dpr ||
    c.thickness !== thicknessCssPx ||
    c.bounds !== boundsFactor ||
    c.width !== width ||
    c.height !== height
  ) {
    resize(r, camera, x, y, regionRadius, dpr, thicknessCssPx, boundsFactor, width, height)
    resized = true
  }
  if (resized || c.x !== x || c.y !== y || c.z !== z || c.radius !== radius) {
    reposition(r, camera, x, y, z, radius, regionRadius, dpr, thicknessCssPx, boundsFactor, width, height)
  }
  r.ringMesh.visible = true
  if (r.innerMesh) r.innerMesh.visible = true

  // Mask pass. State is restored even if the render throws.
  const prevTarget = gl.getRenderTarget()
  const prevAlpha = gl.getClearAlpha()
  gl.getClearColor(r.savedClear)
  scene.overrideMaterial = r.mask
  try {
    gl.setRenderTarget(r.rt)
    gl.setClearColor(r.maskClear, 0)
    gl.clear()
    gl.render(scene, r.maskCamera)
  } finally {
    scene.overrideMaterial = null
    gl.setRenderTarget(prevTarget)
    gl.setClearColor(r.savedClear, prevAlpha)
  }

  if (import.meta.env.DEV) devStats.outlinePasses++
}

// Renders the layer-1 meshes of the scene into a region-bounded mask and composites
// a silhouette ring behind the anchor. `anchorRef`: Object3D whose world position
// is the model centre and whose world scale is the on-screen radius in CSS px.
export default function OutlineLayer({
  anchorRef,
  thicknessCssPx = OUTLINE_THICKNESS_CSS_PX,
  boundsFactor = OUTLINE_BOUNDS_FACTOR,
}) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const dpr = useThree((s) => s.viewport.dpr)

  const r = useMemo(() => createResources(), [])

  // Failing here throws into CanvasErrorBoundary, which falls back to the poster.
  useLayoutEffect(() => {
    const ok =
      gl.capabilities.isWebGL2 &&
      (gl.extensions.has('EXT_color_buffer_float') ||
        gl.extensions.has('EXT_color_buffer_half_float'))
    if (!ok) throw new Error('OutlineLayer: float render targets are not supported')
    if (import.meta.env.DEV && camera.zoom !== 1) {
      throw new Error('OutlineLayer: the camera zoom must be 1 (1 world unit = 1 CSS px)')
    }
  }, [gl, camera])

  useEffect(() => {
    return () => {
      r.rt.dispose()
      r.mask.dispose()
      r.ring.dispose()
      if (r.inner) r.inner.dispose()
      r.geometry.dispose()
      if (scene.overrideMaterial === r.mask) scene.overrideMaterial = null
    }
  }, [r, scene])

  // Priority 0: after PageScene's spin/tilt callback (-1), before R3F's automatic render.
  useFrame(() => {
    runFrame(r, gl, scene, camera, anchorRef, dpr, thicknessCssPx, boundsFactor, width, height)
  }, 0)

  return (
    <>
      <primitive object={r.ringMesh} />
      {r.innerMesh && <primitive object={r.innerMesh} />}
    </>
  )
}
