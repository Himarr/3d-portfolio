# Tasks: 003 R3F Migration and Moon Model (with full-page starfield)

Markers: `- [ ]` pending, `- [~]` built, `- [x]` verified.
Rules for all tasks: `three`, `@react-three/*` imported only inside `src/three/` (FR-2). Drei named imports only (`useGLTF`). No lights, no shader materials, no `requestAnimationFrame` for rendering. No per-frame allocation in `useFrame` (FR-8). No `svh`/`dvh`/`vh`/`innerHeight` for canvas or buffer sizing (D-24); `innerHeight` is allowed only inside `useScrollMetrics.js` and `usePointerTarget.js`. Helpers that are not components live in `.js` files (oxlint `only-export-components`). Change only the files listed; `Hero.jsx` edits limited per D-11 (as widened by D-21, D-22); do not touch `src/index.css`, `src/App.jsx` or section files (flag to the user first if something seems to require it). Do not improvise: if something is ambiguous or an option fails, stop and report. Every task ends with `npm run lint` exit 0 unless it only touches non-code files. "Needs" lists dependencies. Tasks marked HUMAN/BROWSER need a person or a browser; if the builder has none, return the step to the user and do not mark it built.

## Layer 0: Baseline (before ANY code change)

- [~] T-01 Record baseline build sizes
  - Files: `specs/003-r3f-moon-model/baseline.md` (create)
  - Needs: none. Run before T-03.
  - Do: Run `npm run build` on the unmodified repo. In `baseline.md` create a section "Before": date, entry chunk and 3D (three) chunk file names, raw and gzip sizes (Vite output), and the result of grepping the entry chunk for `WebGLRenderer` (expected none). Leave placeholder headings for "After", "Planet and poster measurements", "Buffer matrix (AC-25)" and "Density notes (AC-31)".
  - Covers: NFR-1, AC-5
  - Done when: `baseline.md` exists with entry and 3D chunk names plus raw and gzip sizes; build exited 0; only `baseline.md` created (and `dist/` regenerated).

- [~] T-02 Capture baseline screenshots and measurements (HUMAN/BROWSER if the builder has no browser)
  - Files: `src/assets/img/baseline-1440x900.png`, `src/assets/img/baseline-375x812.png` (create folder), `specs/003-r3f-moon-model/baseline.md` (append)
  - Needs: none. Run before T-03.
  - Do: On the unmodified app (`npm run dev`), screenshot `/` at 1440x900 and 375x812 at scroll 0 with the procedural planet fully rendered and the pointer idle (D-13). Do not import these files from code. In `baseline.md` "Planet and poster measurements" record per viewport: planet diameter and centre (px), poster image diameter and centre (px), hero section width/height, and `document.documentElement.scrollHeight`.
  - Covers: FR-16, AC-4, AC-22 (reference), D-13
  - Done when: both PNGs exist at the stated viewport sizes; `grep -r "assets/img" src --include=*.js --include=*.jsx` returns nothing; `baseline.md` lists all four measurements for both viewports. HUMAN STEP: without a browser, the owner takes and saves the screenshots and measurements.

## Layer 1: Dependencies and config

- [~] T-03 Install pinned R3F and drei
  - Files: `package.json`, `package-lock.json`
  - Needs: T-01, T-02
  - Do: `npm install --save-exact @react-three/fiber@9.8.2 @react-three/drei@10.7.9`. Add nothing else. Do not change `react`, `react-dom` or `three` ranges.
  - Covers: FR-1, NFR-5, AC-1
  - Done when: `dependencies` has `"@react-three/fiber": "9.8.2"` and `"@react-three/drei": "10.7.9"` (no caret); lock lists both; `npm install` prints no ERESOLVE/peer conflict; `npm run build` exits 0.

- [~] T-04 Allow `.glb` asset imports in Vite
  - Files: `vite.config.js`
  - Needs: none
  - Do: Add `assetsInclude: ['**/*.glb']` to the config object (D-7). Change nothing else. If Vite 8 rejects the option, stop and report.
  - Covers: FR-22
  - Done when: option present; `npm run build` and `npm run lint` exit 0 (hashed `moon-<hash>.glb` is checked in T-30 once imported).

## Layer 2: Pure logic

- [~] T-05 Add buffer-limit functions and node check script
  - Files: `src/three/bufferLimits.js`, `scripts/check-buffer-limits.mjs` (create), `package.json` (add script only)
  - Needs: T-03 (so `package.json` is not edited concurrently)
  - Do: `bufferLimits.js` (pure, no `three`): exports `DPR_MAX = 2`, `PIXEL_BUDGET_DESKTOP = 16_000_000`, `PIXEL_BUDGET_COARSE = 8_000_000`, `maxBufferDim(maxRenderbuffer, maxViewportDims)` (min of the three numbers), `capCssHeight(cssHeight, maxDim)` (= `Math.min`), `fitsAtDprOne(cssWidth, maxDim)`, `computeDpr({ cssWidth, cssHeight, deviceDpr, maxDim, pixelBudget })` = `max(1, min(deviceDpr, 2, maxDim / max(cssWidth, cssHeight) * (1 - 1e-9), sqrt(pixelBudget / (cssWidth * cssHeight))))` rounded down to 2 decimals. Check script imports `../src/three/bufferLimits.js` and asserts with `node:assert` (AC-30): cap of 20000 at limit 4096 is 4096 and 3000 stays 3000; DPR always within [1, 2]; for a grid of sizes that fit at DPR 1, `Math.ceil(css * dpr) <= maxDim`; 1920x4000 at deviceDpr 3 with budget 16M gives DPR below 2 and `w*h*dpr^2 <= 16M`; coarse budget 8M lowers DPR for 375x4500 at deviceDpr 3 only if it exceeds the budget (assert the actual math); `fitsAtDprOne(5000, 4096)` is false. Add script `"check:buffer": "node scripts/check-buffer-limits.mjs"`.
  - Covers: FR-34, FR-35, NFR-6, AC-30
  - Done when: `npm run check:buffer` exits 0 and prints a pass line per case; `grep -n "three" src/three/bufferLimits.js` returns nothing; lint exits 0.

