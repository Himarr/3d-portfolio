# Plan: 005 Scroll Snap, Full-Screen Sections, Hero, Navbar, Section Arrows and Fixed Canvas

Spec update applied before planning: the last open question is resolved as D-10 (touch devices at or above the thresholds also settle after native touch scrolling goes idle; touch scrolling is never intercepted). FR-5, FR-10, AC-10 and Assumptions were adjusted; Open questions now read "None".

## Spec issues found (issues 1 and 3 are now resolved in the spec; 2, 4 and 5 are accepted plan choices)
1. RESOLVED in spec (D-11, FR-5; owner confirmed). FR-5 versus NFR-2: detecting a nested scroller that "can still scroll in that direction" needs layout reads, which NFR-2 forbids. Decision: opt-in marker. The handler checks `event.target.closest('[data-lenis-prevent], [data-snap-ignore]')` (no layout read). No such element exists today; spec 006 must mark nested scrollers (for example a contact textarea).
2. FR-10 (no settle while a mouse button is held, including a paused scrollbar drag). Chrome and Safari dispatch `mousedown`/`mouseup` for the viewport scrollbar; Firefox does not, so a Firefox scrollbar drag that pauses for the debounce can start a settle. Plan: best-effort. Track mouse and touch holds; cancel a settle as soon as any `mousedown`/`touchstart` happens during it; accept the Firefox scrollbar-pause gap (documented, manual check).
3. RESOLVED in spec (AC-12). AC-12 listed "both arrows" in the snapping-off clause (Lenis `scrollTo` at 1000x900), but arrows do not exist when snapping is off (FR-29). The clause now covers navbar links only; arrows are verified under snapping.
4. FR-38 / AC-36 say the canvas CSS width equals `innerWidth`. A `fixed inset-0` element is `clientWidth` wide (excludes a classic scrollbar). Plan: `w-screen` (100vw) so it equals `innerWidth`; the moon is anchored from the measured Hero rect, so the half-scrollbar offset between canvas centre and Hero centre does not matter. Noted, not a conflict.
5. FR-25 / AC-28 total of about 5 s: the current text timeline ends at 1.5 s once the old stage tween (which ended at 2.0 s) is removed, giving 4.5 s. Plan stretches the text timings so the arrow slot ends at 2.0 s (total 5.0 s). A plan choice, not a spec change.

Nothing else was found infeasible. Everything flagged "builder verifies" under Risks is an API detail (Lenis, R3F `advance`), not a spec conflict.

## Approach
Brownfield on 002 to 004 (Vite 8, React 19 StrictMode, react-router-dom 7, Tailwind 4, GSAP 3.15, Lenis 1.3, three 0.186, R3F 9.8.2, oxlint). No new dependency (see Dependencies). The work splits into seven layers that share three ideas:
- One scroll source. Lenis (already created in `SmoothScrollProvider`, driven by `gsap.ticker`) is the only thing that moves the window. The snap animation is `lenis.scrollTo(number, { duration, easing })`, retargeting is a second `scrollTo`, and settle is another `scrollTo`. The canvas reads the scroll value that Lenis applied in the same ticker tick.
- One clock for rendering. The R3F canvas stops running its own rAF loop (`frameloop="never"`). A tiny `FrameDriver` calls `advance()` from a `gsap.ticker` callback that runs right after Lenis, so the moon is positioned from the exact scroll value the DOM was just given (FR-39, no one-frame lag).
- One set of JS constants drives CSS. Thresholds, moon size and nav height are written once by JS as a `data-snap-layout` attribute and CSS custom properties on `<html>` before first paint (`initLayoutVars()` in `main.jsx`), so JS and CSS cannot disagree (NFR-6).

Layers, in build order (detail in Order of work):
1. Pure libs and Node checks: constants, snap maths, moon size, wrap geometry, star wrap maths.
2. Layout vars and section sizing (`data-snap-layout`, `--nav-h`, `--moon-r`), `snap:` Tailwind variant, section markers.
3. Scroll plumbing: Lenis tick prioritised, `scrollSource`, `snapController`, `SnapScroller`, `ScrollToHash` retarget.
4. Settle and arrows.
5. Navbar (remove link, JS-driven mobile menu).
6. Fixed canvas conversion (FrameDriver, PageCanvas, PageScene anchoring, stars, DPR, `check:buffer`, `OutlineLayer` tweaks).
7. Hero (moon size, poster size, wrap, intro) and final verification.

## Architecture / design decisions

### D-A Snap engine: Lenis `scrollTo`, not a second tween (FR-6, FR-7, FR-14)
- Moves call `lenis.scrollTo(top, { duration: SNAP_DURATION_S, easing: snapEase, lock: false, onComplete })` with `top` always a number clamped to `[0, lenis.limit]`. Why: Lenis already owns window scrolling, `ScrollTrigger.update` is fed by its `scroll` event, and a second tween (GSAP `scrollTo` plugin or `window.scrollTo`) would have two systems writing `scrollTop`. Retargeting is free: calling `scrollTo` again restarts from the current animated position.
- Easing: `easeInOutCubic` as a pure function in `snapMath.js` (endpoints 0 and 1, so ends exactly on target; Node-testable).
- Wheel interception: a `wheel` listener on `window` with `{ capture: true, passive: false }`. When it handles an event it calls `preventDefault()` and `stopPropagation()`, so Lenis's own bubble-phase wheel handler never smooths it (no double animation). Listener exists only while snapping is active.
- Why not `stop()` Lenis while active: `stop()` changes native-scroll syncing (scrollbar drag, touch, find-in-page must keep working and stay tracked by Lenis).
- Lenis stays untouched for touch (`syncTouch` default false = native), scrollbar and keyboard focus scrolling.

### D-B Snap controller state machine (`src/lib/snapController.js`, framework-free)
State: `active` (bool), `index` (displayed section), `points[]` (cached snap tops), `moving` (null or `{ kind: 'input' | 'click' | 'settle' | 'resync', toIndex }`), `moveEndAt`, `gesture` (`lastWheelAt`, `lastAbsDelta`), `held` (mouse or touch down), timers, counters (DEV).
Transitions:
- `idle` -> `moving(input)`: an accepted wheel or key event (rules below) at `index = nearestIndex(points, lenis.scroll) +- 1`.
- `idle|moving` -> `moving(click)`: `goTo(index)` from navbar link, arrow or hash. Always accepted; kills the current animation by issuing a new `scrollTo`; `toIndex` replaced.
- `idle` -> `moving(settle)`: settle timer fires (below).
- `moving` -> `idle` (set `moveEndAt = now`): `onComplete`.
- `moving(*)` + wheel or key input: ignored (the wheel is still `preventDefault`ed). Never queued.
- `moving(settle)` + `mousedown`/`touchstart`: cancelled with `scrollTo(current, { immediate: true })` (user takes over).
- `active` false: cancel move/timers, remove listeners, clear store. `active` true: attach listeners, `refresh()`.

Wheel acceptance (pure function `classifyWheel` in `snapMath.js`, so AC-6 is scriptable). Inputs: `now`, `lastWheelAt`, `lastAbsDelta`, `absDelta` (after `deltaMode` normalisation: line x 16, page x innerHeight), `moveEndAt`, `moving`. Rules, in order:
1. Ctrl held, `|deltaX| > |deltaY|`, or `absDelta < SNAP_WHEEL_NOISE_DELTA`: not a move (Ctrl is not even prevented).
2. `moving`: ignore.
3. `now - moveEndAt < SNAP_COOLDOWN_MS`: ignore.
4. Quiet gap: `now - lastWheelAt >= SNAP_GESTURE_GAP_MS`: accept as a new gesture.
5. Otherwise (same stream): accept only if `absDelta >= SNAP_NEW_GESTURE_MIN_DELTA` and `absDelta >= lastAbsDelta * SNAP_NEW_GESTURE_RATIO` (a fresh flick riding on a tail); else ignore.
`lastWheelAt` and `lastAbsDelta` are updated on every wheel event (accepted or ignored), so a continuing inertia tail keeps the stream "busy". A decaying tail never rises by 2x, so it is ignored; a deliberate swipe after the stream pauses at least 100 ms is accepted.

