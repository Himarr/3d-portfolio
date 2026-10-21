# Tasks: 005 Scroll Snap, Full-Screen Sections, Hero, Navbar, Section Arrows and Fixed Canvas

Markers: `- [ ]` pending, `- [~]` built, `- [x]` verified.

Rules for all tasks:
- No new npm dependency (spec NFR-3); `package.json` gets only the `check:snap` and `check:moon` scripts. Change only the files listed; if something else seems to need a change, stop and report.
- `three`, `@react-three/*` are imported only inside `src/three/`. `src/lib/*` and `src/hooks/*` import no three/R3F. Files that are not components live in `.js` files (oxlint `only-export-components`).
- No layout reads (`offsetHeight`, `getBoundingClientRect`, `scrollHeight`, `getComputedStyle`) and no allocation inside rAF, `gsap.ticker`, scroll, wheel or `useFrame` callbacks (NFR-2). Layout reads only inside `ResizeObserver`/`IntersectionObserver`/`matchMedia` callbacks.
- New UI uses the existing `@theme` tokens only (NFR-7). Every add has a matching remove in the same effect (StrictMode safe).
- Snap code never calls `focus()` or `blur()`, except the arrow focus handoff of T-26.
- Every code task ends with `npm run lint` and `npm run build` exit 0, and the app starts in `npm run dev` with no console errors. Do not improvise: if a plan assumption fails (Lenis API, R3F `advance`, `gsap.ticker` priority), stop and report with the fallback named in plan.md.
- "Needs" lists dependencies (earlier tasks). Tasks are ordered so the app works after each one.
- "Browser check: yes" means: after the builder marks the task `[~]`, the orchestrator launches `sdd-browser` with the listed checks and passes its report to the user. "Browser check: no" means lint/build/scripts plus the user's manual look are enough. Tasks marked "measurement" run `sdd-browser` BEFORE the builder, which then records the report in `baseline.md`.
- Model hint: tasks marked `Model: haiku` are small and mechanical; all others sonnet.

Order note (differs from plan.md "Order of work"): the plan puts the fixed canvas at step 7. The risky foundation (single render clock, fixed canvas, moon anchoring, DPR) is moved first (Layer 2, T-07 to T-14) so it can be checked alone while the old layout still works. It depends only on the pure libs (Layer 1) and Lenis. The remaining layers follow plan steps 2 to 6, 8 and 9.

## Layer 0: Baseline (before any code change)

- [~] T-01 Record baseline measurements (measurement)
  - Files: `specs/005-scroll-snap-hero-navbar/baseline.md` (create), `specs/005-scroll-snap-hero-navbar/before-1440x900.png`, `before-375x812.png` (create; not imported by code)
  - Needs: none. Must run before T-07.
  - Do: Run `npm run build` on the unchanged repo and record in a "Before" section: date, entry and 3D chunk file names with raw and gzip sizes, whether the entry chunk contains `WebGLRenderer`/`@react-three` (expected none), and the `package.json` dependency list. From the `sdd-browser` report (dev server, existing `window.__planetInfo()`), record: moon body diameter (outline excluded) and centre at scroll 0 at 1920x1080, 1440x900, 1366x768 and 375x812; Hero box and navbar height; `document.documentElement.scrollHeight` at 1920x1080 and 1440x900; canvas `width x height`, effective DPR, `MAX_RENDERBUFFER_SIZE`, `MAX_VIEWPORT_DIMS` at 1920x1080 and 1440x900 with emulated device DPR 2 and at 375x812 DPR 3 coarse; star count (`stars`) and the number of stars visible in the first viewport at 1440x900 scroll 0 (count by projecting positions, or `stars x 900 / canvasHeight`; state the method). Save the two screenshots (scroll 0, pointer idle). Add empty headings "After", "Fixed canvas and DPR report (AC-37)", "Star density (AC-39)", "Manual checks".
  - Covers: AC-1 (before), AC-16 (before value), AC-37 (before values), AC-39 (before screenshot), NFR-3
  - Done when: `baseline.md` has every number above for every listed size, both PNGs exist at the stated viewport sizes, build exit 0, no file outside the spec folder changed.
  - Browser check: yes (measurement) - moon diameters, canvas/DPR values, `scrollHeight`, star counts at the sizes above, two screenshots.

## Layer 1: Pure libraries and Node checks (no UI change)

- [~] T-02 Add snap constants, core snap maths and `check:snap`
  - Files: `src/lib/snapConfig.js` (create), `src/lib/snapMath.js` (create), `scripts/check-snap.mjs` (create), `package.json` (add script `"check:snap": "node scripts/check-snap.mjs"` only)
  - Needs: none
  - Do: `snapConfig.js` (commented, pure): `SNAP_MIN_WIDTH_PX 1024`, `SNAP_MIN_HEIGHT_PX 700`, `SNAP_QUERY` built from them (`(min-width: 1024px) and (min-height: 700px)`), `SNAP_DURATION_S 1.0`, `SNAP_COOLDOWN_MS 200`, `SNAP_GESTURE_GAP_MS 100`, `SNAP_NEW_GESTURE_RATIO 2`, `SNAP_NEW_GESTURE_MIN_DELTA 40`, `SNAP_WHEEL_NOISE_DELTA 2`, `SNAP_SETTLE_DEBOUNCE_MS 200`, `SNAP_POSITION_EPSILON_PX 1`, `SNAP_FOCUS_WINDOW_MS 600`. `snapMath.js` (pure): `easeInOutCubic`, `nearestIndex(points, y)`, `stepIndex(index, dir, last)` (clamped), `normaliseWheelDelta(event-like, innerHeight)` (line x 16, page x innerHeight), `settleTarget({ points, scroll, focusIndex, epsilon })` (returns the nearest index, or `focusIndex` when given; `null` when already within epsilon). `check-snap.mjs` (`node:assert`, one pass line per case): ease endpoints 0 and 1 and monotonic; `nearestIndex`/`stepIndex` at both ends and ties; `normaliseWheelDelta` modes; `settleTarget` nearest, focus override, epsilon no-op; `SNAP_QUERY` string matches the two constants.
  - Covers: FR-1, FR-2, FR-6, FR-8, FR-9, FR-10, AC-7, NFR-6, AC-43
  - Done when: `npm run check:snap` exits 0; `grep -n "import" src/lib/snapMath.js` shows only `snapConfig.js`; lint exit 0.
  - Browser check: no (pure code, no UI)

- [~] T-03 Add wheel classifier and key filter to `snapMath.js`
  - Files: `src/lib/snapMath.js`, `scripts/check-snap.mjs`
  - Needs: T-02
  - Do: Add `classifyWheel({ now, lastWheelAt, lastAbsDelta, absDelta, moveEndAt, moving, ctrlKey, deltaX, deltaY })` returning `'move' | 'ignore' | 'pass'` with the plan D-B rules in order (Ctrl or `|deltaX| > |deltaY|` or `absDelta < SNAP_WHEEL_NOISE_DELTA` is `'pass'`; moving is `'ignore'`; inside `SNAP_COOLDOWN_MS` of `moveEndAt` is `'ignore'`; quiet gap of `SNAP_GESTURE_GAP_MS` is `'move'`; same stream is `'move'` only if `absDelta >= SNAP_NEW_GESTURE_MIN_DELTA` and `>= lastAbsDelta * SNAP_NEW_GESTURE_RATIO`, else `'ignore'`). Add `shouldHandleKey({ key, shiftKey, ctrlKey, altKey, metaKey, defaultPrevented, repeat, targetTag, targetRole, isContentEditable })` returning `{ action: 'next'|'prev'|'first'|'last'|null, preventOnly: boolean }` per the plan (PageDown/ArrowDown/Space next; PageUp/ArrowUp/Shift+Space prev; Home first; End last; skipped for Ctrl/Alt/Meta, `defaultPrevented`, `input|textarea|select`, contenteditable, Space on `button|summary|checkbox`, arrows on roles `slider|menu|menuitem|tab|tablist|listbox|option|radio|spinbutton|combobox|textbox`; `repeat` gives `preventOnly: true`). Extend `check-snap.mjs`: a notched wheel (one event, then 200 ms later another) accepted twice; 10 events at 50 ms during a move all `'ignore'`; a synthetic trackpad stream (about 60 events over 1.5 s, first delta large, decaying) yields exactly one `'move'`; a second gesture after a 150 ms pause yields one `'move'`; a rising flick on a tail (2x and above 40) moves; noise and Ctrl give `'pass'`; key matrix (all keys, Shift+Space, modifiers, `input`/`textarea`/`button`/role cases, `repeat`).
  - Covers: FR-3, FR-4, FR-5, FR-7, FR-8, AC-4, AC-5, AC-6
  - Done when: `npm run check:snap` exits 0 and prints the new cases; no DOM access in `snapMath.js`; lint exit 0.
  - Browser check: no (pure code)

- [~] T-04 Add moon constants, size function and `check:moon`
  - Files: `src/lib/moonConfig.js` (create), `src/lib/moonSize.js` (create), `scripts/check-moon.mjs` (create), `package.json` (add script `"check:moon": "node scripts/check-moon.mjs"` only)
  - Needs: none
  - Do: `moonConfig.js` (commented, no import except `MOON_RADIUS_PER_HERO_HEIGHT` from `../three/moonFraming.js`, which is pure): `HERO_REF_WIDTH_PX 1920`, `HERO_REF_HEIGHT_PX 1080`, `NAVBAR_REF_HEIGHT_PX 61`, `MOON_REF_RADIUS_PX = MOON_RADIUS_PER_HERO_HEIGHT * (1080 - 61)` (derived, about 404.8), `MOON_SCALE_FACTOR 0.9`, `MOON_MIN_RADIUS_PX 128`, `MOON_SIDE_MARGIN_PX 24`, `MOON_INTRO_START_SCALE 0.6`, `MOON_INTRO_DURATION_S 3`, `MOON_INTRO_EASE 'power2.out'`, `HERO_WRAP_MARGIN_PX 20`, `HERO_WRAP_MIN_WIDTH_PX 1024`, `HERO_H1_RADIUS_RATIO 0.26`. `moonSize.js`: `moonFinalRadiusPx(vw, vh) = min(max(MOON_REF_RADIUS_PX * MOON_SCALE_FACTOR * min(vw/1920, vh/1080), MOON_MIN_RADIUS_PX), (vw - 2*MOON_SIDE_MARGIN_PX)/2)`; `moonPosterSidePx(r) = r / MOON_RADIUS_PER_HERO_HEIGHT`; a tiny store `setViewport(w, h)`, `getMoonRadius()`, `subscribeMoonRadius(fn)` (initial value computed from `1920x1080`, replaced on first `setViewport`). `check-moon.mjs`: the plan's size table within 0.5 px (1920x1080 diameter 728.6, 1440x900, 1366x768, 1280x720, 1920x700, 1024x768, 1024x700, 375x812 = 256, 320x568 = 256); floor and ceiling inactive for every size at or above 1024x700 on a grid up to 2560x1440; at 375x812 and 320x568 side clearance at least 24 px and diameter under 596; ratios 0.75 and 0.711 of the 1920x1080 diameter within 3%; `MOON_MIN_RADIUS_PX <=` the 1024x700 plain radius; poster side equals radius over the framing constant; `MOON_REF_RADIUS_PX` within 0.5 px of 404.8.
  - Covers: FR-19, FR-21, AC-16, AC-17, AC-18 (shared function), NFR-6
  - Done when: `npm run check:moon` exits 0 with a pass line per case; `grep -rn "three" src/lib/moonConfig.js src/lib/moonSize.js` shows only the `moonFraming.js` import path; lint exit 0.
  - Browser check: no (pure code)