- [~] T-06 Add star position generator
  - Files: `src/three/starfield.js` (create)
  - Needs: none
  - Do: Export `mulberry32(seed)` (copy the implementation from `src/three/createPlanetScene.js`, do not delete that file yet), `STAR_SEED = 0x5eed1234`, `STAR_Z = -1000`, and `createStarPositions(count) -> Float32Array(count * 3)` with `x = u - 0.5`, `y = 0.5 - v`, `z = STAR_Z`, `u` and `v` consecutive values from `mulberry32(STAR_SEED)`. Pure, no `three` import.
  - Covers: FR-17, FR-31, NFR-5, NFR-8
  - Done when: calling it twice with the same count returns identical arrays; first N values for the same count are a prefix of a larger count (throwaway `node` one-liner, not committed); all x, y within [-0.5, 0.5]; lint exits 0.

- [~] T-07 Add moon framing helper
  - Files: `src/three/moonFraming.js` (create)
  - Needs: none
  - Do: Export `CAMERA_Z = 3.6`, `FOV_DEG = 40`, `MOON_RADIUS_PER_HERO_HEIGHT = (1 / Math.sqrt(CAMERA_Z ** 2 - 1)) / Math.tan(FOV_DEG / 2 * Math.PI / 180) / 2`, and `moonRadiusPx(stageHeight) = MOON_RADIUS_PER_HERO_HEIGHT * stageHeight`. Comment: reproduces the old perspective framing (D-2) as an orthographic pixel radius. Pure.
  - Covers: FR-16, FR-30, D-2
  - Done when: `moonRadiusPx(900)` is about 357 (report the exact value); compare with the baseline planet diameter from T-02 (diameter = 2 x radius at the baseline hero height) and report the percentage difference in the task report (must be within 5%, otherwise stop and report); lint exits 0.

## Layer 3: Generic model loading

- [~] T-08 Add disposeObject helper
  - Files: `src/three/disposeObject.js` (create)
  - Needs: none
  - Do: `export function disposeObject(root)`: `root.traverse`; per node `geometry?.dispose()`, `skeleton?.dispose()`; per material (array-aware) dispose every property value with `isTexture`, then `material.dispose()`.
  - Covers: FR-13, FR-21
  - Done when: single named export; lint exits 0.

- [~] T-09 Add generic Model component
  - Files: `src/three/Model.jsx` (create)
  - Needs: T-03, T-08
  - Do: Default export `Model({ url, ...props })`. `const { scene } = useGLTF(url, false, false)` (Draco and meshopt off, D-8); report from `node_modules/@react-three/drei` source that `false` skips `DRACOLoader`. `clone = useMemo(() => scene.clone(true), [scene])`; render `<primitive object={clone} {...props} />`. Module-level `Map<string, number>` ref count: effect mount `count[url]++`; cleanup `count[url]--` then `setTimeout(0)`: if 0, `disposeObject(scene)`, `useGLTF.clear(url)`, delete entry (D-12, StrictMode-safe). No moon-specific code. Named drei import `useGLTF` only.
  - Covers: FR-13, FR-18, FR-21, FR-22, NFR-5
  - Done when: `grep -in "moon" src/three/Model.jsx` returns nothing; only `useGLTF` imported from drei; lint and `npm run build` exit 0.

## Layer 4: Scene content

- [~] T-10 Add FitToUnit
  - Files: `src/three/fitToUnit.js`, `src/three/FitToUnit.jsx` (create)
  - Needs: T-03
  - Do: `fitToUnit(group)` with module-level scratch `Box3`/`Vector3`: `box.setFromObject(group, true)`, `scale = 1 / (max(size) / 2)`, set `group.scale` uniform and `group.position = -center * scale`. `FitToUnit.jsx`: wrapper `<group ref>` rendering `children`, `useLayoutEffect` once calls `fitToUnit(ref.current)`. Setup-time only.
  - Covers: FR-16, D-2
  - Done when: both files exist; no `useFrame`; lint exits 0.

- [~] T-11 Add Moon
  - Files: `src/three/Moon.jsx` (create)
  - Needs: T-04, T-09, T-10
  - Do: `Moon({ rigRef, spinRef })`: `import moonUrl from '../assets/3D/moon.glb'`; render `<group ref={rigRef} rotation-z={TILT}><group ref={spinRef}><FitToUnit><Model url={moonUrl} /></FitToUnit></group></group>`, `TILT = -0.18`. No lights, no custom material, no animation logic. One-line comment: swapping the model means changing the single import.
  - Covers: FR-14, FR-15 (structure), FR-16, FR-23, D-2, D-3
  - Done when: exactly one `.glb` import; no `light`/`ShaderMaterial`; `npm run build` exits 0 (import path resolves); lint exits 0.

