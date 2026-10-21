import { Fragment, useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/gsap.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'

// Plain text only: never pass links or inline markup. The unsplit text is the
// accessible name; word wrappers are aria-hidden. Full text is in the DOM at
// first render, hidden "from" states are applied by JS only.
export default function SplitHeading({
  as: Tag = 'h2',
  id,
  text,
  className,
  style,
  trigger = 'scroll',
}) {
  const ref = useRef(null)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || trigger !== 'scroll') return undefined
    const el = ref.current
    if (!el) return undefined

    const ctx = gsap.context(() => {
      gsap.from('.word', {
        yPercent: 110,
        opacity: 0,
        stagger: 0.05,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      })
    }, el)

    return () => ctx.revert()
  }, [reducedMotion, trigger, text])

  const words = text.split(' ')

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      style={style}
      aria-label={text}
      data-split
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          <span aria-hidden="true" className="inline-block overflow-hidden">
            <span className="word inline-block">{word}</span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  )
}