- [~] T-05 Add wrap geometry and arrow constants
  - Files: `src/lib/heroWrap.js` (create), `src/lib/arrowConfig.js` (create), `scripts/check-moon.mjs`
  - Needs: T-04
  - Do: `heroWrap.js`: `wrapGeometry({ heroW, heroH, radius, margin }) -> { size, mt, mr }` with `size = 2(R+m)`, `mt = max(0, heroH/2 - (R+m))`, `mr = heroW/2 - (R+m)`. `arrowConfig.js` (commented): `SECTION_ARROW_OFFSET_PX 16`, `SECTION_ARROW_SIZE_PX 44`. Extend `check-moon.mjs`: for a grid of Hero sizes, the float circle centre (`heroW - mr - size/2`, `mt + size/2`, with `mt` unclamped when it fits) equals the Hero centre (`heroW/2`, `heroH/2`) within 0.01 px; arrow-to-moon gap (arrow top = `vh - 16 - 44`, moon bottom = `61 + (vh - 61)/2 + R`) at 1920x1080, 1920x700, 1440x900, 1366x768, 1024x768, 1024x700 is at least `HERO_WRAP_MARGIN_PX` (1920x700 about 23.4, others as in plan.md).
  - Covers: FR-22, FR-28 (constants), FR-30 (clearance numbers), AC-19 (centre part), AC-24 (gap numbers)
  - Done when: `npm run check:moon` exits 0; lint exit 0; no imports from three.
  - Browser check: no (pure code)

- [~] T-06 Add star wrap maths and star count helper
  - Files: `src/three/starScroll.js` (create), `src/three/starfield.js`, `scripts/check-snap.mjs`
  - Needs: T-02
  - Do: `starScroll.js` (pure, no three): export `STAR_SCROLL_PARALLAX_FACTOR = 0.15` (commented), `starOffsets(scroll, factor, W, H, drift, out)` writing `{ dx, dy }` into `out` (`dx = drift * W`, `dy = (scroll * factor) mod H`, always in `[0, W)` and `[0, H)`), and `coversViewport(W, H, dx, dy)` (true when the four copies at `(dx,dy)`, `(dx-W,dy)`, `(dx,dy-H)`, `(dx-W,dy-H)` cover `[0,W]x[0,H]`). In `starfield.js` (add only): `STAR_DENSITY_PER_MPX = 500` (commented as provisional, final value set in T-14) and `starCountFor(w, h, cap, density) = min(cap, round(density * w * h / 1e6))`. Extend `check-snap.mjs`: `coversViewport` true on a grid of scroll 0..20000, sizes (375x812, 1440x900, 1920x1080), drift 0..0.999; `starOffsets` result in range and shift per scroll distance at most the factor (no `out` allocation); `starCountFor` caps at 2000 and 800, monotonic in area.
  - Covers: FR-40, AC-39 (script part)
  - Done when: `npm run check:snap` exits 0; the existing `createStarPositions` output is unchanged (prefix property); lint exit 0.
  - Browser check: no (pure code)

## Layer 2: Risky foundation - render clock, fixed canvas, moon anchoring, DPR (old layout stays; checked on its own)

- [~] T-07 Make the outline layer allocation-free under a moving anchor
  - Files: `src/three/outlineRegion.js`, `src/three/OutlineLayer.jsx`, `scripts/check-cel.mjs`
  - Needs: T-01
  - Do: `computeOutlineRegion(params, out)`: optional `out` argument; when given, write results into it and return it (no new object); without `out` behaviour is unchanged. In `OutlineLayer.jsx` split `relayout` into `resize` (region, render target, frustum: runs only when regionRadius, DPR, thickness or canvas size change) and `reposition` (camera and quad centre: runs when anchor x or y changes), both writing into preallocated objects (no `new`, literals or closures in the frame callback). Size the region and render target from `anchor.userData.regionRadius ?? radius` (final radius), so a scale change from the intro does not resize the target; the radius itself only updates `uRadius`. Frame ordering (anchor callback priority -1 before this layer at 0) is unchanged. Extend `check-cel.mjs`: `out` form returns the same values as the allocating form and is the same object; region unchanged for different `canvasHeight`.
  - Covers: FR-39 (outline follows in the same frame), NFR-2, NFR-5, AC-38 (outline part), AC-41
  - Done when: `npm run check:cel` exits 0 with the new asserts; code inspection shows no allocation in the frame callback or `reposition`; lint and build exit 0; moon and outline look the same and the console is clean.
  - Browser check: yes - moon with outline renders as before at 1440x900 and 375x812; scrolling the page with the moon in view keeps the outline attached to the body with no console errors.

- [~] T-08 Add `scrollSource` and prioritise the Lenis tick
  - Files: `src/lib/scrollSource.js` (create), `src/components/SmoothScrollProvider.jsx`
  - Needs: T-01
  - Model: haiku
  - Do: `scrollSource.js`: `export const scrollSource = { y: 0 }` with a comment (value Lenis applied in the current tick; read by the canvas). In `SmoothScrollProvider.jsx`: initialise `scrollSource.y = window.scrollY` when the instance is created; register the tick with `gsap.ticker.add(tick, false, true)` (third argument = prioritise, so it runs first) and, right after `instance.raf(t * 1000)`, set `scrollSource.y = instance.scroll`. Keep `lagSmoothing(0)`, the `ScrollTrigger.update` hookup, cleanup, and the reduced-motion early return as they are. The builder checks in the GSAP 3.15 source that the third `add` argument is `prioritize` and reports it. On cleanup reset `scrollSource.y = 0`.
  - Covers: FR-14, FR-39 (scroll source), NFR-2
  - Done when: lint and build exit 0; `scrollSource.y` equals `window.scrollY` at rest and tracks while scrolling (dev console check); one Lenis instance still; no console errors.
  - Browser check: no (the next task renders from this value and is checked in the browser)

- [~] T-09 Drive the R3F render from one shared clock (`FrameDriver`)
  - Files: `src/three/FrameDriver.jsx` (create), `src/three/PageCanvas.jsx`
  - Needs: T-08
  - Do: `FrameDriver({ activeRef })` renders `null`; `const advance = useThree(s => s.advance)`; an effect adds a `gsap.ticker` callback `(time) => { if (activeRef.current) advance(time) }` and removes it on cleanup (import `gsap` from `../lib/gsap.js`). In `PageCanvas.jsx` set `frameloop="never"` always, add `const activeRef = useRef(active)` updated each render (in an effect), and mount `<FrameDriver activeRef={activeRef} />` inside `<Canvas>`. The canvas stays page-tall and absolute in this task. The builder reads R3F 9.8.2 source and reports: the unit `advance` expects (seconds), that `useFrame` subscribers (priority -1 and 0) run under `advance`, and that `MAX_DELTA` clamping still protects the first frame after resume. If `advance` does not behave as planned, stop and report (fallback in plan Risks: `frameloop="always"` reading `scrollSource.y`).
  - Covers: FR-39 (single clock), FR-41 (pause/resume), NFR-2, AC-38 (source), AC-40 (pause)
  - Done when: lint and build exit 0; moon spins, stars drift, outline renders as before; no `requestAnimationFrame` added; the `FrameDriver` callback is removed on unmount (dev: 10 route round trips `/` and `/viewer` leave one ticker callback).
  - Browser check: yes - at 1440x900 moon spin and star drift continue; hiding the tab pauses rendering and resuming shows no jump (`window.__planetInfo().frames` stops and restarts); outline stays attached while scrolling; console clean; `/` to `/viewer` ten times leaves zero or one canvas.

- [~] T-10 Re-express buffer limits for a viewport-sized buffer
  - Files: `src/three/bufferLimits.js`, `src/three/DprController.jsx`, `scripts/check-buffer-limits.mjs`
  - Needs: T-01
  - Do: In `bufferLimits.js` remove `capCssHeight`; change `fitsAtDprOne(cssWidth, cssHeight, maxDim)` to require both dimensions at most `maxDim`; keep `DPR_MAX`, budgets, `maxBufferDim` and `computeDpr` as they are. `DprController.jsx` calls `fitsAtDprOne(size.width, size.height, maxDim)`, otherwise unchanged (the page-tall canvas is still capped by its CSS `maxHeight` in this task, so behaviour is unchanged). Update `check-buffer-limits.mjs`: drop the `capCssHeight` check; heights list `[568, 600, 720, 812, 900, 1080, 1440, 2160]`, widths add 3840; replace the three page-tall cases with: 1920x1080@2 and 1440x900@2 reach DPR 2 under the desktop budget; 375x812@3 coarse reaches DPR 2; 3840x2160@2 desktop gives a DPR below 2 within budget; `fitsAtDprOne(5000, 900, 4096)` and `fitsAtDprOne(1920, 5000, 4096)` are false and `fitsAtDprOne(4096, 4096, 4096)` is true.
  - Covers: FR-42, AC-1, AC-37 (expected values), AC-40 (script), NFR-8
  - Done when: `npm run check:buffer` exits 0 and prints the new cases; `grep -rn capCssHeight src scripts` returns nothing; lint and build exit 0.
  - Browser check: no (the DPR report is taken in T-13 with the fixed canvas)