- [~] T-12 Add StarLayer
  - Files: `src/three/StarLayer.jsx` (create)
  - Needs: T-03, T-06
  - Do: `StarLayer({ count, width, height, aRef, bRef })`: `positions = useMemo(() => createStarPositions(count), [count])`; `dpr = useThree(s => s.viewport.dpr)`; render `<group scale={[width, height, 1]}>` containing two `<points>` (refs `aRef`, `bRef`), each with `<bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>` and `<pointsMaterial color={0xe8ecf5} size={STAR_SIZE_CSS_PX * dpr} sizeAttenuation={false} transparent opacity={0.85} depthWrite={false} />`; `STAR_SIZE_CSS_PX = 1.6`. Keep the comment that the colour is duplicated from `--color-text` in `src/index.css`. No `useFrame`. The two instances exist only for seamless drift wrap (comment).
  - Covers: FR-13, FR-17, FR-31, NFR-5, NFR-6, NFR-8
  - Done when: exactly two `points`, one shared `positions` array, no `useFrame`, no custom shader; lint exits 0.

## Layer 5: Hooks

- [~] T-13 Add pointer target hook
  - Files: `src/three/usePointerTarget.js` (create)
  - Needs: none
  - Do: `usePointerTarget()` returns a preallocated `{ x, y }` ref. Effect only if `matchMedia('(pointer: fine)').matches`: `pointermove` on `window` (throttled 33 ms via `performance.now()`, writes normalised -1..1 with y up) and `blur` (resets to 0); cleanup removes both. `POINTER_INTERVAL_MS = 33`.
  - Covers: FR-13, FR-17, AC-15
  - Done when: add/remove symmetric in one effect; nothing registered when `(pointer: fine)` is false; lint exits 0.

- [~] T-14 Add scroll metrics hook
  - Files: `src/three/useScrollMetrics.js` (create)
  - Needs: none
  - Do: `useScrollMetrics(pageRef)` returns a preallocated ref `{ scrollY, maxScroll }`. Effect: passive `scroll` listener on `window` sets `scrollY = window.scrollY`; `updateMax()` sets `maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)` from a `ResizeObserver` on `pageRef.current` and a `window` `resize` listener; call both once at mount. Cleanup removes listeners and disconnects. No Lenis import (works because Lenis scrolls the real window).
  - Covers: FR-13, FR-32, NFR-7, AC-23
  - Done when: scroll listener is `{ passive: true }`; no `requestAnimationFrame`; add/remove symmetric; lint exits 0.

- [~] T-15 Add hero metrics hook
  - Files: `src/three/useHeroMetrics.js` (create)
  - Needs: none
  - Do: `useHeroMetrics(pageRef)` returns `{ metrics, version }`: `metrics` is a preallocated ref `{ cx, cy, height, inView }`, `version` is state. Effect: `hero = pageRef.current?.querySelector('#hero')`; if null, `inView=false` and return. `ResizeObserver` on hero and on `pageRef.current`: in the callback read `offsetLeft/offsetTop/offsetWidth/offsetHeight` (relative to the `relative` wrapper), write `cx = left + width/2`, `cy = top + height/2`, `height`, then bump `version`. `IntersectionObserver` on hero writes `inView`. Cleanup disconnects both.
  - Covers: FR-13, FR-30, FR-33, AC-22
  - Done when: layout reads occur only inside the observer callback; cleanup disconnects both observers; lint exits 0.

- [~] T-16 Add document visibility hook
  - Files: `src/three/useDocumentVisible.js` (create)
  - Needs: none
  - Do: `useDocumentVisible()` via `useSyncExternalStore` subscribing to `visibilitychange` (snapshot `!document.hidden`, server snapshot `true`); unsubscribe on cleanup.
  - Covers: FR-7, FR-13, FR-33, AC-6, AC-24
  - Done when: no IntersectionObserver in this file; lint exits 0.

- [~] T-17 Add dev stats object
  - Files: `src/three/devStats.js` (create)
  - Needs: none
  - Do: `export const devStats = { frames: 0, moonFrames: 0, starCount: 0 }` with a comment: written only under `import.meta.env.DEV`, read by the dev hook for verification counters.
  - Covers: FR-13, AC-6, AC-22, AC-24, AC-26
  - Done when: file exists; lint exits 0.

## Layer 6: Scene and canvas shell

- [~] T-18 Add PageScene
  - Files: `src/three/PageScene.jsx` (create)
  - Needs: T-11, T-12, T-07, T-13, T-14, T-15, T-17
  - Do: `PageScene({ starCount, epoch, pageRef, onLive })`. `size = useThree(s => s.size)`. Refs: `layerRef`, `aRef`, `bRef`, `placeRef`, `rigRef`, `spinRef`, `moonReadyRef`, `motion = useRef({ px:0, py:0, drift:0, frames:0 })`, `widthRef` (updated in an effect). Render `<group ref={layerRef}><StarLayer count width height aRef bRef/></group>` and `<Suspense fallback={null}><group ref={placeRef}><Moon rigRef spinRef/></group><MoonReady/></Suspense>`; `MoonReady` (same file, not exported) sets `moonReadyRef.current = true` in an effect and resets it in cleanup. `useLayoutEffect` on `[size.width, size.height, version]`: `place.position.set(cx - W/2, H/2 - cy, 0)`, `place.scale.setScalar(moonRadiusPx(height))`. ONE `useFrame` implementing exactly the pseudo-code in plan.md "Per-frame logic" (dt clamp 0.1, pointer smoothing, drift wrap with A/B at `d` and `d - 1`, scroll offset `min(progress * SCROLL_PARALLAX_MAX_PX, scrollY)`, star pointer shift, `placeRef.visible = inView`, spin/tilt only when visible and moon ready, `onLive()` after the 2nd frame with the moon ready regardless of visibility, counter reset when `epoch` changes, `devStats` increments and `devStats.starCount = starCount` under `import.meta.env.DEV`). Constants: `DRIFT_PX_PER_SEC = 3`, `SCROLL_PARALLAX_MAX_PX = 120`, `STAR_POINTER_SHIFT_PX = 8`, `POINTER_MAX = 0.15`, `POINTER_SMOOTHING = 4`, `SPIN_RAD_PER_SEC = 2 * Math.PI / 90`. Export only the default component.
  - Covers: FR-4 (live report), FR-8, FR-15, FR-17, FR-30, FR-31, FR-32, FR-33, AC-3, AC-15, AC-22, AC-23, AC-24
  - Done when: exactly one `useFrame`; inspection shows no `new`, array/object literals or arrow functions created inside it; no lights; `SPIN_RAD_PER_SEC` gives a 90 s turn; lint exits 0.

