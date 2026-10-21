# 002 Space Theme and Planet Hero

## Summary
Restyle the whole portfolio with a restrained, editorial deep-space dark theme and make the Hero the strongest moment: a clear message, a CTA to `#projects`, and a Three.js procedural-shader planet (fresnel atmosphere glow, slow rotation, starfield points). Motion is driven by GSAP (hero intro, word-by-word section heading reveals) with Lenis as the single smooth-scroll engine. The hero has a complete static first frame and a static poster fallback for reduced motion, no WebGL, or context loss. Design direction follows the `frontend-design` skill only (no mixing of aesthetic systems), and the bar from `.claude/skills/build-awwward-quality-sites/SKILL.md` is encoded as testable requirements. "Awwwards quality" is an internal bar, never a claim on the site.

## Goals
- A cohesive dark space theme applied to Navbar, Hero, Projects, AboutMe, TechStack and ViewerPage via Tailwind v4 `@theme` tokens.
- A memorable first viewport: message + CTA + planet canvas, usable immediately.
- Composed GSAP hero intro and restrained word-by-word heading reveals.
- One smooth-scroll engine (Lenis) wired to GSAP ScrollTrigger.
- Safe, performant, fully disposed Three.js scene with graceful fallbacks.
- Accessibility and responsiveness preserved from 001 and extended (focus, reduced motion).

## Non-goals
- Black hole, gravitational lensing, post-processing, bloom, render targets.
- Superseded 001 non-goals: 001 excluded "colors, typography, animations, theming" and "any Three.js rendering" (hero). This spec now covers colors, typography (custom fonts), theming, animations and Three.js rendering in the Hero. Still excluded by 001 and unchanged here: the 3D viewer page's Three.js content (stays a "Coming soon" placeholder, only restyled), logo in the navbar, scroll-spy, real content, backend/CMS/contact form/analytics/i18n. 001 "no images" is relaxed only to allow a static poster image for the hero (see FR-12) and the Projects card image slot (see FR-38); no other images are introduced.
- Model-authored SVG/CSS/canvas illustrations; the planet is a shader, which is the one justified canvas.
- Fake logos, logo walls, testimonials, avatars, partnerships, metrics or other invented claims.
- Light theme or theme toggle.
- Locomotive Scroll or any second smooth-scroll library.
- Real project data, bio text, tech lists (placeholders stay, generic and honest).
- Route-transition animation, custom cursor, sound, preloader screen.
- Server-side rendering/prerendering.

## Users/Use cases
- Visitor lands on `/` and immediately sees the name/role, a headline, a CTA and the planet, and can click the CTA to jump to Projects.
- Visitor on a phone, with a slow device, with WebGL disabled, or with reduced-motion preference gets a complete, static, fully usable hero.
- Visitor scrolls the page with smooth scroll and sees section headings reveal; keyboard and screen-reader users get the same content and names.
- Visitor navigates to `/viewer` and sees the same theme.
- Owner later swaps placeholder copy and the poster without touching animation code.

## Functional requirements

### Theme and typography
- FR-1: Design tokens are defined in Tailwind v4 `@theme` in `src/index.css`: background (near-black navy/ink), surface, border, text-primary, text-muted, one cool accent (ice-cyan), one warm rim-light accent, display and text font families, and a focus-ring colour. Components use these tokens, not hard-coded `gray-*`/`white` utilities from 001.
- FR-2: Exactly two typefaces are loaded: one display and one text font, installed via `@fontsource` packages (self-hosted, no runtime Google request). Weights/subsets are limited to those used. A `font-display: swap` strategy is used and fallbacks are defined in the font stacks.
- FR-3: The page background and shell (`App.jsx`) use the dark theme (no white backgrounds anywhere, including `/viewer` and overscroll-visible areas via `color-scheme: dark`).
- FR-4: Typography hierarchy: large display `h1` in the Hero, clear `h2` for sections, small uppercase tracked eyebrow text, muted body text. Generous vertical spacing between sections (at least `py-24` equivalent on `md+`).
- FR-5: Navbar, Projects, AboutMe, TechStack and ViewerPage are restyled to the theme. Behaviour, labels, order, ids and `aria-current` rules from 001 (FR-3 to FR-16) are unchanged.
- FR-6: All interactive elements (nav links, CTA, project items if interactive) have distinct hover, `:focus-visible` and active states; the focus ring is visible against the dark background with at least 3:1 contrast. Active-page state in the Navbar does not rely on colour alone.
- FR-7: Interface icons, if any, use Solar icons via Iconify. No other icon set, no company logos.

