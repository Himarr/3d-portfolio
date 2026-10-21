# Plan: 003 R3F Migration and Moon Model (with full-page starfield)

## Approach
Brownfield on 001/002 (Vite 8, React 19 StrictMode on in `src/main.jsx`, react-router-dom 7, Tailwind v4, `three` 0.186.1, GSAP + Lenis, oxlint with `react/rules-of-hooks` and `react/only-export-components`). Replace the imperative scene (`src/three/createPlanetScene.js` + `src/three/PlanetCanvas.jsx`) with one R3F page-level canvas built from small single-purpose files under `src/three/`, reached only through a `React.lazy` boundary in `src/pages/HomePage.jsx` (D-21). The canvas is an absolutely positioned layer filling the HomePage content box behind the sections; stars fill it, the moon is placed at the hero's centre in page coordinates and scrolls away with the hero. The moon is the GLB's own unlit material rendered through a generic `Model`. Status (`idle | live | fallback`) goes from the canvas to `HomePage.jsx` state, and from there through a small React context to `Hero.jsx`, which only shows/hides the poster (the hero frame is removed, D-22; amended 2026-10-21 by user request).

Order matters: capture baselines (chunk sizes, screenshots, planet and poster measurements) BEFORE touching code, because AC-4, AC-5 and AC-22 compare against them.

## What changed versus the previous plan (pre D-14)
- Mount: `HeroCanvas` inside the hero stage -> `PageCanvas` mounted by `HomePage.jsx` (not Hero, not App). Reduced-motion gate and lazy boundary move from `Hero.jsx` to `HomePage.jsx`.
- `HeroScene.jsx` -> `PageScene.jsx`; `Starfield.jsx` -> `StarLayer.jsx` (layout and motion change); `useRenderGate.js` -> `useDocumentVisible.js` (no IntersectionObserver gate on the whole canvas, FR-33).
- Projection: perspective (FOV 40, z 3.6) -> orthographic in CSS pixels, because a perspective camera over a page-tall canvas would distort the off-centre moon and cannot keep the old size. The old on-screen result (D-2) is reproduced by `moonFraming.js` (same FOV and distance constants, converted to a pixel radius from hero height).
- Star layout: spherical shell (radius 20-60) -> points on a normalised page-area plane, scaled to the canvas; same PRNG (mulberry32) and seed. Star size in screen pixels.
- Added: `bufferLimits.js` (+ node check script), `DprController.jsx`, `useScrollMetrics.js`, `useHeroMetrics.js`, `moonFraming.js`, `devStats.js`, context module, DPR/buffer clamp, height cap, scroll parallax, drift, hero-frame removal (amended 2026-10-21 by user request).
- Kept unchanged: exact pins, `assetsInclude`, `flat`, `Model` with ref-counted disposal + `useGLTF.clear` (D-12), Draco/meshopt off, `FitToUnit`, `disposeObject`, `CanvasGuard`, `CanvasErrorBoundary`, `webgl.js` (extended), `usePointerTarget`, `PosterCapture` (moved to orthographic with shared framing), baseline in `baseline.md` + screenshots in `src/assets/img/`, convention doc, deletions of the imperative scene and shaders.

## Architecture / design decisions

### Dependencies and config
- Pins (D-5, verified on npm 2026-10-20): `@react-three/fiber` `9.8.2` (peers: `react >=19 <19.4`, `react-dom >=19 <19.4`, `three >=0.156`; expo/react-native peers native-only) and `@react-three/drei` `10.7.9` (peers: `react ^19`, `react-dom ^19`, `three >=0.159`, `@react-three/fiber ^9.0.0`). Repo: react/react-dom ^19.2.8, three ^0.186.1. Compatible. Installed with `npm install --save-exact`.
- Constraint: fiber 9.8.2 caps React below 19.4; a React bump to 19.4+ needs a fiber upgrade first.
- `vite.config.js`: `assetsInclude: ['**/*.glb']` (D-7). If Vite 8 rejects it, stop and report (the `?url` fallback needs the owner).
- `package.json` also gets one script, `"check:buffer": "node scripts/check-buffer-limits.mjs"` (no dependency).

