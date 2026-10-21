import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { devStats } from './devStats.js'

export default function CanvasGuard({ onLost, onRestored, onShaderError }) {
  const gl = useThree((s) => s.gl)
  const get = useThree((s) => s.get)

  useEffect(() => {
    const canvas = gl.domElement
    canvas.setAttribute('aria-hidden', 'true')
    canvas.setAttribute('tabindex', '-1')

    const handleLost = (event) => {
      event.preventDefault()
      onLost?.()
    }
    const handleRestored = () => {
      onRestored?.()
    }
    canvas.addEventListener('webglcontextlost', handleLost)
    canvas.addEventListener('webglcontextrestored', handleRestored)

    const debug = get().gl.debug
    const previousShaderError = debug.onShaderError
    debug.onShaderError = onShaderError ?? null

    if (import.meta.env.DEV) {
      window.__planetInfo = () => {
        const ctx = gl.getContext()
        return {
          ...gl.info.memory,
          programs: gl.info.programs?.length,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          dpr: gl.getPixelRatio(),
          cssWidth: canvas.clientWidth,
          cssHeight: canvas.clientHeight,
          maxRenderbuffer: ctx.getParameter(ctx.MAX_RENDERBUFFER_SIZE),
          maxViewportDims: ctx.getParameter(ctx.MAX_VIEWPORT_DIMS),
          documentHeight: document.documentElement.scrollHeight,
          frames: devStats.frames,
          moonFrames: devStats.moonFrames,
          stars: devStats.starCount,
          outlinePasses: devStats.outlinePasses,
          outlineRtWidth: devStats.outlineRtWidth,
          outlineRtHeight: devStats.outlineRtHeight,
          moonCyViewport: devStats.moonCyViewport,
          introScale: devStats.introScale,
          moonRadius: devStats.moonRadius,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        }
      }
    }

    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost)
      canvas.removeEventListener('webglcontextrestored', handleRestored)
      debug.onShaderError = previousShaderError
      if (import.meta.env.DEV) {
        delete window.__planetInfo
      }
    }
  }, [gl, get, onLost, onRestored, onShaderError])

  return null
}