- [~] T-19 Add WebGL probe and error boundary
  - Files: `src/three/webgl.js`, `src/three/CanvasErrorBoundary.jsx` (create)
  - Needs: T-05
  - Do: `probeWebGL2()`: throwaway canvas, `getContext('webgl2')`, read `MAX_RENDERBUFFER_SIZE` and `MAX_VIEWPORT_DIMS`, release via `WEBGL_lose_context.loseContext()`, return `{ maxDim: maxBufferDim(...) }` or `null` (try/catch -> null). `CanvasErrorBoundary`: class component; `getDerivedStateFromError` renders `null`; `componentDidCatch` calls `props.onError(error)` and, only when `import.meta.env.DEV`, one `console.error`.
  - Covers: FR-11, FR-20, FR-34, FR-35, AC-8 (b, c)
  - Done when: both files exist; boundary renders children when no error; lint exits 0.

- [~] T-20 Add DprController
  - Files: `src/three/DprController.jsx` (create)
  - Needs: T-03, T-05
  - Do: Renders `null`; props `{ maxDim, pixelBudget, onDpr, onUnfit }`; `size = useThree(s => s.size)`; `useLayoutEffect` on `[size.width, size.height]`: if `!fitsAtDprOne(size.width, maxDim)` call `onUnfit()`; else `onDpr(computeDpr({ cssWidth: size.width, cssHeight: size.height, deviceDpr: window.devicePixelRatio, maxDim, pixelBudget }))`.
  - Covers: FR-34, FR-35, NFR-6, AC-25
  - Done when: only `bufferLimits.js` functions are used for the maths; no `svh/dvh/vh/innerHeight`; lint exits 0.

- [~] T-21 Add CanvasGuard
  - Files: `src/three/CanvasGuard.jsx` (create)
  - Needs: T-03, T-17
  - Do: Renders `null`; props `{ onLost, onRestored, onShaderError }`; `useThree` for `gl`. Effect: set `aria-hidden="true"` and `tabIndex = -1` on `gl.domElement`; add `webglcontextlost` (`preventDefault()`, `onLost()`) and `webglcontextrestored` (`onRestored()`); set `gl.debug.onShaderError = onShaderError`; DEV only: `window.__planetInfo = () => ({ ...gl.info.memory, canvasWidth, canvasHeight, dpr: gl.getPixelRatio(), cssWidth, cssHeight, maxRenderbuffer, maxViewportDims, documentHeight: document.documentElement.scrollHeight, frames: devStats.frames, moonFrames: devStats.moonFrames, stars: devStats.starCount })` (values read at call time from `gl.domElement`, `gl.getContext().getParameter(...)`). Cleanup removes listeners, restores `onShaderError`, deletes `window.__planetInfo`.
  - Covers: FR-9, FR-10, FR-11, FR-13, FR-29, AC-8 (d), AC-9, AC-20, AC-25
  - Done when: add/remove listener pairs match; dev hook behind `import.meta.env.DEV`; lint exits 0.

- [~] T-22 Add PageCanvas
  - Files: `src/three/PageCanvas.jsx` (create)
  - Needs: T-16, T-18, T-19, T-20, T-21
  - Do: Default export `PageCanvas({ pageRef, onStatus })` per plan.md. On mount `probeWebGL2()`; null -> `onStatus('fallback')`, render nothing. `useState` initialisers: `coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 768`; `starCount = coarse ? 800 : 2000`; `pixelBudget = coarse ? PIXEL_BUDGET_COARSE : PIXEL_BUDGET_DESKTOP`. State `lost`, `failed`, `epoch`, `dpr` (init 1), `live`. `active = useDocumentVisible() && !lost && !failed`. `report(s)` sets local `live` and calls `onStatus`. `fail` sets `failed` and calls `onStatus('fallback')` once; when `failed` render nothing. Layer: `<div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700 motion-reduce:transition-none {live ? 'opacity-100' : 'opacity-0'}" style={{ maxHeight: maxDim + 'px' }}>` containing `<CanvasErrorBoundary onError={fail}><Canvas orthographic dpr={dpr} flat resize={{ scroll: false }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} camera={{ position: [0,0,1000], near: 1, far: 4000, zoom: 1 }} frameloop={active ? 'always' : 'never'} style={{ pointerEvents: 'none' }}>` with `<CanvasGuard onLost onRestored onShaderError/>`, `<DprController maxDim pixelBudget onDpr={setDpr} onUnfit={fail}/>`, `<PageScene starCount epoch pageRef onLive={() => report('live')}/>`. `onLost`: `lost=true`, `live=false`, `onStatus('fallback')`; `onRestored`: `lost=false`, `epoch+1`. Dev capture branch (`import.meta.env.DEV && location.search.includes('capture-poster')`) is added in T-27, not here. Verify in `node_modules/@react-three/fiber` 9.8.2 source and report: (a) `resize={{ scroll: false }}` is honoured, (b) `frameloop` `'never'` -> `'always'` clock behaviour, (c) whether the event manager can be disabled cleanly (use it if so, else leave default and report), (d) `dpr` number prop is applied on change.
  - Covers: FR-4, FR-5, FR-6, FR-7, FR-9, FR-10, FR-11, FR-19, FR-26, FR-27, FR-29, FR-34, FR-35, FR-36, NFR-5, NFR-6
  - Done when: `grep -n "orthographic\|flat\|frameloop\|resize\|maxHeight" src/three/PageCanvas.jsx` shows each; no import of `PlanetCanvas.jsx`/`createPlanetScene.js`; no `svh/dvh/vh/innerHeight` for sizing (the `innerWidth` profile check is allowed); lint exits 0.

