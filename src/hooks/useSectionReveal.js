import { useLayoutEffect } from 'react'
import { gsap } from '../lib/gsap.js'
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js'

// Reveals `[data-reveal]` elements inside the ref'd section with a short
// stagger. One-shot ScrollTrigger, no scrub. Hidden "from" state is applied by
// JS only; no-op with reduced motion.
export function useSectionReveal(ref) {
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion) return undefined
    const el = ref.current
    if (!el) return undefined

    const ctx = gsap.context(() => {
      gsap.from('[data-reveal]', {
        opacity: 0,
        y: 24,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          once: true,
        },
      })
    }, ref)

    return () => ctx.revert()
  }, [reducedMotion, ref])
}

export default useSectionReveal
