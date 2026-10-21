# Tasks: 002 Space Theme and Planet Hero

Markers: `- [ ]` pending, `- [~]` built, `- [x]` verified.
UI tasks: use the frontend-design skill only (deep-space, restrained, editorial; one cool accent plus one warm rim accent). No second aesthetic system. Use token classes (`bg-ink`, `text-muted`, `border-line`, `font-display`, ...), never `bg-white` or `gray-*`. Never add "award-winning"/"Awwwards" text, fake logos, testimonials, stats or hand-drawn SVG/CSS illustrations. Hidden "from" states come from JS only, never default CSS. Do not change 001 behaviour, ids, labels, order or `aria-current` rules. Three.js is imported only inside `src/three/`. Verification tasks list problems and fix only the defect in the relevant file.

## Layer 1: Theme

- [x] T-01 Install dependencies
  - Files: `package.json`, `package-lock.json`
  - Do: `npm install gsap lenis @fontsource/instrument-serif @fontsource/hanken-grotesk`. Do not install `locomotive-scroll`, `@gsap/react`, `postprocessing` or any other animation lib.
  - Covers: FR-2, FR-24, FR-29, NFR-5, AC-3
  - Done when: `package.json` dependencies list exactly those four new packages; no `locomotive-scroll`; `npm run build` exits 0.

- [x] T-02 Update index.html (noscript and meta)
  - Files: `index.html`
  - Do: Add `<noscript>JavaScript is required to view the full site.</noscript>` in `body`, `<meta name="color-scheme" content="dark">` and `<meta name="theme-color" content="#05070d">` in `head`. Add no CSS that hides content.
  - Covers: FR-28, FR-3, AC-13
  - Done when: `index.html` contains the noscript message and both meta tags; `npm run build` exits 0.

- [x] T-03 Define theme tokens and base CSS
  - Files: `src/index.css`
  - Do: After `@import "tailwindcss";` add an `@theme` block with `--color-ink #05070d`, `--color-surface #0b1020`, `--color-line #1c2540`, `--color-text #e8ecf5`, `--color-muted #9aa6c0`, `--color-accent #7fe3ff`, `--color-rim #ffb067`, `--color-focus #7fe3ff`, `--font-display` (Instrument Serif then serif fallbacks), `--font-sans` (Hanken Grotesk then system-ui fallbacks). Add base: `:root { color-scheme: dark }`, `html, body` background `var(--color-ink)` and text `var(--color-text)`, body font sans, global `:focus-visible` outline using the focus token (2px, offset 2px). Add `.hero-frame` class: layered CSS background (radial warm rim glow over navy-to-ink linear gradient). No default `opacity: 0` or `visibility: hidden` anywhere.
  - Covers: FR-1, FR-3, FR-6, FR-12, AC-2, AC-13
  - Done when: `@theme` defines all tokens above; `npm run build` exits 0; `grep -E "opacity: ?0|visibility: ?hidden" src/index.css` returns nothing.

- [x] T-04 Import self-hosted fonts
  - Files: `src/main.jsx`
  - Do: Import only `@fontsource/instrument-serif/latin-400.css`, `@fontsource/hanken-grotesk/latin-400.css`, `@fontsource/hanken-grotesk/latin-500.css`. Add a comment next to the imports: fonts from Fontsource, SIL OFL 1.1, self-hosted.
  - Covers: FR-2, FR-33, AC-20, AC-21
  - Done when: exactly these three imports exist with provenance comment; `npm run build` exits 0; no reference to `fonts.googleapis.com` in the repo source.

- [x] T-05 Restyle App shell
  - Files: `src/App.jsx`
  - Do: Dark shell: root `div` `flex min-h-svh flex-col bg-ink text-text font-sans`. `main` becomes `flex-1` with no `max-w-5xl`, no padding (sections already own their container; Hero will be full-bleed). Keep Navbar, ScrollToHash, Routes as in 001.
  - Covers: FR-3, FR-10, FR-5, AC-2
  - Done when: `main` has no `max-w-*` or padding classes; no `bg-white`/`gray-*` in `App.jsx`; `npm run lint` clean.