### Page-level canvas architecture
DOM (all inside the lazy chunk except the wrapper):
```
HomePage.jsx
  <CanvasStatusContext.Provider value={status}>
    <div ref={pageRef} className="relative isolate">      // HomePage content box
      {!reducedMotion && <Suspense fallback={null}><PageCanvas pageRef onStatus={setStatus} /></Suspense>}
      <Hero/> <Projects/> <AboutMe/> <TechStack/>
    </div>
  </CanvasStatusContext.Provider>
PageCanvas layer:  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700 motion-reduce:transition-none {live ? opacity-100 : opacity-0}" style={{ maxHeight: maxDim + 'px' }}> <Canvas/> </div>
```
- Stacking: `isolate` on the wrapper makes a stacking context, so the layer at `-z-10` paints above the shell's `bg-ink` (and `html/body` bg) but below every in-flow section (sections are non-positioned, or `relative isolate` like Hero, so they paint above negative-z content). No `App.jsx` edit needed. The wrapper is `relative`, so `hero.offsetTop/offsetLeft` are relative to it.
- Size: the layer is `inset-0` (follows the wrapper height with zero JS, so no feedback loop: the layer is absolute and adds nothing to layout or `scrollHeight`). `maxHeight` is the D-19 cap (see buffer limits). R3F measures the layer with its internal `react-use-measure` (ResizeObserver). Pass `resize={{ scroll: false }}` so scroll events do not trigger `getBoundingClientRect` re-measures (NFR-7). Builder confirms the option in 9.8.2 source.
- Height follows document height only (D-24): no `svh/dvh/vh/innerHeight` is used in sizing. The existing `min-h-svh` in the shell/Hero is small-viewport based and does not change on mobile URL-bar toggle.
- Canvas top edge is the top of the wrapper (D-26), directly below the opaque Navbar.
- Projection: `<Canvas orthographic camera={{ position: [0, 0, 1000], near: 1, far: 4000, zoom: 1 }} flat ...>`. R3F sets the ortho frustum to the canvas size, so 1 world unit = 1 CSS px, origin at canvas centre, +Y up. Page-to-world mapping: `worldX = pageX - W/2`, `worldY = H/2 - pageY` (W, H = R3F `size`). No lights.
- Props: `dpr={dpr}` (state, starts at 1, see DPR), `flat` (no tone mapping, keeps the unlit texture as authored), `gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}`, `frameloop={active ? 'always' : 'never'}`, `resize={{ scroll: false }}`, `style={{ pointerEvents: 'none' }}`. R3F event handling: no object has handlers; builder checks 9.8.2 source for a supported way to disable the event manager (`events` prop) and uses it if clean, else relies on `pointer-events: none` + no handlers and reports (FR-29).

### Status context (D-21)
- `src/context/canvasStatus.js` (no components, no `three`): `export const CanvasStatusContext = createContext('idle')`; `export function useCanvasStatus() { return useContext(CanvasStatusContext) }`. Value is the status string, so no memo needed. `HomePage.jsx` renders the Provider directly and holds `const [status, setStatus] = useState('idle')`.
- `PageCanvas` receives `onStatus` and also keeps a local `live` boolean for the layer's opacity. Reports: `'fallback'` on any failure/context loss, `'live'` after the first rendered frame with the moon loaded (and again after a context restore), never `'idle'` (initial only).
- Reduced motion: `HomePage.jsx` does not mount the lazy canvas, so status stays `'idle'`; Hero shows the poster over plain page background (same as fallback; no frame, amended 2026-10-21 by user request). No 3D chunk is requested.

### Hero.jsx changes (only these, D-11 as widened by D-21, D-22)
1. Remove `lazy`/`Suspense` imports, the `PlanetCanvas` lazy declaration, the wrapper div and the `<PlanetCanvas />` mount, and the local `canvasState` state. `reducedMotion` stays (intro timeline).
2. `const status = useCanvasStatus()`. Poster `<img>` class: `status === "live" ? "opacity-0" : "opacity-100"` (same classes otherwise).
3. Hero frame removed (D-22; amended 2026-10-21 by user request): remove `hero-frame` from the `<section>` class and add NO replacement element. The section keeps `relative isolate` (stage `-z-10` inside it) and has no background, so the hero is transparent and page stars show behind it once the canvas is live. The `.hero-frame` rule in `src/index.css` becomes unused; it is left in place (index.css is not edited; flag dead CSS to the user).
4. Provenance comment text (FR-25).
Poster `<img>` markup, intro timeline, copy, heading, CTA: untouched. The intro timeline still targets `[data-stage]`.

### Rename decision (D-10)
`PlanetCanvas.jsx` -> `PageCanvas.jsx` (it is page-level and no longer a planet). No re-export shim.

### Component and file breakdown (`src/three/`)
Helpers that are not components live in `.js` files (oxlint `only-export-components`).

