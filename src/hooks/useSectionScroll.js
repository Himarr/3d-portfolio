import { useCallback } from 'react'
import { useSmoothScroll } from '../components/SmoothScrollProvider.jsx'
import { snapController } from '../lib/snapController.js'

// The single in-page navigation function. Every hash or link scroll goes
// through it:
//   snapping active  -> snapController.goTo (same animation as wheel/keys)
//   Lenis, no snap   -> lenis.scrollTo(el, { offset: 0 }) (Hero maps to 0)
//   no Lenis (reduced motion) -> el.scrollIntoView() (instant)
export function useSectionScroll() {
  const lenis = useSmoothScroll()

  return useCallback(
    (target, { immediate = false, offset = 0 } = {}) => {
      if (!target) return
      if (snapController.getState().active && snapController.goTo(target, { immediate })) {
        return
      }
      if (!lenis) {
        target.scrollIntoView()
        return
      }
      lenis.scrollTo(target.id === 'hero' ? 0 : target, { offset, immediate })
    },
    [lenis],
  )
}
