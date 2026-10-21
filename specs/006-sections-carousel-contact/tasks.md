# Tasks: 006 Projects Carousel, Project Pages, About, Tech Stack, Contact and Footer

Markers: `- [ ]` pending, `- [~]` built, `- [x]` verified.

Sources: `spec.md` (with D-21 to D-23) and `plan.md` in this folder. Decision and section names (D-A to D-M) refer to plan.md.

Naming: 006 tasks are `T-xx`. 005 tasks are always written `005:T-xx`.

## Running beside 005
005 is being built in parallel. State when this file was written: 005:T-01 to 005:T-17 are built (`[~]`); 005:T-18 and later are pending. The builder MUST re-read `specs/005-scroll-snap-hero-navbar/tasks.md` before starting any task whose "005 waits" is not "none", and must not start it unless every listed 005 task is `[~]` or `[x]`. If it is not, stop and report; do not edit the file.

Rule that governs every dependency below: a 006 task never edits a file while a pending 005 task also edits that file. Files owned by 005 and the 005 tasks that touch them:
| File | 005 tasks that edit it (pending ones in bold) |
|---|---|
| `src/index.css` | T-15 (built), **T-24**, **T-30** (only if a class is needed), **T-32** |
| `src/components/Navbar.jsx` | T-17 (built), **T-21** (only the same-hash onClick fallback), **T-27**, **T-29** |
| `src/lib/navConfig.js` | **T-28** (created), **T-29** (may set 768) |
| `src/pages/HomePage.jsx` | **T-25** (mounts `SectionArrows`) |
| `src/App.jsx` | **T-20** (mounts `SnapScroller`) |
| `src/assets/icons/README.md` | **T-24** (creates it) |
| `src/components/sections/Projects.jsx`, `AboutMe.jsx`, `TechStack.jsx` | T-16 (built); no pending 005 task edits them |
| `package.json` | T-02, T-04 (built); no pending 005 task edits it |
`ScrollToHash.jsx`, `SmoothScrollProvider.jsx`, `SectionArrows.jsx`, the snap files, Hero and all of `src/three/` are never edited by 006.

Can start now (no pending 005 wait): T-01 to T-25. T-26 onwards each wait on pending 005 tasks (listed per task).

Rules for all tasks:
- No new npm dependency (spec NFR-3); `package.json` gets only the `check:carousel` and `check:contrast` scripts. Change only the files listed; if something else seems to need a change, stop and report.
- `three` and `@react-three/*` are never imported in 006 files. Files that are not components live in `.js` files (oxlint `only-export-components`); `.jsx` files export components only.
- No layout reads (`getBoundingClientRect`, `offsetWidth`, `clientWidth`, `scrollHeight`, `getComputedStyle`) inside the GSAP tween `onUpdate`, the autoplay timer, wheel, pointer move or key callbacks (NFR-2). Reads only in a layout effect on mount, `ResizeObserver`, `resize`, `IntersectionObserver`, `matchMedia` and `input` callbacks.
- New UI uses the existing `@theme` tokens only, plus `error` for form validation states only (NFR-5). Every add has a matching remove in the same effect (StrictMode safe).
- Every code task ends with `npm run lint` and `npm run build` exit 0 and the app starting in `npm run dev` with no console errors or warnings. The app must still build and render after every task (new files that are not yet mounted are fine).
- Class names for tokens or helpers that land later (`text-error`, `.icon-mask`) may be written before T-26; they simply have no style yet.
- Do not improvise: if a plan assumption fails (Tailwind class order, `inert` behaviour, GSAP API), stop and report with the fallback named in plan.md Risks.
- "Browser check: yes" means: after the builder marks the task `[~]`, the orchestrator launches `sdd-browser` with the listed checks and passes its report to the user. "no" means lint, build, scripts and the user's manual look are enough. Tasks marked "measurement" run `sdd-browser` BEFORE the builder, which then records the report in `specs/006-sections-carousel-contact/measurements.md`.
- Model hint: `Model: haiku` tasks are small and mechanical; all others sonnet.

## Layer 0: Pure libraries, data, assets and Node checks (all can start now)

- [~] T-01 Add carousel constants, index/pool/style logic and `check:carousel`
  - Files: `src/lib/carouselConfig.js` (create), `src/lib/carouselLogic.js` (create), `scripts/check-carousel.mjs` (create), `package.json` (add script `"check:carousel": "node scripts/check-carousel.mjs"` only)
  - Needs (006): none
  - 005 waits: none (`package.json` has no pending 005 edit)
  - Can start now: yes
  - Do: `carouselConfig.js` (one commented module, plan constants table): `CAROUSEL_AUTOPLAY_MS 5000`, `CAROUSEL_TRANSITION_S 0.6`, `CAROUSEL_EASE 'power3.out'`, `CAROUSEL_SIDE_OPACITY 0.4`, `CAROUSEL_SIDE_SCALE 0.88`, `CAROUSEL_IMAGE_ASPECT 16 / 10`, `CAROUSEL_VISIBLE_RATIO 0.5`, `CAROUSEL_SWIPE_MIN_PX 40`, `CAROUSEL_SWIPE_AXIS_RATIO 1.5`, `CAROUSEL_SWIPE_CLICK_SUPPRESS_MS 400`, `CAROUSEL_WHEEL_MIN_DELTA 20`, `CAROUSEL_WHEEL_GESTURE_GAP_MS 120`, `CAROUSEL_MAX_DOTS 10`, `CAROUSEL_MIN_POOL 4`, `CAROUSEL_PEEK_FRACTION 0.4`, `CAROUSEL_GAP_MIN_PX 24`, `CAROUSEL_GAP_MAX_PX 64`, `CAROUSEL_CHROME_REM { head: 4.75, headGap: 1, controls: 3.25, text: 9, safety: 0.5 }`, below-snap `CAROUSEL_NARROW_MAX_PX 640`, `CAROUSEL_NARROW_PEEK_PX 24`, `CAROUSEL_NARROW_GAP_PX 12`, `CAROUSEL_WIDE_PEEK_FRACTION 0.25`, `CAROUSEL_BELOW_SNAP_MAX_CARD_PX 640`; each with a one-line reason from the plan. `carouselLogic.js` (pure, imports only `carouselConfig.js`): `poolSize(n)` (0, 1, else `n * ceil(MIN_POOL / n)`), `wrapSigned(x, period)`, `slotRel(slot, pos, pool)`, `slotStyle(rel)` returning `{ x (step units), scale, opacity (3 decimals, exactly `CAROUSEL_SIDE_OPACITY` at `|rel| = 1`, 0 at `|rel| >= 2`), visible }`, `activeSlot(target, pool)`, `activeProject(target, n)`, `shortestDelta(from, to, n)` (range `(-n/2, n/2]`, tie goes forward), `goTarget(target, action, n)` for actions `next`, `prev`, `project k`, `autoplayAllowed({ n, reducedMotion, hover, focusWithin, documentHidden, visible })`, `liveModeFor({ autoplayRunning, lastChangeManual })`. `check-carousel.mjs` (`node:assert`, one pass line per case): config sanity (5000, 0.4, 0.88); `poolSize` n = 0..12 and `pool / 2 >= 2` for n >= 2; for n in 1, 2, 3, 4, 5, 10, 11 and `pos` swept 0 to 2*pool in steps of 0.05: exactly one slot with `|rel| < 0.5`, no two slots at the same rel, hidden slots have opacity 0 and `visible` false, `slotStyle(1).opacity === 0.4`; at integer `pos` and n >= 2 slots at rel -1 and +1 both exist; loop simulation: `3n` nexts from target 0 end on project `0`, prev from the first shows the last, rapid-press model (target changes by exactly the number of presses); `shortestDelta` table with ties; `autoplayAllowed` truth table (each flag alone closes it, n < 2 closes it); `liveModeFor` table.
  - Covers: FR-4, FR-5, FR-6, FR-8 (dot count rule), NFR-4, NFR-8, AC-7 (logic), AC-8 (constant), AC-9 (gate), AC-16 (live mode), AC-32 (script)
  - Done when: `npm run check:carousel` exits 0 and prints the cases; `grep -n "import" src/lib/carouselLogic.js` shows only `carouselConfig.js`; no DOM access in either lib file; lint and build exit 0.
  - Browser check: no (pure code)

- [~] T-02 Add carousel geometry (height-aware fit, D-22 peek rule)
  - Files: `src/lib/carouselGeometry.js` (create), `scripts/check-carousel.mjs`
  - Needs (006): T-01
  - 005 waits: none
  - Can start now: yes
  - Do: `computeCarouselGeometry({ regionWidth, viewportHeight, snapOn, rootPx }) -> { cardW, gap, step, peek }` exactly as plan D-E. Snap on: take `bandPx` as an optional argument defaulting to 72 so this lib imports no 005 file (T-04 asserts that `SECTION_SAFE_BAND_PX` equals this default); `imgH = vh - 2 * bandPx - sum(CAROUSEL_CHROME_REM) * rootPx`; `Wh = imgH * CAROUSEL_IMAGE_ASPECT`; `Wp = (regionWidth - 2 * GAP_MIN) / (1 + 2 * PEEK_FRACTION)`; `cardW = floor(min(Wh, Wp))`; peek rule `sideW = SIDE_SCALE * cardW`, `halfFree = regionWidth / 2 - cardW / 2`, `peek = min(sideW, max(PEEK_FRACTION * cardW, halfFree - GAP_MAX))`, `gap = halfFree - peek`. Snap off: `regionWidth < 640` -> peek 24, gap 12, `cardW = regionWidth - 72`; else `cardW = min(640, floor((regionWidth - 48) / 1.5))` with the same peek rule using `CAROUSEL_WIDE_PEEK_FRACTION`. `step = (1 + SIDE_SCALE) / 2 * cardW + gap`. Extend the check: the plan D-E table within 1 px for 1920x1080, 1920x700 (peek 366.1, gap 385.9), 1440x900, 1366x768 (peek 357, gap 64), 1280x720 (peek 352, gap 64), 1024x768, 1024x700 (peek 240, gap 64); 375x812 (cardW 303, gap 12, peek 24) and 320x568 (cardW 248); centre image width >= 400 at all seven snap sizes and >= 700 at 1920x1080 and 1440x900; sweep widths 1024 to 2560 and heights 700 to 1080: peek >= 15% of `cardW`, peek <= `sideW`, `gap <= 64` unless `peek === sideW`, `gap >= 24`, chrome + image + bands <= vh; below-snap sweep 320 to 1919 gives `cardW > 0` and peek >= 12.
  - Covers: FR-3, FR-15, FR-33 (carousel geometry), NFR-2, AC-6 (numbers), AC-28 (carousel part), AC-32
  - Done when: `npm run check:carousel` exits 0 with the new cases; the lib imports only `carouselConfig.js`; lint and build exit 0.
  - Browser check: no (pure code)