### Hero
- FR-8: The Hero's first viewport contains: eyebrow (existing "3D Artist & Game Developer"), the `h1` headline, a short intro paragraph, a primary CTA link to `#projects`, and the planet canvas region. The `h1` remains the single `h1` on `/`.
- FR-9: The CTA is an anchor `<a>`/router link to `/#projects` that scrolls to the Projects section (via Lenis when active, native otherwise), with visible label text (e.g. "View projects").
- FR-10: The hero is full-bleed visually (the planet region may extend beyond the `max-w-5xl` content column), while the text content stays aligned to the content column. Hero height fills the viewport minus the navbar (`min-h-svh` based), without horizontal overflow.
- FR-11: Hero text, Navbar and CTA are readable and operable from first paint; the intro timeline never gates visibility or pointer events (no `visibility:hidden`/`pointer-events:none` on them for longer than the intro itself, and never if JS fails).
- FR-12: The hero has a static first frame implemented in CSS: a layered gradient (deep navy to ink with a soft warm rim glow) plus a static poster of the planet. The poster is a licensed or owner-provided image, or a one-time render captured from the shader itself (provenance recorded, see FR-31). The static frame is shown beneath the canvas and is complete without JS/WebGL. It is the only fallback shown when: WebGL is unavailable, shader creation fails, context is lost and not restored, or `prefers-reduced-motion: reduce` is set.

### Planet scene (Three.js)
- FR-13: One component (e.g. `PlanetCanvas`) owns the scene, with a single responsibility: render the hero planet. It is lazy-loaded (code-split) so Three.js is not in the initial critical bundle.
- FR-14: The planet is a sphere with a custom `ShaderMaterial` (procedural surface via noise in the fragment shader, no texture files required), lit with a cool-tone body and a warm rim light, plus a fresnel atmosphere glow (additive back-side shell or equivalent in the same shader). No lensing, no post-processing.
- FR-15: A starfield is rendered as a single `THREE.Points` object with a fixed point count (at most 2000 desktop, at most 800 on coarse pointer or width under 768px), generated once at setup.
- FR-16: The planet rotates slowly and continuously (full revolution no faster than 60 s). Optional pointer parallax tilts the camera/planet by a small bounded amount, throttled (at most one update per frame, input sampled at no more than ~30 Hz) and additive: with no pointer, touch only, or after window blur, the scene returns to or stays in a complete default pose.
- FR-17: Renderer DPR is capped: `setPixelRatio(Math.min(devicePixelRatio, 2))`; resize is handled with `ResizeObserver` and updates size and aspect without a layout-triggering loop.
- FR-18: Rendering pauses (rAF cancelled) when the hero is offscreen (`IntersectionObserver`) or `document.hidden` is true, and resumes when visible again.
- FR-19: No per-frame allocation in the render loop (vectors, colours, objects reused; no `new` inside the loop).
- FR-20: `webglcontextlost` calls `preventDefault`, stops the loop and shows the static poster; `webglcontextrestored` resumes rendering or leaves the poster in place. Page content is unaffected either way.
- FR-21: On unmount (including route change to `/viewer` and React StrictMode double-mount) all resources are released: cancel rAF, disconnect observers, remove event listeners (pointer, visibilitychange, resize, context events), dispose geometries, materials, textures (if any) and the renderer (`dispose` and `forceContextLoss`), and remove the canvas from the DOM.
- FR-22: The canvas is decorative: `aria-hidden="true"`, not focusable, no `role`, and does not intercept pointer events over text or the CTA (`pointer-events: none` on the canvas layer or correct stacking so text and CTA remain clickable).
- FR-23: Canvas initialisation failure (feature detection or thrown error) is caught and results in the static poster with no console errors from project code that break the page.

