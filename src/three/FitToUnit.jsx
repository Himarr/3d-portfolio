import { useLayoutEffect, useRef } from 'react'
import { fitToUnit } from './fitToUnit.js'

export default function FitToUnit({ children }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    if (ref.current) fitToUnit(ref.current)
  }, [])

  return <group ref={ref}>{children}</group>
}