- [~] T-03 Add wheel and swipe classifiers
  - Files: `src/lib/carouselLogic.js`, `scripts/check-carousel.mjs`
  - Needs (006): T-01
  - 005 waits: none
  - Can start now: yes
  - Do: add `classifyCarouselWheel({ deltaX, deltaY, ctrlKey, deltaMode, now, lastEventAt, moving, innerWidth }) -> 'slide-next' | 'slide-prev' | 'consume' | 'pass'` with the rules of plan D-C in order (Ctrl pass; `|dx| <= |dy|` pass; moving consume; same stream within `CAROUSEL_WHEEL_GESTURE_GAP_MS` consume; quiet and `|dx| >= CAROUSEL_WHEEL_MIN_DELTA` slide, `dx > 0` next; otherwise pass; delta mode normalised: line x 16, page x `innerWidth`). Add `classifySwipe({ dx, dy }) -> 'next' | 'prev' | null` (`|dx| >= CAROUSEL_SWIPE_MIN_PX` and `|dx| >= CAROUSEL_SWIPE_AXIS_RATIO * |dy|`; `dx < 0` is next). The caller (not the function) updates `lastEventAt` on every `slide-*` and `consume` result; document this in a comment. Extend the check: a decaying 60-event horizontal stream over 1.5 s (first delta 80) gives exactly one `slide-*` and the rest `consume`; a second gesture after 150 ms quiet gives one more; a vertical stream and an exact diagonal tie give only `pass`; Ctrl gives `pass`; a lone horizontal event of 10 gives `pass`; Shift+wheel style (`dx` 100, `dy` 0) slides; events while `moving` give `consume`; line and page delta modes; swipe table at the 40 px and 1.5 ratio boundaries and both directions.
  - Covers: FR-9, FR-11, AC-13 (logic), AC-15 (logic), AC-32
  - Done when: `npm run check:carousel` exits 0 with the new cases; no DOM access in the lib; lint and build exit 0.
  - Browser check: no (pure code)

- [~] T-04 Add section layout constants
  - Files: `src/lib/sectionLayout.js` (create), `scripts/check-carousel.mjs`
  - Needs (006): none (T-01 creates the check script; if absent, create the script file with only this case and let T-01 merge)
  - 005 waits: 005:T-05 (built: `arrowConfig.js` exists)
  - Can start now: yes
  - Model: haiku
  - Do: `sectionLayout.js` (commented): `SECTION_ARROW_CLEARANCE_PX = 12`, `SECTION_SAFE_BAND_PX = SECTION_ARROW_OFFSET_PX + SECTION_ARROW_SIZE_PX + SECTION_ARROW_CLEARANCE_PX` (import the two constants from `./arrowConfig.js`), `ABOUT_IMAGE_ASPECT = 4 / 5`, `ABOUT_IMAGE_MAX_REM = 32`, `export const safeBandStyle = { '--safe-band': `${SECTION_SAFE_BAND_PX}px` }`. Check cases: `SECTION_SAFE_BAND_PX === 72`; `safeBandStyle['--safe-band'] === '72px'`; the default `bandPx` used in `carouselGeometry.js` equals `SECTION_SAFE_BAND_PX`.
  - Covers: FR-30, NFR-8, AC-4 (constant)
  - Done when: `npm run check:carousel` exits 0; the only import is `./arrowConfig.js`; lint and build exit 0.
  - Browser check: no (pure code)

- [~] T-05 Add placeholder SVGs and asset READMEs
  - Files: `src/assets/icons/carousel-prev.svg`, `carousel-next.svg`, `github.svg`, `itchio.svg` (create), `src/assets/tech/placeholder.svg` (create), `src/assets/tech/README.md` (create), `src/assets/img/README.md` (create)
  - Needs (006): none
  - 005 waits: none (005:T-24 creates only `src/assets/icons/arrow-down.svg` and `README.md`; different files, do NOT create or edit those two here)
  - Can start now: yes
  - Model: haiku
  - Do: four single-colour icons using `currentColor` strokes or fills, a `viewBox` and no `width`/`height` attributes, each with the XML comment `PLACEHOLDER, replace with owner SVG`: prev (left chevron), next (right chevron), github (a generic ring with a short horizontal bar; not a real logo), itchio (a generic rounded square outline; not a real logo). `tech/placeholder.svg`: generic glyph (a plain square with a diagonal), `currentColor`, marked placeholder. `tech/README.md`: filenames `<tool id>.svg` (current ids `blender`, `unity`, `threejs`, `react`), square-ish viewBox preferred, no width/height, no scripts, no external references or fonts, multicolour is shown as is, `tint: true` needs a single-colour logo and renders it in `currentColor` (dark logos need it on the dark theme), the `icon` import line to add in `src/data/techStack.js`, provenance and trademark comment rule, placeholder behaviour. `img/README.md`: `about.<webp|jpg|png>` ratio 4:5 (`ABOUT_IMAGE_ASPECT`), 1200x1500 recommended, 800x1000 minimum, about 300 KB; `projects/<slug>.<webp|jpg|png>` ratio 16:10 (`CAROUSEL_IMAGE_ASPECT`), 2000x1250 recommended, 1600x1000 minimum, about 400 KB; `alt`, `width`, `height` in the data entry; provenance comment rule; cover cropping; the `src/assets/img/projects/` folder is created when the first image is added.
  - Covers: FR-7 (assets), FR-20 (assets), FR-27 (assets), FR-35, AC-31
  - Done when: all seven files exist; `grep -L currentColor` on the five SVGs returns nothing; `grep -l "PLACEHOLDER" ` matches all five; `grep -n "width=\|height=" ` on the SVGs returns nothing outside `viewBox`; lint and build exit 0.
  - Browser check: no

- [~] T-06 Add data modules (projects, tech stack, social links, about image)
  - Files: `src/data/projects.js`, `src/data/techStack.js`, `src/data/socialLinks.js`, `src/data/about.js` (create all)
  - Needs (006): T-05
  - 005 waits: none
  - Can start now: yes
  - Model: haiku
  - Do: `projects.js`: `export const projects` with the three existing placeholder projects (titles "Project title one/two/three", the existing description text), slugs `project-one`, `project-two`, `project-three`, no `kind`, no `image`; `export function getProjectBySlug(slug)` (`projects.find(p => p.slug === slug)`, exact match); header comment with the field rules (slug rule, `description` optional, `image` shape) and a commented example `// Provenance: <source, author, licence or own work>` above `image: { ... }`. `techStack.js`: `export const techStack` with categories Modeling (Blender "Modeling and texturing"; "Placeholder tool" "What I use it for"), Game Dev (Unity "Game engine"), Web (Three.js "3D on the web"; React "Interface and tooling"); ids `blender`, `placeholder-tool`, `unity`, `threejs`, `react`; no `icon`, no `tint`; comment block: how to add an icon (`import blenderIcon from '../assets/tech/blender.svg'` preceded by `// Provenance:` and a trademark note, `icon: blenderIcon`), `tint: true` rule, `use` at most 40 characters, name at most 20 characters, capacity 3 categories x 5 tools. `socialLinks.js`: imports `../assets/icons/github.svg` and `itchio.svg`; `export const socialLinks = [{ id: 'github', label: 'GitHub', url: 'https://github.com/', icon: githubIcon }, { id: 'itchio', label: 'itch.io', url: 'https://itch.io/', icon: itchioIcon }]` with `// PLACEHOLDER, replace with real profile URL` above each URL. `about.js`: `export const aboutImage = null` with the shape comment, a commented example and the provenance rule.
  - Covers: FR-1, FR-19 (image slot data), FR-20 (data), FR-27 (data), FR-35, AC-2 (default content), AC-20 (default content), AC-26 (data), AC-31
  - Done when: `grep -rn "kind" src/data` returns nothing; each file has the described exports; lint and build exit 0 (the data modules are not imported yet).
  - Browser check: no

- [~] T-07 Add data validators, the Node data loader and the data checks
  - Files: `src/lib/dataValidation.js` (create), `scripts/lib/loadDataModule.mjs` (create), `scripts/check-carousel.mjs`
  - Needs (006): T-01, T-06
  - 005 waits: none
  - Can start now: yes
  - Do: `dataValidation.js` (pure): `validateImage(img)`, `validateProjects(list)`, `validateTechStack(list)`, `validateSocialLinks(list)` each returning `string[]` (empty is valid), and `checkProvenanceComments(sourceText)`. Rules from plan D-I: slug `^[a-z0-9]+(-[a-z0-9]+)*$` and unique; non-empty trimmed title; image needs non-empty `src`, non-empty `alt`, positive integer `width` and `height`; tech ids unique across categories, non-empty `name`, `use` a string when present; social `url` starts with `https://`, non-empty label; provenance: every non-comment line containing `image:`, `icon:` or an asset `import` (svg, png, jpg, jpeg, webp) must have a line matching `/provenance/i` directly above it. `loadDataModule.mjs`: reads a data module's source, rewrites `import x from '...(svg|png|jpg|jpeg|webp)'` to `const x = "stub:<file>"`, imports the result through a `data:` URL, returns the module. Extend the check: valid data passes; each failing case (duplicate slug, bad slug `Bad Slug`, empty title, image without alt, width 0, height 1.5, duplicate tool id, `http://` URL, missing label) is reported; provenance fixtures (with and without the comment); the real `projects`, `techStack`, `socialLinks` modules load through the loader and validate; `getProjectBySlug('project-one')` found, `'Project-One'` and `'x'` not found.
  - Covers: FR-1, FR-20, FR-27, NFR-4, AC-2, AC-20 (provenance), AC-31
  - Done when: `npm run check:carousel` exits 0; scratch-adding a duplicate slug to `projects.js` makes it exit non-zero (reverted); the lib imports nothing; lint and build exit 0.
  - Browser check: no

