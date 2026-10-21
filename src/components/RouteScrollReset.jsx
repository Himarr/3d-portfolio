import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { useSmoothScroll } from './SmoothScrollProvider.jsx'

// New route pushes (no hash) start at the top. ScrollToHash and the 005 scroll
// function own hash navigation; Back (POP) is left to the browser and 005 settle.
export default function RouteScrollReset() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const lenis = useSmoothScroll()

  useLayoutEffect(() => {
    if (navigationType !== 'PUSH' || location.hash !== '') return
    lenis?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
    // Keyed on pathname only: a push to the same path must not re-run on lenis change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return null
}