- `PageCanvas.jsx` (default export, lazy target). Props `{ pageRef, onStatus }`. Owns: `probeWebGL()` result (null -> `onStatus('fallback')`, render nothing), state `lost`, `failed`, `epoch`, `dpr`, `live`; `docVisible = useDocumentVisible()`; `active = docVisible && !lost && !failed`; star count and pixel budget profile via `useState` initialisers (`coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 768`: 800 stars / 8M px if coarse, else 2000 / 16M). `fail()` sets `failed` and calls `onStatus('fallback')` once; when `failed` the component renders nothing, so the Canvas unmounts. Renders the layer div, `<CanvasErrorBoundary onError={fail}>` and `<Canvas>` with `<CanvasGuard/>`, `<DprController/>`, `<PageScene/>`. Dev branch: `import.meta.env.DEV && location.search.includes('capture-poster')` loads `PosterCapture` via dynamic `import()` inside the DEV branch.
- `PageScene.jsx`: owns the scene refs, the hooks (`usePointerTarget`, `useScrollMetrics`, `useHeroMetrics`) and the ONE `useFrame`. Renders `<group ref={layerRef}>` (star translation) `> <StarLayer .../>`, and `<Suspense fallback={null}>` containing `<group ref={placeRef}>` (moon position/scale) `> <Moon rigRef spinRef />` plus a tiny local `MoonReady` that sets `moonReadyRef.current = true` in an effect (cleanup resets it). Moon placement runs in `useLayoutEffect` on `[size.width, size.height, heroVersion]`: `place.position.set(heroCx - W/2, H/2 - heroCy, 0)`, `place.scale.setScalar(moonRadiusPx(heroHeight))` (setup-time, not per frame).
- `StarLayer.jsx` (props `{ count, width, height }`): `positions = useMemo(() => createStarPositions(count), [count])`; `<group scale={[width, height, 1]}>` containing TWO `<points>` (A and B) each with its own declarative `bufferGeometry`/`bufferAttribute` (shared `positions` array) and `pointsMaterial` (`color 0xe8ecf5`, `size = STAR_SIZE_CSS_PX * dpr`, `sizeAttenuation={false}`, `transparent`, `opacity 0.85`, `depthWrite={false}`). R3F disposes them on unmount. Forwarded refs `aRef`, `bRef`. Two instances exist only so drift can wrap seamlessly without a custom shader or buffer re-uploads (Assumption in spec). Colour comment "duplicated from `--color-text` in `src/index.css`" kept. `dpr` for the size comes from `useThree(s => s.viewport.dpr)` read in the component render (re-renders only on DPR change).
- `starfield.js`: `mulberry32(seed)`, `STAR_SEED = 0x5eed1234`, `createStarPositions(count) -> Float32Array(count*3)` with `x = u - 0.5`, `y = 0.5 - v`, `z = STAR_Z` (-1000, behind the moon, whose z extent is within +/- its pixel radius), `u, v` from the PRNG. Pure, normalised, so a canvas height change rescales the field without reshuffling it.
- `Moon.jsx`, `FitToUnit.jsx`, `fitToUnit.js`, `Model.jsx`, `disposeObject.js`: as in the previous plan. `Moon({ rigRef, spinRef })` renders `<group ref={rigRef} rotation-z={TILT}><group ref={spinRef}><FitToUnit><Model url={moonUrl}/></FitToUnit></group></group>` with `import moonUrl from '../assets/3D/moon.glb'` (swap = change this import). `TILT = -0.18`. `FitToUnit` normalises the GLB to a unit-radius sphere (precise `Box3`, includes baked rotation); the placement group in `PageScene` scales it to pixels.
- `moonFraming.js` (pure): `CAMERA_Z = 3.6`, `FOV_DEG = 40`; `MOON_RADIUS_PER_HERO_HEIGHT = (1 / Math.sqrt(CAMERA_Z ** 2 - 1)) / Math.tan(FOV_DEG / 2 * Math.PI / 180) / 2` (about 0.397: the silhouette radius of a unit sphere under the old camera, as a fraction of stage height); `moonRadiusPx(stageHeight) = MOON_RADIUS_PER_HERO_HEIGHT * stageHeight`. Shared by `PageScene` and `PosterCapture` so poster and live moon use one definition. Verified against the baseline measurements (AC-4); if off by more than 5%, stop and report, do not hand-tune.
- `bufferLimits.js` (pure, no `three`): `DPR_MAX = 2`; `PIXEL_BUDGET_DESKTOP = 16_000_000`, `PIXEL_BUDGET_COARSE = 8_000_000`; `maxBufferDim(maxRenderbuffer, maxViewportDims)` = min of the three numbers; `capCssHeight(cssHeight, maxDim) = Math.min(cssHeight, maxDim)` (D-19); `fitsAtDprOne(cssWidth, maxDim)`; `computeDpr({ cssWidth, cssHeight, deviceDpr, maxDim, pixelBudget })` = `max(1, min(deviceDpr, 2, maxDim / max(cssWidth, cssHeight) * (1 - 1e-9), sqrt(pixelBudget / (cssWidth * cssHeight))))`, rounded down to 2 decimals so `ceil(css * dpr)` never exceeds `maxDim` when the size fits at DPR 1.
- `scripts/check-buffer-limits.mjs`: imports `../src/three/bufferLimits.js` and asserts with `node:assert` (AC-30): cap 20000 -> 4096 and 3000 -> 3000 at limit 4096; DPR within [1, 2]; `ceil(css*dpr) <= maxDim` for a grid of sizes that fit at DPR 1; budget lowers DPR (e.g. 1920x4000 at deviceDpr 3 -> below 2 and `w*h*dpr^2 <= 16M`); width above the limit -> `fitsAtDprOne` false. Run with `npm run check:buffer`.
- `DprController.jsx` (renders null, inside `<Canvas>`): `size = useThree(s => s.size)`; `useLayoutEffect` on `[size.width, size.height]`: if `!fitsAtDprOne(size.width, maxDim)` -> `onUnfit()` (-> `fail`); else `onDpr(computeDpr({...}))` with the current `window.devicePixelRatio`. State lives in `PageCanvas` and is passed as the `dpr` prop, which R3F applies. The Canvas starts at `dpr=1` and the CSS `maxHeight` guarantees DPR 1 fits, so no creation-time oversize buffer. Resize-time risk: one same-task window where R3F applies a new size with the old DPR before the controller lowers it; no draw occurs in between (frames render in rAF, the layout effect + state commit run synchronously). Builder reads R3F 9.8.2 `Canvas`/`createRoot` to confirm and reports.
- `webgl.js`: `probeWebGL2()` creates a throwaway canvas, `getContext('webgl2')`, reads `MAX_RENDERBUFFER_SIZE` and `MAX_VIEWPORT_DIMS`, releases via `WEBGL_lose_context.loseContext()`; returns `{ maxDim: maxBufferDim(...) }` or `null` (try/catch -> null). The same `maxDim` feeds the layer's CSS `maxHeight` (D-19/FR-35) and `DprController`. WebGL2 only (three 0.186).
- `useDocumentVisible.js`: `useSyncExternalStore` over `visibilitychange` (`!document.hidden`), server snapshot true. Replaces `useRenderGate`.
- `useScrollMetrics.js` (`useScrollMetrics(pageRef) -> ref`): preallocated ref `{ scrollY, maxScroll }`. Effect: passive `scroll` listener on `window` writes `scrollY = window.scrollY` (works with Lenis, which drives real window scroll and so fires native scroll events; no coupling to `SmoothScrollProvider`); `updateMax()` sets `maxScroll = max(0, documentElement.scrollHeight - window.innerHeight)` from a `ResizeObserver` on the page wrapper and a `resize` listener; initial call at mount. Cleanup removes listeners and disconnects. `innerHeight` is used here only for parallax progress, never for sizing.
- `useHeroMetrics.js` (`useHeroMetrics(pageRef) -> { metrics, version }`): preallocated ref `{ cx, cy, height, inView }`. Effect: `hero = pageRef.current.querySelector('#hero')` (null -> `inView=false`); `ResizeObserver` on hero and page wrapper reads `offsetLeft/offsetTop/offsetWidth/offsetHeight` (layout reads happen in the observer callback only) and bumps `version` state (rare: resize and layout change); `IntersectionObserver` on hero writes `inView` into the ref. Cleanup disconnects both. Moon placement therefore follows hero position/size in page coordinates (FR-30).
- `usePointerTarget.js`: as before (fine pointer only, 33 ms throttle, `blur` resets, preallocated ref).
- `CanvasGuard.jsx`: as before (aria-hidden, tabIndex -1 on `gl.domElement`, context lost/restored listeners, `gl.debug.onShaderError`). DEV hook extended: `window.__planetInfo = () => ({ ...gl.info.memory, canvasWidth, canvasHeight, dpr: gl.getPixelRatio(), cssWidth, cssHeight, maxRenderbuffer, maxViewportDims, documentHeight: document.documentElement.scrollHeight, frames: devStats.frames, moonFrames: devStats.moonFrames, stars: devStats.starCount })` (allocation only when called). Removed in cleanup.
- `devStats.js`: `export const devStats = { frames: 0, moonFrames: 0, starCount: 0 }`; written only under `import.meta.env.DEV` (numeric writes, no allocation). Replaces temporary frame counters in verification.
- `CanvasErrorBoundary.jsx`: as before.
- `PosterCapture.jsx` (dev-only): own `<Canvas orthographic>` in a fixed 1200x1200 box, `dpr={1}`, `flat`, `frameloop="demand"`, `gl={{ alpha: true, preserveDrawingBuffer: true }}`, camera as in `PageCanvas`, `<group scale={moonRadiusPx(1200)}><Moon/></group>` at the origin, refs untouched (spin 0, tilt kept), no stars, no lights; `CaptureOnReady` downloads `hero-planet-poster.png` once the model is rendered. Imported only via dynamic `import()` in the DEV branch.

