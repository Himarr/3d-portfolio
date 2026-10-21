# Plan: 006 Projects Carousel, Project Pages, About, Tech Stack, Contact and Footer

Planned against the 005 TARGET state (005 spec.md, plan.md, tasks.md), not against the current source, because 005 is being built in parallel. 005 modules are referenced by the names its plan defines: `snapController`, `snapConfig.js` (`SNAP_QUERY`), `arrowConfig.js` (`SECTION_ARROW_OFFSET_PX`, `SECTION_ARROW_SIZE_PX`), `useSectionScroll`, `SectionArrows`, `SnapScroller`, `data-snap-layout` plus the `snap:` Tailwind variant, `--nav-h`, `NAV_MENU_BREAKPOINT_PX` in `navConfig.js`, `useMediaQuery`, the capture-phase wheel handler and `shouldHandleKey`.

## Spec issues found
None block the plan. Each item says what the plan does.
1. FR-13 versus AC-7 / AC-16 (what assistive tech "sees"). FR-13 makes every inactive slide inert and out of the accessibility tree, so at any moment AT sees exactly ONE slide group (the active one, "n of N"). AC-7 says that with N = 2 "assistive tech sees only 2 slides". Plan reading: across a full loop the only labels ever exposed are "1 of 2" and "2 of 2" (a repeated slot never produces "3 of 2"). Verified by sampling the exposed label over one loop, not by counting groups in the tree at one instant.
2. FR-11 versus real devices. FR-11 "handles" horizontal events only at `|deltaX| >= CAROUSEL_WHEEL_MIN_DELTA`. Inertia-tail events of a stream the carousel already handled fall below that value and would reach the browser's swipe-back gesture. Plan refinement (does not contradict the text): inside a handled stream, horizontal-dominant events of any size are consumed (`preventDefault`, no slide). Also, handled and consumed horizontal events call `stopPropagation` so Lenis (bubble phase on `window`, active when snapping is off) does not scroll the small `deltaY` part of a diagonal swipe. FR-11 forbids `stopPropagation` only for the vertical case.
3. RESOLVED in spec (D-21, owner). FR-6 versus mouse use: a mouse click leaves focus on the button, which would have paused autoplay indefinitely. Owner decision: only keyboard focus (`:focus-visible`) pauses. Plan: D-B (focus flag set only when the focused element matches `:focus-visible`). Tests may use Tab and mouse clicks.
4. RESOLVED in spec (D-22, owner). FR-3 versus FR-15: on wide, short windows the height-capped card forced a huge gap (586 px at 1920x700, 237 px at 1280x720). Owner decision: the side cards may reveal more than the standard peek, up to fully visible, with the gap bounded by `CAROUSEL_GAP_MAX_PX`. Plan: D-E (new peek rule, constant 64, recomputed fit table: gap 386 px with fully visible side cards at 1920x700, 64 px at 1280x720).
5. RESOLVED in spec (D-23, owner exception). FR-33 (16 px minimum) versus the Tech Stack fit at 1024x700 (a 16 px `use` line gives 562 px of content against 556 px available). `use` is 16 px below the snap layout and 14 px (`snap:text-sm`) at snap-active sizes; the exception covers that line only. Plan: D-F.
6. FR-34 (all reveal items visible within 1.5 s) versus the shared `useSectionReveal` (0.7 s tween, 0.08 s stagger): the 1.5 s limit allows at most 11 `[data-reveal]` targets per section. Plan: at most 8 per section, so reveals go on blocks (heading eyebrow, each tool category, the form block), never on every tile or field.
7. 005 assumption not backed by 005's plan: FR-18 needs "project page starts at `scrollY` 0". 005's `ScrollToHash` only acts on hashes. Plan adds a separate `RouteScrollReset` component (D-I); no 005 file is changed for it except mounting it in `App.jsx`.
8. 005 NFR "nested-scroller marker is `data-lenis-prevent` or `data-snap-ignore`". Only `data-lenis-prevent` is honoured by Lenis, which smooths wheel input when snapping is off (1000x900). Plan uses `data-lenis-prevent` (D-15 allows either).
9. 005 `NAV_MENU_BREAKPOINT_PX` lives in 005's `navConfig.js`. If the 006 measurement requires 768, that one constant in a 005 file changes (D-L), after 005 T-29.

## Approach
Brownfield on 001 to 005 (React 19 StrictMode, react-router-dom 7, Tailwind 4, GSAP 3.15, Lenis 1.3). No new dependency (see Dependencies). Five ideas drive the design:
- Pure logic first. Everything that can be wrong silently (loop indices, pool size, slide styles, wheel and swipe classification, autoplay gate, geometry fit numbers, data validation, form messages, colour contrast) lives in pure `.js` modules under `src/lib/` and is covered by `npm run check:carousel` and `npm run check:contrast`. Components and the hook only wire it up.
- Carousel as a continuous position, not as clones. A fixed pool of slide elements is placed from one animated float `pos` (GSAP tween). Every slide's `transform` and `opacity` come from `rel = wrapSigned(slot - pos, poolSize)`. There is no DOM reordering, no mount or unmount during motion, so rapid input can never leave a gap and N = 2 or 3 need no special cases beyond the pool size.
- CSS stays dumb, JS measures only in observers. The carousel card size is computed by one pure function from the region width, `innerHeight` and the snap layout, in a `ResizeObserver` / `resize` callback, and written as a CSS variable. Per-frame code only writes styles from cached numbers.
- One safe-band variable. `SECTION_SAFE_BAND_PX` (72) is derived from 005's `arrowConfig.js`, written as `--safe-band` on each section, and every section uses it as `snap:py-(--safe-band)` with `snap:min-h-svh`. Height-aware children use `100svh - 2 * safe band - budget`.
- Reuse 005's contracts, change none of its logic: section markers and labels, `snap:` variant, `useSectionScroll` through `ScrollToHash`, `data-lenis-prevent`, arrows.

Layers in build order (detail in Order of work): (1) pure libs, constants, data modules, validators, Node checks; (2) placeholders, READMEs, token, mask-icon class; (3) leaf components (carousel, card, controls, tech category, about frame, form, footer, project page); (4) section rewrites and Contact section; (5) routes, scroll reset, navbar link; (6) verification and regression.

## Architecture / design decisions

### D-A Index model and state machine (FR-4, FR-5, FR-7, FR-8)
Pure module `src/lib/carouselLogic.js`.
- Two numbers. `target` (integer, unbounded "virtual index", the logical selection) and `pos` (float, the animated visual position, lives in a ref object `{ v }`). Actions only change `target`; a GSAP tween moves `pos.v` to `target`.
- Pool. `poolSize(n)`: `0` if n = 0, `1` if n = 1, otherwise `n * ceil(CAROUSEL_MIN_POOL / n)` (n = 2 gives 4, n = 3 gives 6, n of 4 or more gives n). Why at least 4: each slot is hidden (opacity 0) for `|rel| >= 2`, and a slot wraps from one side to the other at `|rel| = pool / 2`; that wrap must happen inside the hidden zone, so `pool / 2 >= 2`. Slot `s` shows project `s mod n`.
- `rel(slot, pos) = wrapSigned(slot - pos, pool)` in `(-pool/2, pool/2]`.
- Active slot = `mod(target, pool)`; active project = `mod(target, n)`; slide label = active project + 1. The active slot may be a repeated slot (for example slot 4 of 6 when n = 3); there is no "real versus clone" distinction at runtime.
- Navigation: next = `target + 1`, prev = `target - 1`, `goProject(k) = target + shortestDelta(activeProject, k, n)` where `shortestDelta` returns the signed distance in `(-n/2, n/2]` and an exact tie (even n) goes forward. A side-card click is `go(relToTarget)` where `relToTarget = wrapSigned(slot - target, pool)` is ±1.
- Rapid input: every action immediately changes `target` and re-tweens from the current `pos.v` (`overwrite: true`, same duration). N quick clicks move `target` by N, so exactly N slides, never a gap, because slides are always placed from the continuous `pos`. Hidden slots use `visibility: hidden` (discrete flip, not an animation) so they never take clicks.
- The tween: `gsap.to(pos, { v: target, duration: CAROUSEL_TRANSITION_S, ease: CAROUSEL_EASE, overwrite: true, onUpdate: apply, onComplete })`. `apply()` loops over the pool and writes `transform` and `opacity` (and `visibility`) from cached `step`; no layout reads. With reduced motion: no tween, `pos.v = target; apply()`.
- Slide style (`slotStyle(rel)`): `a = |rel|`; opacity: `1` at a = 0, exactly `CAROUSEL_SIDE_OPACITY` at a = 1 (endpoint returned exactly, not by interpolation), linear to `0` at a = 2, `0` beyond; scale: `1` at a = 0, `CAROUSEL_SIDE_SCALE` at a >= 1; x = `sign(rel) * min(a, 2) * step`. Opacity is written rounded to 3 decimals.
- N cases:
  | N | pool | Rendered | Controls | Autoplay | Notes |
  |---|---|---|---|---|---|
  | 0 | 0 | one empty-state line ("No projects yet."), no region, no hook | none | none | component returns before the hook component mounts |
  | 1 | 1 | one centred card, `rel` always 0 | none, no dots | none | no wheel, swipe, key listeners attached; slide "1 of 1"; live `polite` |
  | 2 | 4 | slots map to projects 0,1,0,1 | prev, next, 2 dots | yes | both side slots show the other project; each side slot is inert, exposed label comes only from the active slot |
  | 3 | 6 | projects 0,1,2,0,1,2 | yes | yes | |
  | 4 to 10 | N | one slot per project | yes, dots | yes | |
  | above 10 | N | one slot per project | prev, next, "n / N" text (`aria-hidden`) | yes | |