- [~] T-08 Add contact constants and field-message logic
  - Files: `src/lib/contactConfig.js` (create), `src/lib/contactValidation.js` (create), `scripts/check-carousel.mjs`
  - Needs (006): T-01
  - 005 waits: none
  - Can start now: yes
  - Model: haiku
  - Do: `contactConfig.js`: `CONTACT_MESSAGE_MAX_LENGTH = 2000`, `CONTACT_MESSAGE_ROWS = 4` (commented with reasons). `contactValidation.js` (pure): `fieldMessage(field, validity, value)` with `field` in `'name' | 'email' | 'message'`: `value.trim() === ''` or `validity.valueMissing` gives "Enter your name." / "Enter your email address." / "Write a message."; email `typeMismatch` gives "Enter a valid email address."; message `tooLong` gives "Keep your message under 2000 characters." (build the number from the constant); else `null`. Extend the check with a fake `validity` for every field and combination, whitespace-only name and message, and `typeMismatch`.
  - Covers: FR-22, FR-23, AC-22 (messages)
  - Done when: `npm run check:carousel` exits 0; lint and build exit 0; no DOM access in the lib.
  - Browser check: no

- [~] T-09 Add the contrast check script
  - Files: `scripts/check-contrast.mjs` (create), `package.json` (add script `"check:contrast": "node scripts/check-contrast.mjs"` only)
  - Needs (006): none
  - 005 waits: none
  - Can start now: yes
  - Do: the script reads `src/index.css`, parses `--color-*` declarations from the `@theme` block, computes WCAG 2.x relative luminance and contrast ratio, prints each pair with its ratio and a pass line. Always checks: `muted` and `text` on `ink` and on `surface` at least 4.5; `focus` on `ink` at least 3; the eight existing tokens (`ink`, `surface`, `line`, `text`, `muted`, `accent`, `rim`, `focus`) are present. Error token section: `const REQUIRE_ERROR_TOKEN = false` at the top; when the token `--color-error` is absent and the flag is false print `PENDING: --color-error not defined yet` and continue; when present (or the flag is true) require `error` on `ink` and on `surface` at least 4.5 (text) and at least 3 (border and icon), and that the token set is exactly the eight existing plus `error`. Comment explains that T-26 flips the flag.
  - Covers: FR-23 (token check), NFR-5, AC-34 (script)
  - Done when: `npm run check:contrast` exits 0 and prints the ratios for the existing tokens and the PENDING line; run against a scratch copy of the CSS containing `--color-error: #e8707e` it prints 6.36 on surface and 6.76 on ink (no repo file is changed for this); lint and build exit 0.
  - Browser check: no

## Layer 1: Leaf components and the carousel hook (write now; mounted later)

- [~] T-10 Add the shared `IconMask` component
  - Files: `src/components/IconMask.jsx` (create)
  - Needs (006): none
  - 005 waits: none
  - Can start now: yes
  - Model: haiku
  - Do: `IconMask({ src, className })` renders `<span aria-hidden="true" className={`icon-mask ${className ?? ''}`} style={{ '--icon-url': `url("${src}")` }} />`. Comment: the `.icon-mask` class lands in `index.css` in T-26; shape comes from the SVG alpha, colour from `currentColor`.
  - Covers: FR-7, FR-20, FR-27, NFR-6, AC-11, AC-26
  - Done when: lint and build exit 0; the file has one export and no state.
  - Browser check: no (needs T-26 to be visible)

- [~] T-11 Add `useCarousel` core (position, tween, geometry, navigation, DEV hook)
  - Files: `src/hooks/useCarousel.js` (create)
  - Needs (006): T-01, T-02
  - 005 waits: none (reads `SNAP_QUERY` from the existing `snapConfig.js`)
  - Can start now: yes
  - Do: `useCarousel({ projects, regionRef, viewportRef, trackRef })`. State: `target` (ref plus a React state mirror for `activeSlot` / `activeProject`), `pos = { v }` ref, `slotRefs` and `linkRefs` arrays, cached `step`. `next()`, `prev()`, `goProject(k)`, `goRelative(rel)` change `target` via `goTarget` and start `gsap.to(pos, { v: target, duration: CAROUSEL_TRANSITION_S, ease: CAROUSEL_EASE, overwrite: true, onUpdate: apply, onComplete })` (gsap from `../lib/gsap.js`); `apply()` loops the pool and writes `transform` (`translate3d(x*step px, 0, 0) scale(s)`), `opacity` and `visibility` from `slotStyle(slotRel(slot, pos.v, pool))` using the cached step, no layout reads. `moving` flag true while a tween runs. Reduced motion (`usePrefersReducedMotion`): no tween, `pos.v = target; apply()`; when it turns on mid-tween kill the tween and jump. Geometry: a layout effect measures once (`regionRef.current.clientWidth`, `window.innerHeight`, `matchMedia(SNAP_QUERY).matches`, root font size) before first paint, then a `ResizeObserver` on the region and a `window` `resize` listener recompute `computeCarouselGeometry`, set `--carousel-card-w` and `--carousel-step` on the region, update the cached step and call `apply()` (the tween is untouched). Pool of 0 or 1 attaches nothing and starts nothing. Cleanup kills the tween (`gsap.killTweensOf(pos)`), disconnects the observer and removes the listener. DEV only (`import.meta.env.DEV`): `window.__carouselInfo()` returns `{ n, pool, target, pos, activeSlot, activeProject, moving, paused: [], timers: 0, listeners, observers, live, advances: [], reducedMotion }` (later tasks fill `paused`, `timers`, `advances`, `live`); a module-level counter object tracks mounted instances. Returns `{ activeSlot, activeProject, pool, slotRefs, linkRefs, next, prev, goProject, goRelative, moving }`.
  - Covers: FR-3, FR-4, FR-7 (one activation = one slide, rapid input), FR-15, NFR-2, AC-6, AC-7, AC-32
  - Done when: lint and build exit 0; code inspection shows no layout read in `apply`, `onUpdate`, `onComplete`; add/remove symmetry; a throwaway call in a scratch component (not committed) moves `pos.v` to `target` in 0.6 s.
  - Browser check: no (mounted in T-16)

- [~] T-12 Add autoplay timer, pause sources and live-region sync to `useCarousel`
  - Files: `src/hooks/useCarousel.js`
  - Needs (006): T-11
  - 005 waits: none
  - Can start now: yes
  - Do: implement plan D-B. Flags ref `{ hover, focusWithin, documentHidden, visible, reducedMotion }`. `syncAutoplay()`: gate from `autoplayAllowed`; gate closed clears the timer; gate open and no timer starts a fresh `CAROUSEL_AUTOPLAY_MS` `setTimeout`; open with a timer does nothing. Tick: write `aria-live="off"` on the track, call `next('auto')` (which calls `restartAutoplay()`). Manual navigation kinds `'button' | 'dot' | 'key' | 'wheel' | 'swipe' | 'side-click'` write `aria-live="polite"` on the track BEFORE changing `target` and call `restartAutoplay()`. Whenever the gate is closed (and at mount) the track `aria-live` is `polite`; use `liveModeFor`. Listeners on the region: `pointerenter`/`pointerleave` (ignore `pointerType === 'touch'`); `focusin` sets `focusWithin = event.target.matches(':focus-visible')` (treat a thrown `matches` as true, D-21) and `focusout` clears it when `relatedTarget` is outside the region; `document` `visibilitychange`; an `IntersectionObserver` on the region with `threshold: [0, CAROUSEL_VISIBLE_RATIO, 1]` setting `visible = intersectionRatio >= CAROUSEL_VISIBLE_RATIO`; reduced motion from the hook state clears the timer immediately and allows a fresh interval when it turns off. Pool below 2 attaches no listeners and no timer. DEV: `__carouselInfo()` now reports `paused` reasons, `timers` (0 or 1), `advances` (last 20 `{ t: performance.now(), kind }`), `live`, `listeners`, `observers`. Cleanup removes every listener, observer and timer.
  - Covers: FR-5, FR-6, FR-12 (live attribute), FR-34 (reduced motion), NFR-2, D-21, AC-8, AC-9, AC-10, AC-16, AC-29, AC-32
  - Done when: lint and build exit 0; `grep -n "focusin" src/hooks/useCarousel.js` shows the `:focus-visible` test; exactly one `setTimeout` id variable; cleanup symmetric (StrictMode scratch mount shows `timers <= 1`).
  - Browser check: no (mounted in T-16; autoplay verified in T-34)

- [~] T-13 Add wheel, swipe and key input to `useCarousel`
  - Files: `src/hooks/useCarousel.js`
  - Needs (006): T-03, T-12
  - 005 waits: none
  - Can start now: yes
  - Do: implement plan D-C. Wheel: `addEventListener('wheel', handler, { passive: false })` on the region; the handler calls `classifyCarouselWheel` with cached values; `slide-*` and `consume` call `preventDefault()` and `stopPropagation()` and set `lastEventAt`; `slide-*` also navigates with kind `'wheel'`; `pass` does nothing; no layout reads. Swipe: Pointer Events on the viewport element: `pointerdown` (only `pointerType !== 'mouse'`, `isPrimary`) stores x/y, `pointerup` calls `classifySwipe` and navigates with kind `'swipe'`, `pointercancel` clears; passive; no `preventDefault`; after a recognised swipe set `suppressClickUntil = performance.now() + CAROUSEL_SWIPE_CLICK_SUPPRESS_MS`; export `onLinkClick(event)` that calls `event.preventDefault()` when the time is before it. Keys: `onKeyDown(event)` for the region: `ArrowLeft`/`ArrowRight` without modifiers and not `defaultPrevented` call `preventDefault()` and navigate with kind `'key'`; every other key is ignored. Focus handoff: before navigating by key, if `document.activeElement === linkRefs[activeSlot]` remember it; a layout effect keyed on the active slot calls `linkRefs[newSlot].focus({ preventScroll: true })`. Pool below 2 attaches none of these. DEV counters include the new listeners. Cleanup removes all.
  - Covers: FR-9, FR-10, FR-11, FR-12, NFR-2, AC-10, AC-13, AC-14, AC-15, AC-16, AC-32
  - Done when: lint and build exit 0; `grep -n "preventDefault" src/hooks/useCarousel.js` shows it only in the wheel handler, the key handler and `onLinkClick`; `grep -n "touch" src/hooks/useCarousel.js` shows no `preventDefault` on touch or pointer handlers; add/remove symmetric.
  - Browser check: no (mounted in T-16; verified in T-35)