### Per-frame logic (single `useFrame` in `PageScene`)
Preallocated: `motion = useRef({ px: 0, py: 0, drift: 0, frames: 0 })`, refs to groups, metric refs. No object/array/closure/vector creation in the callback (FR-8).
```
dt = Math.min(delta, 0.1)                    // clamp; resume after pause cannot jump
k = 1 - Math.exp(-dt * POINTER_SMOOTHING)
motion.px += (pointer.x - motion.px) * k     // pointer.x, pointer.y in -1..1 (y up)
motion.py += (pointer.y - motion.py) * k
// stars
motion.drift += dt * DRIFT_PX_PER_SEC / width ; if (motion.drift >= 1) motion.drift -= 1
aRef.position.x = motion.drift ; bRef.position.x = motion.drift - 1      // normalised units, group scale = canvas size
progress = scroll.maxScroll > 0 ? Math.min(scroll.scrollY / scroll.maxScroll, 1) : 0
offset = Math.min(progress * SCROLL_PARALLAX_MAX_PX, scroll.scrollY)     // never exceeds scroll, so no uncovered top strip
layerRef.position.x = -motion.px * STAR_POINTER_SHIFT_PX
layerRef.position.y = -offset + motion.py * STAR_POINTER_SHIFT_PX         // stars shifted down by offset: they scroll slightly slower than content
// moon
visible = hero.inView ; if (placeRef.visible !== visible) placeRef.visible = visible
if (visible && moonReady) { spin.rotation.y += dt * SPIN_RAD_PER_SEC ; rig.rotation.x = motion.py * POINTER_MAX ; rig.rotation.y = motion.px * POINTER_MAX }
// live report (counted regardless of hero visibility)
if (moonReady && ++motion.frames === 2) onLive()       // reset to 0 when `epoch` changes
// dev only
if (import.meta.env.DEV) { devStats.frames++ ; if (visible && moonReady) devStats.moonFrames++ }
```
`width` is the R3F `size.width` held in a ref updated in an effect. The wrap is seamless: copy A spans `[d - 0.5, d + 0.5]`, copy B `[d - 1.5, d - 0.5]` in canvas-width units, so the visible window `[-0.5, 0.5]` always shows exactly one full star tile. Scroll offset is bounded by `SCROLL_PARALLAX_MAX_PX`; stars at the canvas top are uncovered by at most that offset, but because `offset <= scrollY` they are never inside the viewport. Pointer shift can expose at most `STAR_POINTER_SHIFT_PX` of empty strip at the very top/bottom canvas edge (accepted).