- Numbers never need normalising in practice (a float at 1e6 keeps full precision); no wrap-around reset is implemented.
- Pause sources do not touch the tween. A transition in flight always finishes (spec edge case).

### D-B Autoplay timer and pause sources (FR-5, FR-6)
- Gate (pure `autoplayAllowed`): `n >= 2 && !reducedMotion && !hover && !focusWithin && !documentHidden && visible`. Flags live in a ref object; every flag change calls `syncAutoplay()`.
- One timer: a single `setTimeout` id in a ref. `syncAutoplay()`: if the gate is closed, `clearTimeout` and null; if open and no timer exists, start a fresh `CAROUSEL_AUTOPLAY_MS` timer; if open and a timer exists, do nothing. So every resume gets a full interval and a flag change that keeps the gate closed never starts anything.
- Tick: set the live region to `off`, `next('auto')`, which itself calls `restartAutoplay()` (clear plus new full timer). The interval is therefore measured from the start of each advance (FR-5). Manual navigation (`'button' | 'dot' | 'key' | 'wheel' | 'swipe' | 'side-click'`) also calls `restartAutoplay()` (only starts a timer if the gate is open).
- Sources:
  | Flag | Set by | Notes |
  |---|---|---|
  | hover | `pointerenter` / `pointerleave` on the region, `pointerType !== 'touch'` | covers cards, buttons, dots |
  | focusWithin | `focusin` on the region sets `focusWithin = event.target.matches(':focus-visible')` (evaluated on every `focusin`, so a mouse-click focus sets it false and Tab focus sets it true; if `matches` throws on an unsupported selector, treat as true); `focusout` clears it when `relatedTarget` is outside the region | D-21; a mouse click on a control is manual navigation (restarts the timer) and does not pause |
  | documentHidden | `visibilitychange`, read `document.hidden` | |
  | visible | `IntersectionObserver` on the region, `threshold: [0, CAROUSEL_VISIBLE_RATIO, 1]`, `visible = intersectionRatio >= CAROUSEL_VISIBLE_RATIO` | covers other sections and (because the component unmounts) other routes |
  | reducedMotion | `usePrefersReducedMotion()` (reactive) | when it turns true: kill the tween, jump `pos.v = target`, clear the timer; when it turns false: gate may reopen with a fresh interval |
- Test note (D-21): focus-visible after script `.focus()` follows the browser heuristic; `sdd-browser` reaches controls with Tab (keyboard modality) and with real mouse clicks, and `__carouselInfo().paused` lists the active pause reasons.
- StrictMode: the effect creating timer, observers and listeners returns one cleanup that clears all; `window.__carouselInfo().timers` (DEV) must stay 0 or 1 per mounted carousel.
- Moving the pointer or focus onto a control never advances (the gate only closes).

### D-C Input split with 005 (FR-9, FR-10, FR-11, D-3)
005's wheel handler is on `window` in the capture phase and returns `'pass'` (no `preventDefault`, no `stopPropagation`) for Ctrl, `|deltaX| > |deltaY|`, or `|delta| < SNAP_WHEEL_NOISE_DELTA`. Everything else (vertical-dominant or equal) is 005's. The carousel listens on the region in the bubble phase, so it only ever sees what 005 passed or ignored, and it independently refuses vertical-dominant events with the same test, so the two cannot both act on one event.
- Wheel (`classifyCarouselWheel`, pure). Input: `{ deltaX, deltaY, ctrlKey, deltaMode, now, lastEventAt, moving }` (delta mode normalised: line x 16, page x `innerWidth`). Rules in order:
  1. `ctrlKey` -> `pass`.
  2. `|dx| <= |dy|` (tie is vertical) -> `pass`.
  3. `moving` (tween running) -> `consume`.
  4. `now - lastEventAt < CAROUSEL_WHEEL_GESTURE_GAP_MS` (same stream) -> `consume`.
  5. quiet gap and `|dx| >= CAROUSEL_WHEEL_MIN_DELTA` -> `slide` (dx > 0 next, dx < 0 prev).
  6. otherwise -> `pass` (a tiny lone horizontal event is left to the browser).
  `lastEventAt` is set on every `slide` and `consume` result. `consume` and `slide` call `preventDefault()` and `stopPropagation()`; `pass` does nothing. The listener is `{ passive: false }` on the region only, removed on cleanup. It reads no layout. Reduced motion has no `moving`, so the gap rule alone limits one slide per gesture. Shift + wheel (browsers turn it into `deltaX`) therefore also slides; that is intended.
- Swipe (`classifySwipe({ dx, dy })`, pure): `|dx| >= CAROUSEL_SWIPE_MIN_PX && |dx| >= CAROUSEL_SWIPE_AXIS_RATIO * |dy|` -> `dx < 0` next, else prev; otherwise `null`. Pointer Events on the viewport element: `pointerdown` (only `pointerType !== 'mouse'`, `isPrimary`) stores start x/y; `pointerup` classifies; `pointercancel` clears (the browser took it for vertical scrolling). Passive listeners, no `preventDefault` anywhere; the viewport has `touch-action: pan-y` (`touch-pan-y`). After a recognised swipe, `suppressClickUntil = now + CAROUSEL_SWIPE_CLICK_SUPPRESS_MS` and the card link's `onClick` calls `preventDefault()` on that click (a click event, not a touch event) so a swipe starting on a link never opens it. Mouse drag is not implemented (mouse pointers are ignored).
- Keys: React `onKeyDown` on the region. Only `ArrowLeft` / `ArrowRight`, no modifiers, not `defaultPrevented`; `preventDefault()` and `next` / `prev` with kind `'key'`. All other keys fall through untouched, so 005's `shouldHandleKey` still gets ArrowUp/Down, Home/End, PageUp/PageDown and Space (a button swallows Space natively; Space on the card link is an `a`, so 005 snaps, matching FR-10). Focus handoff: before the state change record `focusedLinkSlot = activeSlot` if `document.activeElement` is the active card link; after the commit (`useLayoutEffect` keyed on the active slot) call `linkRefs[newActiveSlot].focus({ preventScroll: true })`. Focus on a button or dot is not moved. Focus never lands on `<body>` because the old link becomes inert in the same commit that the new one becomes live.
- Navbar links, arrows and 005 keys while the pointer is on the carousel are unaffected (no listener of ours touches them).

### D-D Accessibility semantics (FR-12, FR-13, FR-14)
- Region: `<div role="region" aria-roledescription="carousel" aria-label="Projects">` containing the viewport (cards) and the controls row. Track: the grid element with a `useId` id, referenced by `aria-controls` on prev/next.
- Slide wrapper (one per pool slot): `role="group" aria-roledescription="slide" aria-label="n of N"` with n = project index + 1 (never above N). Inactive wrappers carry `inert` and `aria-hidden="true"` (belt and braces); both are removed on the active one. Inside the wrapper: the card.
- Side-card click: `inert` blocks hit-testing of its own subtree, so inactive slides render an extra sibling overlay `<div aria-hidden onClick>` (absolute, `inset-0`, `cursor-pointer`) that is not inert; it exists only for slots with `|relToTarget| === 1`. Click calls `go(relToTarget)` with kind `'side-click'` and never navigates. Visible-for-AT content stays inert.
- Live region: the track's `aria-live` is written directly on the DOM node (no React render in between): `off` right before an autoplay advance, `polite` right before any manual change, and re-synced to `polite` whenever the gate is closed (hover, focus, hidden, out of view, reduced motion, N < 2) and to `off` when autoplay is running and the last change was automatic. Writing the attribute before the content change is what lets assistive tech announce the new slide. Fallback if the manual screen-reader spot check fails: a visually hidden `role="status"` mirror ("Project n of N: title") instead of the track attribute.
- Card link: stretched-link pattern. The `h3` contains one router `<Link>` (accessible name = title text only) whose `::after` is `absolute inset-0` over the `relative` card, so the whole card is one click target, one tab stop, no nested links. The focus ring is drawn around the whole card with `has-[a:focus-visible]:outline-2 outline-focus` on the card and `focus-visible:outline-none` on the link itself. Description is a sibling `<p>` (clamped to two lines with `line-clamp-2`, full text in the DOM).
- Tab order (documented, FR-13): card link, previous, indicators (dots), next. DOM order equals visual order top to bottom, left to right (card above the controls row); screen-reader users reach the content before the controls. Dots are plain `<button>`s in a `role="group"` labelled "Choose project", with `aria-current="true"` on the active one.
- Heading order: `h2` Projects, `h3` per card.