- [~] T-14 Add `ProjectCard`
  - Files: `src/components/projects/ProjectCard.jsx` (create)
  - Needs (006): T-01
  - 005 waits: none
  - Can start now: yes
  - Do: `ProjectCard({ project, active, linkRef, onLinkClick })` per plan D-H: `group relative flex flex-col border border-line bg-surface`; image frame with `style={{ aspectRatio: CAROUSEL_IMAGE_ASPECT }}`, `overflow-hidden`, `border-b border-line`; `img` (`object-cover`, `width`, `height`, `alt`, `loading="lazy"`, `decoding="async"`) or the gradient placeholder (`aria-hidden`, same frame) when `image` is missing or `onError` fires (local state); text block `p-4` with `h3` (`font-display text-xl leading-7 text-text line-clamp-2`) containing a router `<Link to={`/projects/${slug}`} ref={linkRef} onClick={onLinkClick}>` styled as a stretched link (`after:absolute after:inset-0`, `focus-visible:outline-none`); optional description `p` (`mt-1 text-base leading-6 text-muted line-clamp-2`, rendered only when present); card ring `has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus`; `hover:border-accent` only when `active`; image zoom `motion-safe:group-hover:scale-105 motion-safe:transition-transform`. Tokens only.
  - Covers: FR-2, FR-14, NFR-1, AC-6, AC-17
  - Done when: lint and build exit 0; the card has exactly one `<a>`; no `kind` use; description element absent when `description` is undefined.
  - Browser check: no (mounted in T-16)

- [~] T-15 Add `CarouselControls`
  - Files: `src/components/projects/CarouselControls.jsx` (create)
  - Needs (006): T-01, T-10
  - 005 waits: none
  - Can start now: yes
  - Do: `CarouselControls({ projects, activeProject, trackId, onPrev, onNext, onDot })`: renders nothing when `projects.length < 2`. Row `flex flex-wrap items-center justify-center gap-2 mt-2`. Prev and next `<button type="button">` named "Previous project" / "Next project", `aria-controls={trackId}`, `size-11` hit area with `IconMask` from `../../assets/icons/carousel-prev.svg` / `carousel-next.svg` (`size-6`), states: `hover:bg-surface hover:text-accent`, `focus-visible:bg-surface`, `active:text-rim`, `transition-colors duration-200 motion-reduce:transition-none`. Between them: when `projects.length <= CAROUSEL_MAX_DOTS` a `role="group"` `aria-label="Choose project"` with one `<button type="button">` per project (`aria-label` "Show project n of N: <title>", `aria-current="true"` on the active one, `size-11` hit area, a small visible dot `size-2.5` rounded, active dot filled `bg-accent` and wider, inactive `bg-muted`), otherwise an `aria-hidden` text counter "n / N". Plain buttons, no `role="tab"`. Tokens only.
  - Covers: FR-7, FR-8, NFR-1, AC-11, AC-12
  - Done when: lint and build exit 0; no `role="tab"`; counter branch present for more than `CAROUSEL_MAX_DOTS`; names exactly as listed.
  - Browser check: no (mounted in T-16)

- [~] T-16 Add `ProjectCarousel` (empty state, region, slides, overlay, semantics)
  - Files: `src/components/projects/ProjectCarousel.jsx` (create)
  - Needs (006): T-11, T-12, T-13, T-14, T-15
  - 005 waits: none
  - Can start now: yes
  - Do: `ProjectCarousel({ projects })`: `projects.length === 0` returns `<p>` "No projects yet." (no region, no hook); otherwise renders an inner view that calls `useCarousel`. Structure per plan D-D/D-E: region `div role="region" aria-roledescription="carousel" aria-label="Projects" onKeyDown` (ref `regionRef`) containing the viewport `div` (`overflow-x-clip touch-pan-y`, ref `viewportRef`) containing the track `div` (`useId` id, `grid`, `aria-live`, ref `trackRef`) with one wrapper per pool slot (`style` width `var(--carousel-card-w)`, `grid-area: 1 / 1`, `justify-self: center`, `align-self: start`, `role="group" aria-roledescription="slide" aria-label="n of N"` with n = slot project + 1), inactive wrappers `inert` and `aria-hidden="true"`; a non-inert absolutely positioned overlay `div aria-hidden onClick={() => goRelative(rel)}` (cursor-pointer) only for inactive slots with `|wrapSigned(slot - target, pool)| === 1`; each wrapper holds `ProjectCard` (project of `slot % n`, `active`, `linkRef`, `onLinkClick`). Below the viewport: `CarouselControls` wired to `prev`, `next`, `goProject` (kinds `'button'`/`'dot'`). No `data-reveal` anywhere inside. Initial slot styles are written by `apply()` in the hook's layout effect so the first paint is correct.
  - Covers: FR-4, FR-7, FR-8, FR-12, FR-13, FR-14, FR-16, NFR-4, AC-7, AC-12, AC-14, AC-16, AC-17
  - Done when: lint and build exit 0; for N = 1 no controls and no overlay in the markup; `inert`, `aria-hidden` appear only on inactive slides; `grep -n "data-reveal" src/components/projects` returns nothing.
  - Browser check: no (mounted in T-23)

- [~] T-17 Add `TechCategory`
  - Files: `src/components/tech/TechCategory.jsx` (create)
  - Needs (006): T-10
  - 005 waits: none
  - Can start now: yes
  - Do: `TechCategory({ category })` renders `<div>` with `h3` (`font-display text-lg leading-7 text-text mb-2`) and a `ul` of tiles. Tile `li`: `flex items-start gap-3 border-b border-line py-1.5`; icon slot `size-10 shrink-0`: tool with `icon` and no `tint` -> `<img src alt="" loading="lazy" className="size-full object-contain" />`; with `tint: true` -> `IconMask` with the icon (`size-full text-text`); without `icon` -> `IconMask` with `../../assets/tech/placeholder.svg` (`size-full text-muted`). Text block: name `text-base leading-6 text-text wrap-break-word`; `use` only when present, `text-base leading-6 text-muted snap:text-sm snap:leading-5` (D-23: 14 px only when the snap layout is on). Tiles have no links and no tabindex.
  - Covers: FR-20, NFR-1, AC-20
  - Done when: lint and build exit 0; no interactive element in the file; `use` element absent when `use` is undefined; no tool name or text typed in the file.
  - Browser check: no (mounted in T-25)

- [~] T-18 Add `ContactForm`
  - Files: `src/components/contact/ContactForm.jsx` (create)
  - Needs (006): T-08
  - 005 waits: none
  - Can start now: yes
  - Do: plan D-K. `<form noValidate onSubmit>` (no `action`, no `method`); fields with fixed ids `contact-name`, `contact-email`, `contact-message`, visible `<label htmlFor>`; name `type="text" autoComplete="name" required`; email `type="email" autoComplete="email" inputMode="email" required`; textarea `rows={CONTACT_MESSAGE_ROWS} maxLength={CONTACT_MESSAGE_MAX_LENGTH} required autoComplete="off"` with `resize-none`; controls `min-h-11 w-full text-base bg-surface text-text border border-rim/50 focus:border-accent aria-invalid:border-error aria-invalid:shadow-[inset_0_0_0_1px_var(--color-error)]`; submit "Send message" (`min-h-11`, never disabled). State `{ errors, attempted, status }`. Submit: `preventDefault()`, `attempted = true`, validate all with `fieldMessage(field, el.validity, el.value)`; any error sets `errors`, `status = 'idle'` and `focus()`es the first invalid field; none sets `status = 'notConnected'`. After the first attempt `onInput` and `onBlur` re-validate that field; any `onInput` sets `status = 'idle'`. Invalid field: `aria-invalid="true"` and `aria-describedby={`${id}-error`}`, otherwise neither attribute. Error element `<p id="...-error" className="mt-1 text-base leading-6 text-error">` with an `aria-hidden` "!" in a small bordered ring (`border-error text-error`) before the message; no `role="alert"`. Status: `<p role="status">` always in the DOM beside the button, text "This form is not connected yet. Nothing was sent." only when `status === 'notConnected'`, neutral `text-muted` styling, no animation. Textarea marker: `textarea.toggleAttribute('data-lenis-prevent', textarea.scrollHeight > textarea.clientHeight + 1)` from `onInput`, from a `ResizeObserver` on the textarea (disconnect on cleanup) and once after mount; never from a wheel handler. Uncontrolled inputs so values stay. No `fetch`, `XMLHttpRequest`, `sendBeacon`, `mailto:`, `window.open`.
  - Covers: FR-22, FR-23, FR-24, FR-25, FR-32, NFR-1, NFR-6, AC-21, AC-22, AC-23, AC-24
  - Done when: lint and build exit 0; `grep -nE "fetch|XMLHttpRequest|sendBeacon|mailto|window\.open|role=\"alert\"|action=" src/components/contact/ContactForm.jsx` returns nothing; only one `ResizeObserver` with matching `disconnect`.
  - Browser check: no (mounted in T-28; verified in T-37)

- [~] T-19 Add `ContactFooter`
  - Files: `src/components/contact/ContactFooter.jsx` (create)
  - Needs (006): T-06, T-10
  - 005 waits: none
  - Can start now: yes
  - Do: `<footer className="mt-auto shrink-0 border-t border-line">` (no explicit role) with `div` `mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-8`: `<p className="text-base text-muted">© {new Date().getFullYear()} Himar</p>` and `<ul aria-label="Social links" className="flex flex-wrap -mx-3">` with one `<li><a>` per `socialLinks` entry: `href={link.url}`, `target="_blank"`, `rel="noopener noreferrer"`, visible text `{link.label}` followed by `<span className="sr-only"> (opens in a new tab)</span>`, `IconMask` with `link.icon` (`size-5`), classes like the navbar items (`inline-flex min-h-11 items-center gap-2 rounded-sm px-3 text-base text-muted hover:text-text focus-visible:bg-surface focus-visible:text-text active:text-accent transition-colors duration-200 motion-reduce:transition-none`). No URL typed in the file.
  - Covers: FR-26, FR-27, NFR-1, NFR-6, AC-25, AC-26
  - Done when: lint and build exit 0; `grep -n "http" src/components/contact/ContactFooter.jsx` returns nothing; `grep -n "role=" ` returns nothing.
  - Browser check: no (mounted in T-28)

