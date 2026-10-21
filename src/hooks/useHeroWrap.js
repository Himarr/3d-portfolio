import { useEffect } from 'react'
import { wrapGeometry } from '../lib/heroWrap.js'
import { getMoonRadius, subscribeMoonRadius } from '../lib/moonSize.js'
import { HERO_WRAP_MARGIN_PX } from '../lib/moonConfig.js'

const MIN_PT_PX = 64
const PT_EPSILON_PX = 2
const MAX_PASSES = 3

// Writes the text wrap CSS variables on the Hero element (spec 005 FR-22/23).
// All layout reads happen inside `measure`, which only runs from the
// ResizeObserver callback (it also fires once on observe) or the moon-size
// store; nothing reads layout during render.
export function useHeroWrap(heroRef, textRef, enabled) {
  useEffect(() => {
    if (!enabled) return undefined
    const hero = heroRef.current
    const text = textRef.current
    if (!hero || !text) return undefined

    let lastKey = ''
    let passes = 0
    let lastPt = null

    const measure = () => {
      const heroW = hero.clientWidth
      const heroH = hero.clientHeight
      const textH = text.offsetHeight
      const radius = getMoonRadius()

      const key = `${heroW}x${heroH}@${radius}`
      if (key !== lastKey) {
        lastKey = key
        passes = 0
      }
      if (passes >= MAX_PASSES) return
      passes += 1

      const { size, mt, mr } = wrapGeometry({
        heroW,
        heroH,
        radius,
        margin: HERO_WRAP_MARGIN_PX,
      })
      const style = hero.style
      style.setProperty('--wrap-size', `${size}px`)
      style.setProperty('--wrap-mt', `${mt}px`)
      style.setProperty('--wrap-mr', `${mr}px`)

      const pt = Math.max(MIN_PT_PX, (heroH - textH) / 2)
      if (lastPt === null || Math.abs(pt - lastPt) >= PT_EPSILON_PX) {
        lastPt = pt
        style.setProperty('--wrap-pt', `${pt}px`)
      }
    }

    const observer = new ResizeObserver(measure)
    observer.observe(hero)
    observer.observe(text)
    const unsubscribe = subscribeMoonRadius(measure)

    return () => {
      observer.disconnect()
      unsubscribe()
      ;['--wrap-size', '--wrap-mt', '--wrap-mr', '--wrap-pt'].forEach((p) =>
        hero.style.removeProperty(p),
      )
    }
  }, [heroRef, textRef, enabled])
}
