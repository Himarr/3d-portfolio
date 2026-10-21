import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { gsap } from '../lib/gsap.js'
import { recordSync } from './devSyncProbe.js'

// Single render clock (FR-39). The Canvas runs with frameloop="never"; this
// callback renders it from gsap.ticker, after the prioritised Lenis tick has
// applied the scroll, so the moon is placed from the scroll value the DOM just
// received. gsap.ticker passes seconds, which is what advance() expects.
export default function FrameDriver({ activeRef }) {
  const advance = useThree((s) => s.advance)

  useEffect(() => {
    const tick = (time) => {
      if (activeRef.current) {
        advance(time)
        if (import.meta.env.DEV) recordSync()
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [advance, activeRef])

  return null
}