- [~] T-20 Add the `Contact` section component
  - Files: `src/components/sections/Contact.jsx` (create)
  - Needs (006): T-04, T-18, T-19
  - 005 waits: none (new file; 005:T-15 built, so `snap:` exists)
  - Can start now: yes
  - Do: `Contact` section per plan D-F: `<section ref id="contact" aria-labelledby="contact-heading" data-snap-section data-snap-label="Contact" tabIndex={-1} style={safeBandStyle} className="flex w-full flex-col outline-none snap:min-h-svh snap:pt-(--safe-band)">`, `useSectionReveal(ref)`. Form area `div` `mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-16 sm:px-8 snap:py-0`, inside a grid `md:grid-cols-[1fr_2fr] gap-8 md:gap-12 items-center w-full`: left block (`data-reveal`) eyebrow "Get in touch" (`mb-3 text-xs uppercase tracking-widest text-accent`), `SplitHeading as="h2" id="contact-heading" text="Contact"` with `wrap-break-word font-display text-4xl leading-tight tracking-tight text-text sm:text-5xl snap:text-4xl`, intro line "Send a message about a project or a collaboration." (`mt-3 text-base text-muted`); right `div data-reveal` holding `ContactForm`. `ContactFooter` is the last child of the section. At most 2 `data-reveal` targets.
  - Covers: FR-21, FR-26, FR-31, FR-34, NFR-4, AC-5, AC-21, AC-25
  - Done when: lint and build exit 0; the markers are exactly as listed; `ContactFooter` is a descendant of the section; no `overflow-hidden`/fixed height on the root.
  - Browser check: no (mounted in T-28)

- [~] T-21 Add the project page and the not-found state
  - Files: `src/pages/ProjectPage.jsx` (create), `src/components/ProjectNotFound.jsx` (create)
  - Needs (006): T-06
  - 005 waits: none
  - Can start now: yes
  - Do: `ProjectPage` reads `slug` with `useParams`, `getProjectBySlug(slug)`; found: `<div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-8">` with one `h1` (title, `font-display text-4xl text-text sm:text-5xl`, `tabIndex={-1}`, `outline-none`, focused on mount with `{ preventScroll: true }` in a `useEffect`), `<p className="mt-4 text-base text-muted">Details coming soon.</p>`, back link `<Link to="/#projects">Back to projects</Link>` (`mt-8 inline-flex min-h-11 items-center rounded-sm px-3 -mx-3 text-sm uppercase tracking-widest text-muted underline decoration-transparent underline-offset-8 hover:text-text hover:decoration-accent focus-visible:bg-surface active:text-accent transition-colors motion-reduce:transition-none`). Not found: `ProjectNotFound` renders `h1` "Project not found" (same focus handling), a short message ("There is no project at this address.") and the same back link; no console output. No canvas, no footer, no arrows.
  - Covers: FR-17, NFR-1, AC-18
  - Done when: lint and build exit 0; exactly one `h1` per branch; `grep -n "console" ` on both files returns nothing; unused until T-29.
  - Browser check: no (routed in T-29)

- [~] T-22 Add `RouteScrollReset`
  - Files: `src/components/RouteScrollReset.jsx` (create)
  - Needs (006): none
  - 005 waits: none
  - Can start now: yes
  - Do: component returning `null` using `useLocation`, `useNavigationType`, `useSmoothScroll()` (from `./SmoothScrollProvider.jsx`). `useLayoutEffect` keyed on `location.pathname`: when `navigationType === 'PUSH'` and `location.hash === ''`, call `lenis?.scrollTo(0, { immediate: true, force: true })` and `window.scrollTo(0, 0)`. `POP` and hash navigations do nothing. Comment: ScrollToHash and the 005 scroll function own hash navigation; Back is left to the browser and 005 settle.
  - Covers: FR-18, AC-18
  - Done when: lint and build exit 0; the file has no timers and no listeners; not yet mounted.
  - Browser check: no (mounted in T-29)

## Layer 2: Section rewrites (no pending 005 task edits these files)

- [~] T-23 Rewrite the Projects section with the carousel
  - Files: `src/components/sections/Projects.jsx`
  - Needs (006): T-04, T-06, T-16
  - 005 waits: none (005:T-16 built; no pending 005 task edits this file)
  - Can start now: yes
  - Do: rewrite keeping `id="projects"`, `aria-labelledby="projects-heading"`, `data-snap-section`, `data-snap-label="Projects"`, `tabIndex={-1}`, `outline-none` exactly as 005:T-16 left them, `ref` plus `useSectionReveal`. Root: `grid w-full gap-4 outline-none py-16 md:py-24 snap:min-h-svh snap:py-(--safe-band) snap:content-center` with `style={safeBandStyle}` (no `max-w-5xl` on the root: the carousel is full-bleed). Heading container `mx-auto w-full max-w-5xl px-4 sm:px-8`: eyebrow `p data-reveal` "Selected work" (`text-xs uppercase tracking-widest text-accent mb-3`), `SplitHeading as="h2" id="projects-heading" text="Projects"` with `wrap-break-word font-display text-4xl leading-tight tracking-tight text-text sm:text-5xl snap:text-4xl`; no intro line. Below, `div data-reveal` wrapping `<ProjectCarousel projects={projects} />` (import from `../../data/projects.js`). DEV only: run `validateProjects(projects)` once and `console.error` if it returns messages. Remove the inline project array, `kind` and the old grid.
  - Covers: FR-1, FR-2, FR-3, FR-15, FR-16, FR-29, FR-30, FR-31, FR-34, AC-3, AC-4, AC-6
  - Done when: lint and build exit 0; `grep -n "kind\|const projects" src/components/sections/Projects.jsx` returns nothing; markers unchanged; one `data-reveal` on the heading block and one on the carousel wrapper.
  - Browser check: yes (interim, without snapping: use `window.scrollTo` to the section top) - at 1920x1080, 1440x900, 1366x768, 1280x720, 1024x768, 1024x700 and 1920x700 the Projects rect has height equal to `innerHeight` within 1 px and no descendant has `scrollHeight > clientHeight` outside the carousel viewport; the centre card is horizontally centred, side cards are visible and dimmed, centre image width at least 400 (700 at 1920x1080 and 1440x900), gap at most 64 px except where side cards are fully visible; at 375x812 the centre card is fully visible with peeks of at least 12 px; no horizontal page overflow; console clean. Icons stay blank until T-26.

- [~] T-24 Rewrite the About section with the image slot
  - Files: `src/components/sections/AboutMe.jsx`
  - Needs (006): T-04, T-06
  - 005 waits: none (005:T-16 built)
  - Can start now: yes
  - Do: keep `id="about"`, `aria-labelledby="about-heading"`, the 005 markers (`data-snap-label="About"`), `useSectionReveal`, the eyebrow "Background", the `h2` "About Me" (`SplitHeading`, classes as in T-23), the two bio paragraphs and the three facts with unchanged text. New layout: root `mx-auto grid w-full max-w-5xl gap-8 px-4 py-16 outline-none sm:px-8 md:grid-cols-[1fr_auto] md:items-center md:gap-12 md:py-24 snap:min-h-svh snap:py-(--safe-band) snap:content-center` with `style={safeBandStyle}`; left column (heading block `data-reveal`, bio `data-reveal` block with paragraphs `text-base sm:text-lg snap:text-base`, facts `dl data-reveal` with `sm:grid-cols-3`); right column image wrapper `data-reveal`: a frame `div` with `style={{ aspectRatio: ABOUT_IMAGE_ASPECT }}`, `overflow-hidden border border-line`, `w-full max-w-xs mx-auto md:mx-0`, and at snap sizes `snap:max-w-none snap:w-auto` with `style` height `min(calc(100svh - 144px - 0.5rem), 32rem)` applied through a CSS variable and `snap:h-(--about-img-h)` (value built from `SECTION_SAFE_BAND_PX` and `ABOUT_IMAGE_MAX_REM`); inside, `aboutImage` from `../../data/about.js` as `img` (`object-cover`, `width`, `height`, `alt`, `loading="lazy"`) or the tokens-only gradient placeholder (`aria-hidden`). Image above the text below `md` (DOM order: image first via `order` classes, or place the wrapper first and use `md:order-last`). At most 5 `data-reveal` targets.
  - Covers: FR-19, FR-29, FR-30, FR-31, FR-34, AC-3, AC-4, AC-19
  - Done when: lint and build exit 0; bio and facts text identical to the previous file (diff the strings); markers unchanged; no fixed height without `min()`; no `overflow-hidden` on the section root.
  - Browser check: yes (interim, `window.scrollTo`) - at the seven desktop sizes the About rect equals `innerHeight` within 1 px, no clipped descendants, frame ratio 4/5 within 1% and its height at most `innerHeight - 144`; no text or interactive rect inside the top or bottom 72 px; stacked with the frame above the text at 375x812 and 1000x900 with no horizontal overflow; console clean.

- [~] T-25 Rewrite the Tech Stack section from the data module
  - Files: `src/components/sections/TechStack.jsx`
  - Needs (006): T-04, T-06, T-17
  - 005 waits: none (005:T-16 built)
  - Can start now: yes
  - Do: keep `id="tech-stack"`, `aria-labelledby="tech-stack-heading"`, the 005 markers (`data-snap-label="Tech Stack"`), `useSectionReveal`, eyebrow "Toolkit", `h2` "Tech Stack" (`SplitHeading`, classes as in T-23); drop the intro line. Root `mx-auto grid w-full max-w-5xl gap-8 px-4 py-16 outline-none sm:px-8 md:gap-12 md:py-24 snap:min-h-svh snap:py-(--safe-band) snap:content-center snap:gap-4` with `style={safeBandStyle}`; heading block `data-reveal`; a `div` `grid gap-x-8 gap-y-8 md:grid-cols-3` holding one `<div data-reveal>` per category wrapping `<TechCategory category={category} />` from `techStack`. Remove the inline tool list. At most 5 `data-reveal` targets.
  - Covers: FR-20, FR-29, FR-30, FR-31, FR-34, AC-3, AC-4, AC-20
  - Done when: lint and build exit 0; `grep -n "technologies\|name:" src/components/sections/TechStack.jsx` returns nothing; markers unchanged.
  - Browser check: yes (interim, `window.scrollTo`) - three category columns side by side from 768 wide and stacked below; at the seven desktop sizes the section rect equals `innerHeight` within 1 px with no clipping and nothing in the 72 px bands; `use` computed font size is 14 px at 1440x900 and 16 px at 1000x900 (D-23); tool tiles have no tab stops; a scratch 3 x 5 list with 40-character `use` lines (reverted) still fits at 1024x700; console clean.