- [~] T-11 Add dev instrumentation for sync and DPR checks
  - Files: `src/three/devStats.js`, `src/three/devSyncProbe.js` (create), `src/three/FrameDriver.jsx`, `src/three/CanvasGuard.jsx`
  - Needs: T-09
  - Do: Add `moonCyViewport: 0`, `introScale: 1`, `moonRadius: 0` to `devStats`. `devSyncProbe.js` (DEV only, enabled when `window.__syncProbe === true`): exports `recordSync()` that, when enabled, pushes `[devStats.moonCyViewport, heroRect.top + heroRect.height / 2, performance.now()]` into `window.__syncLog` (it reads `getBoundingClientRect` only in this verification mode, never otherwise, and caps the log at 5000 entries). `FrameDriver` calls `recordSync()` right after `advance` inside `import.meta.env.DEV`. In `CanvasGuard.jsx` extend the existing `window.__planetInfo()` with `moonCyViewport`, `introScale`, `moonRadius`, `innerWidth`, `innerHeight` (still DEV only). Nothing runs in production.
  - Covers: AC-37 (report source), AC-38 (probe), NFR-2
  - Done when: `window.__planetInfo()` returns the new fields in dev (values 0/1 until T-12); production build contains no `__syncProbe` (`grep -rl "__syncProbe" dist/assets` empty); lint and build exit 0.
  - Browser check: no (exercised by T-13)

- [~] T-12 Convert to a viewport-fixed canvas with per-frame moon anchoring
  - Files: `src/three/PageCanvas.jsx`, `src/three/useHeroMetrics.js`, `src/three/PageScene.jsx`, `src/three/useScrollMetrics.js` (delete)
  - Needs: T-07, T-09, T-10, T-11
  - Do: `PageCanvas.jsx`: wrapper class `fixed left-0 top-0 -z-10 h-svh w-screen pointer-events-none` (keep `aria-hidden`, the opacity crossfade classes), remove the `maxHeight` style. `useHeroMetrics.js`: store `{ cxVp, cyDoc, height, inView }`; in the `ResizeObserver` callback (observing the Hero, the page wrapper and the `<header>`) compute `cxVp = rect.left + rect.width/2` and `cyDoc = rect.top + window.scrollY + rect.height/2` from `getBoundingClientRect` (observer callback only); remove the `version` state (no re-render); keep the `inView` `IntersectionObserver`. `PageScene.jsx`: delete `useScrollMetrics` use and the placement layout effect; inside the existing priority -1 `useFrame` place the moon every frame: `place.position.x = cxVp - size.width/2`, `place.position.y = size.height/2 - (cyDoc - scrollSource.y)`, `place.scale = moonRadiusPx(height)` (radius unchanged in this task), `place.userData.regionRadius = moonRadiusPx(height)`; set `devStats.moonCyViewport` (DEV). Interim stars (restored in T-14): remove the scroll-parallax offset so stars are viewport-fixed with only drift and pointer shift; star count unchanged. Keep `MoonReady` and the live report logic. Delete `useScrollMetrics.js` and confirm nothing imports it. Check that `HomePage`'s `relative isolate` wrapper has no transform or filter so `fixed` is viewport-relative; if it does, stop and report.
  - Covers: FR-38, FR-39, FR-41, NFR-2, NFR-5, AC-36, AC-38
  - Done when: lint and build exit 0; `grep -rn "useScrollMetrics\|maxHeight" src` returns nothing; no layout read in any `useFrame` (code inspection); the app shows stars and the moon at the Hero centre exactly as before and the moon moves out with the Hero when scrolling.
  - Browser check: yes - one `<canvas>`, computed `position: fixed`, CSS size equals `innerWidth x innerHeight` within 1 px and constant while scrolling; `scrollHeight` unchanged; `elementFromPoint` over text never returns the canvas; moon centre follows the Hero centre while scrolling (use `window.__syncProbe = true`, then compare `__syncLog` columns); no console errors.

- [~] T-13 Verify fixed canvas, anchoring and DPR report (measurement)
  - Files: `specs/005-scroll-snap-hero-navbar/baseline.md` (append "Fixed canvas and DPR report (AC-37)")
  - Needs: T-12
  - Do: Record the `sdd-browser` report: (AC-37) in dev, `canvas.width`, `canvas.height`, effective DPR, `MAX_RENDERBUFFER_SIZE`, `MAX_VIEWPORT_DIMS` at 1920x1080 with device DPR 1 and 2, 1440x900 DPR 2, 375x812 coarse DPR 3, next to the T-01 before values, plus pass/fail for `canvas.width = innerWidth x dpr` (within 1 px), effective DPR `min(deviceDpr, 2)` for all four cases, and constant size/DPR while scrolling. (AC-36) canvas count, position, size vs `innerWidth/innerHeight` at 1920x1080, 1440x900, 375x812; `scrollHeight`/`scrollWidth` equal with the canvas and with reduced motion (no canvas); `aria-hidden`, `tabindex=-1`, no `role`, `pointer-events: none`. (AC-38 parts b and d) at 1000x900 fast Lenis scroll (scripted `lenis.scrollTo` or wheel stream): per-frame diff between `__syncLog` columns at most 1 px; at rest within 1 px; Hero fully out of view leaves no moon pixels and `moonFrames` stops while `frames` continues; back at top no rotation jump; deep link `/#about` then scroll to top matches the Hero; with `loseContext()` then `restoreContext()` the moon re-anchors at the current scroll. Any value outside tolerance is recorded as a defect with the file to fix; stop and report instead of editing source.
  - Covers: FR-38, FR-39, FR-42, AC-36, AC-37, AC-38 (b, d)
  - Done when: `baseline.md` has the full table and pass/fail per check; all pass, or defects are listed with the file to fix.
  - Browser check: yes (measurement) - all items listed in Do.

- [~] T-14 Rebuild the starfield for the viewport canvas (wrap, parallax, density)
  - Files: `src/three/StarLayer.jsx`, `src/three/PageScene.jsx`, `src/three/starfield.js`, `specs/005-scroll-snap-hero-navbar/baseline.md` (append "Star density (AC-39)")
  - Needs: T-06, T-12, T-13
  - Do: Generate positions once for the cap (`STAR_MAX` 2000 desktop, 800 coarse; same seeded generator). `StarLayer` creates one geometry and one material in `useMemo` (disposed in cleanup), renders four `<points>` copies (2x2) sharing them, and takes a `count` prop applied with `geometry.setDrawRange(0, n)` where `n = starCountFor(W, H, cap, STAR_DENSITY_PER_MPX)` is updated on canvas size change without regenerating or allocating. In `PageScene`'s frame callback compute `starOffsets(scrollSource.y, STAR_SCROLL_PARALLAX_FACTOR, W, H, drift, offsets)` (preallocated `offsets`) and position the four copies at `(dx, dy)`, `(dx-W, dy)`, `(dx, dy-H)`, `(dx-W, dy-H)` (normalised-unit scale as today); keep the horizontal drift (wraps in `[0,1)`) and the pointer shift on the outer layer; remove the temporary no-parallax interim. Set `STAR_DENSITY_PER_MPX` from the T-01 baseline so on-screen density at 1440x900 is within about 25% of the before density (state the computed value and arithmetic in `baseline.md`); keep the caps. No per-frame allocation; `point size = STAR_SIZE_CSS_PX x dpr` unchanged.
  - Covers: FR-40, AC-39
  - Done when: `npm run check:snap` still exits 0; lint and build exit 0; code inspection shows no allocation in the frame callback and positions are not regenerated on resize; `baseline.md` records the density arithmetic and the chosen `STAR_DENSITY_PER_MPX`.
  - Browser check: yes - at scroll 0, 25%, 50%, 75%, 100% of max scroll and during a slow top-to-bottom scroll, stars cover the whole viewport with no empty band or pop at the wrap point; drift and fine-pointer parallax still work; runtime star count at most 2000 desktop and 800 at 375px; visible density at 1440x900 within about 25% of the before screenshot (`before-1440x900.png`); console clean.

## Layer 3: Layout variables, section markers and sizing

- [~] T-15 Add layout variables and the `snap:` Tailwind variant
  - Files: `src/lib/layoutVars.js` (create), `src/main.jsx`, `src/index.css`
  - Needs: T-02, T-04
  - Do: `layoutVars.js` exports `initLayoutVars()`: sets `document.documentElement.dataset.snapLayout = 'on' | 'off'` from `matchMedia(SNAP_QUERY)` and updates it on the query's `change` event; on load and on `resize` calls `setViewport(innerWidth, innerHeight)` from `moonSize.js` and writes `--moon-r` (px) and `--moon-poster-side` (px, via `moonPosterSidePx`) on `<html>`. Call it in `main.jsx` before `createRoot().render`. In `index.css` add `@custom-variant snap (&:where([data-snap-layout="on"] *));` and a default `--nav-h: 3.8125rem` on `:root`. No consumer yet.
  - Covers: FR-2, FR-16 (variable), D-6, NFR-6, AC-43
  - Done when: lint and build exit 0; in dev `document.documentElement.dataset.snapLayout` is `on` at 1440x900 and `off` at 1000x900 and 1440x650 and flips on resize; `--moon-r` and `--moon-poster-side` are set and match `moonFinalRadiusPx(innerWidth, innerHeight)`; no console errors.
  - Browser check: no (first consumers are T-16/T-17, checked there)

- [~] T-16 Make Projects, About and Tech Stack snap targets that fill one screen
  - Files: `src/components/sections/Projects.jsx`, `src/components/sections/AboutMe.jsx`, `src/components/sections/TechStack.jsx`
  - Needs: T-15
  - Do: On each section root add `data-snap-section`, `data-snap-label="Projects" | "About" | "Tech Stack"`, `tabIndex={-1}` and `outline-none` (programmatic focus target), keep the existing ids and heading structure. Add `snap:min-h-svh snap:content-center` (vertical centring on the existing grid or flex, no markup change beyond that). Use `min-height`, never fixed height or `overflow: hidden`. Content, spacing and reveals unchanged.
  - Covers: FR-1, FR-16, FR-17, AC-2 (sections), AC-10 (layout), AC-15
  - Done when: lint and build exit 0; each section has the three attributes in DOM order (Projects, About, Tech Stack); `grep -n "overflow-hidden\|h-\[" ` on the three files shows no new fixed height or clip.
  - Browser check: yes - at 1920x1080 and 1366x768 each of the three sections is exactly 100 svh tall (scroll each to its top: section top = viewport top and bottom = viewport bottom within 1 px); at 1023x900, 1440x699 and 375x812 they are content-sized as before; with `prefers-reduced-motion: reduce` at 1440x900 they are still 100 svh; no horizontal overflow; reveals still play.

