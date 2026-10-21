# Baseline (spec 005)

## Before

Date: 2026-10-20. Repo unchanged (no code change yet).

### Build (`npm run build`, exit 0)

| File | Raw | Gzip |
|---|---|---|
| `dist/assets/index-D_ZZKme4.js` (entry) | 405.00 kB | 135.66 kB |
| `dist/assets/PageCanvas-DuWl8NBo.js` (3D chunk) | 1,001.60 kB | 269.35 kB |
| `dist/assets/index-DpGxh7xV.css` | 26.36 kB | 5.76 kB |

- Entry chunk contains `WebGLRenderer`: no (0 matches). Contains `@react-three`: no (0 matches). The 3D chunk contains `WebGLRenderer` (6 matches).
- Vite warns that chunks are larger than 500 kB (PageCanvas, pre-existing).

### package.json dependencies

dependencies: `@fontsource/hanken-grotesk ^5.3.0`, `@fontsource/instrument-serif ^5.3.0`, `@react-three/drei 10.7.9`, `@react-three/fiber 9.8.2`, `gsap ^3.15.0`, `lenis ^1.3.27`, `react ^19.2.8`, `react-dom ^19.2.8`, `react-router-dom ^7.18.4`, `three ^0.186.1`.

devDependencies: `@tailwindcss/vite ^4.3.3`, `@types/react ^19.2.18`, `@types/react-dom ^19.2.7`, `@vitejs/plugin-react ^6.1.1`, `oxlint ^1.81.0`, `tailwindcss ^4.3.3`, `vite ^8.3.0`.

Scripts: dev, build, lint, check:buffer, check:cel, preview.

### Browser measurements

Conditions: dev server, scroll 0, pointer idle. No console errors; one warning: "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead."

The desktop scrollbar is 15 px, so Hero and canvas widths are 1905 (1920), 1425 (1440), 1351 (1366). 375 has no scrollbar.

#### Moon body diameter (outline excluded) and centre at scroll 0

Method: computed, not measured. diameter = 2 x 0.39722680 (`MOON_RADIUS_PER_HERO_HEIGHT` in moonFraming.js) x `hero.offsetHeight`; centre = Hero box centre in viewport coordinates. Cross-checked against the 1440x900 screenshot: about 652-657 px visible including outline vs 666.5 computed (approximate).

| Viewport | Diameter | Centre |
|---|---|---|
| 1920x1080 | 809.55 px | (952.5, 570.5) |
| 1440x900 | 666.55 px | (712.5, 480.5) |
| 1366x768 | 561.68 px | (675.5, 414.5) |
| 375x812 | 596.63 px | (187.5, 528.5) (moon overflows the viewport sides) |

outlineRt buffer: 862 @1920x1080 DPR 1, 710 @1440x900 DPR 1, 1274 @375x812 DPR 2.

#### Hero top / height / width and navbar height

| Viewport | Hero top | Hero height | Hero width | Navbar height |
|---|---|---|---|---|
| 1920x1080 | 61 | 1019 | 1905 | 61 |
| 1440x900 | 61 | 839 | 1425 | 61 |
| 1366x768 | 61 | 707 | 1351 | 61 |
| 375x812 | 153 | 751 | 375 | 153 (links wrap to 2 rows) |

At 375x812, 153 + 751 = 904 > 812.

#### `document.documentElement.scrollHeight`

| Viewport | scrollHeight |
|---|---|
| 1920x1080 | 2762 |
| 1440x900 | 2582 |
| 1366x768 | 2450 |
| 375x812 | 3805 |

#### Canvas, effective DPR, GL limits (at the DPR actually obtained)

| Viewport | DPR obtained | Buffer | CSS size | dpr | MAX_RENDERBUFFER_SIZE | MAX_VIEWPORT_DIMS |
|---|---|---|---|---|---|---|
| 1920x1080 | 1 | 1905x2701 | 1905x2701 | 1 | 16384 | 32767x32767 |
| 1440x900 | 1 | 1425x2521 | 1425x2521 | 1 | 16384 | 32767x32767 |
| 1366x768 | 1 | 1351x2389 | not recorded | 1 | not recorded | not recorded |
| 375x812 (mobile preset, coarse pointer) | 2 (not 3) | 750x7304 | 375x3652 | 2 | 16384 | 32767x32767 |

At 375x812 the CSS canvas height 3652 is less than documentHeight 3805 (canvas shorter than the page).

Requested but missing:
- DPR 2 at 1920x1080: not obtainable (pane has no DPR emulation)
- DPR 2 at 1440x900: not obtainable (pane has no DPR emulation)
- DPR 3 at 375x812: not obtainable (pane has no DPR emulation)