- [x] T-06 Restyle Navbar
  - Files: `src/components/Navbar.jsx`
  - Do: Use the frontend-design skill. Swap to token classes. Keep items, order, routes, `end`, `min-h-11`, wrapping layout. Add distinct hover, `focus-visible` and active states via CSS transitions. Active (`aria-current`) state must not rely on colour alone (add underline or marker). Keep non-sticky.
  - Covers: FR-5, FR-6, FR-36, NFR-3, AC-2, AC-16
  - Done when: DOM order and `aria-current` rules identical to 001; no `gray-*`/`white` classes; all six items reachable at 320px; lint clean.

- [x] T-07 Restyle Projects section
  - Files: `src/components/sections/Projects.jsx`
  - Do: Use the frontend-design skill. Token classes, `py-24` equivalent on `md+`, `h2` hierarchy, small uppercase tracked eyebrow where useful, muted body text, surface/line card styling with hover and focus-visible states if items are interactive. Keep id `projects`, `aria-labelledby`, at least 3 placeholder items, generic copy.
  - Covers: FR-4, FR-5, FR-6, AC-2
  - Done when: no `gray-*`/`white` classes in file; ids and items unchanged; lint clean.

- [x] T-07b Projects cards with image
  - Files: `src/components/sections/Projects.jsx`
  - Do: Use the frontend-design skill. Give each placeholder project object an optional `image` field (`{ src, alt, width, height }`; omitted in all current placeholders). In each card add an image slot at the top with one shared fixed aspect ratio (e.g. `aspect-[16/10]`), `overflow-hidden`, token border. If `project.image` exists render `<img src alt width height loading="lazy" className="h-full w-full object-cover">` using the data values; otherwise render a neutral placeholder `div` (`aria-hidden="true"`) with a CSS gradient from theme tokens only (e.g. `bg-linear-to-br from-surface to-ink` plus a faint `line` border). No SVG, no illustrations, no people, no logos, no text in the placeholder. Add hover and `focus-visible` states on the slot/card via CSS transitions only (e.g. image scale, border colour via `group-hover` and `group-focus-visible`/`focus-within`), not dependent on hover for touch. Add a short comment: real images need provenance (FR-33) and descriptive alt. Keep id `projects`, `aria-labelledby`, at least 3 items and generic copy.
  - Covers: FR-38, FR-34, FR-35, FR-6, AC-25, AC-2
  - Done when: every card shows the same-ratio placeholder frame with no `img`; temporarily adding `image` to one project renders an `img` with `alt`, `width`, `height`, `loading="lazy"`, `object-cover` and no component markup change (revert the temporary data afterwards); no `gray-*`/`white` classes; ids and items unchanged; lint clean.

- [x] T-08 Restyle AboutMe and TechStack sections
  - Files: `src/components/sections/AboutMe.jsx`, `src/components/sections/TechStack.jsx`
  - Do: Use the frontend-design skill. Same treatment as T-07 (tokens, spacing, hierarchy). Keep ids `about` and `tech-stack`, `h2` text, at least 4 TechStack items, generic copy.
  - Covers: FR-4, FR-5, AC-2
  - Done when: no `gray-*`/`white` classes in both files; ids and items unchanged; lint clean.

- [x] T-09 Restyle ViewerPage
  - Files: `src/pages/ViewerPage.jsx`
  - Do: Use the frontend-design skill. Token classes only; keep single `h1` "3D Viewer" and "Coming soon"; no Three.js import; own container.
  - Covers: FR-3, FR-5, AC-18, AC-2
  - Done when: `/viewer` renders dark, one `h1`, "Coming soon"; `grep -r "three" src/pages` returns nothing; lint clean.

## Layer 2: Motion plumbing