## Layer 7: Integration

- [~] T-23 Add canvas status context
  - Files: `src/context/canvasStatus.js` (create)
  - Needs: none
  - Do: `export const CanvasStatusContext = createContext('idle')` and `export function useCanvasStatus() { return useContext(CanvasStatusContext) }`. No components, no `three` import.
  - Covers: FR-38, D-21
  - Done when: file exports exactly those two names; lint exits 0 with no oxlint disable comment.

- [~] T-24 Update Hero.jsx: consume status, remove hero frame, drop in-hero canvas (amended 2026-10-21 by user request)
  - Files: `src/components/sections/Hero.jsx`
  - Needs: T-23
  - Do: Only these changes (D-11 as widened): remove `lazy`/`Suspense` imports, the `PlanetCanvas` lazy declaration, the canvas wrapper div and `<PlanetCanvas />`, and the `canvasState` state; add `const status = useCanvasStatus()` (import from `../../context/canvasStatus.js`); poster class uses `status === "live" ? "opacity-0" : "opacity-100"`; remove `hero-frame` from the `<section>` class and add NO replacement element (frame removed entirely, hero transparent; amended 2026-10-21 by user request). Keep `reducedMotion` (intro), poster `<img>` markup, stage div, intro timeline, copy, heading, CTA. Do not edit the provenance comment yet (T-28).
  - Covers: FR-28, FR-36, FR-38, D-11, D-22, AC-29
  - Done when: `grep -n "three\|PlanetCanvas\|lazy\|Suspense" src/components/sections/Hero.jsx` returns nothing; diff touches only the listed items; `npm run build` exits 0; `grep -n "hero-frame" src/components/sections/Hero.jsx` returns nothing; with no provider (idle) the poster is visible over the plain background (smoke check in `npm run dev`) (amended 2026-10-21 by user request).

- [~] T-25 Mount the lazy page canvas in HomePage.jsx
  - Files: `src/pages/HomePage.jsx`
  - Needs: T-22, T-23, T-24
  - Do: Wrap the sections in `<CanvasStatusContext.Provider value={status}><div ref={pageRef} className="relative isolate">`. `const [status, setStatus] = useState('idle')`, `const pageRef = useRef(null)`, `const reducedMotion = usePrefersReducedMotion()`. First child of the wrapper: `{!reducedMotion && <Suspense fallback={null}><PageCanvas pageRef={pageRef} onStatus={setStatus} /></Suspense>}` with `const PageCanvas = lazy(() => import("../three/PageCanvas.jsx"))`. Then `<Hero/> <Projects/> <AboutMe/> <TechStack/>` unchanged and in the same order. This is the only lazy import of the canvas. No other file changes.
  - Covers: FR-2, FR-4, FR-12, FR-26, FR-37, FR-38, D-14, D-21, AC-5, AC-18, AC-29
  - Done when: `npm run build` exits 0 and lists a separate chunk with three/R3F; `npm run dev` shows stars behind all sections and the moon in the hero on `/`; no canvas on `/viewer`; lint exits 0.

## Layer 8: Removal

- [~] T-26 Delete imperative scene and shaders
  - Files: delete `src/three/PlanetCanvas.jsx`, `src/three/createPlanetScene.js`, `src/three/shaders/planet.vert.glsl`, `planet.frag.glsl`, `atmosphere.frag.glsl`, and the empty `src/three/shaders/` directory
  - Needs: T-25 (nothing may still import them)
  - Do: Delete the listed files. Then grep `src/` for `new WebGLRenderer`, `createPlanetScene`, `PlanetCanvas`, `ShaderMaterial`, `?raw`, `requestAnimationFrame` and for `from "three"` / `@react-three` outside `src/three/`; fix only leftover references (report any). A `requestAnimationFrame` in non-3D code (`ScrollToHash.jsx`, Lenis/GSAP) is expected and listed in the report.
  - Covers: FR-3, FR-2, D-1, AC-2
  - Done when: files gone; every grep returns nothing (apart from the listed non-3D rAF); `npm run lint` and `npm run build` exit 0.

## Layer 9: Poster and docs

