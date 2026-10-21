// Swapping the model means changing this single import.
import moonUrl from '../assets/3D/moon.glb'
import FitToUnit from './FitToUnit.jsx'
import Model from './Model.jsx'

const TILT = -0.18

export default function Moon({ rigRef, spinRef }) {
  return (
    <group ref={rigRef} rotation-z={TILT}>
      <group ref={spinRef}>
        <FitToUnit>
          <Model url={moonUrl} toon outline />
        </FitToUnit>
      </group>
    </group>
  )
}