## Layer 3: Tokens, docs and mounting (each waits for pending 005 tasks that edit the same file)

- [~] T-26 Add the `error` token and the `.icon-mask` class
  - Files: `src/index.css`, `scripts/check-contrast.mjs`
  - Needs (006): T-09, T-10
  - 005 waits: 005:T-24, 005:T-30 and 005:T-32 (all edit `index.css`; wait until all three are `[~]` or `[x]`)
  - Can start now: no
  - Do: in the existing `@theme` block add `--color-error: #e8707e;` after `--color-focus` with the comment `error: #e8707e. Contrast: 6.36:1 on surface (#0b1020), 6.76:1 on ink (#05070d). Text needs 4.5, border and icon need 3. Form validation states only.` Add the class (outside `@theme`): `.icon-mask { display: inline-block; background-color: currentColor; mask-image: var(--icon-url); mask-repeat: no-repeat; mask-position: center; mask-size: contain; }` with a comment pointing to 005's `.arrow-icon` as the same technique. Change `REQUIRE_ERROR_TOKEN` to `true` in `scripts/check-contrast.mjs`. Touch nothing else in `index.css`.
  - Covers: FR-7, FR-23, FR-27, NFR-5, D-20, AC-11, AC-26, AC-34
  - Done when: `npm run check:contrast` exits 0 and prints 6.36 (surface) and 6.76 (ink) within 0.01; the token set is the eight existing plus `error`; lint and build exit 0; carousel prev/next and footer icons now render.
  - Browser check: yes - prev/next icons and social icons visible and tinted by `currentColor` (hover changes their colour); placeholder tech glyph visible; computed `--color-error` equals `#e8707e`; console clean.

- [~] T-27 Extend the icons README
  - Files: `src/assets/icons/README.md`
  - Needs (006): T-05
  - 005 waits: 005:T-24 (creates the README)
  - Can start now: no
  - Model: haiku
  - Do: append a section "Carousel and footer icons (spec 006)": files `carousel-prev.svg`, `carousel-next.svg`, `github.svg`, `itchio.svg`; where used (carousel prev and next buttons, footer social links); format (single colour with `currentColor`, any viewBox, no fixed width/height, only the shape matters because of the CSS mask); replacing a file with the same name needs no code change; placeholders are marked inside each file; the `.icon-mask` class and `IconMask` component.
  - Covers: FR-35, AC-31
  - Done when: the README names all four files and the replacement rule; lint and build exit 0.
  - Browser check: no

- [~] T-28 Mount Contact on the home page
  - Files: `src/pages/HomePage.jsx`
  - Needs (006): T-20, T-26, T-23, T-24, T-25
  - 005 waits: 005:T-25 (`SectionArrows` mount edits this file)
  - Can start now: no
  - Do: import `Contact` and render `<Contact />` directly after `<TechStack />` and before `<SectionArrows />`. Nothing else changes.
  - Covers: FR-21, FR-31, AC-5
  - Done when: lint and build exit 0; `[data-snap-section]` order is Hero, Projects, About, Tech Stack, Contact with the five labels; the page ends with the Contact footer.
  - Browser check: yes - at 1440x900 the page has five sections; the Contact section shows the form area and footer on one screen at its snap point (use `window.scrollTo` if 005:T-20 is not built); no console errors; the form renders.

