# 006 measurements

## Navbar breakpoint (D-L)

Task: T-31. Browser run via `sdd-browser` on a restarted dev server (localhost:5174, `/`). Console: no errors.

Decision: `NAV_MENU_BREAKPOINT_PX = 640` kept. `src/lib/navConfig.js` unchanged. Slack is >= 40, so no re-run at 768 was needed.

### Slack at 640x900

| Value | Result |
| --- | --- |
| brand `offsetWidth` | 49 |
| links group `offsetWidth` | 454 (margin -12px / -12px, effective 430) |
| column gap (`gap-x-4`) | 16 |
| nav horizontal padding (32 + 32) | 64 |
| `slack = 640 - (64 + 49 + 16 + 430)` | 81 (about 80.5 with fractional widths) |
| slack without counting negative margin | 57 |

Prediction was about 49 px. Measured value is higher.

Check: slack >= 40. **PASS**

### One row and no horizontal overflow

All items (Himar, Home, Projects, About, Contact, 3D Viewer) share `offsetTop` 8.

| Width | scrollWidth | innerWidth | Result |
| --- | --- | --- | --- |
| 640 | 640 | 640 | PASS |
| 641 | 641 | 641 | PASS |
| 1024 | 1009 | 1024 | PASS (15 px difference is the vertical scrollbar) |
| 1280 | 1265 | 1280 | PASS (15 px difference is the vertical scrollbar) |
| 1920 | 1905 | 1920 | PASS (15 px difference is the vertical scrollbar) |

### Mobile toggle at 639

| Check | Result |
| --- | --- |
| Desktop row | not rendered. **PASS** |
| Toggle | display flex, visible, 44x44. **PASS** |
| scrollWidth / innerWidth | 639 / 639. **PASS** |

## Fit and safe bands (T-32)

Task: T-32. Browser run via `sdd-browser` on a restarted dev server (localhost:5174, `/`). Page reloaded per size. Each section reached with one wheel tick and measured once after settling. Console: only the known THREE.Clock warning.

Method:
- Viewport width is clientWidth (excludes the scrollbar).
- (c) internal overflow exempts the carousel viewport `div.overflow-x-clip` (scrollWidth 2520 > clientWidth 1425 at 1440) and `span.sr-only`.
- (d) excludes the carousel's off-screen and horizontally peeking slides.
- (e) uses 72 px top and bottom bands over text nodes and a/button/input/textarea/select.
- Arrows: every SectionArrows button was tested against every text node and interactive element. Arrow results come from DOM rects; the screenshots were too small to judge the arrows.

Sizes: 1920x1080, 1920x700, 1440x900, 1366x768, 1280x720, 1024x768, 1024x700. Sections: Projects, About, Tech Stack, Contact.

### Checks that pass at every size and section

| Check | Result |
| --- | --- |
| (a) top 0 and height = innerHeight | PASS |
| (b) previous bottom 0, next top = innerHeight | PASS |
| (d) no rect outside the viewport (0 offenders) | PASS |
| (e) no text or interactive element in the 72 px bands (0 offenders) | PASS |
| Arrows visible with 0 overlaps | PASS. Contact shows only the previous arrow. |

Section heights at 1440x900 were 900 / 900 / 900 / 900. The other sizes pass (a).

### Fit per size and section

Cell = result of check (c) for that size and section. All other checks pass in every cell.

| Size | Projects | About | Tech Stack | Contact |
| --- | --- | --- | --- | --- |
| 1920x1080 | PASS | PASS | FAIL (minor, icon boxes) | PASS |
| 1920x700 | PASS | PASS | FAIL (minor, icon boxes) | PASS |
| 1440x900 | PASS | PASS | FAIL (minor, icon boxes) | PASS |
| 1366x768 | PASS | FAIL (content column, heading mask) | FAIL (minor, icon boxes) | PASS |
| 1280x720 | PASS | PASS | FAIL (minor, icon boxes) | PASS |
| 1024x768 | PASS | PASS | FAIL (minor, icon boxes) | PASS |
| 1024x700 | PASS | PASS | FAIL (minor, icon boxes) | PASS |

### Failures and files to fix

| # | Check | Where | Measured | Likely file | Impact |
| --- | --- | --- | --- | --- | --- |
| 1 | (c) internal overflow | Tech Stack, all 7 sizes: 5 `span.size-10.shrink-0` icon boxes | scrollHeight 47 > clientHeight 40, overflow visible | `src/components/sections/TechStack.jsx` (icon SVG or line-height inside the 40 px box) | None visible. Minor FAIL of the strict (c) rule. |
| 2 | (c) internal overflow | About at 1366x768: `div.flex.min-w-0` | scrollHeight 383 > clientHeight 371 (+12 px) | `src/components/sections/AboutMe.jsx` (content column) | None on safe bands or viewport. |
| 3 | (c) internal overflow | About at 1366x768: heading word-reveal mask `span.inline-block.overflow-hidden` | 77 and 84 > 60 | Likely `src/components/sections/AboutMe.jsx` (not confirmed; check where the mask is defined) | None on safe bands or viewport. |