- [x] T-10 Create GSAP registry and reduced-motion hook
  - Files: `src/lib/gsap.js`, `src/hooks/usePrefersReducedMotion.js`
  - Do: `gsap.js` imports `gsap` and `ScrollTrigger`, calls `gsap.registerPlugin(ScrollTrigger)` once, exports both. Hook `usePrefersReducedMotion()` uses `useSyncExternalStore` over `matchMedia('(prefers-reduced-motion: reduce)')` (subscribe to `change`, server snapshot `false`).
  - Covers: FR-24, FR-31, NFR-6
  - Done when: both files export as described; `registerPlugin` appears once in `src/`; lint clean.

- [x] T-11 Create SmoothScrollProvider and wire in main.jsx
  - Files: `src/components/SmoothScrollProvider.jsx`, `src/main.jsx`
  - Do: Provider holds Lenis in state; exports `useSmoothScroll()` returning instance or `null`. In an effect, only when `usePrefersReducedMotion()` is false: `new Lenis({ autoRaf: false })`, `tick = (t) => lenis.raf(t * 1000)`, `gsap.ticker.add(tick)`, `gsap.ticker.lagSmoothing(0)`, `lenis.on('scroll', ScrollTrigger.update)`, `document.fonts.ready.then(() => ScrollTrigger.refresh())`. Cleanup: `gsap.ticker.remove(tick)`, `lenis.off(...)`, `lenis.destroy()`, state to null. Wrap `<App />` in provider inside `BrowserRouter` in `main.jsx`. This must be the only `new Lenis` in `src/`.
  - Covers: FR-29, FR-31, FR-30, AC-3, AC-10, AC-14
  - Done when: `grep -r "new Lenis" src` finds one match; cleanup lines present; app loads with no console errors; lint clean.

- [x] T-12 Update ScrollToHash for Lenis
  - Files: `src/components/ScrollToHash.jsx`
  - Do: Use `useSmoothScroll()`. If `location.hash` and target exists: Lenis non-null -> `lenis.scrollTo(el, { offset: SCROLL_OFFSET })`, else `el.scrollIntoView()`. `const SCROLL_OFFSET = 0` (navbar non-sticky; comment that a sticky navbar needs this changed). Keep `location.key`/hash deps. After route change to `/` call `ScrollTrigger.refresh()`.
  - Covers: FR-30, AC-5, AC-15
  - Done when: both branches present; `/viewer` -> `/#about` still scrolls with Lenis on and with reduced motion on; lint clean.

- [x] T-13 Create SplitHeading component
  - Files: `src/components/SplitHeading.jsx`
  - Do: Props `as`, `id`, `text`, `className`, `trigger` (`'scroll'|'none'`, default `'scroll'`). Render `<Tag id className aria-label={text} data-split>` with `text.split(' ')` words as `<span aria-hidden="true" class="inline-block overflow-hidden"><span class="word inline-block">word</span></span>`, separated by plain spaces; full text present at first render. No default hiding CSS. For `trigger='scroll'` and not reduced motion: `gsap.context` in effect with one-shot ScrollTrigger (`start: 'top 85%'`, `once: true`, no scrub) animating `.word` from `yPercent: 110, opacity: 0` with `stagger: 0.05`; cleanup `ctx.revert()`. Reduced motion or `trigger='none'`: no animation set up. Plain text only (never split links or inline markup).
  - Covers: FR-26, FR-27, FR-28, FR-31, AC-12, AC-10
  - Done when: rendered heading has `aria-label` equal to text, every word wrapper `aria-hidden="true"`; stagger value 0.05 in code; only `transform`/`opacity` animated; lint clean.

- [x] T-14 Create useSectionReveal hook
  - Files: `src/hooks/useSectionReveal.js`
  - Do: `useSectionReveal(ref)` -> in `useLayoutEffect` with `gsap.context(..., ref)`: unless reduced motion, animate elements matching `[data-reveal]` inside the ref from `opacity: 0, y: 24` with `stagger: 0.08`, one-shot ScrollTrigger (`start: 'top 80%'`, `once: true`, no scrub). Cleanup `ctx.revert()`. No-op when reduced motion.
  - Covers: FR-26, FR-28, FR-31, FR-32, AC-10
  - Done when: hook exported; only `opacity`/`y` animated; lint clean.

