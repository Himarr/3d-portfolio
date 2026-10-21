# Plan: 002 Space Theme and Planet Hero

## Approach
Brownfield change on the 001 app (Vite 8, React 19, react-router-dom 7, Tailwind v4 via `@tailwindcss/vite`, `three` already installed, lint is `oxlint`, StrictMode already on in `src/main.jsx`). Four layers, built in this order:
1. Theme: Tailwind v4 `@theme` tokens + two self-hosted `@fontsource` fonts; restyle every 001 component by swapping `gray-*`/`white` classes for token classes. Behaviour, ids, labels, order and `aria-current` stay untouched.
2. Motion plumbing: `gsap` + `ScrollTrigger` registered once, `lenis` in one provider, a reduced-motion hook, a `SplitHeading` reveal component.
3. Hero: restructured to full-bleed; CSS static frame (gradient + poster) always present; lazy `PlanetCanvas` mounted on top only when motion is allowed.
4. Poster capture (one-time, from the app's own shader) and verification.

All design choices follow the `frontend-design` skill only (NFR-1). UI tasks must say "use the frontend-design skill; deep-space, restrained, editorial".

Resolved open questions (spec assumptions used): no prerender, only `<noscript>`; poster captured from own shader; planner picks fonts; navbar stays non-sticky; generic placeholder copy and CTA label "View projects".

## Architecture / design decisions
- Tokens in `@theme` (`src/index.css`), generating utilities like `bg-ink`, `text-muted`, `border-line`, `ring-focus`, `font-display`:
  - `--color-ink: #05070d` (page bg), `--color-surface: #0b1020`, `--color-line: #1c2540`, `--color-text: #e8ecf5`, `--color-muted: #9aa6c0` (about 8:1 on ink), `--color-accent: #7fe3ff` (ice-cyan), `--color-rim: #ffb067` (warm rim), `--color-focus: #7fe3ff` (well above 3:1 on ink).
  - `--font-display`, `--font-sans` with system fallbacks. Builder verifies contrast numbers (AC-19) and adjusts hex values if below threshold.
  - `:root { color-scheme: dark }`, `html, body { background: var(--color-ink) }` so overscroll is never white (FR-3). Global `:focus-visible` outline using the focus token (FR-6).
- Fonts (planner choice, editorial pairing): display `@fontsource/instrument-serif` (400 only, normal style), text `@fontsource/hanken-grotesk` (400 and 500). Import only the `latin` files (e.g. `@fontsource/hanken-grotesk/latin-400.css`) in `main.jsx`. Fontsource CSS already uses `font-display: swap`. Provenance comment (OFL licence, fontsource) next to the imports (FR-33).
- Layout restructure (FR-10): `main` in `App.jsx` loses `max-w-5xl`, padding and vertical padding (becomes `flex-1`). Each section already owns `mx-auto max-w-5xl px-4 sm:px-8`, so Projects/About/TechStack are unaffected; `ViewerPage` already has its own container. Hero becomes `relative isolate overflow-x-clip` full-bleed with an inner content column of `max-w-5xl`. `min-h-svh` minus navbar via a flex column shell (`min-h-svh` on shell, hero `flex-1`/`min-h-[calc(100svh-<nav>)]`).
- Navbar stays non-sticky (assumption). So no scroll offset is needed for FR-30; `ScrollToHash` still accepts an `offset` constant (0) so a later sticky change is one line. Mobile navbar keeps the 001 wrapping layout (no menu), items keep `min-h-11`.
- Static frame (FR-12, FR-35): hero container has a CSS layered `background` (radial warm rim glow over navy-to-ink linear gradient) and a decorative `<img alt="" aria-hidden="true" width height>` poster with explicit `object-fit: contain` and `object-position` per breakpoint, positioned to match the canvas planet. Poster is transparent PNG so the gradient shows through. The poster is imported via Vite asset import (`src/assets/hero-planet-poster.png`), so a blocked/slow poster leaves the gradient and no layout shift (absolute positioned, sized by container).
- Canvas/poster handoff: `Hero` holds `canvasState` (`'idle' | 'live' | 'fallback'`) set by `PlanetCanvas` via an `onStatus` callback. Poster is visible by default; when `'live'` its opacity transitions to 0 (CSS transition, not GSAP, FR-32); on `'fallback'` (init failure, shader error, context lost) the canvas is unmounted and the poster stays/returns. Reduced motion: `PlanetCanvas` is never mounted.
- Lazy loading (FR-13, AC-23): `const PlanetCanvas = lazy(() => import('../three/PlanetCanvas.jsx'))` inside `<Suspense fallback={null}>`. Three is imported with named imports only, and only inside `src/three/`. GSAP and Lenis stay in the entry chunk (small; they do not block hero text because text is plain DOM rendered first).
- Three.js split into a React shell and plain JS scene (keeps lifecycle testable and files small):
  - `PlanetCanvas.jsx`: React lifecycle. In one `useEffect`: create `canvas`, call `createPlanetScene(canvas, opts)` inside try/catch (failure -> `onStatus('fallback')`), attach `ResizeObserver` (container), `IntersectionObserver` (hero), `visibilitychange`, `pointermove`/`blur` (only if `matchMedia('(pointer: fine)')`), and canvas `webglcontextlost/restored`. Cleanup reverses all of it.
  - `createPlanetScene.js`: builds renderer (`antialias: true`, `alpha: true`, `powerPreference: 'high-performance'`), scene, camera, planet, atmosphere, starfield; returns `{ renderFrame/start, stop, resize, setPointer, dispose }`. Sets `renderer.debug.onShaderError` to trigger fallback (three does not throw on shader compile errors).
  - `shaders/planet.vert.glsl`, `planet.frag.glsl`, `atmosphere.frag.glsl` imported with `?raw`.
- Planet (FR-14): `SphereGeometry(1, 64, 64)` + one `ShaderMaterial` (fbm value/simplex noise for surface bands and continents, cool blue-teal palette from uniforms, lambert from a fixed key light, warm rim term using `uRimColor` weighted toward the light side). Atmosphere: a second mesh, scale 1.12, `BackSide`, additive blending, `depthWrite: false`, fresnel in its own small `ShaderMaterial` (needed for a glow outside the disc). Interpretation of AC-6: exactly one planet surface material plus one glow-shell material; no post-processing, no render targets.
- Starfield (FR-15): one `THREE.Points`, `BufferGeometry` with a `Float32Array` of positions on a spherical shell (radius 20-60) from a seeded PRNG (mulberry32, so poster and live scene match), `PointsMaterial` (`sizeAttenuation`, `transparent`, `depthWrite: false`, colour = text token). Count: 800 if `matchMedia('(pointer: coarse)')` or `innerWidth < 768`, else 2000, computed once at setup.
- Loop (FR-16 to FR-19): rotation `planet.rotation.y += delta * (2*PI/90)` (90 s per turn, slower than the 60 s limit). Delta from `performance.now()` stored in a module-level number; reset on resume so there is no jump. Pointer: handler stores raw coords only when `now - last >= 33` ms; loop lerps `current` toward `target` (bounded +/-0.15 rad) with preallocated numbers; on blur target is 0. All Vector3/Color objects and uniform values are created at setup; the loop only mutates. `running = intersecting && !document.hidden && !lost`; a single `rafId` guard prevents double loops. DPR: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`; `ResizeObserver` callback calls `renderer.setSize(w, h, false)` and updates camera aspect once per callback (canvas CSS size from layout, no layout reads in the loop).
- Context loss (FR-20): `webglcontextlost` -> `preventDefault()`, `stop()`, `onStatus('fallback')` (poster shown, canvas kept mounted but hidden). `webglcontextrestored` -> three re-inits state itself; resume loop, `onStatus('live')` after the next rendered frame.
- Disposal (FR-21): `dispose()` cancels rAF, disposes both geometries, all three materials, `renderer.dispose()`, `renderer.forceContextLoss()`, and the React cleanup disconnects observers, removes every listener, and removes the canvas. Verified by `renderer.info.memory` on a dev-only `window.__planetInfo` hook guarded by `import.meta.env.DEV` (removed from prod by Vite).
- Canvas a11y (FR-22): `<canvas aria-hidden="true" tabIndex={-1}>` inside a `div` with `pointer-events-none absolute inset-0 -z-10`; hero text column is `relative z-10`.
- GSAP setup: `src/lib/gsap.js` imports `gsap` and `ScrollTrigger`, calls `gsap.registerPlugin(ScrollTrigger)` once, re-exports both. All other files import from there. No `@gsap/react` (NFR-5); use `gsap.context()` inside `useLayoutEffect`/`useEffect` and `ctx.revert()` on cleanup.
- Lenis (FR-29, FR-30): `SmoothScrollProvider` (wraps the app inside `BrowserRouter`) creates Lenis with `autoRaf: false` in an effect only when reduced motion is false. `gsap.ticker.add(tick)` with `tick = (t) => lenis.raf(t * 1000)`, `gsap.ticker.lagSmoothing(0)`, `lenis.on('scroll', ScrollTrigger.update)`, `document.fonts.ready.then(ScrollTrigger.refresh)`. Cleanup: `gsap.ticker.remove(tick)`, `lenis.off`, `lenis.destroy()`, context value reset to null. Exposes `useSmoothScroll()` returning the instance or `null` (via state, so consumers re-render). Reacts to reduced-motion changes through `usePrefersReducedMotion` (create/destroy).
- `ScrollToHash`: if `useSmoothScroll()` is non-null use `lenis.scrollTo(el, { offset })`, else `el.scrollIntoView()`. Keeps `location.key`/`hash` deps so repeat clicks and cross-page (`/viewer` to `/#about`) work. On initial deep link child effects run before the provider effect, so the native branch handles it; fine.
- Reduced motion hook `usePrefersReducedMotion`: `matchMedia('(prefers-reduced-motion: reduce)')` with `useSyncExternalStore` (no flash, handles change events). Used by Provider, Hero, `SplitHeading`, `Reveal`.
- Hero intro (FR-25, FR-11): `useLayoutEffect` + `gsap.context` in `Hero`; if reduced motion, return early (final state). Else `gsap.timeline` with `from` tweens (`opacity`, `y`/`yPercent`/`scale` only): eyebrow, h1 words (stagger 0.05), intro paragraph, CTA, stage wrapper fade/scale settle; total <= 2.2 s; plays once per page load via a module-level `introPlayed` flag (so returning from `/viewer` does not replay and StrictMode double-run just reverts and re-applies). Never sets `visibility` or `pointer-events`; if JS fails, nothing is hidden because from-states are only applied by JS. Navbar is not animated.
- `SplitHeading` (FR-26, FR-27): `<Tag aria-label={text}>` rendering `text.split(' ')` into `<span aria-hidden="true" class="inline-block overflow-hidden"><span class="inline-block word">…</span></span>`, rendered by React (full text present in the DOM at first paint). The animation is attached by the parent via a `data-split` selector: for `h2`, a `ScrollTrigger` one-shot (`start: 'top 85%'`, `once: true`, no scrub) animating `.word` `yPercent: 110 -> 0`, `opacity`, stagger 0.05. Headings contain plain text only (no links/inline markup). It accepts `trigger` mode `'scroll' | 'none'` so the Hero `h1` reuses the same markup and is driven by the intro timeline instead.
- `Reveal` helper hook `useSectionReveal(ref)`: after the heading triggers, supporting copy and list items reveal with a short stagger (`opacity`, `y`), one-shot ScrollTrigger; skipped on reduced motion. `gsap.context` scoped to the section ref, reverted on cleanup (also kills ScrollTriggers). `ScrollTrigger.refresh()` also runs on poster `onLoad` and after route change to `/`.
- `index.html`: add `<noscript>` message ("JavaScript is required to view the full site."), `color-scheme` meta, and `theme-color`. No CSS hides content by default (AC-13).
- Poster capture (FR-12, FR-33): `createPlanetScene` supports an option `capture: true`, enabled only by `import.meta.env.DEV && location.search.includes('capture-poster')` in `PlanetCanvas`. In capture mode: `preserveDrawingBuffer: true`, no starfield, fixed rotation, transparent clear, one frame rendered, then `canvas.toBlob` -> download `hero-planet-poster.png` at a fixed 1200x1200 size, DPR 1. A human/builder opens `/?capture-poster` in dev, saves the file to `src/assets/hero-planet-poster.png`. The branch is dead code in production builds. If the builder cannot run a browser, the task returns to the user for that single manual step (no placeholder art is invented). Provenance comment: "generated from this app's planet shader on <date>".
- Icons: none planned (CTA uses text plus a plain arrow character in the label? No: text only). If an arrow icon is wanted, use Solar via `@iconify/react`; not added by default.

## Files to create/modify
Create:
- `src/lib/gsap.js`
- `src/hooks/usePrefersReducedMotion.js`
- `src/components/SmoothScrollProvider.jsx` (provider + `useSmoothScroll`)
- `src/components/SplitHeading.jsx`
- `src/hooks/useSectionReveal.js`
- `src/three/PlanetCanvas.jsx`
- `src/three/createPlanetScene.js`
- `src/three/shaders/planet.vert.glsl`, `planet.frag.glsl`, `atmosphere.frag.glsl`
- `src/assets/hero-planet-poster.png` (generated, human-assisted)
Modify:
- `package.json` / `package-lock.json`: add `gsap`, `lenis`, `@fontsource/instrument-serif`, `@fontsource/hanken-grotesk`
- `index.html`: noscript, meta
- `src/index.css`: `@theme` tokens, base styles, focus-visible, hero static-frame classes, reduced-motion safe transitions
- `src/main.jsx`: font imports; wrap `App` in `SmoothScrollProvider` (inside `BrowserRouter`)
- `src/App.jsx`: dark shell, `main` without the container
- `src/components/Navbar.jsx`, `src/components/ScrollToHash.jsx`
- `src/components/sections/Hero.jsx`, `Projects.jsx`, `AboutMe.jsx`, `TechStack.jsx`
- `src/pages/ViewerPage.jsx` (restyle only; no Three.js)
`HomePage.jsx` unchanged.

## Data / interfaces
- `useSmoothScroll(): Lenis | null`.
- `usePrefersReducedMotion(): boolean`.
- `<SplitHeading as="h2" id text className trigger="scroll|none" />` renders `aria-label={text}`; word spans `aria-hidden="true"`.
- `<PlanetCanvas onStatus={(s: 'live'|'fallback') => void} />` default export (lazy target).
- `createPlanetScene(canvas, { starCount, capture }) -> { start, stop, resize(w,h), setPointer(x,y), dispose }`; throws on WebGL unavailable (caught by caller).
- Theme tokens listed above. Planet/star colours in JS duplicate the token hex values as constants in `createPlanetScene.js` with a comment pointing to `index.css`.
- Hero copy stays generic: eyebrow "3D Artist & Game Developer", placeholder h1, placeholder intro, CTA "View projects" -> `Link to="/#projects"`.

## Dependencies
Add runtime: `gsap`, `lenis`, `@fontsource/instrument-serif`, `@fontsource/hanken-grotesk`. Optional only if icons used: `@iconify/react`. Not added: `locomotive-scroll`, `@gsap/react`, `postprocessing`, any other animation lib. Verification via build, lint (`oxlint`) and browser checks (no test framework, as in 001).

## Risks
- Intro `from` tweens cause a flash of final state before the layout effect: mitigated with `useLayoutEffect` and `immediateRender`; text is never hidden when JS fails.
- StrictMode double-mount creates two Lenis/WebGL contexts: mitigated by strict cleanup and `ctx.revert()`; checked by AC-11 (10 route cycles).
- Lenis `scrollTo` fires before the new route renders: `ScrollToHash` runs in an effect after render; add `ScrollTrigger.refresh()` after route change if triggers shift.
- Poster is produced by a manual step and may drift from the live planet: shared seed/rotation/uniforms and capture mode reduce this; re-capture is documented in a comment.
- Shader compile errors are logged by three as `console.error`, not thrown; `onShaderError` triggers fallback, but one console message from three may appear in that failure path only.
- AC-6 wording ("single `ShaderMaterial` planet"): glow shell is a second material; documented interpretation above, flag to reviewer.
- Contrast of muted text and accents: verify numerically (AC-19); tune hex if needed.
- Full-bleed hero overflow at 320px: `overflow-x-clip` on hero, planet sized with `min()`/`vw` units; checked at all listed widths.
- Fontsource subset/weights: importing extra weights silently adds font loads (AC-20); import only the four files named above.
- Performance on weak GPUs: 64x64 sphere, 5-octave noise, DPR cap 2, star caps; no post-processing.

## Test strategy (maps to AC-n)
- AC-1: `npm run build`, `npm run lint` exit 0.
- AC-2: grep `src/` for `bg-white|text-gray-|border-gray-|divide-gray-`; inspect `@theme` block.
- AC-3: inspect `package.json`/lock; grep for single `new Lenis`.
- AC-4, AC-24: browser at 1440x900, click navbar/CTA during intro; code inspection of timeline duration (<= 2.2 s) and properties.
- AC-5, AC-15: click CTA and navbar links on `/` and from `/viewer`, with Lenis and with reduced motion; re-run 001 checks (AC-8, 14, 15, 16, 17).
- AC-6, AC-7: code inspection (single planet material, one `Points`, caps, no composer); DevTools DPR 3 emulation; frame counter / rAF stops when scrolled offscreen and tab hidden.
- AC-8: `WEBGL_lose_context.loseContext()` in console; disable WebGL via browser flag.
- AC-9: inspect canvas attributes; click through canvas overlap.
- AC-10: emulate `prefers-reduced-motion: reduce` before load; confirm no canvas, no Lenis, content visible.
- AC-11: 10 `/` <-> `/viewer` cycles in dev (StrictMode); `window.__planetInfo` memory counts; one canvas; no duplicate ticker callbacks.
- AC-12: accessibility tree for `h1`/`h2` names; DOM check of `aria-hidden` wrappers; stagger value 0.05.
- AC-13: grep CSS for default `opacity: 0`/`visibility: hidden`; view `index.html` `<noscript>`.
- AC-14: code inspection of provider.
- AC-16, AC-19: keyboard pass; contrast calculation for text, muted, accent, focus ring.
- AC-17: responsive mode 320/375/768/1280/1920 on `/` and `/viewer`.
- AC-18: view `/viewer`; grep for no `three` import outside `src/three/`.
- AC-20: network panel for font origin and families.
- AC-21: grep for provenance comments, `award|Awwwards`; confirm no hand-authored SVG.
- AC-22: Slow 3G throttle, block poster request; check no layout shift.
- AC-23: `npm run build` output lists a separate chunk containing `three`.

## Order of work
1. Dependencies and fonts: install packages, font imports, `index.html` noscript/meta.
2. Theme tokens and base CSS (`index.css`), `App.jsx` shell and `main` change.
3. Restyle Navbar, Projects, AboutMe, TechStack, ViewerPage with token classes and states (frontend-design skill).
4. `src/lib/gsap.js`, `usePrefersReducedMotion`, `SmoothScrollProvider`, wire in `main.jsx`, update `ScrollToHash`.
5. `SplitHeading` and `useSectionReveal`; apply to section headings and lists.
6. Hero restructure: full-bleed, static CSS frame, content column, CTA, intro timeline (poster placeholder path reserved).
7. Three.js: shaders, `createPlanetScene`, `PlanetCanvas`, lazy wiring into Hero, status handoff, fallbacks, disposal.
8. Poster capture mode, human-assisted capture, add poster asset with provenance comment, tune crop.
9. Verification pass against all ACs (build, lint, reduced motion, context loss, StrictMode cycles, responsive, contrast).