### Motion (GSAP and Lenis)
- FR-24: GSAP (with ScrollTrigger) is the primary animation system. `gsap` is added to `dependencies`.
- FR-25: A composed hero intro timeline runs on first load of `/`: eyebrow, then headline (word by word), then intro paragraph, then CTA, then canvas fade-in/scale settle, with total duration at most 2.5 s. It animates only `transform` and `opacity` and plays once per page load.
- FR-26: Section `h2` headings (Projects, About Me, Tech Stack) reveal word by word with a restrained stagger (between 0.03 s and 0.08 s per word) when entering the viewport, via ScrollTrigger (one-shot, not scrubbed). Supporting copy and list items reveal after their heading with a short sequence.
- FR-27: Word-splitting preserves accessibility: the heading element keeps its unsplit full text as its accessible name (e.g. `aria-label` on the heading with the full text), every split word wrapper is `aria-hidden="true"`, links and elements with inline markup are never split, and the unsplit text is present in the DOM for first paint. Applies to the hero `h1` and section `h2`s.
- FR-28: Without JS-applied animation state, all content is visible. Hidden "from" states are applied by JS at setup (e.g. `gsap.set`/`from` in an effect) and never by default CSS. A `<noscript>` element in `index.html` states that JavaScript is required for the full site (see Open questions).
- FR-29: Lenis is the sole smooth-scroll engine. It is initialised once on the client, driven by `gsap.ticker` (`lenis.raf(time * 1000)`, `gsap.ticker.lagSmoothing(0)`), connected to ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)`), and `ScrollTrigger.refresh()` is called after fonts load (`document.fonts.ready`) and after hero media/poster load. On cleanup, `lenis.destroy()`, the ticker callback and all ScrollTriggers/timelines are removed. `locomotive-scroll` is never installed.
- FR-30: In-page navigation (navbar links, CTA, `ScrollToHash`) works with Lenis active (uses Lenis `scrollTo` or equivalent) and with Lenis inactive (native `scrollIntoView`), retaining 001 FR-13 to FR-15 behaviour, including arriving at `/#section` from `/viewer`. The sticky/static navbar choice must not cover the target heading (scroll offset handled if the navbar is sticky or fixed).
- FR-31: Reduced motion: when `prefers-reduced-motion: reduce` matches (checked at load and on change via `matchMedia`), Lenis is not created (or is destroyed), no ScrollTrigger scrub timelines are created, the hero intro and heading reveals are skipped and final states render immediately, and the Three.js canvas is not created (static poster shown instead). Switching the preference at runtime updates behaviour without a reload or leaves a consistent final state.
- FR-32: Simple hover, focus and tap states use CSS transitions, not GSAP. No property is animated by two systems at once.

### Assets and honesty
- FR-33: Provenance of every non-code asset (poster image, fonts, any media) is recorded in a source comment next to its use (source, author, licence, or "generated from this app's shader on <date>"). No uncredited media.
- FR-34: No model-drawn SVG/CSS/canvas illustrations; no fake logos, testimonials, avatars, statistics, awards, clients or partnerships. Placeholder copy remains clearly generic. No user-facing or source text claims "award-winning" or "Awwwards".
- FR-35: Any `img` has meaningful `alt` text (or empty `alt` if purely decorative), explicit width/height or aspect ratio to avoid layout shift, and the poster has a defined crop (`object-fit`/`object-position`) at mobile and desktop.

### Responsive and navigation
- FR-36: Layout works from 320px to 1920px with no horizontal overflow, including the hero canvas/poster. The mobile Navbar remains fully usable (all six items reachable); wrapping nav or a disclosure menu are both acceptable, and a menu, if used, is keyboard operable with `aria-expanded` and closes on route/hash change and Escape.
- FR-37: Touch and coarse-pointer devices do not depend on hover; pointer parallax is disabled or no-op without a fine pointer.

### Projects card image
- FR-38: Each Projects card features an image slot, structured so a real image can be dropped in through an `image` field in the project data (e.g. `{ src, alt, width, height }`; absent means placeholder). Requirements:
  - The slot has a fixed aspect ratio (same for all cards) and the image is cropped with `object-cover`.
  - When a real image exists: descriptive `alt` text of what it shows, `loading="lazy"`, explicit `width` and `height` attributes, and no layout shift.
  - While no real image exists: a neutral CSS-gradient placeholder frame (theme tokens only) fills the same slot with the same aspect ratio. It contains no model-drawn SVG/CSS/canvas illustration, no fake people, no fake logos, and no text claims; it is decorative (`aria-hidden="true"`, no `img`).
  - The slot has distinct hover and `:focus-visible` states (CSS transitions only, e.g. subtle scale or border/ring change; the card is the focusable/interactive unit if cards are interactive), without relying on hover on touch devices.
  - This relaxes the 001/002 "no images" limits for this use only; FR-33 (provenance) and FR-34/FR-35 (honesty, alt and dimensions) still apply to any real image added.