### D-E Height-aware fit without per-frame reads (FR-3, FR-15, D-14)
Pure `computeCarouselGeometry({ regionWidth, viewportHeight, snapOn, rootPx })` in `src/lib/carouselGeometry.js` returns `{ cardW, gap, step }` (all px). Called in: a layout effect on mount (before first paint, so no flash) and from a `ResizeObserver` on the region plus a `resize` listener (height-only resizes do not change the region width). Inputs read there only: `region.clientWidth`, `window.innerHeight`, `matchMedia(SNAP_QUERY).matches` (from 005's `snapConfig.js`, so JS and CSS cannot drift) and the root font size. Output goes to CSS variables `--carousel-card-w` and `--carousel-step` on the region and to a cached `step` number used by `apply()`; the tween is not touched on resize, `apply()` just re-runs at the current `pos.v` (no stuck transition, no jump).
- Snap layout (`snapOn`): vertical budget from the section's own padding (D-F): `imgH = vh - 2 * SECTION_SAFE_BAND_PX - (HEAD + HEAD_GAP + CONTROLS + TEXT + SAFETY) * rootPx` with the chrome in rem: heading block 4.75 (eyebrow 16 + 12 + h2 up to 45 = 73 px, rounded up to 76), gap below it 1, controls row (8 px gap + 44 px buttons) 3.25, card text block 9 (padding 32 + title 2 x 28 + gap 4 + description 2 x 24 + borders 3 = 143 px), safety 0.5; total chrome 18.5 rem = 296 px at 16 px. `Wh = imgH * CAROUSEL_IMAGE_ASPECT`. Width bound `Wp = (regionWidth - 2 * CAROUSEL_GAP_MIN_PX) / (1 + 2 * CAROUSEL_PEEK_FRACTION)`. `cardW = floor(min(Wh, Wp))`. Peek rule (D-22): `sideW = CAROUSEL_SIDE_SCALE * cardW`, `halfFree = regionWidth / 2 - cardW / 2`, `peekWanted = CAROUSEL_PEEK_FRACTION * cardW`, `peekByGap = halfFree - CAROUSEL_GAP_MAX_PX`, `peek = min(sideW, max(peekWanted, peekByGap))`, `gap = halfFree - peek`. So the standard peek is 40% of the card (45.5% of the scaled side card), the peek grows only when the standard one would leave a gap above `CAROUSEL_GAP_MAX_PX` (64), and it stops at the whole side card. Consequences: `gap <= 64` unless the side cards are fully visible (then the gap is the remainder, which is at least 64), `gap >= 24` (because `cardW <= Wp`, and the grown peek only makes the gap 64), peek is at least 40% of the card (above the 15% floor).
- Below snap (`!snapOn`): width-driven, no height term. `regionWidth < 640`: peek 24 px, gap 12 px, `cardW = regionWidth - 2 * (24 + 12)` (375 -> 303, 320 -> 248). `regionWidth >= 640`: `cardW = min(640, floor((regionWidth - 48) / 1.5))` with peek fraction 0.25 in the same peek rule (gap max 64 applies, so 1440x650 gives gap 64 instead of 240). Zoom and reduced motion use the same function (the layout flag is independent of motion).
- `step = (1 + CAROUSEL_SIDE_SCALE) / 2 * cardW + gap` (centre-to-centre distance so that the edge gap is exactly `gap`).
- The card is a fixed-structure column: image frame (`aspect-ratio: 16 / 10` from the constant), then a text block with `line-clamp-2` title (`text-xl leading-7`) and `line-clamp-2` description (`text-base leading-6`). Line heights are fixed so the 143 px text budget is a true upper bound. Slides share one grid cell (`display: grid; grid-area: 1 / 1; justify-self: center; align-self: start`), so the region's height is the tallest card without any measuring.
- Fit per size (formulas above; `check:carousel` asserts these numbers, `sdd-browser` asserts the rects). `imgH = vh - 440` at 16 px root:
  | Size | imgH | Wh | Wp | cardW (image width) | sideW (x0.88) | peek (share of cardW / of sideW) | gap | FR-15 minimum |
  |---|---|---|---|---|---|---|---|---|
  | 1920x1080 | 640 | 1024 | 1040 | 1024 | 901 | 410 (40% / 45%) standard | 38 | 700 ok |
  | 1920x700 | 260 | 416 | 1040 | 416 | 366 | 366 (88% / 100%) fully visible | 386 (remainder, 752 - 366) | 400 ok (16 spare) |
  | 1440x900 | 460 | 736 | 773 | 736 | 648 | 294 (40% / 45%) standard | 58 | 700 ok (36 spare) |
  | 1366x768 | 328 | 524.8 | 732 | 524 | 461 | 357 (68% / 77%) grown | 64 | 400 ok |
  | 1280x720 | 280 | 448 | 684 | 448 | 394 | 352 (79% / 89%) grown | 64 | 400 ok |
  | 1024x768 | 328 | 524.8 | 542 | 524 | 461 | 210 (40% / 45%) standard | 40 | 400 ok |
  | 1024x700 | 260 | 416 | 542 | 416 | 366 | 240 (58% / 66%) grown | 64 | 400 ok (16 spare) |
  | 375x812 (below snap) | - | - | - | 303 | - | 24 (narrow rule) | 12 | peek at least 12 ok |
  Worked example, 1280x720: `halfFree = 640 - 224 = 416`; `peekWanted = 179.2`; `peekByGap = 416 - 64 = 352`; `peek = min(394.2, max(179.2, 352)) = 352`; `gap = 416 - 352 = 64`. Worked example, 1920x700: `halfFree = 960 - 208 = 752`; `peekByGap = 688`; `peek = min(366.1, 688) = 366.1` (side card fully visible, not cut by the edge); `gap = 752 - 366.1 = 385.9`; at this window the three cards total 1148 px of the 1920 px, so a gap above 64 is unavoidable once the cards are whole.
  The 16 px of spare at the two 700 px heights is the tightest number in the spec. If `sdd-browser` measures the real chrome above 296 px, the lever is `CAROUSEL_TEXT_REM` (drop to a one-line title) or the gap/eyebrow sizes, not a spec change. Card text over budget is impossible because of the clamps.
- Controls row is inside the budget, below the card: `[prev] [dots or counter] [next]`, `flex flex-wrap justify-center gap-2`, 44 px high. It wraps only when many dots meet a very narrow window (below snap, where growth is allowed).

### D-F Section layouts and the safe bands (FR-19, FR-20, FR-21, FR-26, FR-29, FR-30, D-17)
Shared: `src/lib/sectionLayout.js` exports `SECTION_SAFE_BAND_PX = SECTION_ARROW_OFFSET_PX + SECTION_ARROW_SIZE_PX + SECTION_ARROW_CLEARANCE_PX` (16 + 44 + 12 = 72, imports 005's `arrowConfig.js`), `ABOUT_IMAGE_ASPECT = 4 / 5`, `ABOUT_IMAGE_MAX_REM = 32`, and `safeBandStyle = { '--safe-band': '72px' }`. Each of the four sections spreads `safeBandStyle` into its `style` and uses `snap:min-h-svh snap:py-(--safe-band) snap:content-center` in place of `py-16 md:py-24` at snap sizes (the old padding classes stay for the non-snap layout). Content is vertically centred inside the band-padded box, so it cannot enter either band when it fits, and the section grows rather than clips when it does not (005 FR-17). Section h2 uses `text-4xl sm:text-5xl snap:text-4xl` in all four sections (45 px line at snap sizes; builder verifies Tailwind orders `snap:` after `sm:` in the built CSS). Available content height at snap sizes: `A = vh - 144` = 556 (700), 576 (720), 624 (768), 756 (900), 936 (1080).
- Projects: grid, one column. The heading (eyebrow, `h2`) sits in a normal `mx-auto max-w-5xl px-4 sm:px-8` container; the intro line is dropped (budget). The carousel region follows full-bleed (`w-full`), wrapped in a `data-reveal` div. Fit: by construction (D-E) the sum is `A - 8` at every size.
- About: grid `md:grid-cols-[1fr_auto]`, gap 12; left column heading block (eyebrow, `h2`) then two bio paragraphs (`text-base`, `snap:text-base`) then the facts `dl` (`sm:grid-cols-3`); right column the image frame, `aspect-ratio: 4 / 5`, `object-cover`, `height: min(100svh - 144px - 0.5rem, 32rem)` at snap sizes (width follows from the ratio), `w-full max-w-xs` and image above text below `md`. Fit: image 512 px high at every test height (all A are at least 556); text column at 1024 wide is about 502 px wide: heading 73 + 24, two 3-line paragraphs 144 + 16, facts 25 + up to 92 = about 399 px against 556 (157 px spare, roughly six more lines of bio; the data comment tells the owner to keep the two paragraphs under about 600 characters).
- Tech Stack: heading block (eyebrow, `h2`, no intro) above `md:grid-cols-3` categories. Each category: `h3` (`text-lg leading-7`, `mb-2`) plus a `ul` of tiles; tile = `flex items-start gap-3 border-b border-line py-1.5` with a 40 px square icon slot (`size-10 shrink-0`) and a text block (name `text-base leading-6`, `use` `text-base leading-6 snap:text-sm snap:leading-5`). Worst case (5 tools, 40-character `use` wrapping to two lines in a 246 px text column at 1024 wide): tile 12 + max(40, 24 + 40) + 1 = 77 px, 5 tiles 385, `h3` 36, heading block plus gap 89: total 510 px against 556 at 1024x700 (46 spare); a name that wraps to two lines adds 24 and still fits (534). At 16 px `use` the total would be 562, so the 14 px line at snap-active sizes is the owner-approved exception D-23 (16 px below the snap layout; computed font size verified in AC-20).
- Contact: section `flex flex-col`, `snap:min-h-svh snap:pt-(--safe-band)`, no bottom padding. Form area `flex flex-1 items-center` (centred in the remaining height); footer `shrink-0` last. From `md`: two columns, left eyebrow + `h2` + intro (about 157 px), right the form. Form heights (16 px gaps): name 28 + 44, email 28 + 44, message 28 + textarea (4 rows x 24 + 16 + 2 = 114), actions row 44 (button, with the status text beside it, wrapping to two lines = 48): 378 without errors; each error is `mt-1` 4 + 24, so 462 with three, 466 with a two-line status. Footer: 1 px rule + `py-2` + 44 px links = 61 px, flush with the viewport bottom (its bottom edge is 0 px from it, limit 40). Form area at 1024x700 = 700 - 72 - 61 = 567 against 466 worst case (101 spare); at 1080 it is 947.
- Footer element: a `<footer>` that is a descendant of `section#contact`. By HTML-AAM a `footer` inside sectioning content (here `section`) has no `contentinfo` role, so there is no second landmark; no explicit role is set. Checked in the accessibility tree by `sdd-browser` (AC-25). Footer link group is `ul` with `aria-label="Social links"`.
- Reveal targets (cap 8, issue 6): Projects eyebrow, carousel wrapper; About eyebrow-block, paragraph block, facts, image wrapper; Tech eyebrow-block, 3 categories; Contact intro block, form block. The carousel container is one block; no slide, track or side card ever gets `data-reveal`.

### D-G Project data, routes and not-found (FR-1, FR-17, FR-18)
- `src/data/projects.js`: `export const projects = [...]` and `export function getProjectBySlug(slug)` (`projects.find(p => p.slug === slug)`, exact, case-sensitive). Single source for `Projects.jsx` / carousel and `ProjectPage.jsx` (AC-2 greps that no second list exists). Entries keep the existing titles and descriptions with slugs `project-one`, `project-two`, `project-three`, no `kind`, no `image`. A commented example shows the image import and the required `// Provenance:` line.
- Routes in `App.jsx`: `<Route path="/projects/:slug" element={<ProjectPage />} />`. Eager import (the page is tiny and has no heavy dependency). React Router matches a trailing slash. No catch-all route (non-goal). `ProjectPage` looks the slug up; no match renders `ProjectNotFound` (`h1` "Project not found", a short message, the back link) with no console output. Found: `h1` title, `<p>Details coming soon.</p>`, back link. Back link `<Link to="/#projects">` (href `/#projects`), styled like the navbar items (`min-h-11`, hover, focus-visible, active). The `h1` has `tabIndex={-1}` and is focused on mount with `{ preventScroll: true }` (route-change focus; outline suppressed on the h1 only). Layout `mx-auto max-w-5xl px-4 sm:px-8 py-16`, tokens only, no canvas, arrows or footer. Vite dev server and `vite preview` serve `index.html` for these paths (SPA fallback); a static host needs a rewrite rule (risk).
- `RouteScrollReset` (new, mounted in `App.jsx` next to `ScrollToHash`): on a pathname change with navigation type `PUSH` and no hash, scroll to 0 before paint: `lenis?.scrollTo(0, { immediate: true, force: true })` and `window.scrollTo(0, 0)` (reduced motion has no Lenis). With a hash it does nothing (ScrollToHash and 005's `scrollToSection` own that path: navbar Projects / About / Contact and the back link use the 005 scroll function, snap animation with snapping, Lenis `scrollTo` otherwise, instant with reduced motion). `POP` (browser Back) is left to the browser; 005's settle then rests the page on a section; the carousel remounts at project 0 because its state is local.
- ScrollToHash is unchanged by 006. 005 deactivates `SnapScroller` when `pathname !== '/'`, so there is no snapping or arrow on project pages.

### D-H Project card (FR-2, FR-14)
`ProjectCard` renders: image frame (`aspect-ratio` from `CAROUSEL_IMAGE_ASPECT`, `overflow-hidden` on the frame only, `border-b border-line`); `img` with `object-cover`, `width`/`height` from data, `alt`, `loading="lazy"`, `decoding="async"`; on missing image or `onError` (local state) the existing gradient placeholder (`aria-hidden`, same frame, no shift). Image hover zoom is `motion-safe:group-hover:scale-105` inside the frame. Title `h3` with the stretched link, optional description. Card: `group relative flex flex-col border border-line bg-surface`, `hover:border-accent` for the active card only (inactive cards get no hover state, the overlay shows `cursor-pointer`).

### D-I Data modules and dev-time validation (FR-1, FR-20, FR-27, NFR-4)
- Shapes:
  - `projects`: `{ slug: string, title: string, description?: string, image?: { src, alt, width, height } }`.
  - `techStack`: `[{ id, label, tools: [{ id, name, icon?, use?, tint? }] }]`. Default: Modeling (Blender, Placeholder tool), Game Dev (Unity), Web (Three.js, React); no `icon` on any tool yet (importing a missing file would fail the build). Each tool entry has a `// Provenance:` / trademark comment line; a commented example shows `import blenderIcon from '../assets/tech/blender.svg'` and `icon: blenderIcon`, `tint: true`.
  - `socialLinks`: `[{ id, label, url, icon }]` with `icon` imported from `src/assets/icons/github.svg` / `itchio.svg`, URLs `https://github.com/` and `https://itch.io/` with the comment `PLACEHOLDER, replace with real profile URL`.
  - `src/data/about.js`: `export const aboutImage = null` (shape `{ src, alt, width, height }`) with a commented example and provenance rule. Bio and facts stay in `AboutMe.jsx` (text unchanged).
- `src/lib/dataValidation.js` (pure): `validateProjects(list)`, `validateTechStack(list)`, `validateSocialLinks(list)`, `validateImage(img)`, `checkProvenanceComments(sourceText, pattern)`. Rules: slug matches `^[a-z0-9]+(-[a-z0-9]+)*$` and is unique; title non-empty after trim; image has non-empty `src`, non-empty `alt`, positive integer `width` and `height`; tech ids unique across all categories, `name` non-empty, `use` a string; social `url` starts with `https://`, labels non-empty. `checkProvenanceComments` requires that every non-comment source line containing `image:` / `icon:` / a `.svg` or image `import` has a line matching `/provenance/i` directly above it (scratch test AC-2, AC-20).
- Dev-time check = `npm run check:carousel` (loads the real data modules through `scripts/lib/loadDataModule.mjs`, which rewrites `import x from '...(svg|png|jpg|jpeg|webp)'` to a stub constant so Node can import them) plus a DEV-only `console.error` in `Projects.jsx` if `validateProjects` returns errors (never fires on valid data).
- Components read data only through these modules; no URL, tool name or project title is typed in a component (AC-20, AC-26 source searches).

### D-J Icons and masks (FR-7, FR-20, FR-27, D-13)
Same technique as 005 D-F: a CSS mask tints a plain SVG with `currentColor`, no SVGR, no dependency. 006 adds its own generic class so it does not depend on the arrow-specific `.arrow-icon`: in `src/index.css`, `.icon-mask { display: inline-block; background-color: currentColor; mask-image: var(--icon-url); mask-repeat: no-repeat; mask-position: center; mask-size: contain; }` (Lightning CSS adds the `-webkit-` prefixes). A tiny shared component `IconMask({ src, className })` renders `<span aria-hidden="true" className="icon-mask ..." style={{ '--icon-url': `url("${src}")` }} />`. Consumers: carousel prev/next, GitHub, itch.io, and tech logos with `tint: true`. Mask uses the alpha of the SVG, so only shape matters (as the spec asset table says), hover and focus colours flow through `currentColor`, and replacing a file with the same name changes the icon with no JSX edit. Tech logos without `tint` are plain `<img src alt="" loading="lazy">` in the 40 px slot with `object-contain`, so multicolour logos keep their colours; a tool without `icon` uses `placeholder.svg` through the same `IconMask` (placeholder is `currentColor`, `text-muted`). SVGs are only referenced as URLs, never inlined (NFR-6). Placeholder glyphs are generic (chevrons, a ring, a rounded square), each with an XML comment `PLACEHOLDER, replace with owner SVG`, no `width`/`height` attributes.

### D-K Contact form (FR-22 to FR-25, D-9, D-15, D-20)
- Structure: `<form noValidate onSubmit>` with no `action` or `method`. Three uncontrolled fields with fixed ids `contact-name`, `contact-email`, `contact-message`, each `<label htmlFor>` visible above the control; a message error element id `${id}-error`. Name: `type="text" autoComplete="name" required`; email: `type="email" autoComplete="email" inputMode="email" required`; message: `<textarea rows={CONTACT_MESSAGE_ROWS} maxLength={CONTACT_MESSAGE_MAX_LENGTH} required autoComplete="off" className="resize-none">`. Controls `min-h-11`, `text-base` (16 px, no mobile zoom), `w-full`, `bg-surface text-text border border-rim/50` (the rim colour at 50% on `ink` is about 5.2:1, above 3:1 for a UI boundary), `focus:border-accent`, plus the global focus ring. Invalid: `aria-invalid:border-error aria-invalid:shadow-[inset_0_0_0_1px_var(--color-error)]` (thicker border without layout shift; this replaces the rim border).
- Validation (`contactValidation.js`, pure): `fieldMessage(field, validity, value)` where `validity` is the element's `ValidityState` (or a fake in Node). Order: `value.trim() === ''` or `validity.valueMissing` -> "Enter your name." / "Enter your email address." / "Write a message."; email `typeMismatch` -> "Enter a valid email address."; message `tooLong` -> "Keep your message under 2000 characters."; otherwise `null`. The browser supplies the native checks (`required`, `type=email` so `a@` and `a b` fail, `maxlength`); the trim rule covers whitespace-only. No `setCustomValidity`; messages live in the DOM.
- Behaviour: component state `{ errors, attempted, status }`. Submit: `preventDefault()`, `attempted = true`, validate all three; any error -> set `errors`, `status = 'idle'`, `focus()` the first invalid field (browser focus scroll only); no error -> `status = 'notConnected'`. After the first attempt, each field re-validates in `onInput` and `onBlur`; the error clears when valid and returns when invalid again. Any `onInput` in any field sets `status = 'idle'` (hides the message). Invalid field: `aria-invalid="true"` and `aria-describedby={errorId}`; valid: neither attribute. Error element: `<p id class="text-error">` with a small `aria-hidden` "!" ring (text glyph in a bordered circle using `border-error`/`text-error`) and the message text. No `role="alert"`; no live region on errors (focus move plus `aria-describedby` carry them).
- Not-connected state: a `<p role="status">` is always in the DOM (so the live region exists before it is filled) and holds "This form is not connected yet. Nothing was sent." only when `status === 'notConnected'`; neutral styling (`text-muted`, no success colour or wording); sits beside the submit button; no animation at all (so identical under reduced motion). Field values stay (uncontrolled inputs). The button is never disabled.
- No network guarantee: the form module contains no `fetch`, `XMLHttpRequest`, `sendBeacon`, `mailto:`, `window.open`, `location` assignment or `action`. `check:carousel` greps the contact files for those strings; DEV spies and the browser network log verify at runtime (AC-23). Submit with Enter in a field fires the same `submit` handler.
- Nested scroller marker (D-15): `ContactForm` syncs `textarea.toggleAttribute('data-lenis-prevent', textarea.scrollHeight > textarea.clientHeight + 1)` from the textarea's `onInput` and from a `ResizeObserver` on it (never from a wheel handler), and once after mount. 005's capture handler reads the marker at event time, Lenis honours it when snapping is off. Keys typed in fields never move the page because 005's `shouldHandleKey` skips `input`/`textarea` targets.

### D-L Error colour token and navbar breakpoint (D-20, FR-28)
- Token: `--color-error: #e8707e;` in the existing `@theme` block, with the comment `error: #e8707e. Contrast: 6.36:1 on surface (#0b1020), 6.76:1 on ink (#05070d). Text needs 4.5, border and icon need 3. Form validation states only.` Used as `text-error`, `border-error`, `shadow-[...var(--color-error)]`, nowhere else.
- Why this value: a muted coral-rose, not an alarm red: R 232, G 112, B 126 sits next to the cool `accent` (#7fe3ff) without clashing and stays well apart from `rim` white. Lightness is mid-range on purpose; the minimum luminance that still meets 4.5:1 on `surface` is 0.2, this value has 0.3025, so it passes with margin and does not glare.
- Maths (WCAG 2.x relative luminance, `c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`):
  - `#e8707e`: R 232/255 = 0.9098 -> 0.8070; G 112/255 = 0.4392 -> 0.1620; B 126/255 = 0.4941 -> 0.2086. `L = 0.2126*0.8070 + 0.7152*0.1620 + 0.0722*0.2086 = 0.1716 + 0.1159 + 0.0151 = 0.3025`.
  - `ink #05070d`: R 0.0015, G 0.0021, B 0.0040 -> `L = 0.00032 + 0.00152 + 0.00029 = 0.00213`.
  - `surface #0b1020`: R 0.0033, G 0.0052, B 0.0144 -> `L = 0.00071 + 0.00371 + 0.00104 = 0.00546`.
  - Ratio on ink `(0.3025 + 0.05) / (0.00213 + 0.05) = 0.3525 / 0.05213 = 6.76`. Ratio on surface `0.3525 / 0.05546 = 6.36`.
  - Thresholds: text 4.5 (6.36 and 6.76 pass); border and icon 3.0 (pass). The default input border `rim` at 50% on ink: blended channel `0.5*255 + 0.5*5 = 130` gives `L` about 0.22 and ratio about 5.2 (above 3).
  `scripts/check-contrast.mjs` parses `--color-*` from `src/index.css`, recomputes all of this, and also asserts `muted` and `text` on `ink` and `surface` at least 4.5 and `focus` on `ink` at least 3 (the footer, tiles and card text rely on them).
- Navbar breakpoint decision (FR-28): `NAV_MENU_BREAKPOINT_PX` stays 640 unless measured slack is under 40 px. Prediction from 005's numbers: Contact item = 7 characters at about 10.4 px + `px-3` 24 = about 97 px; 005 measured about 146 px of slack, so about 49 px remains. Process, run by `sdd-browser` after the link exists: at 640x900 read `brand.offsetWidth`, `linkGroup.offsetWidth` (negative margin bleed included), the `gap-x-4` (16) and the nav horizontal padding (64) and compute `slack = 640 - (padding + brand + 16 + links)`; check one row (all items share `offsetTop`) and `scrollWidth <= innerWidth` at 640, 641, 1024, 1280, 1920 and the toggle at 639. If `slack >= 40` keep 640 and record the numbers in `specs/006-sections-carousel-contact/measurements.md`. If under 40 set the constant to 768 in 005's `navConfig.js` and repeat at 767, 768, 769.

### D-M Reduced motion, below-snap and StrictMode (FR-33, FR-34, NFR-2)
- Reduced motion: no autoplay timer exists, slide changes instant (`pos.v = target`), no reveals (existing hooks), no form animation, no new content-moving transitions (hover zoom is `motion-safe:`). The full-screen layouts and the carousel geometry still follow `matchMedia(SNAP_QUERY)`, not motion. Runtime toggle handled by the reactive hook (D-B).
- Below snap: normal flow, no height term (D-E), About image above text, categories stacked, form full width, footer ends the page, no arrows (005).
- StrictMode: every effect pairs add/remove; GSAP tween killed with `gsap.killTweensOf(pos)` in cleanup; DEV counters in `window.__carouselInfo()` (`{ n, pool, target, pos, activeSlot, activeProject, gate, paused: [...], timers, listeners, observers, live, advances: [{ t, kind }], reducedMotion }`) support AC-8, AC-9, AC-10, AC-32. Counters and the hook exist only under `import.meta.env.DEV`.
- Performance: no layout read in `apply()`, the tween `onUpdate`, the wheel handler, pointer handlers or the timer; reads only in the layout effect, `ResizeObserver`, `resize`, `IntersectionObserver` and input callbacks. Motion is `transform`/`opacity` only (plus the discrete `visibility` flip).

## Tunable constants (final values and reasons)
One commented module per group: `carouselConfig.js` (carousel), `sectionLayout.js` (layout bands, About), `contactConfig.js` (form), `navConfig.js` (005, one constant). All pure JS.
| Constant | Value | Why |
|---|---|---|
| `CAROUSEL_AUTOPLAY_MS` | 5000 | Spec. Long enough to read a title and description, short enough to feel alive. |
| `CAROUSEL_TRANSITION_S`, `CAROUSEL_EASE` | 0.6, `power3.out` | Decelerating and quicker than 005's 1.0 s section move so the two do not feel alike; retargets cleanly under rapid input. |
| `CAROUSEL_SIDE_OPACITY` | 0.4 | Spec "about 0.4". Dim but still legible; returned exactly at `|rel| = 1`, so computed opacity is 0.4 (limit "at most 0.4"). |
| `CAROUSEL_SIDE_SCALE` | 0.88 | Makes the centre card clearly larger (12%) without shrinking side text much; also keeps the peek share against the scaled width at 45.5%, under 50%. |
| `CAROUSEL_IMAGE_ASPECT` | 16 / 10 | Spec. |
| `CAROUSEL_VISIBLE_RATIO` | 0.5 | Spec. IntersectionObserver threshold list includes it. |
| `CAROUSEL_SWIPE_MIN_PX`, `CAROUSEL_SWIPE_AXIS_RATIO` | 40, 1.5 | Spec. 40 px is above touch slop (about 10 px), so a tap is never a swipe; 1.5 rejects diagonal scrolls. |
| `CAROUSEL_SWIPE_CLICK_SUPPRESS_MS` | 400 | Covers the synthetic click that some browsers still send after a short pen/touch drag; longer than any click delay. |
| `CAROUSEL_WHEEL_MIN_DELTA` | 20 | Trackpad horizontal streams start with 1 to 5 px events and reach well above 20 within two events; a horizontal mouse notch is 100 to 120. 20 ignores lateral jitter while a user scrolls vertically. |
| `CAROUSEL_WHEEL_GESTURE_GAP_MS` | 120 | Trackpad and inertia tail events arrive every 8 to 50 ms; a tilt-wheel notch repeats no faster than about 100 ms. 120 ms (above 005's 100) separates streams without merging two deliberate notches. |
| `CAROUSEL_MAX_DOTS` | 10 | Spec. 10 x 44 px = 440 px fits the 960 px content width. |
| `CAROUSEL_MIN_POOL` | 4 | Smallest pool whose wrap point is inside the hidden zone (D-A). |
| `CAROUSEL_PEEK_FRACTION` | 0.4 | Standard peek: 40% of the card (45.5% of the scaled card), 25 points above the 15% floor. It is the minimum; D-22 lets the peek grow. |
| `CAROUSEL_GAP_MAX_PX` | 64 | D-22. Four times the 16 px base gutter and under three times `CAROUSEL_GAP_MIN_PX`; wide enough that cards still read as separate, small enough that the row looks like one band. Standard peek already gives 38 to 58 px at 1920x1080 and 1440x900, so those sizes are unchanged. |
| `CAROUSEL_GAP_MIN_PX` | 24 | Gutter between cards at the tightest snap fit (1024x768 gives 40). |
| `CAROUSEL_CHROME_REM` | head 4.75, head gap 1, controls 3.25, text 9, safety 0.5 | Derived from fixed line heights (D-E); sums to 18.5 rem = 296 px. |
| Below-snap: narrow peek / gap / width cutoff | 24 px / 12 px / 640 px | Peek at 375 is 24 (limit 12); 640 matches the navbar breakpoint family. |
| Below-snap: wide fraction / max card | 0.25 / 640 px | Keeps the card readable at 640 to 1023 wide without a huge image. |
| `ABOUT_IMAGE_ASPECT` | 4 / 5 | Spec. |
| `ABOUT_IMAGE_MAX_REM` | 32 | 512 px high at most; leaves about 500 px of text column at 1024 wide. |
| `SECTION_ARROW_CLEARANCE_PX` | 12 | Spec D-17 (16 + 44 + 12). |
| `SECTION_SAFE_BAND_PX` | 72 (derived) | Equals the arrow offset plus size plus clearance; asserted in `check:carousel`. |
| `CONTACT_MESSAGE_MAX_LENGTH` | 2000 | Spec. About 350 words; ample for an enquiry and still a short paste. |
| `CONTACT_MESSAGE_ROWS` | 4 | 114 px; keeps the form inside the Contact budget with errors shown (D-F). |
| `--color-error` | `#e8707e` | D-L (6.36:1 on surface, 6.76:1 on ink). |
| `NAV_MENU_BREAKPOINT_PX` (005) | 640, 768 only if slack < 40 | D-L (predicted slack about 49). |

## Files to create/modify
Create (no 005 file involved unless stated):
- Pure libs: `src/lib/carouselConfig.js`, `src/lib/carouselLogic.js`, `src/lib/carouselGeometry.js`, `src/lib/sectionLayout.js` (imports 005 `arrowConfig.js`), `src/lib/dataValidation.js`, `src/lib/contactConfig.js`, `src/lib/contactValidation.js`
- Data: `src/data/projects.js`, `src/data/techStack.js`, `src/data/socialLinks.js`, `src/data/about.js`
- Hook: `src/hooks/useCarousel.js`
- Components: `src/components/IconMask.jsx`, `src/components/projects/ProjectCarousel.jsx` (empty state plus view), `src/components/projects/ProjectCard.jsx`, `src/components/projects/CarouselControls.jsx`, `src/components/tech/TechCategory.jsx`, `src/components/sections/Contact.jsx`, `src/components/contact/ContactForm.jsx`, `src/components/contact/ContactFooter.jsx`, `src/components/RouteScrollReset.jsx`, `src/components/ProjectNotFound.jsx`, `src/pages/ProjectPage.jsx`
- Assets: `src/assets/icons/carousel-prev.svg`, `carousel-next.svg`, `github.svg`, `itchio.svg`; `src/assets/tech/placeholder.svg`, `src/assets/tech/README.md`; `src/assets/img/README.md` (the `src/assets/img/projects/` folder is documented there; no image is added)
- Scripts: `scripts/check-carousel.mjs`, `scripts/check-contrast.mjs`, `scripts/lib/loadDataModule.mjs`
- Notes: `specs/006-sections-carousel-contact/measurements.md` (navbar slack, fit rects, AC-34 numbers; written by measurement tasks)
Modify:
- `src/index.css`: `--color-error` in `@theme`, `.icon-mask` class (005 owns this file too, see Dependencies on 005)
- `src/components/sections/Projects.jsx`, `AboutMe.jsx`, `TechStack.jsx`: full rewrite keeping `id`, `aria-labelledby`, `data-snap-section`, `data-snap-label`, `tabIndex={-1}`, `outline-none` exactly as 005 T-16 leaves them (005 owns these files)
- `src/pages/HomePage.jsx`: add `<Contact />` after `<TechStack />` and before `<SectionArrows />` (005 owns)
- `src/App.jsx`: `/projects/:slug` route, mount `RouteScrollReset` (005 owns)
- `src/components/Navbar.jsx`: Contact link after About in the desktop row and the mobile menu (005 owns)
- `src/lib/navConfig.js`: only if D-L requires 768 (005 owns)
- `src/assets/icons/README.md`: add the four new files (005 T-24 creates it)
- `package.json`: scripts `check:carousel`, `check:contrast` only; dependencies unchanged
Not touched: `snapController`, `snapInput`, `snapSettle`, `snapMath`, `SectionArrows`, `SmoothScrollProvider`, `ScrollToHash`, `useSectionReveal`, `SplitHeading`, Hero, all of `src/three/`.

## Data / interfaces
- `carouselLogic.js`: `poolSize(n)`, `wrapSigned(x, period)`, `slotRel(slot, pos, pool)`, `slotStyle(rel, cfg) -> { x, scale, opacity, visible }` (x in step units), `activeSlot(target, pool)`, `activeProject(target, n)`, `shortestDelta(from, to, n)`, `goTarget(target, action, n)`, `classifyCarouselWheel(input) -> 'slide-next' | 'slide-prev' | 'consume' | 'pass'`, `classifySwipe({ dx, dy }) -> 'next' | 'prev' | null`, `autoplayAllowed(flags) -> boolean`, `liveModeFor({ autoplayRunning, lastChangeManual }) -> 'off' | 'polite'`.
- `carouselGeometry.js`: `computeCarouselGeometry({ regionWidth, viewportHeight, snapOn, rootPx }) -> { cardW, gap, step }`.
- `useCarousel({ projects, regionRef, viewportRef, trackRef })` returns `{ activeSlot, activeProject, pool, slotRefs, linkRefs, next, prev, goProject, goRelative, onKeyDown, onLinkClick }`. It owns the tween, timer, observers, listeners and DEV hook.
- CSS variables on the carousel region: `--carousel-card-w`, `--carousel-step`. On sections: `--safe-band`.
- `IconMask({ src, className })`; data module exports as in D-I; `getProjectBySlug(slug)`.
- `validateX(list) -> string[]` (empty = valid). `fieldMessage(field, validity, value) -> string | null`.

## Dependencies
npm: none added (spec NFR-3). Everything is met by React, react-router-dom, GSAP (tween, already used), `IntersectionObserver`, `ResizeObserver`, Pointer Events, `matchMedia`, CSS masks, `inert`, `:has()`, `overflow-x: clip`, `line-clamp`. No carousel, form, validation or icon library: the carousel is about 250 lines of pure logic plus one hook, and a library would not know 005's wheel contract.

## Dependencies on 005
Names are 005 task IDs from `specs/005-scroll-snap-hero-navbar/tasks.md`. "Browser verification" always needs the stated tasks `[~]` or better, because 006 layouts rely on `snap:` and the snap controller.
| 006 step (Order of work) | Must wait for | Why | Start early? |
|---|---|---|---|
| W-01 Pure libs `carouselConfig`, `carouselLogic`, `carouselGeometry`, `dataValidation`, `contactConfig`, `contactValidation`, `check-carousel.mjs`, `loadDataModule.mjs`, `package.json` scripts | `snapConfig.js` (T-02, exists) for `SNAP_QUERY` in the geometry caller only | pure, Node-tested | YES, now. `package.json` needs only the two script lines (005 finished its script edits in T-02/T-04). |
| W-02 `sectionLayout.js` | T-05 (`arrowConfig.js`, exists) | imports arrow constants | YES |
| W-03 Data modules `projects`, `techStack`, `socialLinks`, `about` | none | pure data (asset imports for icons point at W-05 files) | YES |
| W-04 `check-contrast.mjs` | none (reads `index.css`; the token is added in W-06) | pure script | YES |
| W-05 Placeholder SVGs, `src/assets/tech/*`, `src/assets/img/README.md`, tech README | none (new files). The `src/assets/icons/README.md` extension waits for T-24. | no 005 task writes these | YES, except the icons README (after T-24) |
| W-06 `index.css` (`--color-error`, `.icon-mask`) | T-15 (`snap:` variant, `--nav-h`) and T-24 (`.arrow-icon`); also T-32 if still pending (`.hero-moon-float`) | 005 edits this file in T-15, T-24 and T-32; edits must not overlap in time | NO, schedule between 005 builder runs |
| W-07 Leaf components and hook: `IconMask`, `useCarousel`, `ProjectCarousel`, `ProjectCard`, `CarouselControls`, `TechCategory`, `ContactForm`, `ContactFooter`, `Contact` (section file), `ProjectPage`, `ProjectNotFound`, `RouteScrollReset` | none for writing (new files; `snap:` classes are inert until T-15). Browser checks wait for T-15 and W-06. | no 005 file is edited | YES to write; verify after T-20 |
| W-08 Rewrite `Projects.jsx`, `AboutMe.jsx`, `TechStack.jsx` | T-16 (markers and `snap:` sizing) | same files; must keep T-16's attributes | NO |
| W-09 `HomePage.jsx` adds `<Contact />` | T-25 (mounts `SectionArrows`; `HomePage` then final) | same file | NO |
| W-10 `App.jsx` route and `RouteScrollReset` mount | T-20 (mounts `SnapScroller` in `App.jsx`) | same file | NO |
| W-11 Navbar Contact link (desktop and menu) | T-29 (mobile menu wiring; T-27 link removal and T-17 `--nav-h` precede it) | same file, structure final only after T-29 | NO |
| W-12 Breakpoint measurement and, if needed, `navConfig.js` 768 | T-29 (and T-28 created `navConfig.js`) | 005 file | NO |
| W-13 Browser verification of fit, safe bands, snap contract, arrows, deep links | T-20 (snapping), T-21 (`scrollToSection`), T-25 (arrows), T-29 (menu) | needs the real controller | NO |
| W-14 Final regression (AC-33) | T-37 (005 complete, `baseline.md` written) | re-runs 005 ACs with five sections | NO |
Safe-start summary: W-01 to W-05 and the file-writing part of W-07 are independent of every unfinished 005 task and can proceed now. Anything that edits `index.css`, `Projects.jsx`, `AboutMe.jsx`, `TechStack.jsx`, `HomePage.jsx`, `App.jsx` or `Navbar.jsx` waits for the task listed. The dev server shows the carousel and form before T-15 in the flow layout, but `sdd-browser` fit checks must wait for W-13's prerequisites.

## Risks
- Fit margins at 700 px heights: 16 px spare for the Projects card image (D-E) and 46 px for Tech Stack. A real measurement above budget breaks FR-15 or AC-3. Mitigation: all line heights are fixed and clamped, so the budget is an upper bound; the named levers are the chrome rem values in `carouselConfig.js`; `check:carousel` fails if any test size drops below 400 / 700.
- Wide, short windows (issue 4, resolved by D-22): at 1920x700 the side cards are fully visible and the gap is still 386 px because the three whole cards occupy only 1148 px of 1920 px. Mitigation: accepted by the owner's "up to fully visible" rule; a larger centre card is the only other lever (more height budget).
- Pointer and wheel behaviour on real hardware (macOS inertia, Windows precision touchpads, tilt wheels, iOS and Android swipes). The pure classifiers are script-tested with synthetic streams; constants are named for tuning; a manual pass is on the owner checklist.
- `inert` hit-testing: the side-card overlay approach depends on the overlay being a sibling outside the inert subtree (D-D). Verified by clicking a side card in `sdd-browser`.
- Screen-reader announcement with a toggled-hidden slide under `aria-live` is the APG pattern but engine-dependent. Mitigation: live attribute written before the content change; fallback `role="status"` mirror (D-D). Manual spot check required (AC-16).
- Focus-visible heuristic (issue 3, resolved by D-21): browser heuristics for script `.focus()` differ. Mitigation: tests use Tab and real clicks; `__carouselInfo().paused` shows the reason; a focus set by script right after a mouse click counts as not focus-visible (correct per D-21).
- `snap:text-4xl` versus `sm:text-5xl` precedence in Tailwind 4: builder checks the built CSS order; fallback is an arbitrary variant `[[data-snap-layout=on]_&]:text-4xl`.
- `overflow-x: clip` with `overflow-y: visible` needs evergreen browsers (spec lists them). A fallback is not provided.
- Trademark and licence for tech logos (owner supplies; provenance and trademark comments required in the data module).
- Static hosting needs an SPA rewrite for `/projects/:slug` reloads; dev and `vite preview` already work (AC-18). Deployment config is out of scope.
- Form network guarantee relies on never adding a call: greps in `check:carousel` plus DEV spies; a future backend spec will replace the handler.
- Parallel 005 build: the six shared files change under 006's feet. Mitigation: the dependency table; 006 rewrites keep 005's markers verbatim and `check:carousel` greps the five `data-snap-label` values and the section order in `HomePage.jsx`.
- Contact textarea marker toggling happens on input, resize and mount only; a programmatic value change without an `input` event (autofill that skips it) would leave a stale marker until the next resize. Acceptable; autofill dispatches `input`.
- GSAP reveals plus the carousel's own tween: they never share an element (reveal on the wrapper div, tween on slide wrappers).

## Test strategy (maps to AC-n)
Legend: S = Node script, G = grep or code inspection, B = `sdd-browser` (dev server, emulation, screenshots, console, network, evaluated scripts, `window.__carouselInfo()` and `window.__snapInfo()`), M = manual by the owner.
New scripts (no test framework in the repo):
- `npm run check:carousel` (`scripts/check-carousel.mjs`, `node:assert`, one pass line per case): config sanity (autoplay 5000, side opacity 0.4, `SECTION_SAFE_BAND_PX` = arrow offset + size + 12 = 72); `poolSize` for n = 0..12 and the wrap rule (`pool/2 >= 2` for n >= 2); for n = 1, 2, 3, 4, 5, 10, 11 and a sweep of `pos` from 0 to 2*pool in steps of 0.05: exactly one slot with `|rel| < 0.5`, the slots at `rel = -1` and `+1` exist whenever n >= 2 at integer `pos`, no two slots at the same rel, hidden slots have `opacity 0` and `visible` false, `slotStyle(±1).opacity === 0.4`; loop simulation: 3n next presses from target 0 end at project `3n mod n`, prev from the first shows the last, `shortestDelta` table including ties; rapid-press model (target changes by exactly the number of presses); geometry at the seven test sizes plus 375x812 and 320x568 and a sweep of widths 1024 to 2560 at heights 700 to 1080: image width >= 400 (>= 700 at 1920x1080 and 1440x900), peek >= 15% of the card and <= the scaled side width, `gap <= 64` unless peek equals the scaled side width, `gap >= 24`, peek >= 12 at 375, the table values of D-E (1920x700: peek 366.1 and gap 385.9; 1280x720: peek 352 and gap 64), section sum (chrome + image + bands) <= vh; `classifyCarouselWheel` streams: a decaying 60-event horizontal stream over 1.5 s gives one `slide-*` and the rest `consume`, a second gesture after 150 ms quiet gives one more, a vertical stream and a diagonal tie give only `pass`, Ctrl gives `pass`, a tiny lone horizontal event gives `pass`, events during `moving` give `consume`; `classifySwipe` table (40 px boundary, ratio 1.5 boundary, direction); `autoplayAllowed` truth table (each flag alone closes it, n < 2 closes it); `liveModeFor` table; `fieldMessage` for every field and validity combination, whitespace-only, tooLong; data validators with passing data and each failing case (duplicate slug, bad slug, empty title, image without alt, width or height, duplicate tool id, bad URL); `checkProvenanceComments` on fixture strings; the real data modules load and validate through `loadDataModule`; source audits (grep): no `preventDefault` in any touch or pointer handler of the carousel files, no `fetch|XMLHttpRequest|sendBeacon|mailto:|dangerouslySetInnerHTML|window.open` in the new component files, no `three` import in them, `data-snap-label` values and DOM order in the section files and `HomePage.jsx`.
- `npm run check:contrast` (`scripts/check-contrast.mjs`): parses `src/index.css`; error text on ink and surface at least 4.5, border/icon at least 3, `muted`/`text` on ink and surface at least 4.5, `focus` on ink at least 3; asserts `--color-error` is the only token added versus a fixed list of the existing eight.
Mapping:
- AC-1: S (`build`, `lint`, all `check:*`), G (`package.json` dependencies unchanged), B (console clean on `/`, `/projects/project-one`, `/projects/does-not-exist`, `/viewer`).
- AC-2: S (data check, failing fixtures), G (single import site, no second list), manual scratch edits reverted (duplicate slug, empty title, image without alt, provenance line removed).
- AC-3: B (after each snap to Projects, About, Tech Stack, Contact at the seven sizes: section rect, neighbours hidden, `scrollHeight`/`scrollWidth` walk of descendants, no rect outside the viewport; reduced motion at 1440x900). Numbers recorded in `measurements.md`.
- AC-4: B (rect intersection of every text and interactive element with the top and bottom 72 px, Contact footer exempt below; screenshots with 005 arrows visible).
- AC-5: B (`[data-snap-section]` order and labels, arrow names and DOM absence at Contact, wheel and PageDown at Contact, End and Home, deep links incl. from `/viewer` and a project page).
- AC-6: S (geometry numbers, D-22 bounds), B (rects at 1920x1080, 1440x900, 1366x768, 1024x700, 375x812, plus 1920x700 and 1280x720 for the grown peek; computed opacity and scale; gap versus `CAROUSEL_GAP_MAX_PX`; viewport reaches window edges; aspect ratio; scratch edit removing a description).
- AC-7: S (loop and pool maths, 3n presses), B (`__carouselInfo()` after 3N presses at 100 ms, side-slot occupancy sampled per frame, transition duration within 100 ms, N = 0, 1, 2 via scratch data, reduced motion instant).
- AC-8: B (`advances` log: four advances at 5 s +- 150 ms, scratch `CAROUSEL_AUTOPLAY_MS` edit, N < 2), S (gate).
- AC-9: S (gate truth table), B (hover over card, side card, button, dot for 12 s; Tab focus on button, dot, link for 12 s; a real mouse click on a button with the pointer then moved away does not pause and the next advance is a full 5 s after the click (D-21); emulated hidden; scroll to another section and route change; reduced motion before load and runtime toggle; fresh 5 s after each resume).
- AC-10: B (seven manual actions, each about 4 s after an advance, next advance at least 4.8 s later).
- AC-11: B (names, `aria-controls`, 44 px rects, hover / focus-visible / active computed styles, overlap and safe band, one activation = one slide), manual scratch swap of an icon file reverted.
- AC-12: B (dots: size, names, `aria-current` follows changes, shortest path, N > 10 scratch, no `role="tab"`).
- AC-13: B (touch emulation swipes at 375x812 and 1440x900, vertical swipe scrolls, computed `touch-action: pan-y`, `defaultPrevented` false, swipe over a link does not navigate), G/S (no `preventDefault` in touch or pointer code).
- AC-14: B (keys with focus on button, dot, link; focus handoff; navbar focus does nothing; Enter opens; Home/End/ArrowUp/ArrowDown/PageDown still snap; `activeElement` never body; Tab pass visits one card link; no tabbable inside inactive slides; ring around the whole card screenshot).
- AC-15: B (synthetic `WheelEvent`s over card, side card, button; horizontal 80/5; 60-event stream; diagonal; Ctrl; 1000x900 native vertical scroll plus horizontal slide; ten vertical events during a 005 move; ancestor attribute walk for nested-scroll markers), S (classifier).
- AC-16: B (attribute checks, `aria-live` across states, heading order), M (screen-reader spot check), S (`liveModeFor`).
- AC-17: B (click image, title, description area, Enter; no reload; side-card click stays on `/`; repeated; one link and tab stop with the title as name).
- AC-18: B (page content, `h1` count, back link href, trailing slash, direct load and reload in dev and in `npm run build` + `npm run preview`, 375x812 and 1920x1080 overflow, `scrollY` 0 on arrival, back link and navbar links at 1440x900 / 1000x900 / reduced motion, Back to `/`).
- AC-19: B (frame ratio, placeholder, scratch image object, frame height versus bands, side by side / stacked, text unchanged).
- AC-20: G (no inline list), B (default content, tile structure, `use` computed font size 14 px at 1440x900 and 16 px at 1000x900 (D-23), scratch `<id>.svg` import and `tint`, `use` present/absent, scratch 3 x 5 x 40-character list fits at all sizes, no tab stops), S (provenance check).
- AC-21: B (attributes, sizes, label association, 375x812 single column).
- AC-22: B (empty submit, `a@`, `a b`, whitespace-only, live revalidation, no `role="alert"`, computed styles resolve to `error`), S (`fieldMessage`).
- AC-23: B (network log empty, injected spies on `fetch`, `XMLHttpRequest.send`, `navigator.sendBeacon`, URL, scroll and values unchanged, status show/hide/show, button enabled), G (no network APIs).
- AC-24: B (textarea marker with short text, pasted 30 lines, cleared; keys typed in each field; page scroll unchanged), G (overflow source search).
- AC-25: B (descendant check, bottom edge, centring, year, absence on `/viewer` and project pages, accessibility tree has no extra `contentinfo`, 320x568 wrap and 44 px links, contrast).
- AC-26: B (links, names, `rel`, hit areas, states, scratch icon swap), G (URLs only in the data module).
- AC-27: B (Contact item order and styles, reach from `/`, `/viewer`, project page in all three scroll modes, one-row checks, slack measurement recorded in `measurements.md`, mobile menu at 375x812 and 320x568).
- AC-28: B (five sizes: 1023x900, 1440x699, 1366x600, 375x812, 320x568; overflow, 16 px text, carousel behaviour, stacking, footer last, Tab reachability).
- AC-29: B (reduced motion before load at 1440x900, runtime toggle, dev timer counter, form status without animation).
- AC-30: B (reveal visibility within 1.5 s after each snap, focus-ring screenshots, computed colours), G (no GSAP reveal on carousel elements, `error` only in form files).
- AC-31: G (files, placeholder markers, READMEs, provenance comments).
- AC-32: G (file separation, no three import, no layout reads in callbacks), B (ten round trips `/` to `/projects/project-one` and back: `__carouselInfo()` timers 0 or 1, listeners stable), S (`check:carousel`).
- AC-33: B (005 AC-2, AC-3, AC-5, AC-8/9 incl. focus inside the form, AC-10, AC-13, AC-21 to AC-23, AC-31/32/34 re-run with five sections and Contact last), after 005 T-37.
- AC-34: S (`check:contrast`), B (computed colours of text, border, icon; greyscale screenshot), G (token only in form files, `rim` default gone).
Manual-only checklist for the owner: real trackpad and tilt-wheel feel, a real phone swipe, screen-reader announcements for the carousel and the form, final icon and logo swaps, hover and focus visual feel.

## Order of work
Each step lists the 005 tasks that must be finished (see Dependencies on 005).
- W-01 (now) Pure libs and constants, `check:carousel` with the data and logic cases, `loadDataModule`, `package.json` scripts. No 005 wait.
- W-02 (now) `sectionLayout.js`. Needs T-05 (done).
- W-03 (now) Data modules `projects`, `techStack`, `socialLinks`, `about`; run `check:carousel`.
- W-04 (now) `check-contrast.mjs` (fails until W-06 adds the token; the first run records the baseline of the eight existing tokens).
- W-05 (now) Placeholder SVGs, `tech/placeholder.svg`, tech and img READMEs. Icons README extension after T-24.
- W-06 (after T-15, T-24, and no 005 builder editing `index.css`) `--color-error` with its comment and `.icon-mask`; `check:contrast` passes.
- W-07 (write now, verify after T-20) `IconMask`, `useCarousel`, `ProjectCarousel`, `ProjectCard`, `CarouselControls`, `TechCategory`, `ContactForm`, `ContactFooter`, `Contact`, `ProjectPage`, `ProjectNotFound`, `RouteScrollReset`. Each in its own task; lint and build exit 0.
- W-08 (after T-16) Rewrite `Projects.jsx`, `AboutMe.jsx`, `TechStack.jsx` with the safe-band layout. Verify D-F fits with `sdd-browser` at the seven sizes after T-20.
- W-09 (after T-25) `HomePage.jsx` adds Contact. Verify five snap sections, arrow names, End/Home, `/#contact`.
- W-10 (after T-20) `App.jsx` route and `RouteScrollReset`. Verify AC-17, AC-18.
- W-11 (after T-29) Navbar Contact link, W-12 slack measurement and the 640/768 decision; record numbers.
- W-13 Verification passes by feature: carousel (AC-6 to AC-17), pages (AC-18), About and Tech (AC-19, AC-20), Contact and footer (AC-21 to AC-26), navbar (AC-27), below-snap and reduced motion (AC-28, AC-29), carry-over (AC-30), structure (AC-31, AC-32), token (AC-34). Fit and safe-band numbers go to `measurements.md`.
- W-14 (after T-37) Full regression: lint, build, all `check:*`, 005 ACs re-run with Contact last (AC-33), ten route round trips, owner manual checklist.

## Requirement traceability
| Req | Satisfied by |
|---|---|
| FR-1 | `src/data/projects.js`, `dataValidation.js`, `check:carousel` (D-I, D-G) |
| FR-2 | `ProjectCard`, fixed line heights, placeholder fallback (D-H, D-E) |
| FR-3, FR-15 | `computeCarouselGeometry`, peek fraction, `CAROUSEL_GAP_MAX_PX` peek growth (D-22), chrome budget, side scale and opacity (D-E, D-A) |
| FR-4 | pool and continuous `pos`, N cases (D-A) |
| FR-5, FR-6 | single-timer gate, pause flags, keyboard-focus-only pause (D-21), fresh interval (D-B) |
| FR-7, FR-8 | `CarouselControls`, `IconMask`, `goProject`, counter above `CAROUSEL_MAX_DOTS` (D-A, D-D, D-J) |
| FR-9 | pointer-event swipe, `touch-pan-y`, click suppression (D-C) |
| FR-10 | region `onKeyDown`, focus handoff (D-C) |
| FR-11 | `classifyCarouselWheel`, `stopPropagation` refinement (D-C, issue 2) |
| FR-12, FR-13, FR-14 | roles, inert slides, overlay, live attribute, stretched link, tab order (D-D) |
| FR-16 | markers kept, `data-reveal` on wrapper only (D-F) |
| FR-17, FR-18 | `ProjectPage`, `ProjectNotFound`, `RouteScrollReset`, 005 scroll function (D-G) |
| FR-19 | `AboutMe`, `about.js`, height-aware frame (D-F, D-I) |
| FR-20 | `TechCategory`, `techStack.js`, `IconMask` tint (D-F, D-I, D-J) |
| FR-21, FR-26 | `Contact.jsx`, footer inside the section (D-F) |
| FR-22 to FR-25 | `ContactForm`, `contactValidation.js`, marker sync (D-K) |
| FR-27 | `socialLinks.js`, `ContactFooter`, `IconMask` (D-I, D-J) |
| FR-28 | Navbar item, breakpoint process (D-L) |
| FR-29, FR-30 | `--safe-band`, `snap:` classes, fit tables (D-F) |
| FR-31 | markers in section files, `HomePage` order (D-F, Order W-08, W-09) |
| FR-32 | only the textarea scrolls; carousel clips (D-K, D-E) |
| FR-33 | below-snap geometry and layouts (D-E, D-F, D-M) |
| FR-34 | reveal rules, reduced motion (D-F, D-M) |
| FR-35 | placeholders, READMEs, provenance comments (D-I, D-J) |
| NFR-1 | D-D, D-K, D-L contrast |
| NFR-2 | D-E, D-M |
| NFR-3 | Dependencies |
| NFR-4 | Files to create/modify |
| NFR-5, D-20 | D-L (`--color-error`) |
| NFR-6 | `IconMask`, text-only data rendering, `rel="noopener noreferrer"` in footer |
| NFR-7, NFR-8 | scripts and constants table |