Keys (`shouldHandleKey` in `snapMath.js`, pure, takes `{ key, shiftKey, ctrlKey, altKey, metaKey, defaultPrevented, repeat, targetTag, targetRole, isContentEditable }`): PageDown, ArrowDown, Space = next; PageUp, ArrowUp, Shift+Space = previous; Home, End = first, last. Skipped for modifiers, `defaultPrevented`, `input|textarea|select|[contenteditable]`, and when the focused element natively uses the key (`button`, `summary`, `a` for Enter only, roles `slider`, `menu`, `menuitem`, `tab`, `tablist`, `listbox`, `option`, `radio`, `spinbutton`, `combobox`, `textbox`; arrows on those; Space on `button`/`summary`/`checkbox`). `event.repeat` is `preventDefault`ed but never starts a move (holding PageDown moves one section, not many). No layout reads: only `tagName`, `getAttribute('role')`, `isContentEditable`.

Resync (`resync` kind): `refresh()` recomputes `points` from `[data-snap-section]` (first forced to 0). If idle: compare `lenis.scroll` to `points[index]`; if more than `SNAP_POSITION_EPSILON_PX` apart, `scrollTo(points[index], { immediate: true })` (instant, FR-11). If moving: reissue `scrollTo` to the updated `points[toIndex]`.

### D-C Settle (FR-10, D-10)
- Trigger: `lenis.on('scroll', (e) => ...)` (value `e.scroll`, no DOM read; Lenis emits it for native, touch and programmatic scrolls). If `moving`, ignore (our own animation). Otherwise update `store.index = nearestIndex(points, e.scroll)` (arrows follow live) and restart `settleTimer = setTimeout(trySettle, SNAP_SETTLE_DEBOUNCE_MS)`. Every scroll event restarts it, so touch momentum and scrollbar drags finish first.
- `trySettle`: if `held` (mouse down or `touches > 0`): do nothing; `mouseup`/`touchend` re-arm the timer. If `moving`: return. Choose the target: if a `focusin` was recorded less than `SNAP_FOCUS_WINDOW_MS` before the first scroll event of this burst and its target lies inside a `[data-snap-section]`, target that section; else `nearestIndex`. If `|lenis.scroll - points[target]| <= SNAP_POSITION_EPSILON_PX`, stop. Else start `moving(settle)`.
- Held tracking: `mousedown`/`mouseup` (buttons) and `touchstart`/`touchend`/`touchcancel` (touch count), all passive, plus `blur` and `visibilitychange` reset. Pointer events are not used for touch because browsers fire `pointercancel` when native scrolling takes over.
- Never calls `focus()` or `blur()`; the controller only calls `scrollTo`. A focused field keeps its caret.
- Initial load with browser scroll restoration: the first `scroll` events (or the initial `refresh()` if no event fires) arm the timer; an explicit `armSettle()` call after `refresh()` at activation covers a restored mid-section position with no further scrolling.
- Known gap: Firefox scrollbar drags give no `mousedown` (Spec issue 2).

### D-D Single scroll-to-section function (FR-12)
`snapController.goTo(target, { immediate })` where `target` is a section index, a `[data-snap-section]` element, or any element (mapped to its containing section via `closest`). Public hook `useSectionScroll()` (in `src/hooks/useSectionScroll.js`) returns one stable function `scrollToSection(target, opts)`:
- snapping active: `snapController.goTo`.
- snapping off and Lenis present (motion allowed): `lenis.scrollTo(el, { offset: 0 })` (002 FR-30 behaviour, Hero maps to 0).
- reduced motion (no Lenis): `el.scrollIntoView()` (instant; the site sets no CSS `scroll-behavior`).
`ScrollToHash` keeps its `lenis.resize()` plus next-frame dance and calls `scrollToSection(el)` instead of `lenis.scrollTo`. Initial page load with a hash (`location.key === 'default'`) uses `{ immediate: true }` (no 1 s scroll from the top); in-app navigation (from `/viewer`, back/forward, same-link click) animates. Navbar links stay `<Link to="/#projects">`; the scroll comes from the location change, so Back/forward retargets for free. Unknown hash: no-op.

### D-E Activation and layout threshold (FR-2, FR-16, NFR-6)
- `src/lib/snapConfig.js` holds `SNAP_MIN_WIDTH_PX`, `SNAP_MIN_HEIGHT_PX` and `SNAP_QUERY = (min-width: 1024px) and (min-height: 700px)` (built from the constants).
- `initLayoutVars()` (`src/lib/layoutVars.js`, called in `main.jsx` before `createRoot().render`) sets `document.documentElement.dataset.snapLayout = 'on' | 'off'` from `matchMedia(SNAP_QUERY)` and keeps it updated on `change`. It also sets `--moon-r` and `--moon-poster-side` (D-H) and listens to `resize`. Doing it before React renders means no flash of a mismatched layout.
- CSS (`src/index.css`): `@custom-variant snap (&:where([data-snap-layout="on"] *));`. Sections use `snap:min-h-svh snap:content-center`. Because the attribute depends only on the window size, reduced-motion desktops keep the full-screen layout (D-6).
- Behaviour activation `useSnapActive()` inside `SnapScroller` = `lenis != null && pathname === '/' && useMediaQuery(SNAP_QUERY) && !reducedMotion`. `lenis != null` implies not reduced motion already, but is kept explicit.
- Section sizing: Hero `min-h-[calc(100svh-var(--nav-h))]`; `--nav-h` defaults to `3.8125rem` in CSS and is replaced by the measured header height (`ResizeObserver`, border-box block size) in `Navbar`. Hero uses `min-height`, so navbar + Hero is exactly 100 svh when content fits (AC-2) and never clips if not (FR-17). Other sections: `snap:min-h-svh snap:content-center` on the existing grid (vertical centring, no markup change). Page height at snap sizes = 4 viewports, last snap point = max scroll.
- Section markers: each home section gets `data-snap-section`, `data-snap-label="Hero|Projects|About|Tech Stack"` and `tabIndex={-1}` with `outline-none` (programmatic focus target for FR-30; sections are not interactive).