- [~] T-27 Add dev-only PosterCapture
  - Files: `src/three/PosterCapture.jsx` (create), `src/three/PageCanvas.jsx` (add dev branch only)
  - Needs: T-11, T-07, T-26
  - Do: `PosterCapture`: own `<Canvas orthographic>` in a fixed 1200x1200 box, `dpr={1}`, `flat`, `frameloop="demand"`, `gl={{ alpha: true, preserveDrawingBuffer: true }}`, camera as in `PageCanvas`, `<Suspense><group scale={moonRadiusPx(1200)}><Moon/></group></Suspense>`, refs untouched (spin 0, tilt kept), no stars, no lights. `CaptureOnReady` waits for the model, calls `invalidate()` and one frame, then `gl.domElement.toBlob` and downloads `hero-planet-poster.png`. In `PageCanvas.jsx` add a branch gated by `import.meta.env.DEV && location.search.includes('capture-poster')` that loads `PosterCapture` via dynamic `import()` inside the DEV branch.
  - Covers: FR-25, AC-14
  - Done when: `/?capture-poster` in dev downloads a 1200x1200 transparent PNG (BROWSER); `npm run build` exits 0 and `grep -rl "capture-poster\|CaptureOnReady" dist/assets` returns nothing; lint exits 0.

- [~] T-28 Regenerate poster and update provenance (HUMAN)
  - Files: `src/assets/hero-planet-poster.png` (overwrite), `src/components/sections/Hero.jsx` (comment only)
  - Needs: T-27
  - Do: HUMAN STEP: the owner opens `http://localhost:5173/?capture-poster` in dev and saves the downloaded `hero-planet-poster.png` over `src/assets/hero-planet-poster.png`. Without a browser the builder stops and returns this step; it must not invent placeholder art. After the file is replaced, the builder updates only the provenance comment in `Hero.jsx` to: "generated from this app's moon model scene on <date>; moon.glb provided by owner. Re-capture via /?capture-poster in dev." Compare poster vs live moon at crossfade and report any visible jump. Do not edit `index.css`; ask the user if positioning needs tuning.
  - Covers: FR-25, AC-14
  - Done when: poster is 1200x1200, transparent, shows the moon; comment updated with the date; `Hero.jsx` diff for this task is comment only; `npm run build` exits 0.

- [~] T-29 Write the model convention doc
  - Files: `src/assets/3D/README.md` (create)
  - Needs: T-11
  - Do: Write per the plan outline (five sections): location/import pattern; the exact swap example (`import moonUrl from '../assets/3D/moon.glb'` -> `import shipUrl from '../assets/3D/ship.glb'` in `src/three/Moon.jsx`, `<Model url={shipUrl} />` needs no `Model` change); Blender glTF 2.0 export settings (glTF Binary `.glb`, +Y up, apply modifiers/transforms, embed textures, normals and UVs, no cameras/lights, no Draco/meshopt); budget (at most 1 MB per `.glb`, textures at most 2048x2048 PNG or JPEG, at most ~50k vertices for hero use; `moon.glb` ~496 KB within); notes (materials as exported, framing by `FitToUnit`/`moonFraming.js`, React `<19.4` cap). Keep it short.
  - Covers: FR-23, FR-24, AC-11 (doc part), AC-13
  - Done when: file has the five sections and the exact swap example; `moon.glb` size confirmed under 1 MB (`ls`); no code change.

## Layer 10: Verification (report problems; fix only the defect in the relevant file; BROWSER where marked)

- [~] T-30 Verify static checks, build, chunks and clamp logic
  - Files: `specs/003-r3f-moon-model/baseline.md` (append "After")
  - Needs: T-26, T-27, T-29
  - Do: Run `npm run lint`, `npm run build`, `npm run check:buffer`. Append after-migration entry and 3D chunk names with raw and gzip sizes next to the baseline. Check: entry chunk has no `WebGLRenderer` or `@react-three` markers; separate 3D chunk exists; `dist/assets/moon-<hash>.glb` exists; `grep -rl "PosterCapture\|capture-poster" dist/assets` empty. Re-run the AC-2 greps; each drei import named and used; `package.json` pins and no other new dependency; `HomePage.jsx` has the only `lazy(` of the canvas and `Hero.jsx` diff stays within D-11 (list the changed regions); grep `svh|dvh|vh|innerHeight` in `src/three/` and `HomePage.jsx` (allowed only in the two hooks; `Hero.jsx` pre-existing `svh` is out of scope); code review that the D-19 cap is a CSS `maxHeight` in `PageCanvas.jsx` applied before the renderer sizes the buffer; every `useFrame` allocation-free.
  - Covers: FR-1, FR-2, FR-3, FR-8, FR-22, FR-27, FR-35, FR-38, NFR-1, NFR-2, NFR-5, AC-1, AC-2, AC-5, AC-16 (lint/build), AC-21 (source part), AC-29, AC-30
  - Done when: lint, build and check script exit 0 with no project warnings; every check above reported pass/fail; before/after sizes recorded.