### Motion constants (D-23, subtle starting values; owner tunes)
In `PageScene.jsx` unless noted: `DRIFT_PX_PER_SEC = 3`, `SCROLL_PARALLAX_MAX_PX = 120`, `STAR_POINTER_SHIFT_PX = 8`, `POINTER_MAX = 0.15` (moon tilt rad), `POINTER_SMOOTHING = 4`, `SPIN_RAD_PER_SEC = 2 * Math.PI / 90`, `STAR_SIZE_CSS_PX = 1.6` (in `StarLayer.jsx`), `POINTER_INTERVAL_MS = 33` (hook), `TILT = -0.18` (`Moon.jsx`), `STAR_Z = -1000` and `STAR_SEED` (`starfield.js`). Parallax effect: over the whole page stars move 120 px less than content in total (about 3% slower on a 4000 px page).

### DPR, buffer clamp and height cap (FR-34, FR-35, NFR-6, D-18, D-19)
1. Mount: `probeWebGL2()` -> `maxDim`. Layer `maxHeight = maxDim px` (CSS): the canvas CSS height can never exceed the device limit at DPR 1 (D-19). Below the cap the plain background shows. Applied in layout before the renderer sizes the buffer, so nothing is silently clamped.
2. Canvas creation at `dpr = 1` (always fits if the width fits).
3. `DprController` computes the effective DPR on every R3F size change using `computeDpr` (device DPR, 2, `maxDim`, pixel budget by profile; floor 1). Width above `maxDim` -> fallback.
4. Budget: 16M px desktop, 8M px coarse/narrow (spec defaults, unchanged). Illustration (not a test): 1440 x 4000 at device DPR 2 is 23M px, so the budget lowers it to about 1.67.
5. Dev hook reports the numbers for AC-25. Real-page matrix recorded in `baseline.md` (see Verification). The cap logic is verified by `npm run check:buffer` and code review, not by tall synthetic pages (D-25).

### Visibility / frameloop gating, context loss, fallback split
- `active = docVisible && !lost && !failed`; `frameloop={active ? 'always' : 'never'}`. Offscreen does NOT pause the canvas (FR-33); only the moon's work is skipped via `hero.inView`.
- Pause/resume: all motion uses clamped `dt` accumulation, never absolute time, so there is no jump after a pause. Builder verifies in 9.8.2 source how `frameloop` `'never'` -> `'always'` restarts the clock (informational; the clamp protects regardless).
- Lost: `CanvasGuard.onLost` -> `lost = true`, `live = false`, `onStatus('fallback')` (canvas stays mounted, layer faded out, Hero shows the poster over plain background, rest of page plain). Restored: `lost = false`, `epoch += 1`; the frame counter resets and `onLive()` fires after two new frames, giving `'live'` again.
- Shader error, model failure, unfit width, no WebGL: `failed` -> Canvas unmounted -> `'fallback'` once. No canvas remains in the DOM (FR-36).
- 'live' semantics: reported after a frame rendered with the moon loaded, even if the hero is offscreen at that moment.

### Disposal strategy (FR-13, FR-21)
- Canvas/renderer: R3F unmount runs `renderer.dispose()` and `forceContextLoss()` and removes the canvas (deferred about 500 ms; AC-7 waits at least 1 s on `/viewer`). `HomePage` unmounts on route change.
- Observers/listeners removed in cleanups in `useScrollMetrics`, `useHeroMetrics`, `usePointerTarget`, `useDocumentVisible`, `CanvasGuard`.
- Stars: declarative geometry/material, auto-disposed.
- Model: unchanged ref-counted scheme in `Model.jsx` with a module-level `Map<string, number>`: mount `count[url]++`; cleanup `count[url]--` then `setTimeout(0)`; if 0 -> `disposeObject(scene)`, `useGLTF.clear(url)`, delete entry. The deferred check makes StrictMode safe. `useGLTF(url, false, false)` (Draco and meshopt off, D-8; builder confirms no `DRACOLoader`/CDN request). `scene.clone(true)` per instance shares GPU resources with the cached scene. Free-on-leave per D-12.

### Fallback split (D-17, D-22; amended 2026-10-21 by user request: frame removed)
Fallback or idle: poster visible (opacity 1) over the plain `bg-ink` page background, page canvas absent or faded out, other sections on `bg-ink`. Live: only the poster fades out (700 ms, `motion-reduce:transition-none`), the page canvas fades in (same duration); the hero shows the canvas moon over the page-wide stars. The hero section has no background of its own.

