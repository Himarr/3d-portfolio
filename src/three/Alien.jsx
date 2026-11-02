import alienUrl from '../assets/3D/Alien.glb'
import FitToUnit from './FitToUnit.jsx'
import Model from './Model.jsx'

export default function Alien({ rigRef }) {
  return (
    <group ref={rigRef}>
      <FitToUnit>
        <Model url={alienUrl} toon outline />
      </FitToUnit>
    </group>
  )
}