- [~] T-31 Verify page layout, stacking, accessibility and Lenis (BROWSER)
  - Files: none (fix defects in the relevant file only)
  - Needs: T-30
  - Do: At 1440x900 and 375x812: (AC-17) screenshots at scroll 0/mid/bottom show stars behind Hero (live), Projects, AboutMe, TechStack and gaps; cards and Navbar stay opaque; text legible. (AC-18) exactly one canvas; rect top equals the HomePage wrapper top, width equals wrapper width, height equals wrapper height within 1 px; computed position not `fixed`; `elementFromPoint` over text/CTA never returns the canvas. (AC-19) `scrollHeight`/`scrollWidth` equal with canvas vs reduced motion; no horizontal scrollbar; CLS 0. (AC-20/AC-9) `aria-hidden="true"`, `tabindex=-1`, no `role`, computed `pointer-events: none`; CTA, nav and project links, text selection, wheel/touch/keyboard scroll and `/#projects` anchor with Lenis work. (AC-21) resize width and toggle a section's content/fonts: canvas CSS height follows within one observer callback, no repeated size changes after settle, no console warnings; changing only viewport height does not change canvas width/height unless the document height changes. (AC-29) live: hero transparent with page stars behind the moon; idle/fallback: poster over plain background, no frame (amended 2026-10-21 by user request). Hero position check: moon follows hero on resize.
  - Covers: FR-10, FR-26, FR-27, FR-28, FR-29, FR-30, FR-38, NFR-7, AC-9, AC-17, AC-18, AC-19, AC-20, AC-21, AC-29
  - Done when: each AC reported pass/fail with measurements; failures list the file to fix. HUMAN/BROWSER: if the builder has no browser, the owner runs this checklist.

- [~] T-32 Verify motion, framing and loop gating (BROWSER)
  - Files: none
  - Needs: T-30
  - Do: Using `window.__planetInfo()` counters. (AC-3) moon textured, not mirrored/upside down, starfield behind, no lights, GLB material as loaded, one turn takes 90 s (>= 60). (AC-4/AC-22) at 1440x900 and 375x812 at scroll 0, moon diameter and centre within about 5% of the baseline planet and poster measurements (T-02); resizing the window moves/scales the moon with the hero; scrolled past the hero no moon pixels and `moonFrames` stops while `frames` keeps advancing; scrolling back shows no rotation jump; stars always visible. (AC-23) stationary page: stars displace over a 10 s capture (drift); scroll shifts stars by at most `SCROLL_PARALLAX_MAX_PX` relative to content; no per-frame allocation (code review). (AC-24) hidden tab stops `frames`, resumes without a jump; `loseContext()` stops it. (AC-6) DPR with `devicePixelRatio` 3 is at most 2 (actual value recorded). (AC-15) fine pointer tilts the moon within +/-0.15 rad and shifts stars within 8 px, returns on blur; coarse emulation inactive; runtime star count 2000 desktop / 800 at 375px or coarse.
  - Covers: FR-5, FR-7, FR-8, FR-14, FR-15, FR-16, FR-17, FR-30, FR-31, FR-32, FR-33, AC-3, AC-4, AC-6, AC-15, AC-22, AC-23, AC-24
  - Done when: each check reported with measurements; failures list the file to fix. BROWSER.

- [~] T-33 Record real-page buffer matrix and star density (BROWSER)
  - Files: `specs/003-r3f-moon-model/baseline.md` (append "Buffer matrix (AC-25)" and "Density notes (AC-31)")
  - Needs: T-30
  - Do: No synthetic spacers or tall pages (D-25). On the real `/` page, for widths 375, 768, 1440, 1920 and emulated device-pixel-ratio 1, 2, 3 (12 rows) plus one mobile (coarse pointer) emulation, reload and record from `window.__planetInfo()`: document height, `cssWidth x cssHeight`, `canvasWidth x canvasHeight`, effective DPR, `maxRenderbuffer`, `maxViewportDims`, `canvasWidth*canvasHeight`, applicable budget (16M or 8M), and pass/fail on: each dimension at most the device limit, product at most the budget, DPR in [1, 2], `stars` count at most 2000 (800 for 375/coarse). Then density: screenshots at 1440x900 and 375x812 (scroll 0, mid, bottom); write a short verdict (acceptable, too sparse or too dense) with the counts. Do not change caps; report any finding to the owner.
  - Covers: FR-31, FR-34, FR-35 (real-page part), NFR-6, NFR-8, AC-25, AC-26, AC-31
  - Done when: table has 13 rows with pass/fail, all passing or failures listed with the file to fix; density verdict written. BROWSER.

- [~] T-34 Verify lifecycle, fallbacks, network and loading (BROWSER)
  - Files: none (temporary corrupt-model change must be reverted)
  - Needs: T-30
  - Do: (AC-7) dev, StrictMode on; read `window.__planetInfo()` baseline memory; 10 cycles `/` -> `/viewer` -> `/` (wait over 1 s on `/viewer`); counts equal baseline each time on `/`; at most one canvas on `/`, none and no WebGL context on `/viewer`; no console warnings. (AC-8/AC-27) reduced motion before load: no canvas, no 3D chunk request, hero poster only (no frame), other sections plain `bg-ink`; WebGL disabled: same; corrupt or blocked `.glb`: whole page canvas dropped, status `fallback`, poster only, no uncaught errors; `loseContext()`: poster only, loop paused, then `restoreContext()` resumes or stays fallback. Text, CTA and navbar work in each. (AC-10) Slow 3G: poster stays, no layout shift, poster fades out after the moon rendered (amended 2026-10-21 by user request). (AC-12) Network: `moon.glb` from app origin, no third-party origins (no Draco CDN); after returning from `/viewer` served from browser cache, no new download. (AC-16/AC-28) console clean on `/` and `/viewer`; 002 AC-4, AC-9, AC-10, AC-16, AC-17, AC-18 (`/viewer` still "Coming soon"), AC-22 still pass. Revert any temporary change.
  - Covers: FR-9, FR-11, FR-12, FR-13, FR-18, FR-19, FR-20, FR-21, FR-22, FR-36, FR-37, NFR-2, NFR-3, NFR-4, AC-7, AC-8, AC-10, AC-12, AC-16, AC-27, AC-28
  - Done when: every sub-check reported with result; failures list the file to fix; temporary changes reverted. BROWSER.