- [~] T-17 Make navbar plus Hero fill one screen and mark the Hero as snap target
  - Files: `src/components/sections/Hero.jsx`, `src/components/Navbar.jsx`
  - Needs: T-15, T-16
  - Do: `Navbar.jsx`: add a `ResizeObserver` on the `<header>` that writes its border-box block size to `--nav-h` on `<html>` (observer callback only; disconnect on cleanup); the navbar stays in normal flow (not fixed, not sticky); no other change yet. `Hero.jsx`: root gets `data-snap-section`, `data-snap-label="Hero"`, `tabIndex={-1}`, `outline-none`, keeps `id="hero"`; replace `min-h-[calc(100svh-3.8125rem)]` with `min-h-[calc(100svh-var(--nav-h))]`. Do nothing else in the Hero (CTA, intro, poster remain).
  - Covers: FR-1, FR-15, FR-16, FR-17, AC-2, AC-10 (layout), AC-15
  - Done when: lint and build exit 0; at 1920x1080 and 1440x900 navbar height + Hero height equals the viewport height within 1 px at `scrollY = 0`; below the snap thresholds the Hero keeps today's sizing.
  - Browser check: yes - AC-2 at 1920x1080: at scroll 0 the Hero bottom is at the viewport bottom and no Projects pixels show; each of the four snap points (tops 0, and each section top via `scrollTo`) shows exactly one section; no clipped content at 1440x900 and 1366x768; a scratch tall block in one section (reverted) stays reachable by scrolling; 1023x900, 1440x699, 375x812 layouts unchanged; no horizontal overflow at 320 to 1919 wide.

## Layer 4: Scroll plumbing

- [~] T-18 Add the snap store and controller core (moves, retarget, resync)
  - Files: `src/lib/snapStore.js` (create), `src/lib/snapController.js` (create)
  - Needs: T-02, T-08, T-17
  - Do: `snapStore.js`: framework-free store `{ active, index, labels }` with `getSnapshot`, `subscribe`, `set` (new object on change only). `snapController.js` (plan D-A, D-B): `attach(lenis)`, `setActive(bool)`, `refresh()` (reads `[data-snap-section]` elements in DOM order, their `data-snap-label` and tops via `getBoundingClientRect` + scroll, first point forced to 0, last clamped to `lenis.limit`; reads happen only here, called from observer/event callbacks), `goTo(target, { immediate })` (target index, a snap element, or any element mapped with `closest('[data-snap-section]')`; unknown target is a no-op), `getSection(i)`, `getState()`. Moves call `lenis.scrollTo(top, { duration: SNAP_DURATION_S, easing: easeInOutCubic, lock: false, onComplete })` with `top` a number clamped to `[0, lenis.limit]`; state `moving = { kind: 'input'|'click'|'settle'|'resync', toIndex }`, `moveEndAt`; a new `goTo` while moving simply issues another `scrollTo` (retarget) and replaces `toIndex`; `store.index` = destination while moving, else nearest to `lenis.scroll`. `resync`: recompute points; if idle and `|lenis.scroll - points[index]| > SNAP_POSITION_EPSILON_PX` do an `immediate` scrollTo; if moving, reissue to the updated target. `setActive(false)` cancels the move at its current position (`scrollTo(lenis.scroll, { immediate: true })`), clears timers and store. DEV: `window.__snapInfo()` returns `{ active, index, moving, points, moves, settles, listeners }` with counters. No `focus()`/`blur()`. The builder verifies the Lenis 1.3 `scrollTo` options used (`lock`, `onComplete`, `immediate`, `easing`) and reports; if retargeting or `immediate` cancel does not work as planned, stop and report.
  - Covers: FR-1, FR-6, FR-7, FR-9, FR-11, FR-12 (goTo), FR-14, AC-5, AC-7, AC-14
  - Done when: lint and build exit 0; no DOM listeners are registered by this file yet; the file imports no React; `__snapInfo` exists in dev; code inspection shows layout reads only inside `refresh()`.
  - Browser check: no (not mounted yet; exercised from T-20)

- [~] T-19 Add wheel and key input handlers
  - Files: `src/lib/snapInput.js` (create), `src/lib/snapController.js`
  - Needs: T-03, T-18
  - Do: `snapInput.js` exports `attachInput(controllerApi)` returning a detach function. Wheel: `window` listener `{ capture: true, passive: false }`. Skip entirely (no `preventDefault`) for `ctrlKey` and when `event.target.closest('[data-lenis-prevent], [data-snap-ignore]')` (D-11, no layout read). Otherwise run `classifyWheel` with `normaliseWheelDelta`; `'move'` -> `preventDefault()`, `stopPropagation()`, start a move to `nearestIndex(points, lenis.scroll) +- 1` (clamped; at the ends nothing happens but the event is still prevented); `'ignore'` -> prevent and stop propagation; `'pass'` -> leave to native. Update `lastWheelAt`/`lastAbsDelta` on every wheel event. Keys: `keydown` listener using `shouldHandleKey` (reads only `tagName`, `getAttribute('role')`, `isContentEditable`); `preventDefault()` only when handled or `preventOnly`; Home/End go to first/last. Ignore all input while a move runs (never queued). No touch listeners that call `preventDefault`. `snapController.setActive(true)` attaches the input (and `setActive(false)` detaches); the listener count is reflected in `__snapInfo().listeners`.
  - Covers: FR-3, FR-4, FR-5, FR-7, FR-8
  - Done when: lint and build exit 0; `grep -n "touch" src/lib/snapInput.js` shows no `preventDefault` on touch; attach/detach symmetric; `snapMath` functions are the only decision logic; not yet mounted so the page still scrolls natively.
  - Browser check: no (mounted in T-20)

- [~] T-20 Mount `SnapScroller` and activate snapping
  - Files: `src/hooks/useMediaQuery.js` (create), `src/components/SnapScroller.jsx` (create), `src/App.jsx`
  - Needs: T-19
  - Do: `useMediaQuery(query)` via `useSyncExternalStore` on `matchMedia` (subscribe to `change`, snapshot `matches`). `SnapScroller.jsx` renders `null`: `active = lenis != null && pathname === '/' && useMediaQuery(SNAP_QUERY) && !reducedMotion` (`useSmoothScroll`, `useLocation`, `usePrefersReducedMotion`); one effect `[lenis, active]`: `snapController.attach(lenis)`, `setActive(active)`, cleanup `setActive(false)` (removes all listeners, cancels the move). Mount `<SnapScroller />` once in `App.jsx` inside the router, next to `ScrollToHash`. Under reduced motion, below the thresholds, and on `/viewer` nothing is attached.
  - Covers: FR-2, FR-3, FR-4, FR-5, FR-7, FR-8, FR-9, FR-18, AC-3, AC-4, AC-5, AC-6, AC-7, AC-10, NFR-1
  - Done when: lint and build exit 0; in dev at 1440x900 a wheel notch moves one section; `__snapInfo().listeners` is 0 on `/viewer` and at 1000x900.
  - Browser check: yes - (AC-3) at 1920x1080, 1440x900, 1366x768 single wheel gestures go Hero -> Projects -> About -> Tech Stack, nothing at the end, and back up, never skipping; (AC-4) PageDown/ArrowDown/Space and PageUp/ArrowUp/Shift+Space move one section, End and Home jump, keys typed in a scratch `input` do not move the page, Ctrl+wheel not intercepted; (AC-5) 10 synthetic wheel events at 50 ms plus mixed keys during a move give exactly one move and nothing queued; (AC-6) a synthetic 60-event decaying stream gives one move ending on a snap point, a second gesture after the pause gives one more; (AC-7) every snap ends within 1 px of target (last one clamped), duration 1.0 s within 100 ms; (AC-10) at 1023x900, 1440x699, 1366x600, 375x812 and with reduced motion at 1440x900 no snapping, no listeners, native scroll; emulated touch scroll is not prevented; console clean.

- [~] T-21 Route all in-page navigation through one scroll-to-section function
  - Files: `src/hooks/useSectionScroll.js` (create), `src/components/ScrollToHash.jsx`
  - Needs: T-20
  - Do: `useSectionScroll()` returns one stable `scrollToSection(target, opts)`: snapping active -> `snapController.goTo`; snapping off with Lenis -> `lenis.scrollTo(el, { offset: 0 })` (Hero maps to 0), as in 002 FR-30; reduced motion (no Lenis) -> `el.scrollIntoView()` (instant). `ScrollToHash.jsx` keeps its `lenis.resize()` plus next-frame wait and `SCROLL_OFFSET = 0`, calls `scrollToSection(el)` instead of `lenis.scrollTo`; initial page load with a hash (`location.key === 'default'`) uses `{ immediate: true }`, in-app navigation animates; unknown hash is a no-op. Navbar links stay `<Link to="/#projects">`; the location change drives the scroll (Back/forward retarget for free). If a same-hash link click creates no new `location.key`, add an explicit `onClick` on the Navbar Projects/About links calling `scrollToSection` and report the change (touches `Navbar.jsx` only for that).
  - Covers: FR-7 (click/hash retarget), FR-12, FR-13, AC-5 (click and Back), AC-12, AC-13
  - Done when: lint and build exit 0; no navigation path calls `lenis.scrollTo` or `scrollIntoView` outside this function (grep); loading `/#about` ends on About.
  - Browser check: yes - (AC-12) at 1440x900 navbar Projects/About links use the snap animation (same duration and ease, one animation at a time) and end on the section top; at 1000x900 they use Lenis `scrollTo`; with reduced motion they jump instantly; (AC-13) loading `/#about` and `/#tech-stack` ends with the section top at the viewport top within 1 px, `/viewer` -> `/#projects` and `/#about` via the navbar likewise, `/#nonexistent` stays at top with no error, Back/forward between hashes lands correctly; (AC-5) clicking About, or `history.back()`, during a move to Projects retargets with one animation and no jump, ending exactly on the new target.

