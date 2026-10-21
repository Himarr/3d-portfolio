import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSectionScroll } from '../hooks/useSectionScroll.js'
import { ScrollTrigger } from '../lib/gsap.js'
import { useSmoothScroll } from './SmoothScrollProvider.jsx'

// Navbar is non-sticky, so no offset is needed. If the navbar becomes
// sticky or fixed, change this to the negative navbar height.
const SCROLL_OFFSET = 0

export default function ScrollToHash() {
  const location = useLocation()
  const lenis = useSmoothScroll()
  const scrollToSection = useSectionScroll()

  useEffect(() => {
    if (location.pathname === '/') ScrollTrigger.refresh()

    if (!location.hash) return undefined
    const el = document.getElementById(location.hash.slice(1))
    if (!el) return undefined

    // A first page load jumps; in-app navigation animates.
    const immediate = location.key === 'default'

    if (!lenis) {
      scrollToSection(el)
      return undefined
    }

    // Lenis caches the page height from the previous (shorter) route, so its
    // scroll limit can be ~0 right after navigating. Re-measure, then scroll
    // on the next frame once layout has settled.
    lenis.resize()
    const raf = requestAnimationFrame(() => {
      lenis.resize()
      scrollToSection(el, { immediate, offset: SCROLL_OFFSET })
    })
    return () => cancelAnimationFrame(raf)
  }, [location.key, location.hash, location.pathname, lenis, scrollToSection])

  return null
}