### Shell and section backgrounds (FR-28)
Checked in source: no section (Hero, Projects, AboutMe, TechStack) sets a background; only `bg-surface` cards and the Navbar `bg-ink` are opaque (`hero-frame` removed from Hero; amended 2026-10-21 by user request). Therefore `App.jsx`, `index.css`, `Projects.jsx`, `AboutMe.jsx`, `TechStack.jsx` and `Navbar.jsx` need NO edits. The only layout addition is the `relative isolate` wrapper in `HomePage.jsx`; Hero.jsx only loses the `hero-frame` class.

## Files to create/modify
Create:
- `src/three/`: `PageCanvas.jsx`, `PageScene.jsx`, `StarLayer.jsx`, `starfield.js`, `Moon.jsx`, `FitToUnit.jsx`, `fitToUnit.js`, `Model.jsx`, `disposeObject.js`, `moonFraming.js`, `bufferLimits.js`, `DprController.jsx`, `webgl.js`, `CanvasErrorBoundary.jsx`, `CanvasGuard.jsx`, `devStats.js`, `useDocumentVisible.js`, `useScrollMetrics.js`, `useHeroMetrics.js`, `usePointerTarget.js`, `PosterCapture.jsx` (dev-only)
- `src/context/canvasStatus.js`
- `scripts/check-buffer-limits.mjs`
- `src/assets/3D/README.md` (convention doc)
- `specs/003-r3f-moon-model/baseline.md` (before/after sizes, planet and poster measurements, AC-25 matrix, density notes; verification input, not shipped)
- `src/assets/img/` with `baseline-1440x900.png`, `baseline-375x812.png` (D-13; not imported by code)
Modify:
- `package.json`, `package-lock.json` (two exact pins; `check:buffer` script)
- `vite.config.js` (`assetsInclude`)
- `src/pages/HomePage.jsx` (wrapper, lazy mount, reduced-motion gate, status state and provider)
- `src/components/sections/Hero.jsx` (as listed above)
- `src/assets/hero-planet-poster.png` (regenerated, human-assisted)
Delete:
- `src/three/PlanetCanvas.jsx`, `src/three/createPlanetScene.js`, `src/three/shaders/planet.vert.glsl`, `planet.frag.glsl`, `atmosphere.frag.glsl` (and the empty `shaders/` directory)
Unchanged: `src/App.jsx`, `src/index.css`, Navbar, Projects, AboutMe, TechStack, ViewerPage, `src/lib/gsap.js`, `SmoothScrollProvider.jsx`, `ScrollToHash.jsx`, theme tokens, hero copy.

## Data / interfaces
- `PageCanvas({ pageRef: RefObject<HTMLElement>, onStatus: (s: 'live' | 'fallback') => void })`, default export (lazy target).
- `CanvasStatusContext` value: `'idle' | 'live' | 'fallback'`; `useCanvasStatus(): string`.
- `Model({ url, position?, rotation?, scale? })`; `Moon({ rigRef, spinRef })`; `StarLayer({ count, width, height, aRef, bRef })`; `PageScene({ starCount, epoch, pageRef, onLive })`; `DprController({ maxDim, pixelBudget, onDpr, onUnfit })`; `CanvasGuard({ onLost, onRestored, onShaderError })`.
- `useScrollMetrics(pageRef): Ref<{scrollY, maxScroll}>`; `useHeroMetrics(pageRef): { metrics: Ref<{cx, cy, height, inView}>, version: number }`; `usePointerTarget(): Ref<{x, y}>`; `useDocumentVisible(): boolean`.
- Pure: `computeDpr`, `capCssHeight`, `fitsAtDprOne`, `maxBufferDim`, `moonRadiusPx`, `createStarPositions`, `mulberry32`.
- Dev global: `window.__planetInfo()` (shape above).

## Convention doc outline (`src/assets/3D/README.md`, FR-24, AC-11, AC-13)
1. Where: `.glb` files in `src/assets/3D/`; bundled via Vite (`assetsInclude`), hashed name, bad path fails the build.
2. Import pattern and the exact swap example: `import moonUrl from '../assets/3D/moon.glb'` -> `import shipUrl from '../assets/3D/ship.glb'` in `src/three/Moon.jsx`; `<Model url={shipUrl} />` needs no `Model` change.
3. Blender glTF 2.0 export: glTF Binary (`.glb`); +Y up; apply modifiers/transforms; embed textures; include normals and UVs; no cameras, no lights; no Draco/meshopt.
4. Budget: at most 1 MB per `.glb`; textures at most 2048x2048, PNG or JPEG; at most about 50k vertices for hero use. `moon.glb` (~496 KB) is within.
5. Notes: materials used as exported (unlit works with no lights); framing is done by the scene (`FitToUnit`, `moonFraming.js`), not `Model`; React `<19.4` constraint from fiber 9.8.2.

## Dependencies
Runtime added: `@react-three/fiber@9.8.2`, `@react-three/drei@10.7.9` (exact). Drei: named import `useGLTF` only (in `Model.jsx`). Nothing else. Lint is `oxlint`; no test framework (as in 001/002); verification by build, lint, the node check script and the browser.

