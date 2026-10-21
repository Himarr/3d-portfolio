import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { SNAP_QUERY } from '../lib/snapConfig.js'
import { snapController } from '../lib/snapController.js'
import { useSmoothScroll } from './SmoothScrollProvider.jsx'

// Activates section snapping on the home page when the viewport is large
// enough and motion is allowed. Renders nothing.
export default function SnapScroller() {
  const lenis = useSmoothScroll()
  const { pathname } = useLocation()
  const wide = useMediaQuery(SNAP_QUERY)
  const reducedMotion = usePrefersReducedMotion()
  const active = lenis != null && pathname === '/' && wide && !reducedMotion

  useEffect(() => {
    if (!lenis) return undefined
    snapController.attach(lenis)
    snapController.setActive(active)
    return () => snapController.setActive(false)
  }, [lenis, active])

  return null
}
