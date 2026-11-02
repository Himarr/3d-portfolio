import { createToonMaterial } from '../../../src/three/toonMaterial.js'

const FRAG = '#include <common>\nvoid main(){\n#include <opaque_fragment>\n}'

// Runs the material's onBeforeCompile on a fake shader and returns it.
export function compileToon() {
  const material = createToonMaterial({ name: 'x' })
  const shader = { uniforms: {}, fragmentShader: FRAG }
  material.onBeforeCompile(shader)
  return shader
}

// Source of celShade() onwards.
export function celShadeBody(glsl) {
  const start = glsl.indexOf('vec3 celShade')
  if (start < 0) throw new Error('celShade not found')
  return glsl.slice(start)
}