- [x] T-15 Apply SplitHeading and reveal to sections
  - Files: `src/components/sections/Projects.jsx`, `src/components/sections/AboutMe.jsx`, `src/components/sections/TechStack.jsx`
  - Do: Replace each section `h2` with `<SplitHeading as="h2" id=... text=... />` keeping the same ids/text and `aria-labelledby`. Add a `ref` on each section and call `useSectionReveal(ref)`; mark supporting copy and list items with `data-reveal`. Hover/focus states stay CSS (no GSAP on the same properties).
  - Covers: FR-26, FR-27, FR-32, AC-12
  - Done when: three `h2`s are `SplitHeading`; ids and `aria-labelledby` unchanged; headings reveal on scroll with Lenis on; content fully visible with reduced motion; lint clean.

## Layer 3: Hero

- [x] T-16 Restructure Hero layout, static frame and CTA
  - Files: `src/components/sections/Hero.jsx`
  - Do: Use the frontend-design skill. `<section id="hero" aria-labelledby="hero-heading" class="hero-frame relative isolate overflow-x-clip flex min-h-[calc(100svh-<navbar height>)] ...">`. Inner content column `relative z-10 mx-auto max-w-5xl px-4 sm:px-8` with: eyebrow "3D Artist & Game Developer", the single `h1` (id `hero-heading`, `SplitHeading` with `trigger="none"`, display font, large, generic placeholder text), short generic intro paragraph, primary CTA `<Link to="/#projects">View projects</Link>` with distinct hover, focus-visible and active states (CSS only). Add an empty stage `div` (`absolute inset-0 -z-10 pointer-events-none`, `data-stage`) for the planet/poster, sized with `min()`/`vw` so no overflow at 320px. Mark eyebrow, paragraph and CTA with `data-intro`.
  - Covers: FR-8, FR-9, FR-10, FR-12, FR-6, FR-36, AC-4, AC-5, AC-16, AC-17
  - Done when: first viewport at 1440x900 shows eyebrow, `h1`, intro, CTA; clicking CTA scrolls to `#projects`; one `h1` on `/`; no horizontal overflow at 320px; lint clean.

- [x] T-17 Add Hero intro timeline
  - Files: `src/components/sections/Hero.jsx`
  - Do: `useLayoutEffect` + `gsap.context`. Skip when reduced motion or when module-level `introPlayed` is true; set `introPlayed = true` when it runs. Timeline order: `[data-intro]` eyebrow, `h1` `.word` stagger 0.05, intro paragraph, CTA, then `[data-stage]` opacity/scale settle. Only `opacity`, `y`/`yPercent`, `scale`; total duration at most 2.2 s; never set `visibility` or `pointer-events`; `ctx.revert()` on cleanup. Navbar not animated.
  - Covers: FR-11, FR-25, FR-28, FR-31, AC-4, AC-24, AC-10
  - Done when: timeline total duration <= 2.2 s (log or compute in code review); navbar and CTA clickable during the intro; no intro replay after `/` -> `/viewer` -> `/`; reduced motion shows final state immediately; lint clean.

## Layer 4: Three.js planet and poster

- [x] T-18 Write planet and atmosphere shaders
  - Files: `src/three/shaders/planet.vert.glsl`, `src/three/shaders/planet.frag.glsl`, `src/three/shaders/atmosphere.frag.glsl`
  - Do: Planet vertex shader passes normal, position, uv varyings. Planet fragment: 5-octave fbm noise surface (bands/continents) with cool palette from uniforms, lambert from a fixed key light uniform, warm rim term `uRimColor` weighted to the light side. Atmosphere fragment: fresnel glow (`uGlowColor`, power uniform) for a `BackSide` shell. Uniforms only; no texture files, no loops allocating anything.
  - Covers: FR-14, AC-6
  - Done when: three files exist; shaders have no `#include` of missing chunks; compile verified in T-19/T-20 browser run.