## Layer 5: Settle and resize handling

- [~] T-22 Add idle settle (mouse, keyboard focus, touch)
  - Files: `src/lib/snapSettle.js` (create), `src/lib/snapController.js`
  - Needs: T-21
  - Do: `snapSettle.js` exports `attachSettle(controllerApi)` returning a detach function (plan D-C). Passive listeners: `mousedown`/`mouseup`, `touchstart`/`touchend`/`touchcancel` (touch count), `blur` and `visibilitychange` reset `held`; `focusin` records `{ target, at }`. `lenis.on('scroll', e => ...)`: ignore while `moving`; else update `store.index = nearestIndex(points, e.scroll)` and restart `setTimeout(trySettle, SNAP_SETTLE_DEBOUNCE_MS)`. `trySettle`: if `held`, do nothing (`mouseup`/`touchend` re-arm); if moving, return; target = section containing a `focusin` target recorded within `SNAP_FOCUS_WINDOW_MS` before the burst's first scroll event, else `settleTarget`; if within epsilon stop; else start `moving(settle)` (same animation, counts for FR-7/FR-8, cancelled with `scrollTo(current, { immediate: true })` on `mousedown`/`touchstart`). Export `armSettle()` and call it after `refresh()` at activation so a restored mid-page position settles. The controller attaches/detaches settle in `setActive`. Never calls `focus()`/`blur()`; scroll events from snap moves never start a settle. Document the Firefox scrollbar gap (no `mousedown`) in a comment.
  - Covers: FR-5 (touch settle), FR-10, AC-8, AC-9, AC-10 (touch settle)
  - Done when: lint and build exit 0; `grep -n "focus()\|blur()" src/lib/snapSettle.js src/lib/snapController.js` returns nothing; attach/detach symmetric (timer cleared on detach); `__snapInfo().settles` counts settle moves.
  - Browser check: yes - (AC-8) at 1440x900 `window.scrollTo` to a mid-section position with a mouse button held: no settle while held; after release the page animates to the nearest snap point 200 ms (within 100 ms) after the last scroll event; a following wheel gesture moves one section from that point; no second animation after a snap; (AC-9) Tab to an off-screen link in another section settles on that section with `document.activeElement` unchanged and the link visible; scrolling away from a focused scratch `input` keeps focus, caret and text; `scrollIntoView` of a text node (find-in-page emulation) ends with the node in view; reload mid-page settles once idle; (AC-10) emulated touch scroll ending mid-section settles only after the touch ended and the scroll was idle for the debounce, never while the touch is held; console clean.

- [~] T-23 Add refresh triggers and threshold-crossing handling
  - Files: `src/lib/snapController.js`, `src/components/SnapScroller.jsx`
  - Needs: T-22
  - Do: In `setActive(true)`: call `refresh()`, then align without animation to the section most in view (`scrollTo(points[nearest], { immediate: true })`, the activation re-align of FR-11), then `armSettle()`. While active, call `refresh()` from: a `ResizeObserver` on `document.body` and on each snap section (disconnected on cleanup), `window` `resize`, and `document.fonts.ready`; after each refresh run the `resync` rule (idle -> immediate re-align if off by more than epsilon; moving -> reissue to the new target). `setActive(false)` (threshold crossing out, reduced motion on, route leaves `/`) cancels a running move or pending settle at its current position, releases the lock and removes every listener, observer and timer. A resize while a move runs never leaves a stuck lock. Counters in `__snapInfo().listeners` cover input, settle and observers so StrictMode and route round trips can be checked.
  - Covers: FR-11, FR-14, AC-11, AC-14
  - Done when: lint and build exit 0; code inspection shows one `ResizeObserver` set per active period, all disconnected in `setActive(false)`; `__snapInfo().listeners` is 0 when inactive.
  - Browser check: yes - (AC-11) resize 1440x900 -> 1000x900 -> 1440x900 and 1440x900 -> 1440x650 -> 1440x900, once with a move in flight: no stuck lock (the next wheel gesture moves one section), no jump to an unrelated position, no console error, page rests on a snap point after returning to active; (AC-14) 10 route round trips `/` <-> `/viewer` in dev (StrictMode) leave `__snapInfo().listeners` stable and no warnings; after snapping to each section its reveal items are visible within 1.5 s of arrival.

## Layer 6: Section arrows

- [~] T-24 Add the arrow placeholder asset, README and mask-icon style
  - Files: `src/assets/icons/arrow-down.svg` (create), `src/assets/icons/README.md` (create), `src/index.css`
  - Needs: T-15
  - Model: haiku
  - Do: `arrow-down.svg`: a simple single-colour down chevron/arrow using `currentColor`, with a viewBox and no fixed width/height, and an XML comment "PLACEHOLDER, replace with owner SVG". `README.md`: filename, where used (down arrow bottom-centre and the same file rotated 180 degrees as the up arrow, no `arrow-up.svg`), expected format (single colour via `currentColor`, any viewBox, no fixed width/height attributes), how to replace (same filename, no code change). `index.css`: add a `.arrow-icon` class using `mask-image: var(--arrow-icon-url)` (URL set inline by the component), `mask-repeat: no-repeat`, `mask-position: center`, `mask-size: contain`, `background-color: currentColor`; theme tokens only.
  - Covers: FR-31, AC-26
  - Done when: file and README exist; `ls src/assets/icons` shows no `arrow-up.svg`; the SVG has no `width`/`height` attributes and uses `currentColor`; lint and build exit 0.
  - Browser check: no (first used in T-25)

- [~] T-25 Add `SectionArrows` (render, names, click, visibility, rotation transition)
  - Files: `src/hooks/useSnapState.js` (create), `src/components/SectionArrows.jsx` (create), `src/pages/HomePage.jsx`
  - Needs: T-05, T-21, T-24
  - Do: `useSnapState()` = `useSyncExternalStore` on `snapStore`. `SectionArrows` (mounted at the end of `HomePage`, after the sections; renders `null` when `!active`, so nothing is in the DOM below thresholds, with reduced motion and on `/viewer`): a `fixed` `pointer-events-none` container with two `<button type="button">` (44x44 from `SECTION_ARROW_SIZE_PX`, `pointer-events-auto`, `z-20`): down at `bottom: max(offset, env(safe-area-inset-bottom))`, up at `top: max(offset, env(safe-area-inset-top))`, both `left: 50%` with `-translate-x-1/2` on a wrapper (offset from `SECTION_ARROW_OFFSET_PX`, inline style). Icon: a `span.arrow-icon` with `--arrow-icon-url` set from `import arrowUrl from '../assets/icons/arrow-down.svg'`; the up arrow is the same span rotated 180 degrees (CSS transform), `aria-hidden`. Visible: down when `index < labels.length - 1`, up when `index > 0`; hidden state = `inert`, `visibility: hidden`, `opacity: 0` (visibility delayed by the transition) so hidden arrows are not focusable, not in the accessibility tree and not clickable. Names: `Next section: ${labels[index+1]}`, `Previous section: ${labels[index-1]}`, updated on each change. Click: `scrollToSection(index +- 1)` relative to `store.index`; no URL change. States with theme tokens: distinct hover, `:focus-visible` ring (3:1 on the dark background) and active; transitions CSS only on `transform`/`opacity`; the arriving arrow rotates in while fading in and the leaving one rotates out while fading out (down hidden = 180 degrees, up hidden = 0), positions never change, `motion-reduce:transition-none`. Comment the source of the SVG for provenance. Tab order: after the page content in DOM order.
  - Covers: FR-28, FR-29, FR-30, FR-32, NFR-7, AC-21, AC-22, AC-24 (partial), AC-25, AC-26
  - Done when: lint and build exit 0; `grep -rn "arrow-up" src` returns nothing; no colour literals in the file.
  - Browser check: yes - (AC-21) at 1440x900 and 1920x1080 Hero shows only the down arrow, Projects and About both, Tech Stack only the up arrow; both stay at the same viewport coordinates within 1 px (bottom-centre and top-centre) on every section; hidden arrows are not focusable and absent from the accessibility tree; the up arrow does not overlap the navbar at rest; (AC-22) names read "Next section: Projects" on Hero, "Previous section: Hero" on Projects, update on change; each at least 44x44; hover/focus-visible/active are visibly distinct; one click moves exactly one section with no reload and no extra history entry; repeated clicks walk one section each and never overshoot; (AC-25) only `transform`/`opacity` transition, arrows exist only with snapping active, reduced motion emulated before load shows none and toggling it at runtime removes them at once; (AC-26) scratch-swap `arrow-down.svg` for another valid `currentColor` SVG (reverted) changes both arrows and hover colours still apply, no JS edit; (AC-5) a down-arrow click during a move to Projects retargets one section past the displayed Projects; arrows removed below the thresholds and on `/viewer`; screenshots at rest on each section at 1920x1080, 1440x900, 1366x768 show no overlap with content (full six-size set in T-37).

- [~] T-26 Add arrow focus handoff
  - Files: `src/components/SectionArrows.jsx`
  - Needs: T-25
  - Do: Track `focusedInside` with `onFocus`/`onBlur` on the arrow buttons. A layout effect keyed on `[active, index]` with a cleanup: if `focusedInside` and the focused arrow is now hidden or the component is going inactive (snapping turned off), call `snapController.getSection(index).focus({ preventScroll: true })` (the destination section is programmatically focusable via T-16/T-17); focus never ends on `<body>`. This is the only `focus()` call in the snap code; comment it.
  - Covers: FR-30, NFR-1, AC-23
  - Done when: lint and build exit 0; the only `.focus(` in the snap files is this one (grep); no additional scrolling is caused (`preventScroll`).
  - Browser check: yes - (AC-23) keyboard-activating the down arrow on the second-to-last section and the up arrow on section 2 moves `document.activeElement` to the destination section element (not `body`) with no extra scrolling; resizing to 1000x900 while an arrow has focus moves focus to the current section, not `body`; Tab continues from there.

## Layer 7: Navbar

