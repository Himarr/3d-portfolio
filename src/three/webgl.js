import { maxBufferDim } from './bufferLimits.js'

// Probes WebGL2 on a throwaway canvas. Returns { maxDim } or null when
// WebGL2 is unavailable. The probe context is released immediately.
export function probeWebGL2() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return null
    const maxDim = maxBufferDim(
      gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      gl.getParameter(gl.MAX_VIEWPORT_DIMS),
    )
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return { maxDim }
  } catch {
    return null
  }
}