#### Stars

- `stars`: 2000 at 1920x1080, 1440x900, 1366x768; 800 at 375x812 (coarse pointer).
- Visible in the first viewport at 1440x900, scroll 0: 710. Method: exact projection. Replicated `createStarPositions` (mulberry32, seed 0x5eed1234), page y = v x canvasHeight (2521), counted y <= 900. Layer parallax and pointer shift are 0 at scroll 0 with the pointer idle.
- Cross-check, `stars x 900 / canvasHeight`: 714.0.

### Side findings

1. `starCount` is fixed at mount from the viewport at that time. First load at the pane's initial size gave 800 at desktop until a reload.
2. `window.__planetInfo` is briefly undefined after load or resize (the CanvasGuard effect recreates it). It exposes no moon size or position field.

### Screenshots (scroll 0, pointer idle)

- `before-1440x900.jpg`: downscaled to 800x500 by the capture tool.
- `before-375x812.jpg`
- Deviation: tasks.md names `.png` files; the user approved `.jpg` in their place.

## After

## Fixed canvas and DPR report (AC-37)

Date: 2026-10-20. Source: `sdd-browser` report on the dev server (http://localhost:5173), real wheel events. Before values are from the "Before" section (T-01).

### Canvas size, effective DPR and GL limits

Before = page-tall canvas (T-01). After = viewport-fixed canvas (T-12).

| Case | Before: buffer / CSS / dpr / MAX_RENDERBUFFER_SIZE / MAX_VIEWPORT_DIMS | After: canvas.width x canvas.height / effective dpr / MAX_RENDERBUFFER_SIZE / MAX_VIEWPORT_DIMS |
|---|---|---|
| 1920x1080, DPR 1 | 1905x2701 / 1905x2701 / 1 / 16384 / 32767x32767 | 1920x1080 / 1 / 16384 / 32767x32767 |
| 1920x1080, DPR 2 | not obtainable (pane has no DPR emulation) | not obtainable (pane has no DPR emulation) |
| 1440x900, DPR 1 | 1425x2521 / 1425x2521 / 1 / 16384 / 32767x32767 | 1440x900 / 1 / 16384 / 32767x32767 |
| 1440x900, DPR 2 | not obtainable (pane has no DPR emulation) | not obtainable (pane has no DPR emulation) |
| 375x812 coarse, DPR 3 (requested) | not obtainable (pane has no DPR emulation) | not obtainable (pane has no DPR emulation) |
| 375x812 coarse, DPR 2 (mobile preset, obtained) | 750x7304 / 375x3652 / 2 / 16384 / 32767x32767 | 750x1624 / 2 / 16384 / 32767x32767 |

Checks (after), pass/fail:

| Check | 1920x1080 DPR 1 | 1440x900 DPR 1 | 375x812 coarse DPR 2 |
|---|---|---|---|
| `canvas.width = innerWidth x dpr` (within 1 px) | pass (1920 = 1920 x 1) | pass (1440 = 1440 x 1) | pass (750 = 375 x 2) |
| effective dpr = min(deviceDpr, 2) | pass (1) | pass (1) | pass (min(2, 2) = 2) |
| size and dpr constant while scrolling | pass | pass | pass (scrollY 0 to 250) |

The DPR 2 desktop cases and the DPR 3 mobile case were not obtainable, so `min(deviceDpr, 2)` is verified only for DPR 1 and the mobile DPR 2 preset.

### Canvas and wrapper (AC-36)

Canvas count 1 and computed `position: fixed` at every size. Canvas CSS size equals `innerWidth x innerHeight` at each size, and stays constant while scrolling.

| Viewport | Canvas count | Position | Canvas CSS size vs innerWidth x innerHeight | scrollHeight / scrollWidth with canvas | Result |
|---|---|---|---|---|---|
| 1920x1080 | 1 | fixed | 1920x1080 = 1920x1080 | 2762 / 1905 | pass |
| 1440x900 | 1 | fixed | 1440x900 = 1440x900 | 2582 / 1425 | pass |
| 375x812 | 1 | fixed | 375x812 = 375x812 | 3805 / 375 | pass |
| reduced motion (1440x900) | not obtainable (pane has no reduced-motion emulation) | not obtainable (pane has no reduced-motion emulation) | not obtainable (pane has no reduced-motion emulation) | not obtainable (pane has no reduced-motion emulation) | not verified |

Accessibility attributes: wrapper `aria-hidden="true"`; canvas `aria-hidden="true"`, `tabindex="-1"`; no `role` on either; computed `pointer-events: none` on both. All pass.

scrollHeight matches the T-01 "Before" values (2762 at 1920x1080, 2582 at 1440x900, 3805 at 375x812) and scrollWidth equals clientWidth, so there is no horizontal overflow.

### AC-38 parts b and d (1000x900)

| Check | Result |
|---|---|
| Fast scroll 0 to 2000 (10 + 10 wheel ticks): max per-frame diff between `__syncLog` columns | 0.4999 px (pass, limit 1 px) |
| Fast scroll: max frame-to-frame change of (moon - Hero) | 0.9457 px (0.9467 and 0.9705 in later runs) (pass, close to the 1 px limit) |
| At rest, scrollY 0 / 1000 / 2000: moon centre vs Hero centre | 480.5 / 480.5, -519.5 / -519.5, -1519.5 / -1519.5 (pass, exact) |
| Hero fully out of view (scrollY 2000) | `moonFrames` stayed at 330 over 1 s while `frames` went 1231 to 1322; no moon pixels in the screenshot (pass) |
| Back at top | `moonFrames` resumes 330 to 818; moon cy 480.5 (pass) |
| No rotation jump at top | pass by code inspection (`PageScene.jsx`: rotation += clamped dt only while the moon renders); not measured numerically |
| Deep link `/#about`, fresh load | scrollY 2676, `moonFrames` 0, moon cy -2195.5; after scrolling to top, moon cy 480.5 = Hero 480.5, sync diff max 0.4987, `moonFrames` resumes (pass) |
| `loseContext` at scrollY 300, scroll to 500 while lost, `restoreContext` | `isContextLost` false, opacity 1, 1 canvas, moon cy -19.5 (= 480.5 - 500), sync diff 0 over 158 frames (pass) |

### T-12 check results

| Check | Result |
|---|---|
| Canvas count 1 at every size | pass |
| Wrapper computed position fixed | pass |
| Canvas CSS size = innerWidth x innerHeight: 1920x1080, 1440x900, 375x812 | pass |
| Canvas CSS size constant while scrolling (1920 and 1440: scrollY 0 to 500; 375: scrollY 0 to 250) | pass |
| scrollHeight equals baseline: 2762 / 2582 / 3805 | pass |
| `elementFromPoint` over text: canvas hits | 0 of 12 points at scroll 0, 0 of 9 points at scroll 500 (pass) |
| Moon centre vs Hero centre while scrolling to 500 | 1243 frames, max abs diff 0.499 px (pass) |

### Defects

None.

### Notes

- Method: the canvas stays 300x150 with opacity 0 and `__planetInfo` undefined until the pane renders a frame, so every measurement waited for `__planetInfo` before reading.
- Console: clean, except the existing "THREE.Clock: This module has been deprecated" warning and the deliberate Context Lost / Restored logs from the `loseContext` check.
- Scrollbar: with the classic 15 px scrollbar, the `w-screen` canvas is 15 px wider than `clientWidth` (1905 at 1920, 1425 at 1440). This is expected: the canvas CSS width equals `innerWidth`. The moon uses the Hero rect, so it is unaffected.
- Reduced motion: scrollHeight and scrollWidth with reduced motion are not obtainable (pane has no reduced-motion emulation).
- Not verified: DPR 2 at 1920x1080 and 1440x900, DPR 3 at 375x812 (the mobile preset gave DPR 2), reduced-motion sizes, and numeric rotation continuity (code inspection only).

## Star density (AC-39)

Date: 2026-10-20. Set in T-14. Chosen `STAR_DENSITY_PER_MPX = 550` (caps unchanged: 2000 desktop, 800 coarse).

Before (T-01, 1440x900, scroll 0): 2000 stars over a page-tall canvas 1425x2521 CSS px; 710 visible in the first viewport (exact projection; formula cross-check 2000 x 900 / 2521 = 714).

Arithmetic:
- Before visible density: 710 stars over the viewport area 1425 x 900 = 1.2825 Mpx = 553.6 stars per Mpx (714 gives 556.7).
- After: the canvas is the viewport, 1440 x 900 = 1.296 Mpx. Count = round(density x w x h / 1e6) = round(550 x 1.296) = round(712.8) = 713, all drawn at once and visible.
- Compare: 713 vs 710 is +0.4% (vs 714: -0.1%), inside the allowed 25%. Per area: 550 vs 553.6 per Mpx.
- Other sizes (same formula): 1920x1080 gives 1140 (cap not reached); 2560x1440 gives 2028, clamped to the 2000 cap; 375x812 coarse gives 167 (cap 800 not reached).
- Runtime star count is therefore at most 2000 on desktop and at most 800 on coarse devices.

## Manual checks
