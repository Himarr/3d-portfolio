import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const root = (p) => fileURLToPath(new URL(`../../../${p}`, import.meta.url))
export const src = (p) => readFileSync(root(p), 'utf8')
export const loadPlacement = () => import('../../../src/three/alienPlacement.js')

// Moon is centred on the hero (canvas units: 1 unit = 1 CSS px, +Y up), z = 0.
export function input(over = {}) {
  return {
    moonX: 0,
    moonY: -30,
    radius: 390,
    introScale: 1,
    viewportWidth: 1920,
    viewportHeight: 1080,
    timeS: 0,
    ...over,
  }
}
export const run = (m, over) => m.alienPlacement(input(over), { x: 0, y: 0, z: 0, height: 0 })
