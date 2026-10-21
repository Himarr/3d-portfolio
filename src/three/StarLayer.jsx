import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, PointsMaterial } from 'three'
import { createStarPositions } from './starfield.js'

// Star colour, duplicated from --color-text in src/index.css. Keep in sync by hand.
const STAR_COLOR = 0xe8ecf5
const STAR_SIZE_CSS_PX = 1.6
export const STAR_OPACITY = 0.85

// Four <points> copies (2x2) share one geometry and one material so the star field can
// wrap in both axes (drift in x, scroll parallax in y) without a custom shader or
// buffer re-uploads. PageScene positions the copies every frame via the group's
// children (indices 0..3).
//   cap   : positions generated once for this many stars
//   count : stars drawn (draw range), changes with the canvas size without any
//           regeneration or allocation
export default function StarLayer({ cap, count, width, height, copiesRef }) {
  const dpr = useThree((s) => s.viewport.dpr)

  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute(
      'position',
      new BufferAttribute(createStarPositions(cap), 3),
    )
    return g
  }, [cap])

  const material = useMemo(
    () =>
      new PointsMaterial({
        color: STAR_COLOR,
        size: STAR_SIZE_CSS_PX * dpr,
        sizeAttenuation: false,
        transparent: true,
        opacity: STAR_OPACITY,
        depthWrite: false,
      }),
    [dpr],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    geometry.setDrawRange(0, count)
  }, [geometry, count])

  return (
    <group scale={[width, height, 1]}>
      <group ref={copiesRef}>
        <points geometry={geometry} material={material} frustumCulled={false} />
        <points geometry={geometry} material={material} frustumCulled={false} />
        <points geometry={geometry} material={material} frustumCulled={false} />
        <points geometry={geometry} material={material} frustumCulled={false} />
      </group>
    </group>
  )
}