- [~] T-27 Remove the Tech Stack navbar link
  - Files: `src/components/Navbar.jsx`
  - Needs: T-17
  - Model: haiku
  - Do: Delete the Tech Stack `Link` only. Remaining: brand, Home, Projects, About, 3D Viewer. Keep `aria-current` and active-state logic. The `tech-stack` section id and snap order are untouched.
  - Covers: FR-33, AC-31
  - Done when: lint and build exit 0; the DOM has no "Tech Stack" link; `/#tech-stack` still lands on the section (T-21 path).
  - Browser check: no (checked together with T-29)

- [~] T-28 Add navbar constants and the hamburger toggle component
  - Files: `src/lib/navConfig.js` (create), `src/components/NavMenuToggle.jsx` (create)
  - Needs: T-27
  - Do: `navConfig.js`: `NAV_MENU_BREAKPOINT_PX = 640` (commented: fallback 768 if the desktop row has under 40 px slack). `NavMenuToggle({ open, controlsId, onToggle, buttonRef })`: `<button type="button">` 44x44 minimum, `aria-expanded={open}`, `aria-controls={controlsId}`, accessible name "Menu" (state conveyed by `aria-expanded`); a CSS hamburger of three spans (middle fades, outer two rotate +-45 degrees to an X, 200 ms transitions, `motion-reduce:transition-none`); theme tokens only, visible `:focus-visible` ring. Not wired into the Navbar yet.
  - Covers: FR-35, NFR-7, AC-33 (toggle part)
  - Done when: lint and build exit 0; the component has no state of its own; no dependency or icon set used.
  - Browser check: no (wired in T-29)

- [~] T-29 Wire the mobile menu and desktop/mobile modes into the Navbar
  - Files: `src/components/Navbar.jsx`
  - Needs: T-20, T-28
  - Do: `desktop = useMediaQuery('(min-width: 640px)')` built from `NAV_MENU_BREAKPOINT_PX`. Desktop: today's one row (brand + links), no wrapping. Mobile: the `<header>` is `relative`; render `NavMenuToggle` and a panel `id="nav-menu"` always in the DOM with the `hidden` attribute when closed (so out of tab order and accessibility tree), absolutely positioned (`absolute inset-x-0 top-full z-30 bg-ink border-b border-line`) so opening causes no layout shift; items reuse the existing item classes with `min-h-11 w-full`, keep hover/focus-visible/active-page states and the non-colour active indicator. State without effects: `openAt` holds the `location.key` at open time, `isOpen = !desktop && openAt === location.key`, so any route or hash change closes it; widening to desktop clears `openAt` (one effect, with the same documented lint exception pattern as `SmoothScrollProvider`). `document` `keydown` Escape while open closes and focuses the toggle (`buttonRef`); a link click closes it; opening leaves focus on the toggle. Projects/About items use the same `Link`/scroll path as desktop (FR-12). The `--nav-h` observer from T-17 stays. Measure the desktop row at 640 and report the slack; if under 40 px set the constant to 768 and report.
  - Covers: FR-15, FR-34, FR-35, FR-36, FR-37, NFR-1, NFR-7, AC-31, AC-32, AC-33, AC-34, AC-35, AC-42
  - Done when: lint and build exit 0; no `fixed`/`sticky` on the header; breakpoint read only from `navConfig.js`.
  - Browser check: yes - (AC-31) no "Tech Stack" link, five items, `aria-current` unchanged, `/#tech-stack` works; (AC-32) one row, no wrapping and `scrollWidth <= innerWidth` at 640, 641, 1024, 1280, 1920; at 639 the toggle shows and the row is hidden; (AC-33) at 375x812 and 320x568 the toggle is at least 44x44 with name, `aria-expanded` and matching `aria-controls`, icon animates to an X (instant with reduced motion), items at least 44 px tall, no horizontal overflow open or closed; (AC-34) Escape closes and focuses the toggle; clicking Projects/About closes and scrolls; going to `/viewer` or changing the hash closes; widening past 640 with the menu open leaves `aria-expanded="false"`; closed items not tabbable and not in the accessibility tree; focus never on `body`; keyboard-only Tab -> Enter opens -> Tab reaches items in order; (AC-35) opening at 375x812 moves neither the Hero, the moon nor the page height; normal scrolling works with no arrows; console clean.

## Layer 8: Hero (moon size, wrap, intro)

- [~] T-30 Apply the new moon size to the live canvas and the poster
  - Files: `src/lib/moonIntro.js` (create), `src/three/PageScene.jsx`, `src/components/sections/Hero.jsx`, `src/index.css`
  - Needs: T-04, T-14, T-17
  - Do: `moonIntro.js`: `export const moonIntro = { scale: 1 }` (commented plain singleton, GSAP drives it in T-33). `PageScene`: per frame `place.scale.setScalar(getMoonRadius() * moonIntro.scale)` and `place.userData.regionRadius = getMoonRadius()` (replacing `moonRadiusPx(height)`); `devStats.moonRadius`/`introScale` (DEV). `Hero.jsx`: wrap the poster `<img>` in a sized box inside `[data-stage]`: `absolute inset-0 m-auto` with `width` and `height` `var(--moon-poster-side)`; the `<img>` fills it (`object-contain` becomes `object-fill`, same aspect); the existing poster/canvas opacity crossfade stays on the `<img>`; the old stage fade/scale tween is untouched in this task. `index.css`: only if a class is needed for the box. Live canvas, poster and (later) wrap read only `moonFinalRadiusPx` through the store and CSS var (one source).
  - Covers: FR-19, FR-20, FR-21, AC-16, AC-17, AC-18
  - Done when: lint, build and `npm run check:moon` exit 0; `grep -rn "moonRadiusPx" src` shows only `moonFraming.js`, `PosterCapture.jsx` and `moonConfig.js` usage; the moon is visibly 90% of the old size at 1920x1080.
  - Browser check: yes - (AC-16) body diameter at 1920x1080 within 2% of 0.9 x the T-01 before value (about 729 px), 1440x900 about 0.75 x 729 and 1366x768 about 0.711 x 729 (each within 3%), 1920x700 about 0.648 x 729 and inside the Hero, 1024x700 matches the plain rule; resizing updates live; (AC-17) at 375x812 and 320x568 the whole moon and outline are inside the viewport with at least 24 px clear each side, diameter below the before value (596 px at 375x812), no horizontal overflow; (AC-18) with WebGL disabled and with reduced motion the poster diameter matches the live canvas within 5% at 1920x1080, 1440x900, 1366x768, 375x812 and the crossfade shows no size jump; console clean.

- [~] T-31 Remove the "View projects" button from the Hero
  - Files: `src/components/sections/Hero.jsx`
  - Needs: T-25, T-30
  - Model: haiku
  - Do: Delete the CTA link and its markup, and remove only its tween/target from the existing intro timeline (no GSAP warning for a missing target). Nothing else changes in the Hero (the full timeline rewrite is T-33).
  - Covers: FR-23, AC-20 (CTA part)
  - Done when: lint and build exit 0; `grep -rn "View projects" src` returns nothing; no console warning about missing GSAP targets.
  - Browser check: no (checked in T-32)

- [~] T-32 Wrap the Hero text around the moon
  - Files: `src/hooks/useHeroWrap.js` (create), `src/components/sections/Hero.jsx`, `src/index.css`
  - Needs: T-05, T-30, T-31
  - Amended 2026-10-21 by user request: the "below 1024 keep today's layout" and AC-20 (375x812 current layout) parts of this task are superseded by T-38/T-39 (text above the moon).
  - Do: `useHeroWrap(heroRef, textRef)`: one `ResizeObserver` on the Hero and the text block plus a subscription to the moon-size store; in the callback (the only layout reads) write `--wrap-size`, `--wrap-mt`, `--wrap-mr` (from `wrapGeometry` with the FINAL radius `getMoonRadius()` and `HERO_WRAP_MARGIN_PX`) and `--wrap-pt = max(64px, (heroH - textH) / 2)` on the Hero element; update `--wrap-pt` only on a change of 2 px or more and cap re-measure passes at 3 per layout change. `Hero.jsx`: when `useMediaQuery` width is at or above `HERO_WRAP_MIN_WIDTH_PX`, inside a full-height relative container render in order: `div.hero-moon-float` (`aria-hidden`, float right, `width/height: var(--wrap-size)`, `margin-top: var(--wrap-mt)`, `margin-right: var(--wrap-mr)`, `shape-outside: circle(closest-side at 50% 50%)`), a spacer `height: var(--wrap-pt)`, then the text block (eyebrow, `h1`, paragraph; same copy, `aria-label` on the `h1` kept, still real DOM text). In wrap mode the `h1` size is `font-size: clamp(2.75rem, calc(var(--moon-r) * 0.26), 6rem)` (use `HERO_H1_RADIUS_RATIO`; keep it as the only tuning lever). Below 1024 px wide keep today's layout (column, centred, current type scale), no float. `index.css`: `.hero-moon-float`. The wrap uses the final radius, so it does not change during the intro. If at 1024x700 the text block cannot fit without overlapping the moon, report the size instead of improvising.
  - Covers: FR-22, FR-23, AC-19, AC-20, AC-24 (clearance)
  - Done when: lint, build and `npm run check:moon` exit 0; `shape-outside` float present only in wrap mode; text is selectable DOM text; no layout read outside the observer callback.
  - Browser check: yes - (AC-19) at 1366x768, 1440x900, 1024x768 and 1280x720, for every text line box of eyebrow, `h1` and paragraph (`Range.getClientRects`) the distance to the moon centre is at least radius + 20 px; at least one size shows visibly different line lengths following the curve; same with the poster only (WebGL disabled) and with reduced motion; at 1920x1080 no text overlaps the moon; `h1` keeps one accessible name; (AC-20) at 375x812 the current layout, no float, no horizontal overflow, heading and paragraph fully visible, no "View projects" and no arrow; (AC-24 partial) Hero screenshots at 1920x700 and 1024x700 show text, moon and arrows not colliding; resize and zoom recompute the wrap.