## Non-functional requirements
- NFR-1: Design skill: `frontend-design` only. No second aesthetic system is introduced; the visual thesis is deep-space dark, restrained, editorial, large display type with tight hierarchy and generous spacing, one cool accent plus one warm rim accent.
- NFR-2: Semantic HTML from 001 is preserved (`header`/`nav`, `main`, `section` with headings, one `h1` per page, logical heading order).
- NFR-3: Text contrast meets WCAG AA (4.5:1 body, 3:1 large text and focus ring) on the dark palette.
- NFR-4: Performance: Three.js and GSAP/Lenis do not block first paint of hero text; transforms/opacity only for animations; no continuously animated offscreen content; blur and glow limited (no full-screen `backdrop-filter` stacks).
- NFR-5: Dependencies added are limited to `gsap`, `lenis`, the two `@fontsource` packages and, if used, the Iconify package for Solar icons. No `locomotive-scroll`, no post-processing libs, no animation lib besides GSAP.
- NFR-6: Components stay per-file and independently editable (001 NFR-4): e.g. `PlanetCanvas`, a smooth-scroll provider/hook, a heading-reveal component/hook, each separate from section components.
- NFR-7: Build and lint are clean: `npm run build` and `npm run lint` exit 0 with no warnings from project code, and no console errors at runtime on `/` and `/viewer`.
- NFR-8: Shaders and scene code contain no per-frame garbage and no memory growth after repeated route changes between `/` and `/viewer` (see AC-11).

## Acceptance criteria
- AC-1: `npm run build` and `npm run lint` both exit with code 0. (NFR-7)
- AC-2: `src/index.css` defines the `@theme` tokens listed in FR-1; search of `src/` finds no `bg-white`, `text-gray-*`, `border-gray-*` or `divide-gray-*` utilities left from 001. (FR-1, FR-3, FR-5)
- AC-3: `package.json` and `package-lock.json` contain `gsap`, `lenis`, and exactly two `@fontsource*` font packages (one display, one text); they do not contain `locomotive-scroll`. Source shows exactly one smooth-scroll initialisation. (FR-2, FR-24, FR-29, NFR-5)
- AC-4: Loading `/` at 1440x900 shows, within the first viewport: eyebrow, `h1`, intro text, a CTA with visible text and the planet; the navbar and CTA are clickable while the intro is still running. (FR-8, FR-11, FR-25)
- AC-5: Clicking the CTA scrolls to the Projects section (id `projects`) with no reload and URL ending `#projects`; the Projects heading is not hidden under a sticky/fixed navbar. (FR-9, FR-30)
- AC-6: On `/`, the planet canvas shows a shaded rotating sphere with atmosphere glow and a starfield; code inspection confirms a single `ShaderMaterial` planet, one `Points` starfield within the point caps, and no EffectComposer/post-processing import. (FR-13 to FR-16, Non-goals)
- AC-7: Code inspection and runtime check: DPR is capped at 2 (verify with `devicePixelRatio` emulation of 3); rendering stops when the hero is scrolled offscreen and when the tab is hidden (rAF/frame counter stops), and resumes on return; the render loop contains no allocations. (FR-17, FR-18, FR-19)
- AC-8: Simulating `webglcontextlost` (e.g. `WEBGL_lose_context.loseContext()`) shows the static poster, leaves all text and navigation functional, and logs no uncaught errors. With WebGL disabled in the browser, the poster and gradient render and the hero is complete. (FR-12, FR-20, FR-23)
- AC-9: The canvas has `aria-hidden="true"`, is not in the tab order, and clicking where it overlaps text or the CTA still activates the text/CTA. (FR-22)
- AC-10: With `prefers-reduced-motion: reduce` emulated before load: no canvas element exists and the poster is shown, Lenis is not instantiated, no intro or reveal animation runs, no ScrollTrigger scrub exists, and all headings and content are visible in their final state immediately. (FR-12, FR-29, FR-31)
- AC-11: Navigating `/` to `/viewer` and back 10 times, including under React StrictMode in dev, leaves exactly zero or one canvas on `/`, no duplicate Lenis instances or ticker callbacks, no console warnings, and `renderer.info.memory` geometries/textures return to baseline; code review confirms every disposal in FR-21. (FR-21, FR-29, NFR-8)
- AC-12: Word-split headings: the DOM of each split `h1`/`h2` has an accessible name equal to the full unsplit text (via accessibility tree), all word wrappers are `aria-hidden="true"`, and no `a` or inline-markup element is split. The reveal stagger per word is within 0.03 to 0.08 s. (FR-26, FR-27)
- AC-13: With JavaScript disabled, `index.html` shows the `<noscript>` message and no hidden-by-CSS content exists in source for animated elements (no default `opacity: 0`/`visibility: hidden` in CSS targeting hero or section content). (FR-28)
- AC-14: Code inspection shows Lenis is driven by `gsap.ticker`, calls `ScrollTrigger.update` on scroll, `ScrollTrigger.refresh()` runs after `document.fonts.ready`, and cleanup calls `lenis.destroy()` and removes the ticker callback. (FR-29)
- AC-15: Navbar links ("Projects", "About", "Tech Stack") work on `/` and from `/viewer` (navigate to `/` then scroll to the section) with Lenis active and with reduced motion on. All 001 AC-8, AC-14, AC-15, AC-16, AC-17 still pass. (FR-5, FR-30)
- AC-16: Using only the keyboard (Tab, Shift+Tab, Enter, and Escape for any menu) every navbar item and the CTA is reachable in logical order, activatable, and shows a focus ring visible on the dark background. Hover, focus-visible and active states are visibly distinct on nav links and the CTA. (FR-6, FR-36)
- AC-17: No horizontal scrollbar at 320, 375, 768, 1280 and 1920px on `/` and `/viewer`; at 320px all six navbar items are reachable. (FR-10, FR-36, FR-37)
- AC-18: `/viewer` uses the same dark theme, keeps its single `h1` and "Coming soon" text, and contains no Three.js scene. (FR-3, FR-5)
- AC-19: Contrast check of body text, muted text, accent links and focus ring on the background meets NFR-3 thresholds. (NFR-3, FR-6)
- AC-20: Fonts: network panel shows fonts served from the app origin (no `fonts.googleapis.com` or `fonts.gstatic.com`), only the two chosen families load, and `h1`/body use display/text families respectively. (FR-2, FR-4)
- AC-21: Source search finds provenance comments for the poster and fonts, and finds no `award-winning`/`Awwwards` text in `src/` or rendered output, no fake logos, testimonials, avatars or statistics, and no hand-authored SVG/CSS illustrations; any icons are Solar via Iconify. (FR-7, FR-33, FR-34, NFR-1)
- AC-22: Any `img` has `alt` and dimensions/aspect ratio; throttling to Slow 3G or blocking the poster leaves the CSS gradient frame in place with no layout shift of text. (FR-12, FR-35)
- AC-23: Three.js is in a separate lazy chunk (build output lists a distinct chunk containing `three`, and the entry chunk does not). (FR-13, NFR-4)
- AC-24: Hero intro total duration is at most 2.5 s and animates only `transform`/`opacity` (code inspection) and plays once per page load. (FR-25, NFR-4)
- AC-25: Every Projects card renders an image slot with one shared fixed aspect ratio. With no `image` field it shows a CSS-gradient placeholder (`aria-hidden`, no `img`, no SVG/illustration, no people or logos) and causes no layout shift. Adding `image: { src, alt, width, height }` to one project's data renders an `img` with descriptive `alt`, `loading="lazy"`, `width`/`height` attributes and `object-cover` in that slot, without editing component markup. Hover and `:focus-visible` states on the slot are visibly distinct. (FR-38, FR-34, FR-35)