- [x] T-19 Create createPlanetScene
  - Files: `src/three/createPlanetScene.js`
  - Do: Named imports from `three` only. `createPlanetScene(canvas, { starCount, capture })` returns `{ start, stop, resize(w,h), setPointer(x,y), dispose }`; throws if WebGL is unavailable. Renderer `antialias`, `alpha`, `powerPreference: 'high-performance'`, `setPixelRatio(Math.min(window.devicePixelRatio, 2))`. Planet: `SphereGeometry(1, 64, 64)` + one `ShaderMaterial` (shader files via `?raw`); atmosphere: second mesh, scale 1.12, `BackSide`, additive, `depthWrite: false`. Starfield: one `THREE.Points`, `Float32Array` on spherical shell radius 20-60, seeded mulberry32, `PointsMaterial` (`sizeAttenuation`, `transparent`, `depthWrite: false`); `starCount` is passed in. Colour hex constants duplicated from `index.css` tokens with a comment. Loop: rotation `delta * (2*PI/90)`, delta from `performance.now()` reset on `start()`, pointer target/current lerp bounded +/-0.15 rad (blur -> 0), single `rafId` guard, no `new` inside the loop (all vectors/colours preallocated). `renderer.debug.onShaderError` calls an `onError` option. `dispose()` cancels rAF, disposes both geometries, all materials, `renderer.dispose()`, `renderer.forceContextLoss()`. Capture mode: `preserveDrawingBuffer: true`, no starfield, fixed rotation, transparent clear, fixed 1200x1200 at DPR 1, one frame rendered, exposes `toBlob`-able canvas. No EffectComposer/render targets. DEV only: set `window.__planetInfo = () => renderer.info.memory` guarded by `import.meta.env.DEV`.
  - Covers: FR-14, FR-15, FR-16, FR-17, FR-19, FR-21, FR-23, AC-6, AC-7, AC-11
  - Done when: `grep -E "new (Vector|Color|Matrix|Quaternion)" ` inside the loop function returns nothing; no `three/examples` or composer import; `npm run lint` clean and `npm run build` exits 0.

- [x] T-20 Create PlanetCanvas component
  - Files: `src/three/PlanetCanvas.jsx`
  - Do: Default export `PlanetCanvas({ onStatus })`. Render a `div` (`pointer-events-none absolute inset-0`) containing `<canvas aria-hidden="true" tabIndex={-1}>`. One `useEffect`: compute `starCount` (800 if `(pointer: coarse)` or `innerWidth < 768`, else 2000); call `createPlanetScene` in try/catch (failure or `onError` -> `onStatus('fallback')`); attach `ResizeObserver` (container -> `resize`), `IntersectionObserver` (hero in view), `visibilitychange`, canvas `webglcontextlost` (`preventDefault`, `stop`, `onStatus('fallback')`) and `webglcontextrestored` (resume, `onStatus('live')`), and `pointermove`/`blur` only when `matchMedia('(pointer: fine)')` matches (sample at most every 33 ms). Run only while `intersecting && !document.hidden && !lost`. Report `'live'` after the first rendered frame. Cleanup removes every listener, disconnects observers, calls `dispose()`, removes the canvas. Dev-only `?capture-poster` branch (guarded by `import.meta.env.DEV`): create scene with `capture: true`, render one frame, `canvas.toBlob` -> download `hero-planet-poster.png`.
  - Covers: FR-13, FR-16, FR-17, FR-18, FR-20, FR-21, FR-22, FR-23, FR-37, AC-7, AC-8, AC-9, AC-11
  - Done when: canvas has `aria-hidden="true"`, `tabIndex={-1}`, no `role`; every `addEventListener`/observer has matching cleanup; lint clean.

