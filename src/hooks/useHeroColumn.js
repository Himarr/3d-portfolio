import { useEffect } from 'react'
import { setHeroColumnInputs } from '../lib/moonSize.js'

// Publishes the Hero text block height (and the navbar height) to the moon
// size store in column mode (spec 005 FR-23). One ResizeObserver; layout reads
// happen only in its callback, which also fires once on observe.
export function useHeroColumn(textRef, enabled) {
  useEffect(() => {
    if (!enabled) return undefined
    const text = textRef.current
    if (!text) return undefined
    const header = document.querySelector('header')

    const observer = new ResizeObserver(() => {
      const navH = header ? header.offsetHeight : 0
      setHeroColumnInputs(text.offsetHeight, navH || 61)
    })
    observer.observe(text)
    if (header) observer.observe(header)
    return () => observer.disconnect()
  }, [textRef, enabled])
}