## Assumptions
- Visual thesis: near-black navy/ink background, ice-cyan primary accent, warm amber/orange rim-light accent, off-white text, muted blue-grey secondary text.
- Fonts via `@fontsource` (self-hosted) rather than Google Fonts CDN: one display family and one text family; exact families chosen at plan time under the `frontend-design` direction.
- Hero poster: a one-time capture of the planet shader (owner-generated, so no third-party licence), stored under `src/assets/` or `public/`, with provenance comment.
- Hero uses an `h1` placeholder headline that stays generic (e.g. no invented claims); copy is finalised by the owner later.
- Starfield and planet colours use the same theme token values (duplicated as shader uniforms/constants, documented).
- Navbar stays non-sticky unless the plan decides otherwise; if made sticky, FR-30 offset applies.
- The existing `main` wrapper with `max-w-5xl` is restructured at plan time so the Hero can be full-bleed (FR-10) while other sections keep the content column.
- Lenis and ScrollTrigger are used only on the client; no SSR exists in this app.
- Browser support: current evergreen browsers with WebGL2 or WebGL1 fallback to poster.

## Open questions
1. JS-disabled content: this is a client-rendered SPA, so with JS off the page body is empty. Spec only requires a `<noscript>` message and no CSS-hidden content (FR-28, AC-13). Is true no-JS content (prerender/static HTML) required? Assumed no (out of scope).
2. Poster source: capture from own shader (assumed) or provide a licensed/owner image?
3. Display and text font families: leave to plan under `frontend-design`, or does the owner have a preference?
4. Should the Navbar become sticky/fixed on the dark theme (affects FR-30 offset)? Assumed: planner decides, default static.
5. Hero CTA label and headline copy: keep generic placeholders, or will the owner supply copy now?
6. Should the project's `.claude/skills` folder name mismatch (`build-awward-quality-sites` on disk vs `build-awwwards-quality-sites` in its frontmatter) be fixed? Informational only, no impact on this spec.