- [x] T-21 Lazy-mount PlanetCanvas in Hero with status handoff
  - Files: `src/components/sections/Hero.jsx`
  - Do: `const PlanetCanvas = lazy(() => import('../../three/PlanetCanvas.jsx'))` inside `<Suspense fallback={null}>`, rendered in the stage only when `!usePrefersReducedMotion()`; on `'fallback'` unmount (or hide) the canvas and leave the static frame. Hero holds `canvasState` (`'idle'|'live'|'fallback'`) updated through `onStatus`. Canvas mounted behind text (`-z-10`, `pointer-events-none`). No `three` import outside `src/three/`.
  - Covers: FR-12, FR-13, FR-20, FR-22, FR-23, FR-31, AC-6, AC-8, AC-9, AC-10, AC-23
  - Done when: `npm run build` lists a separate chunk containing `three` not in the entry chunk; with reduced motion no `canvas` element exists; text and CTA clickable through the canvas area; lint clean.

- [x] T-22 Verify planet scene in browser and tune
  - Files: `src/three/createPlanetScene.js`, `src/three/shaders/*` (only to fix defects)
  - Do: Run dev server. Confirm the planet renders shaded, rotating slowly, with atmosphere glow and starfield, and shader compiles without errors. Tune uniforms/palette/camera for a strong first viewport at 1440x900 and 375x812. If no browser is available, return to the user listing this single manual check; do not mark verified.
  - Covers: FR-14, FR-15, FR-16, AC-6
  - Done when: planet visible and animated at both sizes; no shader error in console; result reported per check.

- [x] T-23 Capture planet poster (one-time, human-assisted)
  - Files: `src/assets/hero-planet-poster.png`
  - Do: Run `npm run dev`, open `/?capture-poster` in a browser, save the downloaded `hero-planet-poster.png` (1200x1200 transparent) to `src/assets/hero-planet-poster.png`. If no browser is available to the builder, STOP and return to the user with the exact steps (URL, expected file name, destination path); do not invent or draw placeholder art and do not mark the task built.
  - Covers: FR-12, FR-33, AC-22
  - Done when: file exists, is a PNG with transparency at about 1200x1200, and visually shows the shader planet (no stars), or the task has been returned to the user for the manual step.

- [x] T-24 Add poster image to Hero with provenance and crop
  - Files: `src/components/sections/Hero.jsx`, `src/index.css`
  - Do: Requires T-23 complete. Import the poster via Vite asset import. In `[data-stage]` render `<img src alt="" aria-hidden="true" width="1200" height="1200" onLoad={() => ScrollTrigger.refresh()}>` absolutely positioned (no layout shift), `object-fit: contain` and `object-position` set per breakpoint to match the canvas planet. Poster opacity transitions to 0 (CSS transition, not GSAP) when `canvasState === 'live'` and returns on `'fallback'`. Add source comment: "generated from this app's planet shader on <date>; re-capture via /?capture-poster in dev". Reduced motion: poster is shown, no canvas.
  - Covers: FR-12, FR-20, FR-32, FR-33, FR-35, AC-8, AC-10, AC-21, AC-22
  - Done when: blocking the poster request leaves the gradient and no text shift; provenance comment present; `img` has `alt`, width and height; lint clean.

## Verification tasks

- [x] T-25 Static verification (build, lint, source searches)
  - Files: none (fix defects in relevant files only)
  - Do: Run `npm run lint` and `npm run build`. Check: `grep -rE "bg-white|text-gray-|border-gray-|divide-gray-" src` empty; `@theme` tokens complete; `package.json`/lock contain `gsap`, `lenis`, exactly two `@fontsource*` packages, no `locomotive-scroll`; one `new Lenis`; provenance comments for poster and fonts; no `award-winning|Awwwards` in `src/` or `index.html`; no hand-authored SVG; no `three` import outside `src/three/`; no EffectComposer; `<noscript>` present; no default `opacity: 0`/`visibility: hidden` in CSS; build output shows separate `three` chunk; Lenis code uses `gsap.ticker`, `ScrollTrigger.update`, `document.fonts.ready` refresh, `lenis.destroy()` and ticker removal; hero timeline <= 2.5 s with only transform/opacity; loop has no allocations; disposal list from FR-21 present.
  - Covers: FR-1, FR-2, FR-13, FR-19, FR-21, FR-24, FR-25, FR-28, FR-29, FR-33, FR-34, FR-7, NFR-5, NFR-7, AC-1, AC-2, AC-3, AC-6, AC-13, AC-14, AC-18, AC-21, AC-23, AC-24
  - Done when: every listed check passes and is reported per AC; lint and build exit 0.