Projects at 1920x1080 and 1280x720: word-mask overflow (96 > 45) was seen only mid-transition. Settled measurements are clean, so pass.

### Scratch overflow tests at 1024x700 (DOM injection, no file edits, reverted by reload)

| Scratch case | a | c | d | e | Arrows |
| --- | --- | --- | --- | --- | --- |
| Tech list: 3 lists grown to 5 items each (15 items) | ok | only the icon-box 47 > 40 (same as failure 1) | 0 | 0 | ok |
| About bio: first paragraph replaced by 553 chars of lorem, second emptied (total about 553, not 600) | ok | none | 0 | 0 | ok |

### Contact (f)

| Check | Result |
| --- | --- |
| Footer bottom edge distance from viewport bottom (limit 40) | 0 px at every size. PASS |

Vertical centre of the form vs the band centre:

| Size | Form centre | Band centre | Difference |
| --- | --- | --- | --- |
| 1920x1080 | 546 | 540 | 6 |
| 1920x700 | 356 | 350 | 6 |
| 1440x900 | 456 | 450 | 6 |
| 1366x768 | 390 | 384 | 6 |
| 1280x720 | 366 | 360 | 6 |
| 1024x768 | 390 | 384 | 6 |
| 1024x700 | 356 | 350 | 6 |

The difference is 6 px at every size. The report does not restate the pass threshold for this check; confirm it against the spec.

Horizontal note: the form is the right column of a 2-column block, offset +174 to +176 px from the viewport centre. The whole block is centred (504.5 vs 504.5 at 1024). So the form area is centred as part of a centred 2-column block. Whether the condition means the block or the form alone is for human review.

### Not verified

- Reduced motion at 1440x900: NOT VERIFIED. The browser tool cannot emulate `prefers-reduced-motion`. Normal-run section heights were 900 / 900 / 900 / 900.

### Observations and caveats

- At 1366x768 (About to Tech Stack) and 1280x720 (Hero to Projects), a single wheel tick had not settled or moved after 1.5 s. Those sections were re-measured from the other direction.
- A resize without a reload left the snap offsets 64 px stale, so the page was reloaded per size. This relates to 005 resize handling (005:T-23). It was not tested further and needs follow-up.
- Evidence: 1440x900 screenshots are in the session tool-results folder. The report does not give their path.
- Rect values were recorded per check, not as full per-cell rect tables. The only numeric rects kept are the section heights and the Contact centres above.

Result: no failures in (a), (b), (d), (e) or arrows. Two (c) failures are open (failures 1 to 3). Reduced motion is not verified.

## Carousel layout, loop, buttons and dots (T-33)

All runs are real (dev server on 5173).

### AC-6 layout (real data, N=3): PASS at all 7 sizes

| Size | Centre image width (px) | Side visible fraction | Gap (px) |
| --- | --- | --- | --- |
| 1920x1080 | 1022 | 0.455 | 30.9 |
| 1440x900 | 734 | 0.455 | 50.1 |
| 1366x768 | 522 | 0.758 | 64 |
| 1024x700 | 414 | 0.635 | 64 |
| 1920x700 | 414 | 1.0 (fully visible) | 378 (exempt, fully visible) |
| 1280x720 | 446 | 0.874 | 64 |
| 375x812 | 301 | 0.09 (24 px peek, mobile) | 12 |

- Side cards: opacity 0.4, scale 0.88. Frame ratio 1.600. The viewport reaches both window edges. Order is image > title > description.
- The 400 px rule (desktop) and the 700 px rule (1920x1080, 1440x900) are met.
- NOTE: at 375 the side fraction 0.09 is below 15%. Recorded as a mobile peek for the user to judge.
- No-gap scratch (case E, first description removed): PASS. Content block was 60 px unscaled (h3 28 + padding 32) against 88 px with a description, so no reserved space remains. Controls are 8 px below the card and above the 72 px band.

### AC-7 loop: PASS

- From index 0, Previous goes to 2 (enters from the left). Next x3 goes 1, 2, 0.
- 9 clicks 100 ms apart end on 0, with 1 active slot in each of 382 frames and no empty slots. Transition took 594 ms (target 600 +/- 100).
- Reduced motion: NOT VERIFIED.
- Scratch N=0: "No projects yet." (p.text-muted). No buttons or carousel, no console or validateProjects error, section 900 tall with no overflow, rest of page renders. PASS.
- Scratch N=1: one centred card, no side slots, buttons or dots, timers 0, no change over 6.5 s, link /projects/project-one, section 900. PASS. Note: paused showed "out-of-view" while the section was in view.
- Scratch N=2: n=2, pool=4. Next to 1, Next to 0, Prev to 1. 6 rapid clicks 1 to 1 (correct parity). 977 frames: 1 centre slot, left and right slots present, 0 violations. Autoplay about 5.0 s. 2 dots, 44x44, "Show project i of 2: ...", one aria-current, a dot click is one step. No console errors, section 900. PASS.
- Scratch N=12: n=12, pool=12. From 0, Previous to 11, entering from the left (translateX -742 to 0 over 218 frames). 12 Next return to 0. 36 Next 100 ms apart end on 0 (36 mod 12), 930 frames, 0 violations (autoplay paused by a real hover). PASS.
- N=3 is the real data above.

