import { Box3, Vector3 } from 'three'

// Module-level scratch objects: setup-time only, never per frame.
const box = new Box3()
const size = new Vector3()
const center = new Vector3()

// Scales and offsets `group` so its contents fit a sphere-ish unit radius centred at the origin.
export function fitToUnit(group) {
  group.position.set(0, 0, 0)
  group.scale.setScalar(1)
  // Measure in the group's own local frame: detach from ancestors (placement, tilt) while measuring.
  const parent = group.parent
  group.parent = null
  group.updateWorldMatrix(false, true)
  box.setFromObject(group, true)
  group.parent = parent
  if (box.isEmpty()) {
    group.updateWorldMatrix(true, true)
    return
  }
  box.getSize(size)
  box.getCenter(center)
  const maxSize = Math.max(size.x, size.y, size.z)
  if (!(maxSize > 0)) {
    group.updateWorldMatrix(true, true)
    return
  }
  const scale = 1 / (maxSize / 2)
  group.scale.setScalar(scale)
  group.position.copy(center).multiplyScalar(-scale)
  group.updateWorldMatrix(true, true)
}