### D-F Section arrows (FR-28 to FR-32)
- `SectionArrows.jsx` (mounted in `HomePage` after the sections) reads `useSnapState()` (store snapshot `{ active, index, labels }` via `useSyncExternalStore`). Renders `null` when `!active` (not in DOM, AC-10). Labels come from the `data-snap-label` attributes read by `snapController.refresh()`, so 006's sections need no arrow changes.
- Two `<button type="button">`: down at `bottom: max(16px, env(safe-area-inset-bottom))`, up at `top: max(16px, env(safe-area-inset-top))`, both `left: 50%` with `-translate-x-1/2` on a wrapper, `fixed`, `z-20`, 44x44. Offsets come from `SECTION_ARROW_OFFSET_PX` via inline style. Container is `pointer-events-none`, buttons `pointer-events-auto`.
- Visibility: down visible when `index < last`, up when `index > 0`. Hidden state = `inert` + `visibility: hidden` + `opacity: 0` (CSS transition delays `visibility`), so hidden arrows are neither focusable nor in the accessibility tree.
- Names: `Next section: ${labels[index + 1]}`, `Previous section: ${labels[index - 1]}`.
- Icon: `src/assets/icons/arrow-down.svg` imported as a URL and applied as a CSS `mask-image` on a span with `background-color: currentColor`. Why: tints any user SVG through `currentColor` without SVGR or any dependency, and replacing the file needs no code change. The up arrow is the same span with `rotate(180deg)`.
- Transition (FR-32, CSS only): each icon span rests at 0 (down) or 180 degrees (up). The hidden state of down is `rotate(180deg)`; the hidden state of up is `rotate(0deg)`. When the displayed section changes, the arrow that appears rotates in while fading in and the one that disappears rotates out while fading out, so the pair reads as one control turning over. Positions never change. `motion-reduce:transition-none`; arrows do not exist under reduced motion anyway.
- Click: `scrollToSection(index +- 1)` through `goTo` (click kind: retargets). Next/previous are relative to `store.index` (destination of a running move), so repeated clicks walk one section each and the ends never overshoot. No URL change (buttons), so no history entries.
- Focus (FR-30): `onFocus`/`onBlur` track `focusedInside`. A layout effect keyed on `[active, index]` runs a cleanup that, if `focusedInside` and the activated arrow is now hidden or the component is going inactive, calls `snapController.getSection(index).focus({ preventScroll: true })`. Never leaves focus on `<body>`.
- Intro slot (FR-25): the down arrow's outer wrapper is the GSAP target; the inner button owns CSS transitions (two elements, so no property is animated by two systems). On mount, if `heroIntro.timeline` exists and `progress() < 1`, the arrow adds `tl.from(wrapper, { opacity: 0, y: 16, duration: 0.6 }, 'text+=1.4')` inside a `gsap.context` (reverted on unmount). Otherwise nothing animates.
- Tab order: the arrows render after `main` content in the DOM (end of `HomePage`), so Tab reaches Hero text, sections, then the arrows; no trap.
- Overlap check (computed for the spec's sizes, see Constants): worst case is 1920x700, where the gap between moon bottom and the arrow top is about 23 px (`HERO_WRAP_MARGIN_PX` is 20).

### D-G Moon size, poster size and the shared function (FR-19 to FR-21)
- `src/lib/moonConfig.js` (constants, no imports except `MOON_RADIUS_PER_HERO_HEIGHT` from `src/three/moonFraming.js`, a pure file with no three import): `HERO_REF_WIDTH_PX 1920`, `HERO_REF_HEIGHT_PX 1080`, `NAVBAR_REF_HEIGHT_PX 61`, `MOON_REF_RADIUS_PX = MOON_RADIUS_PER_HERO_HEIGHT * (1080 - 61)` (about 404.8, derived not typed), `MOON_SCALE_FACTOR 0.9`, `MOON_MIN_RADIUS_PX 128`, `MOON_SIDE_MARGIN_PX 24`, plus intro and wrap constants.
- `src/lib/moonSize.js`: `moonFinalRadiusPx(vw, vh) = min(max(REF * FACTOR * min(vw/1920, vh/1080), MIN), (vw - 2*SIDE)/2)`, `moonPosterSidePx(r) = r / MOON_RADIUS_PER_HERO_HEIGHT` (poster is a 1200 px square whose moon diameter is `2 * MOON_RADIUS_PER_HERO_HEIGHT` of its side, from 004 capture), plus a tiny store `getMoonRadius()`/`subscribe` updated by `initLayoutVars()` on `resize` from `window.innerWidth/innerHeight`.
- Consumers: the live canvas (`PageScene` reads `getMoonRadius()` per frame, no layout read), the poster (CSS var `--moon-poster-side` on `<html>`), the wrap (D-I) and `check-moon.mjs`. One function, one constants file (AC-18, NFR-6).
- Poster geometry: the stage wrapper is `absolute inset-0 m-auto` with `width/height: var(--moon-poster-side)`; the `<img>` fills it (`object-contain` becomes `object-fill`, same aspect). GSAP scales the wrapper about its centre (intro). The `hero-poster` crossfade (`opacity` transition on the `<img>`) is untouched, so scale (wrapper) and opacity (img) are on different elements.

### D-H Intro timeline and the shared clock (FR-24 to FR-27)
- `src/lib/moonIntro.js`: `export const moonIntro = { scale: 1 }` (module singleton, plain object, no React).
- `Hero` layout effect (replaces the existing one): if `reducedMotion || introPlayed` return. Else set `moonIntro.scale = MOON_INTRO_START_SCALE`, `gsap.set(posterWrap, { scale })`, then one master timeline stored in `heroIntro.timeline` (`src/lib/heroIntro.js`):
  - `tl.fromTo(moonIntro, { scale: 0.6 }, { scale: 1, duration: 3, ease: MOON_INTRO_EASE, onUpdate: () => gsap.set(posterWrap, { scale: moonIntro.scale }) }, 0)`; one tween is the clock for both poster and canvas.
  - `tl.addLabel('text', '>')`, then text tweens relative to `'text'`: eyebrow `+0` (0.6 s), heading words `+0.2` (stagger 0.05, 0.8 s), paragraph `+0.8` (0.6 s), and the arrow slot at `+1.4` (0.6 s, added by `SectionArrows`). Text part ends at 2.0 s, total 5.0 s (AC-28 window 4.5 to 5.5). The old `[data-stage]` fade/scale tween is deleted.
- Canvas side: `PageScene` computes radius each frame as `getMoonRadius() * moonIntro.scale`, so when the lazy chunk and model arrive mid-intro the moon simply appears at the current scale (no jump, FR-27, AC-30). The intro never waits for the canvas: it starts at Hero mount.
- Cleanup: `ctx.revert()`, `heroIntro.timeline = null`, `moonIntro.scale = 1`; same StrictMode guard as today (`introPlayed` reset only if unfinished). Returning from `/viewer`: `introPlayed` stays true, scale stays 1.
- Reduced motion: effect returns immediately; no tween, scale 1, poster only.
- Outline thickness is untouched (constant CSS px, 004).

### D-I Hero text wrap (FR-22, FR-23)
Technique: a CSS `shape-outside: circle()` float anchored to the Hero box, not to the text.
- Hero DOM (wrap mode only, width at or above `HERO_WRAP_MIN_WIDTH_PX`, via `useMediaQuery`): inside the Hero, a full-height container (`relative z-10 flex-1`, no padding, top aligned with the Hero top) holds, in order: (1) `div.hero-moon-float` (`aria-hidden`, `float: right`, `width/height: var(--wrap-size)`, `margin-top: var(--wrap-mt)`, `margin-right: var(--wrap-mr)`, `shape-outside: circle(closest-side at 50% 50%)`); (2) a spacer block `height: var(--wrap-pt)`; (3) the text block (eyebrow, `h1`, paragraph) with the existing `max-w-md xl:max-w-lg pl-12 pr-8`. Floats shorten the line boxes of descendants in the same block formatting context, so lines follow the circle; the float is not a BFC and neither are the text blocks.
- Geometry in pure JS (`src/lib/heroWrap.js`, `wrapGeometry({ heroW, heroH, radius, margin }) -> { size, mt, mr }`): `size = 2(R + m)`, `mt = max(0, heroH/2 - (R + m))`, `mr = heroW/2 - (R + m)` (container has no horizontal padding, so `50%` of the Hero is the moon centre x). The circle centre is therefore exactly the Hero centre, the same point the canvas and poster use. `R` is the FINAL radius (static during the intro). `check-moon.mjs` asserts centre equality on a size grid.
- `useHeroWrap(heroRef, textRef)` (`src/hooks/useHeroWrap.js`): one `ResizeObserver` on the Hero and the text block (plus the moon-size subscription) writes `--wrap-size`, `--wrap-mt`, `--wrap-mr` and `--wrap-pt` on the Hero element. Reads happen in the observer callback only. `--wrap-pt = max(64px, (heroH - textH) / 2)` keeps the text roughly vertically centred as before; updates only when the value changes by 2 px or more, and the loop is capped at 3 passes per layout change (the wrap geometry itself does not depend on `--wrap-pt`, so a residual centring error is cosmetic and cannot cause overlap).
- Heading size in wrap mode: `font-size: clamp(2.75rem, calc(var(--moon-r) * 0.26), 6rem)` (`HERO_H1_RADIUS_RATIO = 0.26`). Reason: heading words are `inline-block` and cannot break, so a word wider than the gap at its line would run into the moon. At 1920x1080 this is capped at 6rem (current `md:text-8xl` size, no visible change); at 1440x900 about 71 px; at 1024x700 about 50 px. This is the "responsive type size" the spec's edge case allows. Verified by AC-19 geometry; the ratio is the single tuning lever.
- Below `HERO_WRAP_MIN_WIDTH_PX` (amended 2026-10-21 by user request; replaces "today's layout, text over the moon"): column mode, no float, no `--wrap-*`. Hero is `flex flex-col` with `padding-top: var(--nav-h)`, current type scale, text block, then `div.hero-moon-slot` (`aria-hidden`, `relative`, `margin-top: HERO_COLUMN_GAP_PX`, `margin-bottom: HERO_COLUMN_BOTTOM_PX`, `height: calc(2 * var(--moon-r))`, full width). Hero height is `min-h` only (content-sized; on phones it is at least `100svh`), so it grows when the floor binds (landscape fallback, decision needing user confirmation). The CTA is deleted in both modes.
- Column radius (amended 2026-10-21 by user request): `moonColumnRadiusPx({ vw, vh, navH, textH })` in `moonSize.js` = `min(max((vh - navH - textH - GAP - BOTTOM) / 2, MOON_MIN_RADIUS_PX), (vw - 2*SIDE) / 2)` (FR-23). `moonFinalRadiusPx(vw, vh)` stays the pure desktop rule; the store's `getMoonRadius()` returns the column value when `vw < HERO_WRAP_MIN_WIDTH_PX`. `textH` is written to the store by `useHeroColumn(textRef)` (`src/hooks/useHeroColumn.js`, one `ResizeObserver` on the text block; text height does not depend on R, so no feedback loop). Recompute on width change or on a height change of 120 px or more (mobile URL bar must not resize the moon); `--moon-r` and `--moon-poster-side` follow the store.
- Moon centre in column mode (amended 2026-10-21 by user request): the slot centre. `useHeroMetrics` observes an anchor element: the Hero in wrap/desktop mode, `.hero-moon-slot` in column mode, and caches its centre (`cxVp`, `cyDoc`) with the same formulas as D-K. The poster box is rendered inside the slot in column mode (`absolute inset-0 m-auto`, `--moon-poster-side`) and stays directly in the Hero stage in desktop mode, so poster and canvas share the centre by construction. Intro scaling is unchanged (about the box centre).
- Sync with the canvas: wrap, poster and canvas all derive from `moonFinalRadiusPx` (column mode: `moonColumnRadiusPx`) and the anchor centre (Hero centre on desktop, slot centre below 1024). The canvas moon centre is the cached Hero centre (D-K); text geometry uses the Hero's own width and height, so scrollbar width differences do not matter.

### D-J Navbar and mobile menu (FR-33 to FR-37)
- Remove the Tech Stack `Link`.
- Mode switch in JS: `const desktop = useMediaQuery('(min-width: 640px)')` (px, from `NAV_MENU_BREAKPOINT_PX`, `src/lib/navConfig.js`). Why not Tailwind `sm:`: Tailwind breakpoints are `rem` media queries, so a changed browser default font size would put the CSS breakpoint and a JS check out of step; one JS query drives both markup and reset. `useMediaQuery` is `useSyncExternalStore` on `matchMedia` (client-only SPA, no flash).
- Breakpoint justification (no wrap): measured row = container padding 64 px (at 640, `sm:px-8`) + brand "Himar" (text-2xl serif, about 75 px) + `gap-x-4` 16 + link group. Link group (`px-3` each, `text-sm uppercase tracking-widest`): Home about 66, Projects about 107, About about 76, 3D Viewer about 114 = about 363, minus the `-mx-3` bleed of 24 = about 339. Total about 494 px against 640 px: about 146 px of slack (fits down to roughly 470 px). Verified at 639/640/641 by `sdd-browser` (`nav` height equals one row, `scrollWidth <= innerWidth`); fallback 768 if measured slack is under 40 px.
- Menu: header becomes `relative`. Toggle button (44x44, `type="button"`, `aria-expanded`, `aria-controls="nav-menu"`, accessible name "Menu"; the state is carried by `aria-expanded`) shows a CSS hamburger (three spans; middle fades, outer two rotate +-45 degrees, transitions 200 ms, `motion-reduce:transition-none`). Panel `id="nav-menu"` is always rendered with the `hidden` attribute when closed (display none: out of tab order and accessibility tree; `aria-controls` target exists), absolutely positioned (`absolute inset-x-0 top-full z-30 bg-ink border-b border-line`), so it overlays and causes no layout shift (AC-35). Items reuse `itemBase`, `min-h-11`, `w-full`.
- State without effects: `openAt` holds the `location.key` at the time of opening; `isOpen = !desktop && openAt === location.key`. Any navigation (path or hash) changes the key and closes it. Widening to desktop clears `openAt` (one effect with a documented lint exception, same pattern as `SmoothScrollProvider`). Escape: `keydown` listener on `document` while open: close and `toggleRef.current.focus()`. Link `onClick` also closes. Focus stays on the toggle when opening; items follow it in DOM order.
- `--nav-h`: `ResizeObserver` on `<header>` writes the border-box height to `--nav-h`.

### D-K Fixed viewport canvas (FR-38 to FR-42)
Wrapper: `PageCanvas` wrapper class changes from `absolute inset-0 -z-10` + `maxHeight` to `fixed left-0 top-0 -z-10 h-svh w-screen pointer-events-none` (no `maxHeight`). HomePage's `relative isolate` wrapper has no transform or filter, so `fixed` is viewport-relative; `-z-10` stays inside the isolated stacking context, behind the sections. `aria-hidden`, `tabindex=-1` (CanvasGuard), `pointer-events: none` unchanged. `dpr` and `DprController` stay.
- Render driver. `Canvas frameloop="never"` always; the old toggle (`active ? 'always' : 'never'`) becomes a ref read by `FrameDriver.jsx`:
  ```
  const advance = useThree(s => s.advance)
  useEffect(() => {
    const tick = (time) => { if (activeRef.current) advance(time) }   // time: seconds
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [advance])
  ```
  `SmoothScrollProvider` registers Lenis's tick with `gsap.ticker.add(tick, false, true)` (prioritised, always first). Order per frame: Lenis sets the window scroll and `scrollSource.y`, then the driver renders. Pause/resume on `document.hidden` and context loss is unchanged (`active` false skips; `MAX_DELTA` clamps the first delta on resume). Builder verifies the unit `advance` expects in R3F 9.8.2 (seconds, as passed by the GSAP ticker) and that `useFrame` subscribers run under `advance`.
- `src/lib/scrollSource.js`: `export const scrollSource = { y: 0 }`. Written in the Lenis tick right after `instance.raf(...)`: `scrollSource.y = instance.scroll`. Initialised from `window.scrollY` when the Lenis instance is created. Why `lenis.scroll` instead of `window.scrollY`: no DOM read in the frame path, and it is the value Lenis just applied; native scrolls (scrollbar drag, touch) are synced into it by Lenis's own scroll listener, which fires before rAF callbacks in the same frame.
- Moon anchoring math (per frame, in `PageScene`'s `useFrame(-1)`):
  ```
  heroCx_vp  = cached  (hero rect left + width/2, viewport coords; no horizontal scroll)
  heroCy_doc = cached  (hero rect top + scrollY + height/2, measured in the ResizeObserver callback)
  place.position.x = heroCx_vp - canvasW/2
  place.position.y = canvasH/2 - (heroCy_doc - scrollSource.y)
  place.scale = getMoonRadius() * moonIntro.scale
  ```
  `useHeroMetrics` now stores `{ cxVp, cyDoc, inView }`, observes the Hero, the page wrapper and the `<header>` (so navbar height changes move `cyDoc`), and no longer triggers React re-renders (the `version` state is removed; placement runs every frame). `useScrollMetrics.js` is deleted (its only consumer was the old star parallax). The `inView` IntersectionObserver still hides the moon and skips spin and tilt (003 FR-33).
- Outline: `OutlineLayer` reads the anchor each frame, and the anchor now moves while scrolling, which the old design never needed. Two changes keep 004's no-allocation and bounded-cost rules: (1) `PageScene` sets `place.userData.regionRadius = getMoonRadius()` (final radius) and `OutlineLayer` sizes the region and render target from `userData.regionRadius ?? radius`, so the intro growth does not resize the render target every frame (it only writes `uRadius`); (2) `relayout` is split into `resize` (region, target, frustum; runs on regionRadius/DPR/thickness/size changes) and `reposition` (camera and quad centre; runs on x/y change), both writing into preallocated objects: `computeOutlineRegion(params, out)` gains an optional `out` argument (backward compatible; `check-cel.mjs` keeps passing). Same frame guarantee as before: `PageScene` callback priority -1 runs before `OutlineLayer` priority 0 inside the same `advance`.
- Stars (`StarLayer`, `PageScene`, `starfield.js`, new `starScroll.js`):
  - Positions are generated once for the cap (`STAR_MAX` 2000, 800 coarse) with the same seeded generator. A `drawRange` (`setDrawRange(0, n)`) with `n = min(cap, round(STAR_DENSITY_PER_MPX * W * H / 1e6))` updates on canvas size change: no regeneration, no allocation (003 FR-31's "not regenerated on resize" holds).
  - Four `<points>` (2 x 2 copies) share one geometry and one material (created in `useMemo`, disposed in cleanup). Wrap offsets: `dx = drift * W` (existing horizontal drift, `drift` in `[0, 1)`), `dy = (scrollSource.y * STAR_SCROLL_PARALLAX_FACTOR) mod H`. Copies sit at `(dx, dy)`, `(dx - W, dy)`, `(dx, dy - H)`, `(dx - W, dy - H)`; with `dx` in `[0, W)` and `dy` in `[0, H)` their union covers the viewport at every scroll position (pure `starScroll.js` exposes `starOffsets(scroll, factor, W, H, drift, out)` and `coversViewport(...)`; `check-snap.mjs` asserts coverage on a grid, AC-39). Stars move up with scroll at 0.15 x the scroll distance (slow, reads as distant) plus the existing pointer shift.
  - Point sizes still `STAR_SIZE_CSS_PX * viewport.dpr`.
- DPR and buffers (FR-42): `bufferLimits.js`: remove `capCssHeight`; `fitsAtDprOne(cssWidth, cssHeight, maxDim)` now checks both dimensions; `computeDpr` and the budgets are unchanged. `DprController` calls the new signature (`onUnfit()` -> poster fallback if the viewport itself exceeds the device limit). `PageCanvas` drops the `maxHeight` style. Expected: 1920x1080@2 = 8.3 M px, 1440x900@2 = 5.2 M px, both under the 16 M desktop budget, so DPR is `min(deviceDpr, 2)`; 375x812@3 coarse = 1.2 M px under 8 M, so 2.
- `scripts/check-buffer-limits.mjs`: remove the `capCssHeight` check; heights list becomes viewport heights (`[568, 600, 720, 812, 900, 1080, 1440, 2160]`) and widths add 3840; replace the three page-tall cases (1920x4000, 375x4500, 375x6000) with: 1920x1080@2 and 1440x900@2 reach DPR 2 under the desktop budget; 375x812@3 coarse reaches DPR 2; 3840x2160@2 desktop budget gives DPR below 2 within budget; `fitsAtDprOne(5000, 900, 4096)` and `fitsAtDprOne(1920, 5000, 4096)` are false and `fitsAtDprOne(4096, 4096, 4096)` is true.
- Dev instrumentation (all `import.meta.env.DEV`): `devStats` gains `moonCyViewport`, `introScale`, `moonRadius`; `window.__planetInfo()` returns them. A dev-only `devSyncProbe.js` (enabled by `window.__syncProbe = true`, set by `sdd-browser`) records per ticker tick `[moonCyViewport, heroRect.top + heroRect.height/2]` after `FrameDriver`, for AC-38. It reads `getBoundingClientRect` only when the flag is on (verification mode), never in normal DEV or production runs. `window.__snapInfo()` (from `snapController`) returns `{ active, index, moving, points, moves, settles, listeners }` for AC-5, AC-6, AC-8, AC-14.

### D-L Reduced-motion and below-threshold paths
- Reduced motion: no Lenis, no canvas (existing), `SnapScroller` inactive (no listeners, no timers), `SectionArrows` render `null`, `scrollToSection` falls back to `scrollIntoView()`, intro skipped, hamburger transition off. `data-snap-layout` still `on` at desktop sizes, so sections are 100 svh (D-6). Hero wrap still applies (it depends on width only) with the poster.
- Below thresholds (width under 1024 or height under 700): no listeners, no arrows, no settle; Lenis smoothing as today; `scrollToSection` uses `lenis.scrollTo`; layout is today's content-sized layout (`snap:` variants off); Hero wrap off below 1024 wide.
- Runtime change of either condition: `SnapScroller`'s effect cleanup removes every listener and timer and cancels a move at its current position (FR-11); `data-snap-layout` flips through the `matchMedia` `change` handler.

### D-M Entry-chunk and structure rules
`src/lib/*` and `src/hooks/*` import no three/R3F; `src/three/*` imports `gsap` (FrameDriver) and `src/lib` constants/stores (`moonSize`, `moonIntro`, `scrollSource`), none of which pull three into the entry chunk. `moonFraming.js` stays pure, so `src/lib/moonConfig.js` importing it adds no three code to the entry. `SnapScroller` and the controller live in the entry chunk (small).

## Tunable constants (FR-21 and the spec table) with chosen values
All pure JS, one commented module per group (`snapConfig.js`, `moonConfig.js`, `navConfig.js`, `arrowConfig.js`).
| Constant | Value | Why |
|---|---|---|
| `SNAP_MIN_WIDTH_PX`, `SNAP_MIN_HEIGHT_PX` | 1024, 700 | Spec. 1024 matches the existing `lg` layout; 700 keeps navbar + Hero + 44 px arrow clear of the moon (worst-case gap 23 px at 1920x700). |
| `SNAP_DURATION_S` | 1.0 | Mid of the allowed 0.7 to 1.2 s; long enough to read as a glide, short enough not to feel slow. |
| `SNAP_EASE` | `easeInOutCubic` (pure function) | Exact endpoints, symmetric, matches the "smooth section move" feel; GSAP's `power3.inOut` equivalent. |
| `SNAP_COOLDOWN_MS` | 200 | Covers late tail events on Windows precision touchpads right after a move ends. |
| `SNAP_GESTURE_GAP_MS` | 100 | Trackpad streams emit every 16 to 30 ms (never 100 ms quiet); a notched wheel is 50 to 150 ms between notches, so a new notch after a move is accepted. |
| `SNAP_NEW_GESTURE_RATIO`, `SNAP_NEW_GESTURE_MIN_DELTA` | 2, 40 | A decaying tail never rises 2x; a flick on top of a tail does, but only counts above a noise floor of 40 px delta. |
| `SNAP_WHEEL_NOISE_DELTA` | 2 | Ignore micro deltas (still prevented). |
| `SNAP_SETTLE_DEBOUNCE_MS` | 200 | Longer than any frame gap in touch momentum (16 ms) and scrollbar drags; short enough to feel immediate. |
| `SNAP_POSITION_EPSILON_PX` | 1 | Spec tolerance for "on target". |
| `SNAP_FOCUS_WINDOW_MS` | 600 | A focus-caused scroll starts within a frame or two; 600 ms covers smooth-scroll style delays. |
| `HERO_REF_WIDTH_PX`, `HERO_REF_HEIGHT_PX` | 1920, 1080 | Spec. |
| `NAVBAR_REF_HEIGHT_PX` | 61 | Current navbar height; used only to derive `MOON_REF_RADIUS_PX`. |
| `MOON_REF_RADIUS_PX` | about 404.8 (derived) | Current rendered radius at 1920x1080. |
| `MOON_SCALE_FACTOR` | 0.9 | Spec. |
| `MOON_MIN_RADIUS_PX` | 128 | At 375x812 gives a 256 px moon (about 43% of today's 596 px) that still reads clearly; stays below the plain rule's smallest desktop value (194 px at 1024x700) so desktops are never affected. |
| `MOON_SIDE_MARGIN_PX` | 24 | At 320 px wide the ceiling is 136 px radius, above the floor, so the floor wins and leaves 32 px each side; it only binds below about 304 px wide. |
| `MOON_INTRO_START_SCALE`, `MOON_INTRO_DURATION_S` | 0.6, 3 | Spec. |
| `MOON_INTRO_EASE` | `power2.out` | Decelerating "approach". |
| `HERO_WRAP_MARGIN_PX` | 20 | Includes the 3 px outline; keeps the arrow-to-moon gap at 1920x700 (23 px) above it. |
| `HERO_WRAP_MIN_WIDTH_PX` | 1024 | Spec default; matches the Hero `lg` layout. |
| `HERO_COLUMN_GAP_PX`, `HERO_COLUMN_BOTTOM_PX` | 24, 24 | Amended 2026-10-21 by user request. Text-to-moon gap and bottom space (covers the 3 px outline). Added to `moonConfig.js`. |
| `HERO_H1_RADIUS_RATIO` | 0.26 | See D-I; tuned against AC-19. |
| `SECTION_ARROW_OFFSET_PX`, `SECTION_ARROW_SIZE_PX` | 16, 44 | 44 px hit area; 16 px edge offset keeps the 1920x700 gap above 20 px. |
| `NAV_MENU_BREAKPOINT_PX` | 640 | See D-J (about 146 px of slack). |
| `STAR_SCROLL_PARALLAX_FACTOR` | 0.15 | Slow distant layer; about half a viewport of shift over the whole page. |
| `STAR_DENSITY_PER_MPX` | 500 (proposal) | Baseline measurement in step 0 sets the final value so on-screen density at 1440x900 is within 25% of today (about 640 stars per viewport from 2000 over the current page-tall canvas); capped at 2000 desktop and 800 coarse. |

Moon size check against the spec sizes (diameter = 2 x radius, from the formula; verified by `check-moon.mjs`):
| Size | Plain radius | Final radius | Diameter | Note |
|---|---|---|---|---|
| 1920x1080 | 364.3 | 364.3 | 728.6 | = 0.9 x 810 (AC-16) |
| 1440x900 | 273.2 | 273.2 | 546.5 | 0.75 x 728.6 |
| 1366x768 | 259.1 | 259.1 | 518.2 | 0.711 x 728.6 |
| 1280x720 | 242.9 | 242.9 | 485.7 | |
| 1920x700 | 236.1 | 236.1 | 472.2 | 0.648 x 728.6, fits Hero (639 px) |
| 1024x768 and 1024x700 | 194.3 | 194.3 | 388.6 | floor and ceiling inactive |
| 375x812 | 71.2 | 128 | 256 | OBSOLETE below 1024 (amended 2026-10-21 by user request): use the column rule (FR-23); plain rule shown for reference only |
| 320x568 | 60.7 | 128 | 256 | OBSOLETE below 1024, same as above |
Plain-rule floor binds only below about 632 px wide (and short windows); ceiling only below about 304 px. Below 1024 wide the column rule applies: ceiling binds at 375x812 (163.5) when `fitR` is larger; at 320x568 and 812x375 `fitR` is below the floor so the floor (128) wins and the Hero grows past the viewport. `check-moon.mjs` asserts these cases with a measured-style `textH` input.

Arrow-to-moon gap check (arrow top edge = `vh - 16 - 44`, moon bottom = `61 + (vh - 61)/2 + R`): 1920x700: 23.4 px (worst case); 1366x768: 34.4 px; 1920x1080: 85 px; 1440x900: 86 px; 1024x700: 65 px; 1024x768: 99 px. All at or above `HERO_WRAP_MARGIN_PX` (20); `check-moon.mjs` asserts this.

## Files to create/modify
Create:
- `src/lib/snapConfig.js`, `src/lib/snapMath.js` (nearestIndex, stepIndex, easeInOutCubic, classifyWheel, shouldHandleKey, normaliseWheelDelta, settleTarget), `src/lib/snapStore.js`, `src/lib/snapController.js`, `src/lib/scrollSource.js`
- `src/lib/moonConfig.js`, `src/lib/moonSize.js`, `src/lib/moonIntro.js`, `src/lib/heroIntro.js`, `src/lib/heroWrap.js`, `src/lib/layoutVars.js`, `src/lib/navConfig.js`, `src/lib/arrowConfig.js`
- `src/hooks/useMediaQuery.js`, `src/hooks/useSnapState.js`, `src/hooks/useSectionScroll.js`, `src/hooks/useHeroWrap.js`
- `src/components/SnapScroller.jsx` (renders null; owns the controller lifecycle), `src/components/SectionArrows.jsx`, `src/components/NavMenuToggle.jsx` (hamburger button)
- `src/three/FrameDriver.jsx`, `src/three/starScroll.js`, `src/three/devSyncProbe.js`
- `src/assets/icons/arrow-down.svg` (marked placeholder), `src/assets/icons/README.md`
- `scripts/check-snap.mjs`, `scripts/check-moon.mjs`
- `specs/005-scroll-snap-hero-navbar/baseline.md`
Modify:
- `src/main.jsx` (call `initLayoutVars()` before render)
- `src/App.jsx` (mount `SnapScroller`)
- `src/components/SmoothScrollProvider.jsx` (prioritised Lenis tick, write `scrollSource`)
- `src/components/ScrollToHash.jsx` (use `scrollToSection`, immediate on initial hash)
- `src/components/Navbar.jsx` (remove link, desktop/mobile modes, `--nav-h` observer)
- `src/index.css` (`@custom-variant snap`, `--nav-h` default, `.hero-moon-float`, mask-icon class, hero poster box)
- `src/pages/HomePage.jsx` (mount `SectionArrows`)
- `src/components/sections/Hero.jsx` (CTA removed, wrap structure, poster box, new timeline, markers, sizing; amended 2026-10-21 by user request: column mode with `.hero-moon-slot`, poster box inside the slot)
- (amended 2026-10-21 by user request) `src/hooks/useHeroColumn.js` (create), `src/lib/moonSize.js` (`moonColumnRadiusPx`, store column input), `src/lib/moonConfig.js` (gap/bottom constants), `src/three/useHeroMetrics.js` (anchor = slot in column mode), `scripts/check-moon.mjs`
- `src/components/sections/Projects.jsx`, `AboutMe.jsx`, `TechStack.jsx` (markers, `tabIndex`, `snap:` sizing only; content unchanged)
- `src/three/PageCanvas.jsx` (fixed wrapper, no `maxHeight`, `frameloop="never"`, `FrameDriver`, `activeRef`)
- `src/three/PageScene.jsx` (per-frame anchoring, 4-copy stars, `userData.regionRadius`, remove `useScrollMetrics` and `version`)
- `src/three/StarLayer.jsx`, `src/three/starfield.js` (shared geometry/material, draw range, count helper)
- `src/three/useHeroMetrics.js` (`cxVp`, `cyDoc`, observe header, no state)
- `src/three/OutlineLayer.jsx`, `src/three/outlineRegion.js` (`out` param, resize/reposition split, `regionRadius`)
- `src/three/DprController.jsx`, `src/three/bufferLimits.js` (both-dimension fit, drop `capCssHeight`)
- `src/three/CanvasGuard.jsx`, `src/three/devStats.js` (dev hook fields)
- `scripts/check-buffer-limits.mjs`, `scripts/check-cel.mjs` (add `out` param and unchanged-region asserts)
- `package.json` (scripts only: `check:snap`, `check:moon`; dependencies unchanged)
Delete: `src/three/useScrollMetrics.js`.
Unchanged: `SplitHeading`, `useSectionReveal`, `usePrefersReducedMotion`, `lib/gsap.js`, `ViewerPage`, `PosterCapture` (still uses `moonRadiusPx(1200)`), cel shader modules, `webgl.js`.

## Data / interfaces
- `snapStore` snapshot: `{ active: boolean, index: number, labels: string[] }` (new object on change; `useSnapState()` returns it).
- `snapController`: `attach(lenis)`, `setActive(bool)`, `refresh()`, `goTo(target, { immediate? })`, `getSection(i): HTMLElement`; internal listener count in DEV.
- `useSectionScroll(): (target, opts?) => void`.
- Section marker contract: `<section data-snap-section data-snap-label="Projects" tabIndex={-1}>` in DOM order; the first marked section's snap point is forced to 0.
- Nested scroller contract: `data-lenis-prevent` (or `data-snap-ignore`) on any element that must keep its own wheel scrolling.
- `moonFinalRadiusPx(vw, vh): number`; `getMoonRadius(): number`; CSS vars on `<html>`: `--moon-r`, `--moon-poster-side`, `--nav-h` (header observer), `data-snap-layout`; on the Hero: `--wrap-size`, `--wrap-mt`, `--wrap-mr`, `--wrap-pt`.
- `moonIntro: { scale }`; `heroIntro: { timeline | null }`; `scrollSource: { y }`.
- `computeOutlineRegion(params, out?)`; `fitsAtDprOne(w, h, maxDim)`; `starOffsets(...)`, `coversViewport(...)`, `starCountFor(w, h, cap, density)`.
- Dev globals: `window.__planetInfo()` (extended), `window.__snapInfo()`, `window.__syncProbe` flag.

## Dependencies
None added (spec NFR-3). Every need is met by installed packages: Lenis (animation and scroll source), GSAP (intro and ticker), R3F `advance`, `matchMedia`, `ResizeObserver`, CSS `shape-outside` and `mask-image`. No SVGR (icon via CSS mask). If the builder finds `lenis.scrollTo` cannot express retargeting or `immediate` cancel as planned, the fallback is still Lenis (`stop()`/`start()` reset), not a new package.

## Risks
- Same-frame render (FR-39). Depends on Lenis tick running before `advance` and on R3F honouring `advance` timestamps. Mitigation: prioritised Lenis tick, driver registered later, builder verifies `advance` unit and subscriber execution; fallback is `frameloop="always"` reading `scrollSource.y` (one-frame lag possible; flag to the owner). Native compositor scrolling (scrollbar drag) can show a one-frame offset by design (spec allows).
- `lenis.scroll` currency. If it is stale when native scrolls arrive, anchoring shifts. Mitigation: AC-38 probe covers snap, fast Lenis and settle; fallback read `window.scrollY` inside the ticker (one cached read per tick, flagged against NFR-2).
- Gesture classification on real hardware (macOS inertia, Windows precision touchpads, mice with free-spin wheels). The pure classifier is script-tested with synthetic streams, but real devices need a manual pass; constants are named for tuning.
- Firefox scrollbar drag and settle (Spec issue 2); manual check on Firefox.
- Text-wrap overflow. `inline-block` heading words cannot break; a wide word on a narrow line could intrude into the moon margin. Mitigation: heading size tied to the moon radius (`HERO_H1_RADIUS_RATIO`), geometry AC at six sizes, ratio tweak is one constant.
- Vertical text centring versus wrap. `--wrap-pt` depends on measured text height which depends on wrapping; mitigated by hysteresis and a pass cap; centring error is cosmetic only.
- Outline cost with a moving anchor. Region now repositions during scroll; handled by resize/reposition split and `out` params; the AC-41 trace and dev counters check no allocation and no render-target resize per frame.
- Star density and wrap seams. Density is tuned from a measured baseline; four-copy wrap is script-checked for coverage. Draw range changes with window size keep stars stable (same seeded order).
- Browser zoom and `innerHeight` on mobile. (Amended 2026-10-21 by user request: the column rule uses `innerHeight` on phones, so the store ignores height-only changes under 120 px at unchanged width; URL-bar collapse does not resize the moon.) On desktop the moon uses `innerHeight` only when height-limited; desktop zoom changes `innerWidth/Height` and the thresholds, handled by listeners.
- Hover/active states for arrows rely on CSS only; `inert` support is universal in evergreen browsers (spec target).
- Page height now 4 viewports and sections `snap:content-center`: any future section taller than the viewport still grows (FR-17); 006 redesigns them.
- Touch settle (D-10) could feel like soft snapping on iPad landscape; it is an owner decision and tunable via `SNAP_SETTLE_DEBOUNCE_MS`.
- StrictMode: all effects are add/remove symmetric (listeners, timers, ticker callbacks, observers, GSAP contexts); counters in `__snapInfo` verify stability over 10 route round trips.
- React Router `location.key` for hash retarget: same-URL link clicks create a new key (verified by AC-5/AC-13); fallback adds an explicit `onClick` that calls `scrollToSection`.

## Test strategy (maps to AC-n)
Legend: S = Node script (`npm run ...`), G = grep or code inspection, B = `sdd-browser` (dev server, emulation, screenshots, console, evaluated scripts such as synthetic `WheelEvent`s), M = manual by the owner (real hardware).
New scripts (no test framework in the repo):
- `npm run check:snap` (`scripts/check-snap.mjs`): `nearestIndex` and `stepIndex` ends; `easeInOutCubic(0)=0`, `(1)=1`, monotonic; `classifyWheel` on synthetic streams: a mouse notch accepted, 10 events at 50 ms during a move ignored, a decaying 60-event trackpad stream (starting large, 1.5 s) accepted exactly once, a second gesture after a 150 ms pause accepted, a rising flick on a tail accepted, noise and Ctrl ignored; `shouldHandleKey` matrix (keys, Shift+Space, modifiers, input/textarea/button/role cases, `repeat`); `settleTarget` (nearest, focus override, epsilon no-op); star wrap `coversViewport` on a grid of scroll values, sizes and drifts; `starCountFor` caps and monotonicity.
- `npm run check:moon` (`scripts/check-moon.mjs`): `moonFinalRadiusPx` table above within 0.5 px; floor inactive and ceiling inactive at or above 1024x700; 375x812 and 320x568 margins at least 24 px and diameter under 596; poster side equals the radius over the framing constant; `wrapGeometry` circle centre equals the Hero centre (x and y) on a grid of Hero sizes; (amended 2026-10-21 by user request) `moonColumnRadiusPx` cases at 375x812, 414x896, 768x1024 (text + gap + diameter fit `vh`), 320x568 and 812x375 (floor wins), width ceiling never exceeded, URL-bar rule (height change under 120 px keeps the radius); arrow-to-moon gap at the six test sizes is at least `HERO_WRAP_MARGIN_PX`; constants sanity.
- `npm run check:buffer` (updated) and `npm run check:cel` (extended).
Mapping:
- AC-1: S (`build`, `lint`, `check:buffer`, `check:snap`, `check:moon`, `check:cel`), G (`package.json` dependencies unchanged), B (console clean on `/` and `/viewer`).
- AC-2: B (rects at 1920x1080 for each section after each snap).
- AC-3: B (synthetic wheel gestures at 1920x1080, 1440x900, 1366x768); S for the classifier logic.
- AC-4: B (synthetic key events incl. `input` and focused arrow, Ctrl cases); S for `shouldHandleKey`.
- AC-5: B (synthetic wheel and key events mid-move, navbar and arrow click and `history.back()` mid-move, `__snapInfo().moves`); S (classifier).
- AC-6: S (synthetic stream), B (replay the stream with timed `dispatchEvent`), M (real trackpad).
- AC-7: B (scroll samples at move end, duration from `performance.now`).
- AC-8: B (scrollbar drag emulation via `window.scrollTo` plus mouse-down state; settle timing from `__snapInfo`), M (real scrollbar drag, Chrome and Firefox).
- AC-9: B (Tab to off-screen link, `activeElement` check, scratch `input`, find-in-page emulation by `scrollIntoView` of a text node, reload mid-page), G (no `focus()`/`blur()` in settle code).
- AC-10: B (matrix of sizes, reduced-motion and touch emulation; DOM and a11y tree check for arrows; touch settle with emulated touch events), G (no touch `preventDefault`).
- AC-11: B (resize sequences with a move in flight, console), G.
- AC-12: B (animation timing equality, Lenis path at 1000x900 for links, reduced-motion jump).
- AC-13: B (loads of `/#about`, `/#tech-stack`, `/viewer` to `/#projects`, `/#nonexistent`, back/forward).
- AC-14: G (one Lenis, no new scroll lib), B (`__snapInfo().listeners` stable over 10 route round trips, reveal visibility timing).
- AC-15: G (no fixed heights or overflow hidden), B (scratch tall block, then revert).
- AC-16: S (`check:moon`), B (pixel measurement of moon bounds against the baseline).
- AC-17: S (`check:moon`), B (screenshots and rect checks at 375x812, 320x568). Amended 2026-10-21 by user request: below 1024 wide the radius check is AC-20's.
- AC-18: B (poster-only and reduced-motion measurements vs canvas at four sizes; crossfade capture), G (shared function).
- AC-19: B (per-line `Range.getClientRects` at six sizes against the circle; poster-only and mid-intro runs), S (`wrapGeometry` centre).
- AC-20: S (`check:moon` column cases), B (column layout, text/moon rect separation, poster and canvas centre parity at 375x812, 414x896, 768x1024, 812x375; DOM absence of the CTA and arrows), G (no "View projects" in source). Amended 2026-10-21 by user request.
- AC-21, AC-22, AC-23: B (arrow presence, coordinates, names, focus moves), G (one SVG, CSS rotation), M (visual feel of hover/focus states).
- AC-24: S (`check:moon` gaps), B (screenshots at six sizes).
- AC-25: B (transition properties, reduced-motion before load, runtime toggle), G (no `arrow-up`).
- AC-26: G (file, README, mask approach), B (scratch swap of the SVG then revert).
- AC-27, AC-28: B (sampled `moonIntro.scale`/poster transform over time, timing to the arrow's final state), G (GSAP only, outline constants untouched, stage tween removed).
- AC-29, AC-30: B (route round trip, StrictMode dev, Slow 3G throttle, reduced-motion load, console), G (no default hidden CSS).
- AC-31, AC-32: B (DOM and rect checks; rows at 639/640/641/1024/1280/1920 incl. `scrollWidth`).
- AC-33, AC-34, AC-35: B (menu keyboard and focus script, `aria-expanded`, a11y tree, layout before/after open), M (screen-reader spot check).
- AC-36: B (canvas rect, position, `scrollHeight` with and without canvas, `elementFromPoint`), G (no document-height observer or `maxHeight` in sizing).
- AC-37: B (`__planetInfo()` at the four emulated cases plus before values in `baseline.md`), S (`check:buffer`).
- AC-38: B (`window.__syncProbe = true`, per-frame log through a snap, a fast scroll at 1000x900, a settle, a deep-link return; outline gap capture), M (scrollbar drag feel), G (no layout reads in `useFrame`).
- AC-39: S (`coversViewport`, `starCountFor`), B (screenshots at 0/25/50/75/100% scroll, density compare with the pre-change screenshot, runtime count), G (no per-frame allocation).
- AC-40: B (003 AC-27 fallbacks, context loss and restore with anchoring, hidden-tab pause, 10 route round trips, oversize viewport emulation), S (`check:buffer`), G (entry chunk free of three, from `build` output).
- AC-41: B (performance trace of a snap at 1440x900; long-task check), G (inspection of `useFrame`, ticker and handlers).
- AC-42: B (keyboard-only sweeps at both sizes), M (screen-reader names).
- AC-43: G (token-only classes, file separation, no three import outside `src/three`), B (scratch threshold edit changes both JS and CSS behaviour, then revert).
`baseline.md` records, before any code change: moon diameters at 1920x1080, 1440x900, 1366x768, 375x812; canvas size and effective DPR at 1920x1080 and 1440x900 (DPR 2); page height; star count and on-screen star density at 1440x900 scroll 0; build chunk sizes; then the same after.

## Order of work
0. Baseline measurements into `baseline.md` (above), before any code changes.
1. Pure libs and constants (`snapConfig`, `snapMath`, `moonConfig`, `moonSize`, `heroWrap`, `starScroll`, `navConfig`, `arrowConfig`) with `check-snap.mjs` and `check-moon.mjs` and the `package.json` scripts. Update `bufferLimits.js` and `check-buffer-limits.mjs` here too (pure).
2. `layoutVars.js` and `main.jsx`; `index.css` variant and vars; section markers and `snap:` sizing; `Hero` height uses `--nav-h`; `--nav-h` observer in `Navbar`. Verify AC-2 and AC-10 layout part.
3. Scroll plumbing: Lenis prioritised tick and `scrollSource`; `snapStore`, `snapController` (moves, wheel, keys, retarget), `SnapScroller`, `useSectionScroll`, `ScrollToHash`. Verify AC-3 to AC-7, AC-12, AC-13.
4. Settle (held tracking, focus override) and resync/threshold handling. Verify AC-8, AC-9, AC-11, AC-14.
5. `SectionArrows` and the placeholder asset and README. Verify AC-21 to AC-26.
6. Navbar: remove link, `useMediaQuery`, mobile menu. Verify AC-31 to AC-35.
7. Fixed canvas: `FrameDriver`, `PageCanvas`, `PageScene` anchoring, `useHeroMetrics`, `OutlineLayer`/`outlineRegion` changes, stars, `DprController`, dev hooks. Verify AC-36 to AC-41 (anchoring and stars) and `check:cel`.
8. Hero: moon size/poster box, wrap structure, intro timeline and arrow slot. Verify AC-16 to AC-20, AC-27 to AC-30. Then (amended 2026-10-21 by user request) the below-1024 column layout (T-38, T-39).
9. Full regression: lint, build (entry chunk free of three), all `check:*`, 10 route round trips, reduced-motion and fallback matrix, `baseline.md` after-values, owner manual pass (real trackpad, Firefox scrollbar, SVG swap).

## Requirement traceability
| Req | Satisfied by |
| --- | --- |
| FR-1, FR-9 | `[data-snap-section]` discovery, `nearestIndex`, labels in store (D-B, D-F) |
| FR-2, FR-16, FR-18, NFR-6 | `SNAP_QUERY`, `data-snap-layout`, `snap:` variant, `useSnapActive` (D-E, D-L) |
| FR-3, FR-4, FR-5 | capture wheel listener, `classifyWheel`, `shouldHandleKey`, `data-lenis-prevent` (D-A, D-B; Spec issue 1) |
| FR-6, FR-7, FR-8, FR-14 | Lenis `scrollTo`, state machine, gesture rules (D-A, D-B) |
| FR-10 | settle timer, held tracking, focus override (D-C; Spec issue 2) |
| FR-11 | resync, cleanup on deactivate (D-B, D-L) |
| FR-12, FR-13 | `scrollToSection`, `ScrollToHash` (D-D) |
| FR-15, FR-17 | in-flow navbar, `min-height` only (D-E) |
| FR-19, FR-20, FR-21 | `moonSize.js`, constants, poster box, `check-moon` (D-G) |
| FR-22, FR-23 | float with `shape-outside`, `wrapGeometry`, `useHeroWrap` (D-I) |
| FR-24 to FR-27 | `moonIntro` tween plus text label timeline, `heroIntro`, arrow slot (D-H) |
| FR-28 to FR-32 | `SectionArrows`, mask icon, CSS rotate transition, focus handling (D-F) |
| FR-33 to FR-37 | Navbar changes, JS-driven menu (D-J) |
| FR-38 to FR-42 | fixed wrapper, `FrameDriver`, scroll-anchored moon, wrapped stars, DPR and `check:buffer` (D-K) |
| NFR-1 | focus, names, `inert`, reduced-motion paths (D-F, D-J, D-L) |
| NFR-2 | cached metrics, `lenis.scroll`, observers, `out` params (D-K) |
| NFR-3 | Dependencies section |
| NFR-4 | file layout (Files to create/modify, D-M) |
| NFR-5 | fixed viewport buffer (D-K) |
| NFR-7, NFR-8 | token-only classes; lint, build and check scripts (Order step 9) |