- [~] T-29 Add the project route and mount `RouteScrollReset`
  - Files: `src/App.jsx`
  - Needs (006): T-21, T-22
  - 005 waits: 005:T-20 (mounts `SnapScroller` in this file)
  - Can start now: no
  - Do: import `ProjectPage` and `RouteScrollReset`; add `<Route path="/projects/:slug" element={<ProjectPage />} />` after `/viewer`; mount `<RouteScrollReset />` next to `<ScrollToHash />` (keep 005's `<SnapScroller />` as is). No catch-all route.
  - Covers: FR-17, FR-18, AC-18
  - Done when: lint and build exit 0; `/projects/project-one` renders the page; `/projects/does-not-exist` renders the not-found state; both with no console output.
  - Browser check: yes - `/projects/project-one` and `/projects/does-not-exist` render one `h1` each, "Details coming soon." and the back link (href `/#projects`); a trailing slash works; a page reload works; navbar present; console clean.

- [~] T-30 Add the Contact link to the navbar
  - Files: `src/components/Navbar.jsx`
  - Needs (006): T-28
  - 005 waits: 005:T-21, 005:T-27 and 005:T-29 (all edit `Navbar.jsx`)
  - Can start now: no
  - Do: add a `Contact` item (`<Link to="/#contact">` with the same classes as the Projects and About items) after About and before 3D Viewer, in the single place the items are defined so it appears in both the desktop row and the mobile menu panel. Follow whatever structure 005:T-29 left (item array or two lists); do not change item styles, menu state or the breakpoint.
  - Covers: FR-28, AC-27
  - Done when: lint and build exit 0; the DOM order is Home, Projects, About, Contact, 3D Viewer in both desktop and the opened mobile menu; the link has `min-h-11`.
  - Browser check: yes - clicking Contact from `/` reaches the Contact section (top at the viewport top within 1 px at 1440x900 once snapping works), from `/viewer` and from a project page it navigates to `/#contact`; the open mobile menu at 375x812 lists Contact with a 44 px height and no horizontal overflow; console clean.

- [~] T-31 Measure the navbar slack and fix the breakpoint if needed (measurement)
  - Files: `specs/006-sections-carousel-contact/measurements.md` (create), `src/lib/navConfig.js` (only if slack is under 40 px)
  - Needs (006): T-30
  - 005 waits: 005:T-28 and 005:T-29 (`navConfig.js` and the menu exist and are final)
  - Can start now: no
  - Do: after the `sdd-browser` report, record in `measurements.md` a section "Navbar breakpoint (D-L)": at 640x900 `brand.offsetWidth`, links group `offsetWidth` (negative margin included), `gap-x-4` (16), nav horizontal padding (64) and `slack = 640 - (padding + brand + 16 + links)`; one row (all items share `offsetTop`) and `scrollWidth <= innerWidth` at 640, 641, 1024, 1280, 1920; the toggle visible and the row hidden at 639. If `slack >= 40` keep `NAV_MENU_BREAKPOINT_PX = 640` and write the numbers. If under 40 set the constant to 768 in `navConfig.js`, then record the same checks at 767, 768, 769 and 1024, 1280, 1920 (the browser run is repeated). Prediction to compare: slack about 49 px.
  - Covers: FR-28, AC-27
  - Done when: `measurements.md` has the numbers and pass/fail; `navConfig.js` is unchanged or holds 768 with the re-run recorded; lint and build exit 0.
  - Browser check: yes (measurement) - all items listed in Do.

## Layer 4: Verification (measurement tasks; builders only write `measurements.md`)

- [~] T-32 Measure fit and safe bands for the four sections (measurement)
  - Files: `specs/006-sections-carousel-contact/measurements.md`
  - Needs (006): T-23, T-24, T-25, T-28, T-26
  - 005 waits: 005:T-20 (snap to rest), 005:T-23 (resize handling), 005:T-25 (arrows visible for the screenshots)
  - Can start now: no
  - Do: record the `sdd-browser` report: at 1920x1080, 1920x700, 1440x900, 1366x768, 1280x720, 1024x768, 1024x700, after snapping with a real wheel gesture to each of Projects, About, Tech Stack and Contact: section rect top 0 and height equal to `innerHeight` within 1 px; no neighbour pixels; for the section and all descendants `scrollHeight <= clientHeight` and `scrollWidth <= clientWidth` (carousel viewport exempt horizontally); no element rect outside the viewport; no text or interactive element rect intersecting the top 72 px or the bottom 72 px (Contact footer exempt below); the Contact footer bottom edge within 40 px of the viewport bottom and the form area centred; screenshots with the 005 arrows visible show no overlap; reduced motion at 1440x900 gives the same heights; the scratch 3 x 5 tech list and a scratch long bio (about 600 characters) at 1024x700 (reverted). Failures are recorded with the file to fix; no source edits.
  - Covers: FR-15, FR-19, FR-20, FR-21, FR-26, FR-29, FR-30, AC-3, AC-4
  - Done when: `measurements.md` has a table of rects per size and section with pass/fail.
  - Browser check: yes (measurement) - all items listed in Do.

- [~] T-33 Measure carousel layout, loop, buttons and dots (measurement)
  - Files: `specs/006-sections-carousel-contact/measurements.md`
  - Needs (006): T-23, T-26
  - 005 waits: none beyond T-26's (005:T-24, T-30, T-32); snapping is not needed (use `window.scrollTo`)
  - Can start now: no
  - Do: record the `sdd-browser` report: (AC-6) at 1920x1080, 1440x900, 1366x768, 1024x700, 1920x700, 1280x720 and 375x812: centre card centred, side cards visible by at least 15% and at most their width, computed opacity at most 0.4 and a scale below 1, clipped by the edge unless fully visible, gap at most 64 px unless fully visible, viewport reaches both window edges, centre image width (400 / 700 rules), image frame ratio 16/10 within 1%, image above title above description, no gap when a description is removed (scratch, reverted); (AC-7) from the first slide Previous shows the last entering from the left, N Next presses return to the first, 3N presses 100 ms apart end on `3N mod N` with exactly one active slide and no empty side slot in per-frame samples, scratch data with N = 0, 1, 2, 3, 12 (reverted), transition within 100 ms of 0.6 s and only `transform`/`opacity` changing, instant with reduced motion; (AC-11) button names, `aria-controls`, 44x44 rects, distinct hover/focus-visible/active computed styles, no overlap with title or description or each other, outside the bottom 72 px band, scratch icon swap (reverted); (AC-12) dots: 44x44, names, one `aria-current`, shortest-path jumps, N > 10 scratch counter, no `role="tab"`.
  - Covers: FR-2, FR-3, FR-4, FR-7, FR-8, FR-15, FR-16, AC-6, AC-7, AC-11, AC-12
  - Done when: `measurements.md` has the numbers and pass/fail per check; defects list the file to fix.
  - Browser check: yes (measurement) - all items listed in Do.

- [~] T-34 Measure autoplay, pauses and timer restart (measurement)
  - Files: `specs/006-sections-carousel-contact/measurements.md`
  - Needs (006): T-33
  - 005 waits: 005:T-20 (snapping to another section for the out-of-view case)
  - Can start now: no
  - Do: record the `sdd-browser` report using `window.__carouselInfo()`: (AC-8) four autoplay advances 5000 ms +- 150 ms with Projects in view, scratch `CAROUSEL_AUTOPLAY_MS` edit (reverted), no autoplay with N < 2; (AC-9) no advance in 12 s with the pointer over the card, a side card, a button and a dot; none with Tab focus (keyboard) on a button, a dot and the card link; a real mouse click on a button then moving the pointer away does not pause and the next advance is 5 s after the click (D-21); emulated `document.hidden` and a fresh full interval after it clears; snapping to another section, and a route change, stop advances for 12 s and a full interval is waited on return; reduced motion before load gives no advance and `timers` 0, toggling at runtime stops or allows autoplay without reload; (AC-10) each of next, previous, a dot, ArrowRight, a horizontal wheel gesture, a swipe and a side-card click about 4 s after an advance leaves at least 4.8 s until the next advance; (AC-29, carousel part) reduced motion at 1440x900: no timer, instant changes, controls and keys still work.
  - Covers: FR-5, FR-6, FR-34, AC-8, AC-9, AC-10, AC-29
  - Done when: `measurements.md` has timestamps and pass/fail per check.
  - Browser check: yes (measurement) - all items listed in Do.

- [~] T-35 Measure carousel inputs, keyboard and semantics (measurement)
  - Files: `specs/006-sections-carousel-contact/measurements.md`
  - Needs (006): T-29, T-33
  - 005 waits: 005:T-20 and 005:T-21 (wheel interplay needs real snapping; card click navigates through the router)
  - Can start now: no
  - Do: record the `sdd-browser` report: (AC-13) touch emulation at 375x812 and 1440x900: horizontal swipes of at least 40 px change one slide in the right direction, a vertical swipe scrolls natively and does not change the slide, viewport computed `touch-action` is `pan-y`, `defaultPrevented` false, swiping over a card link does not open it; (AC-14) keys with focus on a button, a dot and the card link, focus handoff, navbar focus ignores ArrowLeft/Right, Enter on the card link opens the project, Home/End/ArrowUp/ArrowDown/PageDown still snap, `activeElement` never `body`, one card link per Tab pass in the documented order, no tabbable element in inactive slides, ring around the whole card (screenshot); (AC-15) at 1440x900: vertical wheel over the centre card, a side card and a button each moves one section and not the slide, horizontal 80/5 changes exactly one slide and is `preventDefault`ed, a 60-event decaying horizontal stream changes one slide and a second gesture after a pause one more, a diagonal with `|dy| >= |dx|` moves a section, Ctrl+wheel does nothing, at 1000x900 vertical wheel scrolls natively while horizontal still slides, 10 vertical events during a 005 move do nothing extra, no ancestor carries a nested-scroll marker; (AC-16) region, slide and track attributes, `aria-live` across all states, heading order; (AC-17) clicking the image, title, description area and Enter navigate to `/projects/<slug>` without reload, one link and one tab stop with the title as name, side-card click (mouse and tap) slides and never navigates, then the next click opens. Manual items for the owner are listed at the end (screen reader).
  - Covers: FR-9, FR-10, FR-11, FR-12, FR-13, FR-14, FR-32, NFR-1, AC-13, AC-14, AC-15, AC-16, AC-17
  - Done when: `measurements.md` has pass/fail per check and the owner's manual list.
  - Browser check: yes (measurement) - all items listed in Do.

- [~] T-36 Measure project pages, scroll behaviour and lifecycle (measurement)
  - Files: `specs/006-sections-carousel-contact/measurements.md`
  - Needs (006): T-29, T-30
  - 005 waits: 005:T-20, 005:T-21, 005:T-29
  - Can start now: no
  - Do: record the `sdd-browser` report: (AC-18) `/projects/project-one` and `/projects/does-not-exist` content, `h1` count, back link href, trailing slash, direct load and reload in dev and in `npm run build` + `npm run preview`, 375x812 and 1920x1080 without horizontal overflow, no canvas, arrow or footer; opening a project from the carousel while scrolled to Projects starts at `scrollY` 0; the back link and the navbar Projects, About, Contact links reach each section top within 1 px at 1440x900 (snap animation), 1000x900 (Lenis) and instantly with reduced motion; browser Back returns to `/` resting on a snap point with the carousel on the first project. (AC-32, runtime part) ten round trips `/` to `/projects/project-one` and back: `__carouselInfo()` timers 0 or 1, listeners and observers stable, no warnings (StrictMode dev).
  - Covers: FR-17, FR-18, NFR-2, AC-18, AC-32
  - Done when: `measurements.md` has pass/fail per check.
  - Browser check: yes (measurement) - all items listed in Do.

- [~] T-37 Measure About, Tech Stack, Contact and footer (measurement)
  - Files: `specs/006-sections-carousel-contact/measurements.md`
  - Needs (006): T-28, T-26, T-32
  - 005 waits: 005:T-20 (wheel over the textarea), 005:T-22 (settle with focus inside the form), 005:T-25
  - Can start now: no
  - Do: record the `sdd-browser` report: (AC-19) text unchanged, frame ratio, placeholder versus scratch image object (reverted), frame height versus bands, side by side from `md`; (AC-20) default content (3 categories, 5 tools), tile structure, `alt=""`, placeholder in the same slot, scratch `<id>.svg` import and `tint: true` (reverted), `use` present/absent and computed 14 px (snap) / 16 px (non-snap), scratch 3 x 5 x 40-character list fits at the seven sizes, no tab stops; (AC-21) form attributes and sizes, labels, 375x812 single column; (AC-22) empty submit, `a@`, `a b`, whitespace-only, live revalidation, focus on the first invalid field, no `role="alert"`, computed colours resolve to `error`, greyscale screenshot; (AC-23) valid submit by button and Enter shows the status, network log empty, spies on `fetch`, `XMLHttpRequest.send`, `navigator.sendBeacon` record nothing, URL/scroll/values unchanged, status hides on edit, button stays enabled; (AC-24) short message: wheel over the textarea moves one section and no marker; 30 pasted lines: marker present and wheel scrolls the textarea; cleared: marker gone; keys typed in each field move nothing; (AC-25) footer is a descendant of `section#contact`, bottom edge within 40 px, form centred, year text, absent on `/viewer` and project pages, no second `contentinfo`, 320x568 wrap with 44 px links; (AC-26) links, names, `rel`, hit areas, states, scratch icon swap (reverted); (AC-34) computed colours of error text, border and icon against `ink` and `surface`.
  - Covers: FR-19, FR-20, FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27, FR-32, AC-19, AC-20, AC-21, AC-22, AC-23, AC-24, AC-25, AC-26, AC-34
  - Done when: `measurements.md` has pass/fail per check.
  - Browser check: yes (measurement) - all items listed in Do.

- [~] T-38 Measure the snap contract with five sections and the navbar (measurement)
  - Files: `specs/006-sections-carousel-contact/measurements.md`
  - Needs (006): T-28, T-30, T-31
  - 005 waits: 005:T-20, 005:T-21, 005:T-25, 005:T-29
  - Can start now: no
  - Do: record the `sdd-browser` report: (AC-5) `[data-snap-section]` order and labels with `tabindex="-1"`; at Tech Stack the arrows read "Previous section: About" and "Next section: Contact"; at Contact only the up arrow exists ("Previous section: Tech Stack"), the down arrow is not in the DOM or accessibility tree; one wheel gesture and PageDown at Contact do nothing; End from Hero goes to Contact and Home returns; `/#projects`, `/#about`, `/#tech-stack`, `/#contact` land within 1 px at 1440x900, also from `/viewer` and from a project page; (AC-27) Contact item order and styles, reach from `/`, `/viewer`, a project page in all three scroll modes, one-row checks at the breakpoint, +1, 1024, 1280, 1920 (numbers from T-31), the mobile menu at 375x812 and 320x568.
  - Covers: FR-28, FR-31, AC-5, AC-27
  - Done when: `measurements.md` has pass/fail per check.
  - Browser check: yes (measurement) - all items listed in Do.

- [~] T-39 Measure below-snap sizes, reduced motion and carry-over (measurement)
  - Files: `specs/006-sections-carousel-contact/measurements.md`
  - Needs (006): T-28, T-34
  - 005 waits: 005:T-20, 005:T-23, 005:T-29
  - Can start now: no
  - Do: record the `sdd-browser` report: (AC-28) at 1023x900, 1440x699, 1366x600, 375x812, 320x568: no snapping or arrows, no horizontal overflow, body text at least 16 px, carousel with a fully visible centre card, side peeks, working controls, dots and swipe, About stacked with the image above, Tech Stack stacked, full-width form, footer last, every control reachable by Tab; (AC-29) reduced motion at 1440x900 before load: full-height sections without snapping, arrows or Lenis, no autoplay, instant changes, buttons/dots/keys/horizontal wheel work, reveals skipped, form validates and shows its status; runtime toggle without reload; (AC-30) reveal items visible within 1.5 s after arriving at each of the four sections, no GSAP reveal on carousel elements (source), focus rings at least 3:1 on carousel buttons, dots, card link, form controls, submit, social links and the navbar Contact link (screenshots), `error` only in form files.
  - Covers: FR-33, FR-34, NFR-1, NFR-5, AC-28, AC-29, AC-30
  - Done when: `measurements.md` has pass/fail per check.
  - Browser check: yes (measurement) - all items listed in Do.

## Layer 5: Final checks and regression

- [ ] T-40 Static checks, source audits and asset/doc review
  - Files: `scripts/check-carousel.mjs`, `specs/006-sections-carousel-contact/measurements.md`
  - Needs (006): T-01 to T-31 (all code tasks)
  - 005 waits: 005:T-35 (005 static checks done, so build output and `check:*` are final)
  - Can start now: no
  - Do: extend the check script with source audits: no `preventDefault` inside touch or pointer handlers of the carousel files; no `fetch|XMLHttpRequest|sendBeacon|mailto:|dangerouslySetInnerHTML|window.open` in the new component files; no `three` import in 006 files; the five `data-snap-label` values and DOM order in the section files and `HomePage.jsx`; no `kind` in `src/data`; no URL string in components (`https://` only in `src/data/socialLinks.js`); no other `overflow-auto|overflow-scroll` in the new sections. Then run `npm run lint`, `npm run build`, every `check:*` script, and record in `measurements.md` "Static checks": exit codes, `package.json` dependencies identical to before (only the two scripts added), provenance comments present next to every real image/logo entry, the three READMEs and five placeholders present and marked, `--color-error` comment text matches the measured ratios, no layout read in the carousel callbacks (inspection result), separate files for each concern (NFR-4).
  - Covers: NFR-2, NFR-3, NFR-4, NFR-5, NFR-6, NFR-7, NFR-8, FR-35, AC-1, AC-2, AC-31, AC-32, AC-34
  - Done when: all commands exit 0 with no new warnings; every audit line reported pass/fail.
  - Browser check: no

- [ ] T-41 Regression: 005 acceptance criteria with five sections (measurement)
  - Files: `specs/006-sections-carousel-contact/measurements.md`
  - Needs (006): T-32 to T-40
  - 005 waits: 005:T-37 (005 complete)
  - Can start now: no
  - Do: record the `sdd-browser` report re-running with the 006 content and Contact as the last section: 005 AC-2 (fit for Projects, About, Tech Stack, Contact), AC-3 (gestures end at Contact), AC-5 (lock and retarget), AC-8 and AC-9 (settle, including focus inside the form), AC-10 (non-snap sizes), AC-13 (deep links including `/#contact`), AC-21 to AC-23 (arrow presence, names, focus), AC-31, AC-32 and AC-34 (navbar items and menu with Contact). Then the owner's manual checklist, left unchecked: real trackpad and tilt-wheel feel, a real phone swipe, screen-reader announcements for the carousel and the form, final icon and logo swaps, hover and focus visual feel.
  - Covers: FR-28, FR-29, FR-30, FR-31, AC-33
  - Done when: `measurements.md` has pass/fail per 005 AC and the owner checklist.
  - Browser check: yes (measurement) - all items listed in Do.

## Start-now summary
| Task | Title | Browser check | Can start now | 005 waits |
|---|---|---|---|---|
| T-01 | Carousel constants, index logic, `check:carousel` | no | yes | none |
| T-02 | Carousel geometry (D-22 peek rule) | no | yes | none |
| T-03 | Wheel and swipe classifiers | no | yes | none |
| T-04 | Section layout constants (haiku) | no | yes | 005:T-05 (built) |
| T-05 | Placeholder SVGs and asset READMEs (haiku) | no | yes | none |
| T-06 | Data modules (haiku) | no | yes | none |
| T-07 | Validators, loader, data checks | no | yes | none |
| T-08 | Contact constants and messages (haiku) | no | yes | none |
| T-09 | Contrast check script | no | yes | none |
| T-10 | `IconMask` (haiku) | no | yes | none |
| T-11 | `useCarousel` core | no | yes | none |
| T-12 | `useCarousel` autoplay and pauses | no | yes | none |
| T-13 | `useCarousel` inputs | no | yes | none |
| T-14 | `ProjectCard` | no | yes | none |
| T-15 | `CarouselControls` | no | yes | none |
| T-16 | `ProjectCarousel` | no | yes | none |
| T-17 | `TechCategory` | no | yes | none |
| T-18 | `ContactForm` | no | yes | none |
| T-19 | `ContactFooter` | no | yes | none |
| T-20 | `Contact` section component | no | yes | none |
| T-21 | `ProjectPage`, `ProjectNotFound` | no | yes | none |
| T-22 | `RouteScrollReset` | no | yes | none |
| T-23 | Projects section rewrite | yes (interim) | yes | none (005:T-16 built) |
| T-24 | About section rewrite | yes (interim) | yes | none (005:T-16 built) |
| T-25 | Tech Stack section rewrite | yes (interim) | yes | none (005:T-16 built) |
| T-26 | `error` token and `.icon-mask` | yes | no | 005:T-24, T-30, T-32 |
| T-27 | Icons README extension (haiku) | no | no | 005:T-24 |
| T-28 | Mount Contact on the home page | yes | no | 005:T-25 |
| T-29 | Project route and `RouteScrollReset` mount | yes | no | 005:T-20 |
| T-30 | Navbar Contact link | yes | no | 005:T-21, T-27, T-29 |
| T-31 | Navbar slack measurement and breakpoint (measurement) | yes | no | 005:T-28, T-29 |
| T-32 | Fit and safe-band measurement | yes | no | 005:T-20, T-23, T-25 |
| T-33 | Carousel layout, loop, controls measurement | yes | no | via T-26 (005:T-24, T-30, T-32) |
| T-34 | Autoplay and pauses measurement | yes | no | 005:T-20 |
| T-35 | Inputs, keyboard, semantics measurement | yes | no | 005:T-20, T-21 |
| T-36 | Project pages and lifecycle measurement | yes | no | 005:T-20, T-21, T-29 |
| T-37 | About, Tech, Contact, footer measurement | yes | no | 005:T-20, T-22, T-25 |
| T-38 | Snap contract and navbar measurement | yes | no | 005:T-20, T-21, T-25, T-29 |
| T-39 | Below-snap, reduced motion, carry-over measurement | yes | no | 005:T-20, T-23, T-29 |
| T-40 | Static checks and source audits | no | no | 005:T-35 |
| T-41 | 005 regression with five sections | yes | no | 005:T-37 |

## Coverage

| Req | Tasks |
| --- | --- |
| FR-1 | T-06, T-07, T-23 |
| FR-2 | T-14, T-23, T-33 |
| FR-3 | T-02, T-11, T-23, T-33 |
| FR-4 | T-01, T-11, T-16, T-33 |
| FR-5 | T-01, T-12, T-34 |
| FR-6 | T-01, T-12, T-34 |
| FR-7 | T-05, T-10, T-11, T-15, T-16, T-26, T-33 |
| FR-8 | T-01, T-15, T-16, T-33 |
| FR-9 | T-03, T-13, T-35 |
| FR-10 | T-13, T-35 |
| FR-11 | T-03, T-13, T-35 |
| FR-12 | T-12, T-13, T-16, T-35 |
| FR-13 | T-16, T-35 |
| FR-14 | T-14, T-16, T-35 |
| FR-15 | T-02, T-11, T-23, T-32, T-33 |
| FR-16 | T-16, T-23, T-33 |
| FR-17 | T-21, T-29, T-36 |
| FR-18 | T-22, T-29, T-36 |
| FR-19 | T-06, T-24, T-32, T-37 |
| FR-20 | T-05, T-06, T-07, T-17, T-25, T-32, T-37 |
| FR-21 | T-20, T-28, T-32, T-37 |
| FR-22 | T-08, T-18, T-37 |
| FR-23 | T-08, T-09, T-18, T-26, T-37 |
| FR-24 | T-18, T-37 |
| FR-25 | T-18, T-37 |
| FR-26 | T-19, T-20, T-32, T-37 |
| FR-27 | T-05, T-06, T-10, T-19, T-26, T-37 |
| FR-28 | T-30, T-31, T-38, T-41 |
| FR-29 | T-23, T-24, T-25, T-32, T-41 |
| FR-30 | T-04, T-23, T-24, T-25, T-32, T-41 |
| FR-31 | T-20, T-23, T-24, T-25, T-28, T-38, T-41 |
| FR-32 | T-18, T-35, T-37 |
| FR-33 | T-02, T-39 |
| FR-34 | T-12, T-20, T-23, T-24, T-25, T-34, T-39 |
| FR-35 | T-05, T-06, T-27, T-40 |
| NFR-1 | T-14, T-15, T-17, T-18, T-19, T-35, T-39 |
| NFR-2 | T-02, T-11, T-12, T-13, T-36, T-40 |
| NFR-3 | T-40 |
| NFR-4 | T-01, T-07, T-20, T-40 |
| NFR-5 | T-09, T-26, T-39, T-40 |
| NFR-6 | T-10, T-18, T-19, T-40 |
| NFR-7 | T-40 |
| NFR-8 | T-01, T-04, T-40 |
| AC-1 | T-40 |
| AC-2 | T-06, T-07, T-40 |
| AC-3 | T-23, T-24, T-25, T-32 |
| AC-4 | T-04, T-23, T-24, T-25, T-32 |
| AC-5 | T-20, T-28, T-38 |
| AC-6 | T-02, T-11, T-14, T-23, T-33 |
| AC-7 | T-01, T-11, T-16, T-33 |
| AC-8 | T-01, T-12, T-34 |
| AC-9 | T-01, T-12, T-34 |
| AC-10 | T-12, T-13, T-34 |
| AC-11 | T-10, T-15, T-26, T-33 |
| AC-12 | T-15, T-16, T-33 |
| AC-13 | T-03, T-13, T-35 |
| AC-14 | T-13, T-16, T-35 |
| AC-15 | T-03, T-13, T-35 |
| AC-16 | T-01, T-12, T-13, T-16, T-35 |
| AC-17 | T-14, T-16, T-35 |
| AC-18 | T-21, T-22, T-29, T-36 |
| AC-19 | T-24, T-37 |
| AC-20 | T-06, T-07, T-17, T-25, T-37 |
| AC-21 | T-18, T-20, T-37 |
| AC-22 | T-08, T-18, T-37 |
| AC-23 | T-18, T-37 |
| AC-24 | T-18, T-37 |
| AC-25 | T-19, T-20, T-37 |
| AC-26 | T-06, T-10, T-19, T-26, T-37 |
| AC-27 | T-30, T-31, T-38 |
| AC-28 | T-02, T-39 |
| AC-29 | T-12, T-34, T-39 |
| AC-30 | T-39 |
| AC-31 | T-05, T-06, T-07, T-27, T-40 |
| AC-32 | T-01, T-02, T-03, T-11, T-12, T-13, T-36, T-40 |
| AC-33 | T-41 |
| AC-34 | T-09, T-26, T-37, T-40 |

## Open questions
None blocking. Notes for the orchestrator:
- T-01 to T-25 can run now and in this order within each layer; T-04 may create `scripts/check-carousel.mjs` only if T-01 has not (merge by keeping both case sets).
- T-26 is the first task that waits on pending 005 work (005:T-24, T-30, T-32 all edit `index.css`). The leaf components render without it but icons and error colours stay unstyled until it is done.
- T-23 to T-25 browser checks are interim (no snapping, `window.scrollTo`); the full snap-based checks are T-32 to T-39.
- Every measurement task runs `sdd-browser` first; the builder then writes the report into `measurements.md` (the browser agent is read-only).
- `measurements.md` is created by whichever measurement task runs first (T-31 or T-32/T-33); later tasks append sections.