- [~] T-35 Verify swap test, poster and docs (BROWSER)
  - Files: scratch `src/assets/3D/swap-test.glb` and `src/three/Moon.jsx` (both reverted/removed afterwards)
  - Needs: T-28, T-29, T-30
  - Do: Copy `moon.glb` to `swap-test.glb` (or any glTF sample), change only the import line in `Moon.jsx`, confirm it renders with zero edits to `Model.jsx` (diff shows only the import line), then revert and delete the scratch file. Confirm the README has the exact swap example, Blender settings and budget. Check poster vs live moon at crossfade (AC-14), the `Hero.jsx` provenance comment, and that the capture path is gated by `import.meta.env.DEV`.
  - Covers: FR-18, FR-23, FR-24, FR-25, AC-11, AC-13, AC-14
  - Done when: swap diff is only the import line; `Moon.jsx` identical to its pre-test state and the scratch file gone; `npm run build` exits 0. BROWSER.

## Coverage

| Req | Tasks |
| --- | --- |
| FR-1 | T-03, T-30 |
| FR-2 | T-25, T-26, T-30 |
| FR-3 | T-26, T-30 |
| FR-4 | T-18, T-22, T-25 |
| FR-5 | T-22, T-32 |
| FR-6 | T-22 |
| FR-7 | T-16, T-22, T-32 |
| FR-8 | T-18, T-30, T-32 |
| FR-9 | T-21, T-22, T-34 |
| FR-10 | T-21, T-22, T-31 |
| FR-11 | T-19, T-21, T-22, T-34 |
| FR-12 | T-25, T-34 |
| FR-13 | T-08, T-09, T-12, T-13 to T-17, T-21, T-34 |
| FR-14 | T-11, T-32 |
| FR-15 | T-11, T-18, T-32 |
| FR-16 | T-07, T-10, T-11, T-32 |
| FR-17 | T-06, T-12, T-13, T-18, T-32 |
| FR-18 | T-09, T-34, T-35 |
| FR-19 | T-22, T-34 |
| FR-20 | T-19, T-34 |
| FR-21 | T-08, T-09, T-34 |
| FR-22 | T-04, T-09, T-30, T-34 |
| FR-23 | T-11, T-29, T-35 |
| FR-24 | T-29, T-35 |
| FR-25 | T-27, T-28, T-35 |
| FR-26 | T-22, T-25, T-31 |
| FR-27 | T-14, T-22, T-30, T-31 |
| FR-28 | T-24, T-31 |
| FR-29 | T-21, T-22, T-31 |
| FR-30 | T-07, T-15, T-18, T-31, T-32 |
| FR-31 | T-06, T-12, T-18, T-32, T-33 |
| FR-32 | T-14, T-18, T-32 |
| FR-33 | T-15, T-16, T-18, T-32 |
| FR-34 | T-05, T-19, T-20, T-22, T-33 |
| FR-35 | T-05, T-19, T-20, T-22, T-30, T-33 |
| FR-36 | T-22, T-24, T-34 |
| FR-37 | T-25, T-34 |
| FR-38 | T-23, T-24, T-25, T-30, T-31 |
| NFR-1 | T-01, T-30 |
| NFR-2 | T-30, T-34 |
| NFR-3 | T-34 |
| NFR-4 | T-34 |
| NFR-5 | T-03, T-12, T-22, T-30 |
| NFR-6 | T-05, T-12, T-20, T-22, T-33 |
| NFR-7 | T-14, T-31 |
| NFR-8 | T-06, T-33 |
| AC-1 | T-03, T-30 |
| AC-2 | T-26, T-30 |
| AC-3 | T-18, T-32 |
| AC-4 | T-02, T-07, T-32 |
| AC-5 | T-01, T-25, T-30 |
| AC-6 | T-16, T-17, T-32 |
| AC-7 | T-09, T-34 |
| AC-8 | T-19, T-21, T-34 |
| AC-9 | T-21, T-31 |
| AC-10 | T-22, T-34 |
| AC-11 | T-29, T-35 |
| AC-12 | T-09, T-34 |
| AC-13 | T-29, T-35 |
| AC-14 | T-27, T-28, T-35 |
| AC-15 | T-13, T-18, T-32 |
| AC-16 | T-30, T-34 |
| AC-17 | T-31 |
| AC-18 | T-25, T-31 |
| AC-19 | T-31 |
| AC-20 | T-21, T-31 |
| AC-21 | T-30, T-31 |
| AC-22 | T-15, T-18, T-32 |
| AC-23 | T-14, T-18, T-32 |
| AC-24 | T-16, T-17, T-18, T-32 |
| AC-25 | T-20, T-21, T-33 |
| AC-26 | T-06, T-33 |
| AC-27 | T-24, T-34 |
| AC-28 | T-30, T-34 |
| AC-29 | T-24, T-25, T-30, T-31 |
| AC-30 | T-05, T-30 |
| AC-31 | T-33 |

## Open questions
None open. Human/browser steps: T-02 (screenshots/measurements, if the builder has no browser), T-28 (save the captured poster), T-27 (capture download check) and T-31 to T-35 (browser verification; run by the owner if the builder has no browser). Baseline screenshots in `src/assets/img/` are committed source-folder files not imported by code (D-13); remove or relocate after verification if desired.