- [~] T-33 Replace the Hero intro with the moon approach then the text sequence
  - Files: `src/lib/heroIntro.js` (create), `src/components/sections/Hero.jsx`
  - Needs: T-30, T-32
  - Do: `heroIntro.js`: `export const heroIntro = { timeline: null }`. Replace the Hero's intro layout effect: if `reducedMotion || introPlayed` return (moon at scale 1, all text at its final state from first paint, no GSAP on Hero elements). Else set `moonIntro.scale = MOON_INTRO_START_SCALE`, `gsap.set(posterBox, { scale })`, and build one master timeline inside `gsap.context`, stored in `heroIntro.timeline`: `tl.fromTo(moonIntro, { scale: START }, { scale: 1, duration: MOON_INTRO_DURATION_S, ease: MOON_INTRO_EASE, onUpdate: () => gsap.set(posterBox, { scale: moonIntro.scale }) }, 0)` (one tween is the clock for the poster and the canvas; `PageScene` already reads `moonIntro.scale`), then `tl.addLabel('text', '>')` and text tweens at `'text+=0'` eyebrow (0.6 s), `'text+=0.2'` heading words (stagger 0.05, 0.8 s), `'text+=0.8'` paragraph (0.6 s); the arrow slot is `'text+=1.4'` (T-34); text ends at 2.0 s, total 5.0 s. "From" states are applied by JS only (no default CSS `opacity: 0`, `visibility: hidden` or `pointer-events: none` for Hero content). Delete the old `[data-stage]` fade/scale-from-0.94 tween. Cleanup: `ctx.revert()`, `heroIntro.timeline = null`, `moonIntro.scale = 1`; keep the module `introPlayed` flag and the StrictMode guard (reset only if unfinished) so exactly one timeline plays and returning from `/viewer` shows the final state. The moon tween starts at Hero mount and never waits for the lazy canvas. Outline constants untouched. Scrolling away mid-intro or deep-linking to another section must not error.
  - Covers: FR-24, FR-25, FR-26, FR-27, AC-27, AC-28 (moon and text timing), AC-29, AC-30
  - Done when: lint and build exit 0; `grep -rn "scale: 0.94\|0\.94" src/components/sections/Hero.jsx` returns nothing; `grep -n "opacity-0\|invisible\|pointer-events-none" src/components/sections/Hero.jsx` shows nothing that hides content by default.
  - Browser check: yes - (AC-27) on a fresh load at 1440x900 sample `moonIntro.scale` (or poster transform) over time: 0.6 x final at start (+-0.03), 1.0 at 3 s (+-0.02), monotonic, centre fixed; scratch-editing `MOON_INTRO_START_SCALE`/`MOON_INTRO_DURATION_S` (reverted) changes the result; (AC-28) eyebrow, heading words and paragraph stay hidden until 3 s then play in order, finishing at about 5 s (4.5 to 5.5 s); (AC-29) `/` -> `/viewer` -> `/` shows moon and text final with no replay; in dev (StrictMode) exactly one intro plays, no flicker or double text; (AC-30) navbar and content interactive during the intro; with the 3D chunk throttled (Slow 3G) the poster animates on time and the live canvas joins without a size jump; scrolling away mid-intro and back, and a deep link `/#about`, give no console error and the Hero is final on return; with reduced motion no moon animation, poster only at final scale, all text visible at first paint, no GSAP tween on Hero elements.

- [~] T-34 Add the down arrow to the text intro as its last item
  - Files: `src/components/SectionArrows.jsx`
  - Needs: T-25, T-33
  - Do: The down arrow's outer wrapper is the GSAP target and the inner button owns the CSS transitions (two elements, no property animated by two systems). On mount, if `heroIntro.timeline` exists and `progress() < 1`, add inside a `gsap.context`: `tl.from(wrapper, { opacity: 0, y: 16, duration: 0.6 }, 'text+=1.4')`; context reverted on unmount. Otherwise (intro finished, reduced motion, snapping inactive at the time) nothing animates and the arrow is simply shown. The arrow stays clickable and focusable during the intro (no `pointer-events` or `visibility` default hiding).
  - Covers: FR-25, FR-27, AC-28 (arrow end time), AC-30 (arrow clickable)
  - Done when: lint and build exit 0; no default CSS hiding of the arrow beyond the existing hidden-state rules for non-applicable arrows; cleanup reverts the context.
  - Browser check: yes - (AC-28) on a fresh load at 1440x900 the time from load to the down arrow's final state is 4.5 to 5.5 s and the order is eyebrow, heading, paragraph, arrow; at 1000x900 (no arrow) the text sequence still follows the moon; (AC-30) clicking the down arrow during the intro moves to Projects; a later return shows the arrow at its final state with no replay; console clean.

## Layer 9: Final regression

- [ ] T-35 Static checks, chunk report and source-level audits
  - Files: `specs/005-scroll-snap-hero-navbar/baseline.md` (append "After")
  - Needs: T-34
  - Do: Run `npm run lint`, `npm run build`, `npm run check:buffer`, `npm run check:snap`, `npm run check:moon`, `npm run check:cel`. Record in "After": entry and 3D chunk names with raw and gzip sizes next to "Before"; entry chunk free of three/R3F/drei/`WebGLRenderer`. Audit and list results (pass/fail with file for failures): `package.json` dependencies identical to T-01 (only `check:snap`, `check:moon` scripts added); one `new Lenis` and no other scroll library (AC-14); no `three`/`@react-three` import outside `src/three/` (AC-43); snap input, settle, controller, scroll function, arrows, menu, moon size are separate files (NFR-4); thresholds defined once in `snapConfig.js` and consumed by JS and CSS (NFR-6); no `getBoundingClientRect`/`offsetHeight`/`scrollHeight`/`getComputedStyle` inside `useFrame`, ticker, scroll, wheel or rAF callbacks other than the `refresh()`/observer paths and the DEV-only probe (NFR-2, AC-41); no per-frame allocation in new `useFrame` code; no `overflow-hidden` or fixed heights clipping section content, sections use `min-h` (AC-15, FR-17); no `arrow-up` file or reference and `README.md` present (AC-26); no "View projects" and no default hidden CSS for Hero content; no hard-coded colours or fonts in new UI (NFR-7); no `focus()`/`blur()` in snap files except T-26 (AC-9); no touch `preventDefault`; no `useScrollMetrics`/`capCssHeight`/`maxHeight` remains; `grep -rl "__syncProbe\|capture-poster" dist/assets` empty.
  - Covers: FR-17, NFR-3, NFR-4, NFR-7, NFR-8, AC-1, AC-14 (source), AC-15 (source), AC-26 (source), AC-41 (inspection), AC-43
  - Done when: all commands exit 0 with no new warnings; every audit line reported; before/after sizes recorded.
  - Browser check: no

- [ ] T-36 Regression: lifecycle, fallbacks, anchoring and engine (measurement)
  - Files: `specs/005-scroll-snap-hero-navbar/baseline.md` (append results under "After")
  - Needs: T-35
  - Do: Record the `sdd-browser` report: (AC-40) 003 fallbacks (reduced motion, WebGL off, model failure, `loseContext()` shows the poster and plain `bg-ink` elsewhere, `restoreContext()` returns moon and stars with the moon anchored at the current scroll); rendering pauses on `document.hidden` and resumes without a jump; `/` -> `/viewer` -> `/` ten times in dev leaves zero or one canvas on `/`, none on `/viewer`, `gl.info` memory and program counts at baseline; a viewport larger than the device limit (scratch emulation or unit case, reverted) falls back to the poster. (AC-38 a and c) with `window.__syncProbe = true`, per-frame diff between moon centre and Hero centre at most 1 px during a snap move and a settle move; outline follows without a gap. (AC-14) `__snapInfo().listeners` and ticker callbacks stable over the ten round trips; reveal items visible within 1.5 s after each snap. (AC-36) re-check canvas rules at the three sizes. (AC-37) repeat the DPR table "after" values. Failures are recorded with the file to fix; no source edits.
  - Covers: FR-14, FR-41, AC-14, AC-36, AC-37, AC-38 (a, c), AC-40
  - Done when: `baseline.md` has every result with pass/fail; defects list the file to fix.
  - Browser check: yes (measurement) - all items listed in Do.

- [ ] T-37 Regression: performance, accessibility sweep, size matrix and owner checklist (measurement)
  - Files: `specs/005-scroll-snap-hero-navbar/baseline.md` (append "Manual checks" and results)
  - Needs: T-36
  - Do: Record the `sdd-browser` report: (AC-41) performance trace of a snap at 1440x900 with the moon in view: no long task over 50 ms, no dropped-frame bursts. (AC-42) keyboard-only sweeps at 1440x900 and 375x812: navbar links/menu and the arrows reachable in logical order with visible focus rings, Tab never trapped by snapping or settle, Escape behaviour, one `h1`. (AC-10) matrix at 1023x900, 1440x699, 1366x600, 375x812 and reduced motion at 1440x900: no snapping, no settle, no arrows, no overflow, no Lenis instance with reduced motion, sections still 100 svh. (AC-24) screenshots at rest on every section at 1920x1080, 1920x700, 1440x900, 1366x768, 1024x768, 1024x700: arrows do not overlap the moon (20 px clearance), text or interactive content. (AC-43) scratch edit of a threshold constant (reverted) changes both JS behaviour and CSS layout. (FR-18) no horizontal overflow, clipped text or unreachable Hero content at 320 to 1919 wide and 400 to 1080 tall (sampled grid). Then write a "Manual checks" checklist for the owner and leave it unchecked: real trackpad inertia and mouse wheel feel (AC-6), Firefox scrollbar-drag settle gap (plan Spec issue 2), real touch device settle and iPad landscape feel, native scrollbar-drag moon offset (at most one frame, zero at rest), screen-reader names for the arrows and menu toggle, swapping in the final arrow SVG, hover/focus visual feel. Failures are recorded with the file to fix; no source edits.
  - Covers: FR-18, NFR-1, NFR-2, AC-10, AC-24, AC-37 (final), AC-41, AC-42, AC-43
  - Done when: `baseline.md` has the measurements, pass/fail per check, and the owner checklist.
  - Browser check: yes (measurement) - all items listed in Do.

## Layer 10: Hero column layout below 1024 (amended 2026-10-21 by user request)