- [x] T-26 Browser verification: motion, navigation, accessibility
  - Files: none (fix defects in relevant files only)
  - Do: In a browser check: `/` at 1440x900 first viewport content and CTA/navbar clickable during intro (AC-4); CTA and navbar links scroll to sections on `/` and from `/viewer` with Lenis active and with reduced motion (AC-5, AC-15) and re-run 001 AC-8, 14, 15, 16, 17; reduced motion emulated before load: no canvas, no Lenis, no reveals, content visible (AC-10); accessibility tree names of `h1`/`h2` equal full text, word wrappers `aria-hidden` (AC-12); keyboard-only pass with visible focus ring and distinct hover/focus/active states (AC-16); `/viewer` themed with no Three.js (AC-18). If no browser is available, return to the user with this checklist.
  - Covers: FR-5, FR-6, FR-9, FR-11, FR-26, FR-27, FR-30, FR-31, AC-4, AC-5, AC-10, AC-12, AC-15, AC-16, AC-18
  - Done when: each check passes and is reported per AC, or the task is returned to the user.

- [x] T-27 Browser verification: canvas lifecycle, fallbacks, responsive, contrast, fonts
  - Files: none (fix defects in relevant files only)
  - Do: In a browser check: DPR emulated at 3 is capped at 2; render loop stops when hero is scrolled offscreen and tab hidden, resumes after (AC-7); `WEBGL_lose_context.loseContext()` shows poster, text/navigation work, no uncaught errors; WebGL disabled shows poster and gradient (AC-8); canvas `aria-hidden`, not in tab order, click-through works (AC-9); 10 `/` <-> `/viewer` cycles in dev: at most one canvas, no duplicate Lenis/ticker, no warnings, `window.__planetInfo()` returns to baseline (AC-11); Slow 3G and blocked poster: gradient remains, no text shift, `img` has alt and dimensions (AC-22); no horizontal scrollbar at 320, 375, 768, 1280, 1920 on `/` and `/viewer`, six navbar items reachable at 320 (AC-17); contrast calculations for body, muted, accent and focus ring meet 4.5:1 / 3:1, tune hex tokens if not (AC-19); network panel shows fonts from app origin and only the two families (AC-20). If no browser is available, return to the user with this checklist.
  - Covers: FR-12, FR-17, FR-18, FR-20, FR-21, FR-22, FR-35, FR-36, FR-37, NFR-3, NFR-8, AC-7, AC-8, AC-9, AC-11, AC-17, AC-19, AC-20, AC-22
  - Done when: each check passes and is reported per AC, or the task is returned to the user.

## AC coverage
AC-1: T-25 | AC-2: T-03, T-05 to T-09, T-07b, T-25 | AC-3: T-01, T-11, T-25 | AC-4: T-16, T-17, T-26 | AC-5: T-12, T-16, T-26 | AC-6: T-18, T-19, T-21, T-22, T-25 | AC-7: T-19, T-20, T-27 | AC-8: T-20, T-21, T-24, T-27 | AC-9: T-20, T-21, T-27 | AC-10: T-11, T-13, T-14, T-17, T-21, T-24, T-26 | AC-11: T-19, T-20, T-27 | AC-12: T-13, T-15, T-26 | AC-13: T-02, T-03, T-25 | AC-14: T-11, T-25 | AC-15: T-12, T-26 | AC-16: T-06, T-16, T-26 | AC-17: T-16, T-27 | AC-18: T-09, T-25, T-26 | AC-19: T-27 | AC-20: T-04, T-27 | AC-21: T-04, T-24, T-25 | AC-22: T-23, T-24, T-27 | AC-23: T-21, T-25 | AC-24: T-17, T-25 | AC-25: T-07b