## Requirement traceability
| Req | Satisfied by |
| --- | --- |
| FR-1 | exact pins; peers recorded above |
| FR-2 | all 3D imports in `src/three/*`; lazy boundary in `HomePage.jsx`; drei `useGLTF` only |
| FR-3 | delete imperative scene, shaders, `PlanetCanvas.jsx` |
| FR-4 | `PageCanvas` -> `onStatus` -> `HomePage` state -> context; `'live'` from `PageScene` frame counter |
| FR-5 | Canvas props `dpr`, `alpha`, `antialias`, `flat`, ortho camera + `moonFraming.js` |
| FR-6 | R3F measure on the layer with `resize={{ scroll: false }}` |
| FR-7 | `frameloop` gating on `useDocumentVisible` + `lost`/`failed`; clamp |
| FR-8 | single allocation-free `useFrame`, preallocated refs |
| FR-9 | `CanvasGuard` context listeners + `lost`/`epoch` |
| FR-10, FR-29 | layer `pointer-events-none`, `aria-hidden`; `CanvasGuard` aria/tabIndex; no handlers; Lenis untouched |
| FR-11 | `probeWebGL2`, `CanvasErrorBoundary`, `onShaderError`, `onUnfit` |
| FR-12 | reduced-motion gate in `HomePage.jsx` |
| FR-13 | cleanups in hooks/guard; R3F unmount; `Model` ref-counted disposal; dev hook |
| FR-14 | `Moon` + GLB material, no lights, `flat` |
| FR-15 | spin group over baked rotation, 90 s/turn, clamped dt |
| FR-16, FR-30 | `FitToUnit` + `moonFraming.js` + `useHeroMetrics` placement |
| FR-17 | `starfield.js` (same PRNG/seed), counts by profile, `usePointerTarget`, smoothing in `useFrame` |
| FR-18, FR-19, FR-20, FR-21, FR-22 | `Model` + `useGLTF`, Suspense, boundary, ref-counted disposal, `assetsInclude`, Draco off |
| FR-23, FR-24 | `Moon.jsx` single import; README |
| FR-25 | `PosterCapture.jsx`, poster step, `Hero.jsx` comment |
| FR-26, FR-27 | `HomePage` wrapper + `inset-0` layer + R3F measure; no viewport-height units |
| FR-28 | `hero-frame` class removed from Hero (hero transparent; amended 2026-10-21 by user request); no other opaque layer changes |
| FR-31 | `starfield.js`, caps by profile, normalised layout never regenerated on resize |
| FR-32 | drift, scroll parallax, pointer shift in the frame logic; constants above |
| FR-33 | `frameloop` gating; `hero.inView` skips moon work |
| FR-34, FR-35 | `bufferLimits.js`, `DprController`, CSS `maxHeight` cap |
| FR-36 | status + Hero poster over plain background (no frame); failed/lost handling |
| FR-37 | canvas lives in `HomePage` only |
| FR-38 | `src/context/canvasStatus.js`, `HomePage.jsx` provider, `Hero.jsx` consumer |
| NFR-1 | lazy chunk; before/after report |
| NFR-2, NFR-3, NFR-4 | lint/build, unchanged hero gating, disposal + cycles |
| NFR-5 | one concern per file |
| NFR-6 | budget in `computeDpr`; two `points` sharing positions, no extra targets |
| NFR-7 | no layout reads per frame; scroll via passive listener into a ref; absolute layer |
| NFR-8 | counts depend only on the profile |

## Poster regeneration and provenance
1. Ensure the live scene and `moon.glb` work in dev.
2. Open `http://localhost:5173/?capture-poster`; `PosterCapture` renders the 1200x1200 transparent moon in the default pose (spin 0, pointer 0, tilt -0.18, no stars, no lights, `flat`, radius `moonRadiusPx(1200)`) and downloads `hero-planet-poster.png`.
3. A human saves it over `src/assets/hero-planet-poster.png`. No browser -> the task returns to the user; no placeholder art.
4. Update the `Hero.jsx` provenance comment with the capture date. Compare poster vs live moon at crossfade for no visible jump (AC-14, AC-22). Poster is `object-contain` centred in the hero stage while the live moon is sized from hero height, so at narrow widths (stage narrower than tall) they differ by design today; the baseline task records both so the comparison target is the baseline planet (AC-4). If poster positioning needs `index.css` changes, ask the user first.