- [~] T-38 Hero column layout below 1024: text above the moon, shared moon centre
  - Files: `src/lib/moonConfig.js`, `src/lib/moonSize.js`, `src/hooks/useHeroColumn.js` (create), `src/three/useHeroMetrics.js`, `src/components/sections/Hero.jsx`, `src/index.css`, `scripts/check-moon.mjs`
  - Needs: T-30, T-32, T-33
  - Do: See plan D-I (column mode, column radius, moon centre) and FR-23. `moonConfig.js`: add `HERO_COLUMN_GAP_PX` 24 and `HERO_COLUMN_BOTTOM_PX` 24. `moonSize.js`: add pure `moonColumnRadiusPx({ vw, vh, navH, textH })` = `min(max((vh - navH - textH - GAP - BOTTOM) / 2, MOON_MIN_RADIUS_PX), (vw - 2*MOON_SIDE_MARGIN_PX) / 2)`; the store's `getMoonRadius()` uses it when `innerWidth < HERO_WRAP_MIN_WIDTH_PX` (textH and navH from the store inputs; before textH is known use the floor), ignores height-only changes under 120 px at unchanged width, keeps `--moon-r` and `--moon-poster-side` in sync; desktop path and `moonFinalRadiusPx` unchanged. `useHeroColumn(textRef)`: one `ResizeObserver` on the text block publishing `textH` to the store (no other layout reads). `Hero.jsx`: below `HERO_WRAP_MIN_WIDTH_PX` render a flex column: `padding-top: var(--nav-h)`, eyebrow + `h1` + paragraph (current type scale), then `div.hero-moon-slot` (`aria-hidden`, `relative`, full width, `height: calc(2 * var(--moon-r))`, margin-top `HERO_COLUMN_GAP_PX`, margin-bottom `HERO_COLUMN_BOTTOM_PX`) holding the poster box (`absolute inset-0 m-auto`, `--moon-poster-side`); Hero is `min-h` only (at least `100svh`), never a fixed height; no text over the moon. Desktop render path (float wrap, poster in stage) untouched. `useHeroMetrics.js`: observe the slot in column mode and the Hero otherwise, cache the anchor centre with the D-K formulas, re-attach when the mode flips. `index.css`: `.hero-moon-slot` only if a class is needed. `check-moon.mjs`: add `moonColumnRadiusPx` cases at 375x812, 414x896, 768x1024 (text + gap + diameter fit `vh`; use a representative `textH`), 320x568 and 812x375 (floor wins), width ceiling, and the 120 px URL-bar rule. Intro timeline code (T-33) unchanged. If the floor-bound landscape fallback (taller Hero, normal scroll) looks wrong, report it instead of improvising.
  - Covers: FR-23, FR-20, AC-20, AC-17 (below 1024)
  - Done when: lint, build and `npm run check:moon` exit 0; `grep -n "HERO_COLUMN_GAP_PX\|HERO_COLUMN_BOTTOM_PX" src` shows the constants defined once in `moonConfig.js`; no layout read outside the observer callbacks; the desktop wrap path (T-32) is unchanged.
  - Browser check: no (checked in T-39)

- [ ] T-39 Verify the below-1024 Hero column (measurement)
  - Files: `specs/005-scroll-snap-hero-navbar/baseline.md` (append "Hero column below 1024")
  - Needs: T-38
  - Do: Record the `sdd-browser` report, one pass per size, failures recorded with the file to fix, no source edits. At 375x812, 414x896, 768x1024: (a) Hero is a column; `h1` top is at least `--nav-h` below the Hero top; (b) via `Range.getClientRects` over eyebrow, `h1` and paragraph, the bottom of the last text rect is at least 24 px above the moon top (slot top), and no text rect intersects the moon disc plus 3 px outline; (c) moon radius equals the column formula within 0.5 px (read `--moon-r`, text height, `--nav-h`); text + gap + moon diameter + bottom 24 fit `innerHeight` (Hero height at most the viewport height, no inner vertical scroll); moon at least 24 px from each side; (d) live canvas moon centre (`__syncLog`/probe or pixel bounds) equals the poster centre (WebGL disabled, and reduced motion) within 2 px, diameter within 5%, no jump at the crossfade; (e) intro still plays as before (moon scale 0.6 to 1 over 3 s about the fixed centre, text after); (f) scroll to Projects and back: moon follows the slot, no gap or jump; (g) no horizontal overflow, no console errors, no "View projects", no arrows. At 812x375 and 568x320: moon radius equals the floor, text and moon do not overlap, Hero is taller than the viewport, page scrolls normally to the moon (report this for the owner to confirm). At 1024x768, 1440x900 and 1920x1080: Hero and moon identical to the T-32 results (no regression). Resize across 1024 in both directions: layout flips cleanly, moon centre follows, no console error. Take one screenshot each at 375x812 and 768x1024.
  - Covers: FR-23, FR-20, AC-17 (below 1024), AC-20
  - Done when: `baseline.md` has every result with pass/fail and the two screenshots' paths; defects list the file to fix.
  - Browser: yes
  - Browser check: yes (measurement) - all items listed in Do.

## Coverage

| Req | Tasks |
| --- | --- |
| FR-1 | T-02, T-16, T-17, T-18 |
| FR-2 | T-02, T-15, T-20 |
| FR-3 | T-03, T-19, T-20 |
| FR-4 | T-03, T-19, T-20 |
| FR-5 | T-03, T-19, T-20, T-22 |
| FR-6 | T-02, T-18, T-20 |
| FR-7 | T-03, T-18, T-19, T-20, T-21 |
| FR-8 | T-02, T-03, T-19, T-20 |
| FR-9 | T-02, T-18, T-20 |
| FR-10 | T-02, T-22 |
| FR-11 | T-18, T-23 |
| FR-12 | T-18, T-21 |
| FR-13 | T-21 |
| FR-14 | T-08, T-18, T-23, T-36 |
| FR-15 | T-17, T-29 |
| FR-16 | T-15, T-16, T-17 |
| FR-17 | T-16, T-17, T-35 |
| FR-18 | T-20, T-37 |
| FR-19 | T-04, T-30 |
| FR-20 | T-30 |
| FR-21 | T-04, T-30 |
| FR-22 | T-05, T-32 |
| FR-23 | T-31, T-32, T-38, T-39 (amended 2026-10-21 by user request) |
| FR-24 | T-33 |
| FR-25 | T-33, T-34 |
| FR-26 | T-33 |
| FR-27 | T-33, T-34 |
| FR-28 | T-05, T-25 |
| FR-29 | T-25 |
| FR-30 | T-05, T-25, T-26 |
| FR-31 | T-24 |
| FR-32 | T-25 |
| FR-33 | T-27 |
| FR-34 | T-29 |
| FR-35 | T-28, T-29 |
| FR-36 | T-29 |
| FR-37 | T-29 |
| FR-38 | T-12, T-13 |
| FR-39 | T-07, T-08, T-09, T-12, T-13 |
| FR-40 | T-06, T-14 |
| FR-41 | T-09, T-12, T-36 |
| FR-42 | T-10, T-13 |
| NFR-1 | T-20, T-26, T-29, T-37 |
| NFR-2 | T-07, T-09, T-11, T-12, T-37 |
| NFR-3 | T-01, T-35 |
| NFR-4 | T-35 |
| NFR-5 | T-07, T-12 |
| NFR-6 | T-02, T-04, T-15, T-35 |
| NFR-7 | T-25, T-28, T-29, T-35 |
| NFR-8 | T-10, T-35 |
| AC-1 | T-01, T-10, T-35 |
| AC-2 | T-16, T-17 |
| AC-3 | T-20 |
| AC-4 | T-03, T-20 |
| AC-5 | T-03, T-18, T-20, T-21, T-25 |
| AC-6 | T-03, T-20 |
| AC-7 | T-02, T-18, T-20 |
| AC-8 | T-22 |
| AC-9 | T-22, T-35 |
| AC-10 | T-16, T-17, T-20, T-22, T-37 |
| AC-11 | T-23 |
| AC-12 | T-21 |
| AC-13 | T-21 |
| AC-14 | T-18, T-23, T-35, T-36 |
| AC-15 | T-16, T-17, T-35 |
| AC-16 | T-01, T-04, T-30 |
| AC-17 | T-04, T-30, T-38, T-39 (amended 2026-10-21 by user request) |
| AC-18 | T-04, T-30 |
| AC-19 | T-05, T-32 |
| AC-20 | T-31, T-32, T-38, T-39 (amended 2026-10-21 by user request) |
| AC-21 | T-25 |
| AC-22 | T-25 |
| AC-23 | T-26 |
| AC-24 | T-05, T-25, T-32, T-37 |
| AC-25 | T-25 |
| AC-26 | T-24, T-25, T-35 |
| AC-27 | T-33 |
| AC-28 | T-33, T-34 |
| AC-29 | T-33 |
| AC-30 | T-33, T-34 |
| AC-31 | T-27, T-29 |
| AC-32 | T-29 |
| AC-33 | T-28, T-29 |
| AC-34 | T-29 |
| AC-35 | T-29 |
| AC-36 | T-12, T-13, T-36 |
| AC-37 | T-01, T-10, T-13, T-36, T-37 |
| AC-38 | T-07, T-09, T-11, T-13, T-36 |
| AC-39 | T-01, T-06, T-14 |
| AC-40 | T-09, T-10, T-36 |
| AC-41 | T-07, T-35, T-37 |
| AC-42 | T-29, T-37 |
| AC-43 | T-02, T-15, T-35, T-37 |

## Open questions
None. Notes for the orchestrator:
- Measurement tasks (T-01, T-13, T-36, T-37) run `sdd-browser` first; the builder then writes the report into `baseline.md` (the browser agent is read-only).
- T-09 and T-18 carry "builder verifies" API checks (R3F `advance` unit and subscriber order; Lenis 1.3 `scrollTo` options; GSAP `ticker.add` prioritise argument). If one fails, the builder stops and reports with the fallback named in plan.md Risks.
- T-29 may raise `NAV_MENU_BREAKPOINT_PX` to 768 if the measured desktop row has under 40 px slack at 640.
- T-14 sets the final `STAR_DENSITY_PER_MPX` from the T-01 baseline.
- Files added beyond plan.md's list: `src/lib/snapInput.js` and `src/lib/snapSettle.js` (input and settle split out of `snapController.js` for NFR-4); `HERO_*`/`MOON_*` constants all live in `moonConfig.js`; `STAR_SCROLL_PARALLAX_FACTOR` lives in `starScroll.js` and `STAR_DENSITY_PER_MPX` in `starfield.js`.
- Manual-only items (owner): real trackpad and wheel feel, Firefox scrollbar settle gap, real touch device, scrollbar-drag moon offset, screen readers, final arrow SVG (listed in the T-37 checklist).
