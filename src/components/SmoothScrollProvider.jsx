import { createContext, useContext, useEffect, useState } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../lib/gsap.js'
import { scrollSource } from '../lib/scrollSource.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'

const SmoothScrollContext = createContext(null)

export function SmoothScrollProvider({ children }) {
  const [lenis, setLenis] = useState(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) return undefined

    const instance = new Lenis({ autoRaf: false })
    scrollSource.y = window.scrollY
    // Third argument prioritises the tick (GSAP 3.15 ticker.add unshifts it),
    // so Lenis applies the scroll before any later tick (FR-39 same-frame moon).
    const tick = (t) => {
      instance.raf(t * 1000)
      scrollSource.y = instance.scroll
    }

    gsap.ticker.add(tick, false, true)
    gsap.ticker.lagSmoothing(0)
    instance.on('scroll', ScrollTrigger.update)

    let cancelled = false
    document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh()
    })

    // Lenis is an external system; consumers need a re-render when it exists.
    // oxlint-disable-next-line react/set-state-in-effect
    setLenis(instance)

    return () => {
      cancelled = true
      gsap.ticker.remove(tick)
      scrollSource.y = 0
      instance.off('scroll', ScrollTrigger.update)
      instance.destroy()
      setLenis(null)
    }
  }, [reducedMotion])

  return (
    <SmoothScrollContext.Provider value={lenis}>
      {children}
    </SmoothScrollContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function useSmoothScroll() {
  return useContext(SmoothScrollContext)
}