## Verification approach
- Baseline (before any code change): `npm run build` sizes into `baseline.md`; screenshots of `/` at 1440x900 and 375x812 into `src/assets/img/`; measure planet diameter/centre, poster diameter/centre, hero size and document height at both viewports (AC-4, AC-5, AC-22).
- Static (AC-1, AC-2, AC-5, AC-16, AC-28, AC-29): lint, build, chunk markers, drei imports, greps for `new WebGLRenderer|createPlanetScene|ShaderMaterial|\?raw`, 3D imports outside `src/three/`, `svh|dvh|vh|innerHeight` in canvas sizing code (allowed only in the two scroll/pointer hooks), Hero.jsx diff scope.
- Clamp (AC-30): `npm run check:buffer` plus code review of CSS `maxHeight` cap.
- Real-page buffer matrix (AC-25): dev hook on `/` at 375, 768, 1440, 1920 x DPR 1, 2, 3 (DevTools device-pixel-ratio) + one mobile (coarse) emulation; record document height, canvas.width/height, effective DPR, `MAX_RENDERBUFFER_SIZE`, `MAX_VIEWPORT_DIMS`, `width*height` vs budget; table in `baseline.md`. No spacers, no synthetic tall pages.
- Density (AC-31, D-20): screenshots at scroll 0/mid/bottom at 1440x900 and 375x812, write the verdict and counts in `baseline.md`.
- Layout/a11y (AC-17 to AC-21): z-order via `elementFromPoint`, canvas rect vs wrapper rect, scrollHeight/scrollWidth with canvas vs reduced motion, click-through, Lenis wheel/touch/keyboard/anchor, resize and content toggle (observer, no loop).
- Motion (AC-3, AC-6, AC-15, AC-22, AC-23, AC-24): dev counters in `__planetInfo()` (`frames`, `moonFrames`) for hidden tab, hero offscreen, context loss; drift over 10 s; scroll parallax bound; pointer tilt/shift and blur reset; coarse emulation.
- Lifecycle, fallbacks, network, loading (AC-7, AC-8, AC-10, AC-12, AC-27): 10 route cycles (wait over 1 s), reduced motion, WebGL disabled, corrupt/blocked `.glb`, `loseContext()`/`restoreContext()`, Slow 3G, Network panel.
- Swap and docs (AC-11, AC-13, AC-14).
- 002 regression: AC-4, AC-9, AC-10, AC-16, AC-17, AC-18, AC-22.

## Risks
- R3F tone mapping would alter unlit colours: mitigated by `flat`.
- Error propagation relies on Canvas rethrowing scene errors to the outer boundary (v9); verified by the corrupt-model test.
- Resize-time transient (old DPR applied to a new, larger size within one task before `DprController` lowers it): no draw happens in between; verified in source; the CSS cap keeps DPR 1 always safe.
- R3F's default scroll-based re-measure would add layout reads on every scroll: disabled with `resize={{ scroll: false }}`; confirm the option exists in 9.8.2.
- Disabling R3F's event system may not have a clean API: fall back to `pointer-events: none` + no handlers and report.
- Stars at 2000/800 points over a page-sized area are about 4x denser than the old hero view; the density check (AC-31) records the outcome; caps unchanged by decision (D-20).
- Narrow viewports: live moon (sized from hero height) may exceed the poster size or the viewport width, as the old canvas already did; target is the baseline planet (AC-4). Poster parity at 375 may need the owner's decision.
- Orthographic projection replaces the old perspective: a unit sphere silhouette differs from perspective by a few percent at most; checked against baseline (5% tolerance). If it fails, stop and report.
- Pointer star shift can expose a strip of at most 8 px at the canvas top/bottom edge (not visible in practice).
- StrictMode double mount of Canvas and `Model` effects: deferred ref-counted disposal; AC-7 cycles catch regressions.
- R3F's deferred (about 500 ms) renderer disposal can make memory checks look leaky if read too early.
- `useGLTF` with Draco off: confirm no `DRACOLoader`/CDN request.
- Vite 8 `assetsInclude` for `.glb`: confirmed by build output.
- Unknown GLB bounds/pivot: handled by runtime `FitToUnit`; non-spherical moon could exceed the 5% tolerance.
- Hero stage `-z-10` and page canvas order: relies on `isolate` on both wrapper and hero; verified visually (stars visible behind every section including the hero after live; poster over plain background before live and in fallback). The `-z-20` frame risk is gone (frame removed; amended 2026-10-21 by user request). Dead `.hero-frame` CSS remains in `index.css`.
- Poster is a manual step and can drift from the live scene.
- React `<19.4` cap from fiber 9.8.2.
- Chunk size grows (R3F + drei); reported, not gated.
- `window.__planetInfo` name now says "planet"; kept for continuity.

## Order of work
0. Baseline: `baseline.md` sizes and measurements; screenshots into `src/assets/img/`.
1. Pinned deps; `assetsInclude`.
2. Pure logic: `bufferLimits.js` + check script, `starfield.js`, `moonFraming.js`.
3. `disposeObject.js`, `Model.jsx`.
4. `FitToUnit`, `Moon`, `StarLayer`.
5. Hooks: `usePointerTarget`, `useScrollMetrics`, `useHeroMetrics`, `useDocumentVisible`, `devStats`.
6. `PageScene`, `webgl.js`, `CanvasErrorBoundary`, `DprController`, `CanvasGuard`, `PageCanvas`.
7. Context; `Hero.jsx` consumer edit; `HomePage.jsx` mount.
8. Delete old files; grep checks.
9. `PosterCapture`; human poster capture; provenance comment; README.
10. Verification pass.

## Open questions
None open. Spec items flagged as planner assumptions (two `points` instances, normalised star layout, orthographic projection, canvas top below the Navbar, budget floor at DPR 1) are recorded in spec.md Assumptions and D-26 for owner awareness.