### AC-11 buttons: PASS

- Names "Previous project" / "Next project". aria-controls is the track (_r_0_).
- 44x44, outside the bottom band at every size, no overlap with each other, the title or the description.
- Default, hover and focus-visible computed styles differ. :active was checked only via its CSS rule (.active\:text-rim = #ffffff), not a live read.
- Icon-swap scratch (case E): Previous mask became the right chevron (M9 5 L16 12 L9 19), Next the left chevron. Names and behaviour unchanged. PASS (icons come from the imports).

### AC-12 dots and counter

- N=3: 3 dots 44x44, "Show project i of 3: <title>", exactly one aria-current, no role="tab", a dot click takes the shortest path (one step back). PASS.
- N>10 scratch (N=12): text counter "1 / 12" to "2 / 12" after Next, aria-hidden="true", no dot buttons, rect t766 b790, 38 px above the bottom band, no overlap with the buttons, card, title or description. PASS.
- Shortest-path jump with distance > N/2: NOT TESTABLE (no dots at N=12, no dev goTo).

### Open items for the user's review

- Besides transform and opacity, `visibility` toggles on the hidden slots and `inert` changes interactivity during transitions (likely source: src/hooks/useCarousel.js).
- Reduced motion: NOT VERIFIED.
- N=2 assistive tech count: AC-7 says only 2 slides, but the DOM exposes only 1 (the active slide; the other 3 pool slots are aria-hidden + inert). No duplicates, but not 2.
- FR-8 "the live region carries the news": the live region is the track div itself (aria-live polite), whose text is all slide titles and descriptions concatenated, including the inert clones. There is no concise "n of N" announcement.
- 375 side peek of 9% (below 15%).
- Shortest-path jump with distance > N/2 not testable.
- :active checked only via its CSS rule.
- N=1 paused showed "out-of-view" while the section was in view.

## Autoplay, pauses and timer restart (T-34)

Real runs at 1440x900, dev server on 5173, real mouse and keyboard input. Timestamps are performance.now ms from `__carouselInfo().advances` (a capped ring buffer).

### AC-8 autoplay interval

- Real data, pointer outside the carousel: auto at 76554, 81556, 86559, 91559, 96559, deltas 5002/5003/5000/5000. PASS.
- Scratch CAROUSEL_AUTOPLAY_MS=3000 (reverted, hash verified): auto at 12165.6, 15168.4, 18168.5, 21168.7, 24168.9, deltas 3002.8/3000.1/3000.2/3000.2. PASS.
- N<2: from the T-33 scratch N=1, timers 0 and no advance over 6.5 s. PASS (cross-ref T-33).

### AC-9 pauses (each held 12 s: 0 advances and timers 0)

- Hover: centre card, side card, Next button, dot, each paused=[hover]. PASS.
- Tab focus: Previous button, dot, card link, each paused=[focus]. PASS.
- After blur: paused=[] and timers=1.
- Click Next then move the pointer out: button@214660, paused=[], next auto@219695 (+5035). Repeat: button@325798, auto@330813 (+5015). PASS (D-21).
- document.hidden: emulated by overriding the document.hidden/visibilityState getters plus a visibilitychange event. paused=[hidden], timers 0, 0 advances in 12 s. Restored at ~241167, next auto@246167 (+5000). PASS (method: JS getter override, not a real tab switch).
- Out of view: scrollTo(0,0), paused=[out-of-view], timers 0, 0 advances in 12 s. Returned at ~265484, auto@270496 (+5012). PASS (done with window.scrollTo, not wheel snapping).
- Route change: card link to /projects/project-three, then 12 s. The hook unmounted (no __carouselInfo), so no advances are possible. Back: remounted with instances 1, listeners 10, observers 2, timers 1. The first auto came at 307141, about 5 s after the pointer left (~302.1k), because the pointer was still over the card on return. PARTIAL: the full interval from return is confounded by the hover.
- Reduced motion before load and runtime toggle: NOT VERIFIABLE (the tools cannot emulate prefers-reduced-motion; reducedMotion=false throughout).

### AC-10 timer restart (input about 3.3 to 4 s after an auto advance; need >= 4800 ms to the next auto)

- Next: auto 322142, input 325798, next 330813 (+5015). PASS.
- Previous: 345813, 349454, 354469 (+5015). PASS.
- Dot: 359470, 363103, 368119 (+5016). PASS.
- ArrowRight (focus on a dot): 383120, 386781, 391781 (+5000). PASS.
- Horizontal wheel: 450066, 453127, 458127 (+5000). PASS.
- Side-card click: 586229, 589573, 594579 (+5006). PASS.
- Swipe (left_click_drag 120 px across the centre card): AMBIGUOUS. No swipe entry was recorded in advances and no slide changed. Auto 573140, drag ~576.1k (estimated), next auto 581227 (~+5087 from the estimate). Either the synthetic drag did not register as a swipe, or the timer restarted without a move. NOT CONFIRMED.

### AC-29 (carousel part)

- NOT VERIFIABLE (reduced motion cannot be emulated).

Console: no errors in any run.

### Open items for the user's review

- Reduced motion (AC-9 l, AC-29 carousel part): NOT VERIFIED.
- Swipe timer restart: not confirmed (synthetic drag ambiguous).
- Route-return interval: confounded by the pointer hovering the card on return.
- document.hidden was emulated by a getter override, not a real tab switch.

## Carousel inputs, keyboard and semantics (T-35)

Setup: dev server on 5173, real data (n=3, pool of 6 slides). Autoplay "auto" advances are excluded from all slide counts. "Synthetic" means dispatched events, not real input devices.

### Run A (AC-13, AC-15, AC-17)

#### AC-15 wheel

- @1440x900, Projects at sY=900, sections 900 apart. Real vertical wheel (deltaY 198) over the centre card, a side card and the Next button: each sY 900 to 1800, 0 slides. PASS.
- Real horizontal wheel (deltaX 198): exactly 1 slide (kind wheel), sY unchanged, defaultPrevented true. PASS.
- 60-event decaying stream (synthetic; deltaX 80*0.9^i floor 1, deltaY 2, 16 ms apart): +1 slide. After a 700 ms pause a second stream: +1 slide. PASS (synthetic).
- Diagonal (30, 60) (synthetic): section 900 to 1800, 0 slides. PASS (synthetic).
- Ctrl+wheel (synthetic): no slide, no section move, not prevented. PASS (synthetic).
- 10 vertical wheels at 30 ms during a move (synthetic): one section only, 0 slides. PASS (synthetic).
- @1000x900 real: vertical moved 900 to 1098 (native/smooth, no snap, no slide); horizontal 1 slide, prevented. PASS.
- No data-lenis* attribute on any ancestor. PASS.

#### AC-13 touch

- @375x812 and 1440x900, synthetic touch PointerEvents: left 50 px +1 (kind swipe), right 60 px -1, left 30 px 0, vertical 100 px 0. PASS (synthetic).
- defaultPrevented false on all pointer events (passive window capture listener). PASS.
- Real mouse drag: pointercancel, no slide (inconclusive for touch).
- touch-action: the viewport element (div.overflow-x-clip, ancestor of the track) computes pan-y; the track and the link compute auto (not inherited). See open items.
- Swipe over the link: real mouse drag from the link at 375 left the URL unchanged; synthetic swipe + click on the link: click suppressed (preventDefault), +1 slide, URL unchanged. PASS.

#### AC-17 links

- @1440 real clicks on image, title and description each navigated client-side (window.__noReload survived; back worked). Title/description went to /projects/project-one; image went to /projects/project-two (autoplay likely advanced the centre just before the click). PASS.
- Enter on the link (focus() then real Return): /projects/project-one, no reload. PASS.
- One link per card (6 pool cards, stretched link after:inset-0), only 1 tabbable; accessible name = title, no aria-label. PASS.
- Side card real click: slid (kind side-click), URL stayed /, then a click on the now-centred card went to /projects/project-two. PASS.
- @375 mouse click on the right sliver (364,300): slid, no navigation. PASS (mouse, not a true tap).

Console errors: none.

### Run B (AC-14, AC-16) @1440x900, all real key presses, focus never programmatic

#### AC-14 keyboard

- Arrow keys on Previous, a dot and Next: +-1 slide each (kind key), focus stays on the button, never body. PASS.
- On the card link: ArrowRight target 4 to 5, focus moves to the new centre link (project-two to project-three); ArrowLeft goes back. PASS.
- Navbar focus ("Projects" link): ArrowLeft/Right 0 slides. PASS.
- Enter on the link: /projects/project-two client-side; back to /#projects, carousel remounts at target 0. PASS.
- Section snapping with focus on the link: ArrowDown 900 to 1800, ArrowUp 1800 to 900, PageDown 900 to 1800, Home 900 to 0, End 900 to 3600, ArrowUp steps 3600, 2700, 1800, 900; focus stayed on the link. PASS.
- Tab order (from navbar "3D Viewer"): card link, Previous project, dot 1 "Show project 1 of 3", dot 2, dot 3, Next project, Contact input. One card link per pass. PASS.
- Inactive slides: the 5 non-centre slides have 0 focusable descendants (inert="" + aria-hidden="true"); the centre has 1. PASS.
- Focus ring: drawn by card .group via has-[a:focus-visible]:outline-2, rgb(127,227,255) 2px solid, offset 2px; card rect [345,199,736,549]; wraps the whole card (screenshot). The link itself also shows a 2px outline (rect [362,676,105,26]). PASS.
- Notes: the first Tab onto the card link scrolled to y=1139 (browser scrollIntoView, not a snap), back to 900 on the next Tab. Tabbing navbar links briefly reported scrollY=0 (not investigated).

#### AC-16 semantics

- Region: role=region, aria-roledescription=carousel, aria-label=Projects. PASS.
- Slides: role=group, aria-roledescription=slide, aria-label "N of 3" (6 DOM slides: 1,2,3,1,2,3 of 3); inactive ones aria-hidden + inert. PASS.
- aria-live is on the track div; no aria-atomic; textContent 472 chars = all 6 slides' text including inert clones.
- aria-live states: idle autoplay "off" (12 s sample); hover pause "polite"; focus pause "polite"; after a manual step with focus "polite" (manual step without focus/hover not sampled); out-of-view "polite".
- Headings: H1 hero, H2 Projects, 6x H3 (3 titles x2, clones inside inert), H2 About Me, H2 Tech Stack (3 H3), H2 Contact; no skipped level. PASS.

Console errors: none.

### Open items for owner review

- touch-action pan-y is on the viewport element, not the track (PASS if the viewport counts).
- Real touch swipe, native vertical touch scroll and a true tap are not verifiable here (synthetic or mouse only).
- Image-click slug versus autoplay race (image click opened project-two).
- Live region contains clone text with no aria-atomic and no short "n of N" announcement (same as T-33).
- aria-live after a manual step without hover/focus was not sampled.
- First Tab onto the card link scrolls to 1139 (browser scrollIntoView).
- Navbar Tab scrollY=0 blip, not investigated.
- Screen-reader announcements need the owner's manual check (below).

### Manual screen-reader checklist (owner)

Use NVDA (Windows) and VoiceOver (macOS/iOS) where available.

- [ ] The Projects region is announced as a region named "Projects" with the role description "carousel".
- [ ] Moving into the centre slide announces it as a slide with "n of 3" (for example "1 of 3"), not "n of 6".
- [ ] The card link is announced with the project title as its name, once per card (no duplicate image or description links).
- [ ] Pressing Next, Previous or a dot (manual step) makes the live region announce the new slide; the announcement is understandable and not repeated or read twice.
- [ ] While autoplay is running and nothing is hovered or focused, nothing is announced; pausing by focus or hover does not cause unexpected speech.
- [ ] Clone slides (inert, aria-hidden) are never reached by browse mode, Tab or virtual cursor, and their text is not read as extra projects.
- [ ] Heading navigation (H key / rotor) lists H1, H2 Projects, 3 project H3 titles (no clone duplicates), H2 About Me, H2 Tech Stack, H2 Contact in order.
- [ ] Dots are announced as "Show project n of 3" and the active one is indicated.
- [ ] Activating the card link opens the project page and focus/announcement moves sensibly; Back returns to the Projects section.
- [ ] On mobile VoiceOver, swiping through the page reaches the card link, controls and dots in a sensible order and a double-tap on the card opens the project.

## Project pages, scroll behaviour and lifecycle (T-36)

Method: dev server localhost:5173, production preview localhost:4173 (`npm run build` + `npm run preview`). "Real" = computer click or browser Back; "programmatic" = JS or navigate.

### AC-18 (dev)

1. PASS. `/projects/project-one`: 1 h1 "Project title one", "Details coming soon.", no canvas, footer or scroll arrow; back link "Back to projects" href `/#projects`; navbar present. `/projects/does-not-exist`: 1 h1 "Project not found", "There is no project at this address.", back link `/#projects`, no canvas or footer.
2. PASS. Trailing slash `/projects/project-one/` renders the same page (URL keeps the slash).
3. PASS. Direct navigate and programmatic `location.reload()` both render (window marker gone after reload).
4. PASS. No horizontal overflow: 375x812 scrollWidth 375/375 on both URLs (reached by programmatic pushState + popstate, synthetic); 1920x1080 1920/1920 on both (real navigation).
5. PASS. 1440x900: real navbar Projects click, real card click to `/projects/project-three`, scrollY 0.
6. Scroll to section top, real clicks, |scrollY - section top|:
   - 1440x900 (snap animation): back link 0 (900), Projects 0 (900), About 0 (1800), Contact 0 (3600). PASS.
   - 1000x900 (Lenis): back link 0 (900), Projects 0 (900), About 0 (1741). Contact FAIL: scrollY 2470 = max scroll (scrollHeight 3370 - innerHeight 900), Contact top 2796, diff 326. Contact is 574 px tall (< 900 viewport), so its top cannot reach the viewport top; a layout consequence, not tested from a plain home-page Contact click.
   - Reduced-motion instant path: NOT VERIFIABLE (browser tools cannot emulate prefers-reduced-motion).
7. PASS. Real card click then real browser Back: URL `/#projects`, scrollY 900 (Projects top), `__carouselInfo` target 0, activeProject 0, on every round trip.

### AC-18 (production build + preview, port 4173)

- Direct load `project-one`: PASS (1 h1, no canvas/footer, back link `/#projects`).
- Trailing slash: PASS. `does-not-exist`: PASS. Reload: PASS (marker gone).
- Build: only the usual chunk-size warning (PageCanvas ~1000 kB).

### AC-32 runtime (dev, StrictMode)

10 round trips (real card click on the project-one link + real browser Back; first trip used the real "Back to projects" link).
- Baseline at Projects: timers 1 (autoplay), listeners 10, observers 2, instances 1.
- After every return: timers 0 (paused by hover), listeners 10, observers 2, instances 1, activeProject 0. PASS (stable).
- Console: no errors; only warning "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead."

### Open items for owner review

- Contact at 1000x900 does not reach its top (326 px short, page max scroll; Contact 574 px tall).
- Reduced-motion instant path NOT VERIFIABLE with the browser tools.
- 375 overflow checks were synthetic (pushState + popstate).
- THREE.Clock deprecation warning in the console.

## About, Tech Stack, Contact and footer (T-37)

Method: dev server localhost:5173 via sdd-browser. Scratch edits (about image, tech icons, 3x5 tech content, github.svg) were reverted and hashes re-checked.

### AC-19 (About)

- About text present. "Unchanged": NOT VERIFIED (no baseline to compare).
- 1440x900 (snap): frame 409.6x512, ratio 0.8, inside the bands (content 194..706). Placeholder div present. PASS.
- 768x900 and 1000x900 (non-snap, side by side from md) with the placeholder (aboutImage = null): grid columns compute to "639px 2px" and "871px 2px"; the image frame collapses to about 2x2.5 px. FAIL. The user chose to fix this later.
- 767 and 375: layout stacks, frame 320x400. PASS.
- Scratch 1 (reverted; about.js imported src/assets/hero-planet-poster.png, 1200x1200, alt "Scratch image"):
  - img width/height 1200, loading=lazy, no decoding attribute, object-fit cover, complete.
  - 1440: frame 409.6x512, ratio 0.8, inside bands 194..706, no placeholder. 375: frame 320x400.
  - 768 and 1000: frame 320x400. A real image avoids the collapse; only the placeholder collapses.
  - No errors.

### AC-20 (Tech Stack)

- Default content: 3 categories (Modeling 2, Game Dev 1, Web 2), 5 tools.
- Tile structure: li > span.size-10 icon slot plus name.
- Placeholder is an aria-hidden icon-mask span (span.icon-mask text-muted, rgb(154,166,192) = --color-muted); no literal alt.
- Use line computes 14 px with snap on, 16 px with it off. 0 tab stops.
- Scratch 2 (reverted; blender.svg tint:true, unity.svg untinted):
  - blender renders as SPAN.icon-mask.text-text with a data-URI mask and background-color rgb(232,236,245) = --color-text, not the SVG's red.
  - unity renders as `<img alt="" class="size-full object-contain">`, naturalWidth 150, complete, original green/blue fills in the src.
  - Placeholder tool keeps its muted mask. All slots 40x40, every tile 57 px tall.
  - No overflow at 375. No errors.
  - Pixel colours not sampled (screenshot came back blank); colours above are computed styles.
- Scratch 3 (reverted; 3 categories x 5 tools, 20-character names, every `use` exactly 40 characters, no icons):
  - At 1920x1080, 1920x700, 1440x900, 1366x768, 1280x720, 1024x768, 1024x700: snap layout on, section height = innerHeight, no neighbour visible.
  - Content about 539 px tall and centred. Top/bottom gaps in that order: 270.5, 80.5, 180.5, 114.5, 90.5, 114.5, 80.5; all at least the 72 px band.
  - Tiles 77 px. Use lines 14 px, wrap to 2 lines. Names on 1 line. No truncation, no horizontal overflow.
  - PASS at all 7 sizes.
  - Each of the 15 placeholder icon slots (span.size-10.shrink-0) has scrollHeight 47 vs clientHeight 40 (inline svg/baseline overflow of 7 px, not visibly clipped, no layout effect).
  - h2 (75 vs 74) and SplitHeading word spans (61 vs 60) are off by 1 px; read as rounding.
- Provenance comments next to logo imports: not checked in the browser (source check left to the reviewer).

### AC-21 (form): PASS

- name: autocomplete=name. email: type=email, inputmode=email. message: textarea, rows 4, maxlength 2000.
- All fields required. Form has novalidate. Labels use `for`. Fields 16 px; inputs 44 px tall. Single column at 375x812.

### AC-22 (validation): PASS

- Errors set aria-invalid and aria-describedby. Focus moves to the first invalid field. No role=alert.
- Error colour #e8707e = --color-error.
- Greyscale screenshot taken during the run (session tool-results).

### AC-23 (no send): PASS

- role=status message: "This form is not connected yet. Nothing was sent."
- Spies on fetch, XHR.send and sendBeacon recorded nothing; network log empty.
- URL, scrollY and field values unchanged. Status clears on edit; button stays enabled.

### AC-24 (textarea): PASS

- Short message: the wheel moves one section, no marker appears.
- 30 lines: data-lenis-prevent present and the textarea scrolls. Cleared: marker gone.
- Keys typed in the fields move nothing.
- Caveat: Contact is the last section, so a downward page move could not be shown.

### AC-25 (footer): PASS

- Footer is inside section#contact with a 0 px bottom gap; the form is centred.
- Text "© 2026 Himar". One contentinfo.
- Absent on /viewer and on project pages.
- At 320x568 it wraps and the links are 44 px.

### AC-26 (social links): PASS, except :active not exercised

- GitHub and itch.io only. hrefs https://github.com/ and https://itch.io/.
- target=_blank, rel="noopener noreferrer".
- Names "GitHub (opens in a new tab)" and "itch.io (opens in a new tab)".
- Links 44 px tall. Hover gives #e8ecf5; focus-visible shows a 2 px outline. :active NOT exercised.
- Icons are aria-hidden icon-mask spans, 20x20, loaded via URL import in socialLinks.js and rendered by IconMask (CSS mask).
- Scratch 4 (reverted; github.svg replaced by a solid currentColor disc r=10): footer GitHub mask data URI decoded to the scratch SVG with no JSX edit. itch.io control unchanged. No errors.

### AC-34 (contrast): PASS

- Error colour 6.76:1 against ink, 6.36:1 against surface.

### Console

Clean apart from the known THREE.Clock deprecation warning. No failed requests.

### Open items

1. FAIL: About placeholder frame collapses at 768-1023 px non-snap (grid "639px 2px" / "871px 2px"). The user will fix it later.
2. About text "unchanged" not verifiable (no baseline).
3. Placeholder icon slot scrollHeight 47 vs 40 overflow.
4. AC-26 :active not exercised.
5. Pixel colours not sampled for the tint check.
6. AC-24 downward page move not demonstrable (last section).
7. Reduced-motion paths not verifiable with the browser tools.

## Five-section snap contract and navbar (T-38)

Method: dev server via sdd-browser at 1440x900 unless stated. Console clean, no horizontal overflow.

### AC-5 (section order and snap behaviour)

1. PASS. Sections in order hero, projects, about, tech-stack, contact. All tabindex -1. Tops 0, 900, 1800, 2700, 3600.
2. PASS. At Tech Stack the arrows read "Previous section: About" and "Next section: Contact". At Contact only "Previous section: Tech Stack" exists; the down arrow is not in the DOM.
3. PASS. At Contact, wheel down and PageDown leave y at 3600.
4. FAIL (End key). From Hero, End went to y=3464 (Contact top 136); a second End press gave the same. Max scroll is 3600. Home returns to 0 (PASS).
5. PASS. Fresh loads with each hash land at top 0 for all four sections. Navbar links from /viewer and from /projects/project-one land Projects, About and Contact at top 0. Tech Stack has no navbar link (by design).

### AC-27 (navbar Contact link)

6. PASS. Navbar order Home, Projects, About, Contact, 3D Viewer. Contact's classes and min-height (44px) are identical to About's. Hover judged by class only (not pointer-hovered).
7. Partial.
   - Snap layout click: y=3600, Contact top 0. PASS.
   - Non-snap at 1440x699: y=2480 (max scroll), Contact top 124.75. Clamped at page end because the section is shorter than the viewport. FAIL if top 0 is strictly required; otherwise a note.
   - Reduced motion: NOT VERIFIABLE (cannot be emulated).
8. PASS. One row at 640, 641, 1024, 1280 and 1920 with no toggle; the toggle shows at 639. scrollWidth <= innerWidth. Slack from the visible link edge: 20 @640, 20 @641, 35 @1024, 155.5 @1280, 475.5 @1920 (measured differently from T-31's 81, not comparable).
9. PASS with note. The mobile menu at 375 and 320 shows Contact between About and 3D Viewer at 44px; clicking closes the menu. 320x568: Contact top -0.44. 375x812: Contact top 63.1, clamped at page end (section 749px vs viewport 812).

### Open items

1. FAIL: End key lands at y=3464 instead of 3600.
2. Non-snap 1440x699: Contact clamps at top 124.75 (page end).
3. 375x812: Contact clamps at top 63.1.
4. Hover not pointer-tested (class comparison only).
5. Reduced motion not verifiable.

## Below-snap sizes, reduced motion and carry-over (T-39)

Method: one short browser run on the dev server (console clean, no screenshots), plus source greps and lint/build.

### AC-28 (below-snap sizes): PASS

Sizes: 1023x900, 1440x699, 1366x600, 375x812, 320x568.

- data-snap-layout "off" and 0 section arrows at all five.
- No horizontal overflow: scrollWidth 1008/1425/1351/375/320 vs innerWidth 1023/1440/1366/375/320 (desktop deltas are the scrollbar).
- Smallest body text (p/li/label) is 16px at every size. Uppercase eyebrow labels ("Selected work", "Background", "Toolkit") are 12px and excluded; note.
- Carousel centre card fully in the viewport (left-right): 184-824 @1023, 393-1033 @1440, 356-996 @1366, 36-339 @375, 36-284 @320. Side peeks visible: 175/160 @1023, 344/329 @1440, 307/292 @1366, 24/24 @375 and @320. Prev/next present, 3 dots.
- About: stacked (frame above text) at 375 (frame bottom 1881 < heading top 1941) and 320 (1672 < 1732). At 1023, 1366 and 1440 the frame is beside the text (md two-column, md:order-last) per design.
- Tech Stack: stacked at 375 (tops 2652/2842/2971) and 320 (2467/2657/2786); side by side at 1023, 1366 and 1440.
- Form input width equals container content width: 597/597 @1023, 608/608 @1440 and @1366, 343/343 @375, 288/288 @320.
- Footer bottom equals document height at every size (e.g. 3380/3380 @1023, 3918/3918 @375).
- At 1440x699: next then dot 3 gave __carouselInfo().advances ["button","dot"]. PASS.
- Tab order: navbar links (incl. Contact), card link "Project title three", Previous, dots 1-3, Next, name, email, message, Send message, GitHub, itch.io, then wraps to the navbar. All required elements reached. PASS.

### AC-29 (reduced motion): NOT VERIFIABLE

Reduced motion cannot be emulated in the browser pane, so every AC-29 item is NOT VERIFIABLE. Supporting source notes only (not a PASS):

- usePrefersReducedMotion (src/hooks/usePrefersReducedMotion.js:3) reads `(prefers-reduced-motion: reduce)`.
- Consumed by useCarousel.js:17 (autoplay gate via autoplayAllowed, src/lib/carouselLogic.js:73; running tween killed at useCarousel.js:157), useSectionReveal.js:12 (returns early, no reveal), SnapScroller.jsx:15 (snap inactive), SmoothScrollProvider.jsx:14 (no Lenis), SplitHeading.jsx:20, Hero.jsx:38, HomePage.jsx:17.
- `motion-reduce:transition-none` on Navbar.jsx:10, CarouselControls.jsx:7 and :51, ContactForm.jsx:155, ContactFooter.jsx:20, SectionArrows.jsx:27 and :31.

### AC-30 (carry-over): PASS with notes

- Reveals at 1440x900 snap on, sampled 1.8 s after navigating to each section (navbar link, or the "Next section: Tech Stack" arrow): projects 2 items, about 4, tech-stack 4, contact 2. All opacity 1, no transform offset; each section at top 0. Sampled at 1.8 s, not the 1.5 s target.
- Focus rings (real Tab, :focus-visible, outline solid 2px, offset 2px, colour about rgb(127,227,255)), contrast against the background behind: carousel next 13.8:1, dot 13.8:1, card link 12.9:1 (bg rgb(11,16,32)), input 13.8:1, submit 12.7:1, social link 13.8:1, navbar Contact 13.8:1. All >= 3:1. Caveat: background taken from the opaque ancestor colour.
- Source check (a), no GSAP reveal on carousel track, slides or side cards: PASS.
  - `grep data-reveal|gsap` in src/components/projects returns no matches (track, cards, buttons and dots are not targeted).
  - useCarousel.js uses gsap only for its own position tween (gsap.to at :125, killTweensOf at :117, :158, :364), not a reveal.
  - Note: src/components/sections/Projects.jsx:44 puts `data-reveal` on a wrapper `<div>` around `<ProjectCarousel>`, so useSectionReveal (useSectionReveal.js:17, gsap.from('[data-reveal]')) fades/moves the whole carousel as one block. The track and slides are not targeted individually. Flagged for owner judgement.
- Source check (b), `error` token only in form validation: PASS.
  - Definition: src/index.css:12-13 (--color-error, comment "Form validation states only").
  - Usage: only src/components/contact/ContactForm.jsx:7 (aria-invalid:border-error, shadow var(--color-error)), :13 (text-error) and :16 (border-error, text-error).
  - Other `error` hits in src are unrelated code identifiers (error boundaries, validation helpers, console.error).

### Lint and build

- npm run lint: clean (oxlint, no output).
- npm run build: succeeded (built in 369 ms). Only the existing chunk-size warning (PageCanvas 1,002 kB).

### Open items

1. AC-29 not verifiable (reduced motion cannot be emulated).
2. Reveal timing sampled at 1.8 s, not 1.5 s.
3. Eyebrow labels are 12px; if the AC-28 minimum font applies to them, that is a FAIL.
4. Contrast assumes the opaque ancestor background.
5. Projects.jsx:44 wraps the whole carousel in data-reveal (see AC-30 source check (a)).
