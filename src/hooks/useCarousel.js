import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap.js'
import { SNAP_QUERY } from '../lib/snapConfig.js'
import { CAROUSEL_TRANSITION_S, CAROUSEL_EASE, CAROUSEL_AUTOPLAY_MS, CAROUSEL_VISIBLE_RATIO, CAROUSEL_SWIPE_CLICK_SUPPRESS_MS } from '../lib/carouselConfig.js'
import { computeCarouselGeometry } from '../lib/carouselGeometry.js'
import { poolSize, slotRel, slotStyle, activeSlot as toActiveSlot, activeProject as toActiveProject, goTarget, autoplayAllowed, liveModeFor, classifyCarouselWheel, classifySwipe } from '../lib/carouselLogic.js'
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js'

// DEV only: counts of mounted instances and attached observers/listeners for StrictMode symmetry checks.
const devCounters = { instances: 0, listeners: 0, observers: 0 }
// DEV only: the live instance read by window.__carouselInfo.
const devState = { read: null }

export function useCarousel({ projects, regionRef, viewportRef, trackRef }) {
  const n = projects.length
  const pool = poolSize(n)
  const reducedMotion = usePrefersReducedMotion()

  const targetRef = useRef(0)
  const posRef = useRef({ v: 0 })
  const stepRef = useRef(0)
  const movingRef = useRef(false)
  const tweenRef = useRef(null)
  const slotRefs = useRef([])
  const linkRefs = useRef([])
  const reducedRef = useRef(reducedMotion)
  const timerRef = useRef(null)
  const flagsRef = useRef({ hover: false, focusWithin: false, documentHidden: false, visible: false, reducedMotion })
  const advancesRef = useRef([])
  const goRef = useRef(null)
  const lastWheelRef = useRef(-Infinity)
  const innerWidthRef = useRef(typeof window === 'undefined' ? 0 : window.innerWidth)
  const swipeStartRef = useRef(null)
  const suppressClickUntilRef = useRef(0)
  const refocusRef = useRef(false)
  const [view, setView] = useState({ activeSlot: 0, activeProject: 0, moving: false })

  // Write transform, opacity and visibility for every slot. No layout reads.
  const apply = useCallback(() => {
    const step = stepRef.current
    const slots = slotRefs.current
    for (let slot = 0; slot < pool; slot++) {
      const el = slots[slot]
      if (!el) continue
      const s = slotStyle(slotRel(slot, posRef.current.v, pool))
      el.style.transform = `translate3d(${s.x * step}px, 0, 0) scale(${s.scale})`
      el.style.opacity = String(s.opacity)
      el.style.visibility = s.visible ? 'visible' : 'hidden'
    }
  }, [pool])

  const setMoving = useCallback((moving) => {
    movingRef.current = moving
    setView((v) => (v.moving === moving ? v : { ...v, moving }))
  }, [])

  const onComplete = useCallback(() => {
    tweenRef.current = null
    setMoving(false)
  }, [setMoving])

  const writeLive = useCallback(
    (mode) => {
      const track = trackRef?.current
      if (track && track.getAttribute('aria-live') !== mode) track.setAttribute('aria-live', mode)
    },
    [trackRef],
  )

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Gate closed clears the timer; gate open with no timer starts a fresh interval; open with a timer does nothing.
  const syncAutoplay = useCallback(() => {
    const allowed = autoplayAllowed({ n, ...flagsRef.current })
    if (!allowed) {
      clearTimer()
      writeLive(liveModeFor({ autoplayRunning: false, lastChangeManual: true }))
      return
    }
    if (timerRef.current !== null) return
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      writeLive('off')
      goRef.current?.('next', 'auto')
    }, CAROUSEL_AUTOPLAY_MS)
  }, [n, clearTimer, writeLive])

  const restartAutoplay = useCallback(() => {
    clearTimer()
    syncAutoplay()
  }, [clearTimer, syncAutoplay])

  // kind: 'auto' | 'button' | 'dot' | 'key' | 'wheel' | 'swipe' | 'side-click'
  const goToAction = useCallback(
    (action, kind = 'button') => {
      if (pool < 2) return
      const next = goTarget(targetRef.current, action, n)
      if (next === targetRef.current) return
      if (kind !== 'auto') writeLive('polite')
      if (import.meta.env.DEV) {
        advancesRef.current.push({ t: performance.now(), kind })
        if (advancesRef.current.length > 20) advancesRef.current.shift()
      }
      targetRef.current = next
      restartAutoplay()
      setView((v) => ({
        ...v,
        activeSlot: toActiveSlot(next, pool),
        activeProject: toActiveProject(next, n),
      }))
      if (reducedRef.current) {
        gsap.killTweensOf(posRef.current)
        tweenRef.current = null
        posRef.current.v = next
        setMoving(false)
        apply()
        return
      }
      setMoving(true)
      tweenRef.current = gsap.to(posRef.current, {
        v: next,
        duration: CAROUSEL_TRANSITION_S,
        ease: CAROUSEL_EASE,
        overwrite: true,
        onUpdate: apply,
        onComplete,
      })
    },
    [pool, n, apply, setMoving, onComplete, writeLive, restartAutoplay],
  )

  useEffect(() => {
    goRef.current = goToAction
  }, [goToAction])

  const next = useCallback((kind = 'button') => goToAction('next', kind), [goToAction])
  const prev = useCallback((kind = 'button') => goToAction('prev', kind), [goToAction])
  const goProject = useCallback((index, kind = 'dot') => goToAction({ type: 'project', index }, kind), [goToAction])
  // Move by a signed number of slots from the current target (one activation = one slide at a time).
  const goRelative = useCallback(
    (rel, kind = 'side-click') => {
      if (pool < 2 || !rel) return
      goToAction(rel > 0 ? 'next' : 'prev', kind)
    },
    [pool, goToAction],
  )

  // Reduced motion turning on mid-tween: kill the tween and jump to the target.
  useEffect(() => {
    reducedRef.current = reducedMotion
    flagsRef.current.reducedMotion = reducedMotion
    if (reducedMotion && tweenRef.current) {
      gsap.killTweensOf(posRef.current)
      tweenRef.current = null
      posRef.current.v = targetRef.current
      setMoving(false)
      apply()
    }
    // Reduced motion clears the timer at once; turning it off allows a fresh interval.
    syncAutoplay()
  }, [reducedMotion, apply, setMoving, syncAutoplay])

  // Autoplay pause sources. Pool below 2 attaches nothing.
  useEffect(() => {
    if (n < 2) {
      writeLive('polite')
      return undefined
    }
    const region = regionRef.current
    if (!region) return undefined
    const flags = flagsRef.current
    flags.hover = false
    flags.focusWithin = false
    flags.visible = false
    flags.documentHidden = document.hidden
    const onEnter = (e) => {
      if (e.pointerType === 'touch') return
      flags.hover = true
      syncAutoplay()
    }
    const onLeave = (e) => {
      if (e.pointerType === 'touch') return
      flags.hover = false
      syncAutoplay()
    }
    const onFocusIn = (e) => {
      let visibleFocus = true
      try {
        visibleFocus = e.target.matches(':focus-visible')
      } catch {
        visibleFocus = true
      }
      flags.focusWithin = visibleFocus
      syncAutoplay()
    }
    const onFocusOut = (e) => {
      if (e.relatedTarget && region.contains(e.relatedTarget)) return
      flags.focusWithin = false
      syncAutoplay()
    }
    const onVisibility = () => {
      flags.documentHidden = document.hidden
      syncAutoplay()
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (!entry) return
        flags.visible = entry.intersectionRatio >= CAROUSEL_VISIBLE_RATIO
        syncAutoplay()
      },
      { threshold: [0, CAROUSEL_VISIBLE_RATIO, 1] },
    )
    region.addEventListener('pointerenter', onEnter)
    region.addEventListener('pointerleave', onLeave)
    region.addEventListener('focusin', onFocusIn)
    region.addEventListener('focusout', onFocusOut)
    document.addEventListener('visibilitychange', onVisibility)
    observer.observe(region)
    if (import.meta.env.DEV) {
      devCounters.listeners += 5
      devCounters.observers += 1
    }
    syncAutoplay()
    return () => {
      region.removeEventListener('pointerenter', onEnter)
      region.removeEventListener('pointerleave', onLeave)
      region.removeEventListener('focusin', onFocusIn)
      region.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('visibilitychange', onVisibility)
      observer.disconnect()
      clearTimer()
      if (import.meta.env.DEV) {
        devCounters.listeners -= 5
        devCounters.observers -= 1
      }
    }
  }, [n, regionRef, syncAutoplay, clearTimer, writeLive])

  // Wheel: non-passive on the region so a horizontal gesture can be consumed. No layout reads.
  useEffect(() => {
    if (pool < 2) return undefined
    const region = regionRef.current
    if (!region) return undefined
    const onWheel = (e) => {
      const result = classifyCarouselWheel({
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        ctrlKey: e.ctrlKey,
        deltaMode: e.deltaMode,
        now: performance.now(),
        lastEventAt: lastWheelRef.current,
        moving: movingRef.current,
        innerWidth: innerWidthRef.current,
      })
      if (result === 'pass') return
      e.preventDefault()
      e.stopPropagation()
      lastWheelRef.current = performance.now()
      if (result === 'slide-next') goRef.current?.('next', 'wheel')
      else if (result === 'slide-prev') goRef.current?.('prev', 'wheel')
    }
    region.addEventListener('wheel', onWheel, { passive: false })
    if (import.meta.env.DEV) devCounters.listeners += 1
    return () => {
      region.removeEventListener('wheel', onWheel)
      if (import.meta.env.DEV) devCounters.listeners -= 1
    }
  }, [pool, regionRef])

  // Swipe: passive Pointer Events on the viewport, touch and pen only. Never prevents default.
  useEffect(() => {
    if (pool < 2) return undefined
    const viewport = viewportRef?.current
    if (!viewport) return undefined
    const onDown = (e) => {
      if (e.pointerType === 'mouse' || !e.isPrimary) return
      swipeStartRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
    }
    const onUp = (e) => {
      const start = swipeStartRef.current
      if (!start || start.id !== e.pointerId) return
      swipeStartRef.current = null
      const dir = classifySwipe({ dx: e.clientX - start.x, dy: e.clientY - start.y })
      if (!dir) return
      suppressClickUntilRef.current = performance.now() + CAROUSEL_SWIPE_CLICK_SUPPRESS_MS
      goRef.current?.(dir, 'swipe')
    }
    const onCancel = () => {
      swipeStartRef.current = null
    }
    viewport.addEventListener('pointerdown', onDown, { passive: true })
    viewport.addEventListener('pointerup', onUp, { passive: true })
    viewport.addEventListener('pointercancel', onCancel, { passive: true })
    if (import.meta.env.DEV) devCounters.listeners += 3
    return () => {
      viewport.removeEventListener('pointerdown', onDown)
      viewport.removeEventListener('pointerup', onUp)
      viewport.removeEventListener('pointercancel', onCancel)
      swipeStartRef.current = null
      if (import.meta.env.DEV) devCounters.listeners -= 3
    }
  }, [pool, viewportRef])

  // Keyboard: ArrowLeft / ArrowRight without modifiers. Everything else is ignored.
  const onKeyDown = useCallback(
    (event) => {
      if (pool < 2 || event.defaultPrevented) return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
      event.preventDefault()
      const link = linkRefs.current[toActiveSlot(targetRef.current, pool)]
      refocusRef.current = !!link && document.activeElement === link
      goToAction(event.key === 'ArrowRight' ? 'next' : 'prev', 'key')
    },
    [pool, goToAction],
  )

  // A swipe just ended: swallow the click that follows on a card link.
  const onLinkClick = useCallback((event) => {
    if (performance.now() < suppressClickUntilRef.current) event.preventDefault()
  }, [])

  // Focus handoff: after a key move from a focused link, focus the new active slot's link.
  useLayoutEffect(() => {
    if (!refocusRef.current) return
    refocusRef.current = false
    linkRefs.current[view.activeSlot]?.focus({ preventScroll: true })
  }, [view.activeSlot])

  // Geometry: measure once before first paint, then on resize. The tween is untouched.
  useLayoutEffect(() => {
    if (pool < 2) return undefined
    const region = regionRef.current
    const pos = posRef.current
    if (!region) return undefined
    const measure = () => {
      innerWidthRef.current = window.innerWidth
      const g = computeCarouselGeometry({
        regionWidth: region.clientWidth,
        viewportHeight: window.innerHeight,
        snapOn: window.matchMedia(SNAP_QUERY).matches,
        rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize) || 16,
      })
      region.style.setProperty('--carousel-card-w', `${g.cardW}px`)
      region.style.setProperty('--carousel-step', `${g.step}px`)
      stepRef.current = g.step
      apply()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(region)
    window.addEventListener('resize', measure)
    if (import.meta.env.DEV) {
      devCounters.observers += 1
      devCounters.listeners += 1
    }
    return () => {
      gsap.killTweensOf(pos)
      tweenRef.current = null
      movingRef.current = false
      observer.disconnect()
      window.removeEventListener('resize', measure)
      if (import.meta.env.DEV) {
        devCounters.observers -= 1
        devCounters.listeners -= 1
      }
    }
  }, [pool, regionRef, apply])

  // DEV only inspection hook.
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    devCounters.instances += 1
    devState.read = () => ({
      n,
      pool,
      target: targetRef.current,
      pos: posRef.current.v,
      activeSlot: toActiveSlot(targetRef.current, pool),
      activeProject: toActiveProject(targetRef.current, n),
      moving: movingRef.current,
      paused: Object.entries({
        hover: flagsRef.current.hover,
        focus: flagsRef.current.focusWithin,
        hidden: flagsRef.current.documentHidden,
        'out-of-view': !flagsRef.current.visible,
        'reduced-motion': flagsRef.current.reducedMotion,
      })
        .filter(([, on]) => on)
        .map(([k]) => k),
      timers: timerRef.current !== null ? 1 : 0,
      listeners: devCounters.listeners,
      observers: devCounters.observers,
      live: trackRef?.current?.getAttribute('aria-live') ?? null,
      advances: advancesRef.current.slice(),
      reducedMotion: reducedRef.current,
      instances: devCounters.instances,
    })
    const read = devState.read
    window.__carouselInfo = () => devState.read()
    return () => {
      devCounters.instances -= 1
      if (devState.read === read) {
        devState.read = null
        delete window.__carouselInfo
      }
    }
  }, [n, pool, trackRef])

  return {
    activeSlot: view.activeSlot,
    activeProject: view.activeProject,
    pool,
    slotRefs,
    linkRefs,
    next,
    prev,
    goProject,
    goRelative,
    onKeyDown,
    onLinkClick,
    moving: view.moving,
  }
}
