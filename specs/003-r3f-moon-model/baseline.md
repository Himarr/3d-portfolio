# Baseline: 003 R3F Migration and Moon Model

## Before

- Date: 2026-10-20
- Command: `npm run build` on the unmodified repo (Vite 8.3.4), exit 0.
- Entry chunk: `dist/assets/index-Bzbr2N8d.js` - 404.35 kB raw, 135.43 kB gzip
- 3D (three) chunk: `dist/assets/PlanetCanvas-CjDaC-Jz.js` - 533.52 kB raw, 133.67 kB gzip
- Entry CSS: `dist/assets/index-B_iparzH.css` - 24.43 kB raw, 5.43 kB gzip
- Poster: `dist/assets/hero-planet-poster-WZQtAYPb.png` - 569.54 kB
- Grep of entry chunk for `WebGLRenderer`: no matches (count 0, as expected). The 3D chunk contains it.
- Note: Vite warned that a chunk is larger than 500 kB (the 3D chunk).

## After

- Date: 2026-10-20
- Command: `npm run build` (Vite 8.3.4), exit 0.

| Item | Before | After |
|---|---|---|
| Entry chunk | `index-Bzbr2N8d.js` 404.35 kB raw, 135.43 kB gzip | `index-s6ebYH0f.js` 404.74 kB raw, 135.54 kB gzip (+0.39 kB raw, +0.11 kB gzip) |
| 3D chunk | `PlanetCanvas-CjDaC-Jz.js` 533.52 kB raw, 133.67 kB gzip | `PageCanvas-C2WlVyjo.js` 993.68 kB raw, 266.30 kB gzip (+460.16 kB raw, +132.63 kB gzip, about 1.86x raw, 1.99x gzip) |
| Entry CSS | `index-B_iparzH.css` 24.43 kB raw, 5.43 kB gzip | `index-Bhk7dS_K.css` 24.46 kB raw, 5.44 kB gzip |
| Poster | `hero-planet-poster-WZQtAYPb.png` 569.54 kB | `hero-planet-poster-kknpSgBZ.png` 56.14 kB |
| Model | none | `moon-BEGm5URp.glb` 508.16 kB (hashed name present in `dist/assets/`) |

- Entry chunk grep: `WebGLRenderer` count 0; `react-three` / `@react-three` count 0.
- 3D chunk contains `WebGLRenderer` (separate lazy chunk, as intended).
- `grep -rl "PosterCapture\|capture-poster\|CaptureOnReady" dist/assets`: no matches.
- Vite still warns that the 3D chunk is larger than 500 kB (reported, not gated; plan Risks).
- 3D chunk growth: R3F (fiber, its-fine, react-use-measure, scheduler, zustand) plus drei's `useGLTF` path, which pulls three-stdlib `GLTFLoader` with every `KHR_*` extension, `DRACOLoader`, `MeshoptDecoder` and the KTX2 loader. Drei is `sideEffects: false` and tree-shakes well: no OrbitControls, troika, Environment helpers or other drei components found in the chunk. Draco/meshopt code is bundled but inactive (`Model` calls `useGLTF(url, false, false)`); the only third-party URL string in the chunk is the Draco decoder CDN path, unreachable at runtime with Draco off.

## Planet and poster measurements

Captured 2026-10-20 on the unmodified app (`npm run dev`), scroll 0, pointer idle, DPR 1.
Screenshots: `src/assets/img/baseline-1440x900.png` (headless Edge, scrollbars hidden) and `src/assets/img/baseline-375x812.png` (headless Edge via DevTools-protocol device emulation 375x812, since Edge's headless window has a minimum width). Neither is imported by code.

Planet diameter is derived from the old camera (PerspectiveCamera fov 40 deg vertical, z 3.6, sphere radius 1, canvas = hero stage): on-screen diameter = stage height x tan(asin(1/3.6)) / tan(20 deg) = stage height x 0.7944. This was cross-checked against the 1440 screenshot (measured ~665 px, centre ~(720, 480) with scrollbars hidden) and the 375 screenshot (planet top edge at y ~231). The poster is `object-contain`, so it displays as a square the size of the shorter stage side. It was captured at aspect 1 with the same camera, so the planet inside the poster is 0.7944 x that square. Centres are in document CSS px (x from the left, y from the document top). All measurements were taken in a normal browser with a 15 px scrollbar at 1440 and an overlay scrollbar at 375.

| Viewport | Hero stage (w x h) | Hero centre | Planet diameter (live) | Planet centre | Poster image box (displayed) | Planet inside poster | Poster centre | `scrollHeight` |
|---|---|---|---|---|---|---|---|---|
| 1440x900 | 1425 x 839 | (713, 481) | ~667 px | (713, 481) | 839 x 839 | ~667 px | (713, 481) | 2582 |
| 375x812 | 375 x 751 | (188, 529) | ~597 px (wider than viewport, clipped left/right) | (188, 529) | 375 x 375 | ~298 px | (188, 529) | 3805 |

Notes:
- At 1440 the live planet and the poster planet match (~667 px).
- At 375 they do not (597 vs 298 px). This existing mismatch is recorded as plan assumption 6, and the AC-4 target is the live planet.
- Navbar height: 61 px at 1440 and 154 px at 375, where the nav links wrap to two rows.

## Buffer matrix (AC-25)

Recorded 2026-10-20 on the real `/` page in dev, with no synthetic content (D-25). Headless Edge (SwiftShader WebGL) with DevTools-protocol device emulation. Values come from `window.__planetInfo()` about 6 s after load. Device limits reported by this GPU: `MAX_RENDERBUFFER_SIZE` 8192, `MAX_VIEWPORT_DIMS` 8192 x 8192, so maxDim = 8192. Budget is 16M for fine pointers at widths of 768 and up, and 8M for coarse pointers or widths under 768.

| Viewport | DPR (emulated) | Doc height | CSS w x h | Buffer w x h | Effective DPR | Pixels | Budget | Dims <= 8192 | Pixels <= budget | DPR in [1,2] | Stars |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 375x812 | 1 | 3805 | 375 x 3652 | 375 x 3652 | 1 | 1.37M | 8M | pass | pass | pass | 800 pass |
| 375x812 | 2 | 3805 | 375 x 3652 | 750 x 7304 | 2 | 5.48M | 8M | pass | pass | pass | 800 pass |
| 375x812 | 3 | 3805 | 375 x 3652 | 750 x 7304 | 2 | 5.48M | 8M | pass | pass | pass | 800 pass |
| 768x1024 | 1 | 3525 | 768 x 3464 | 768 x 3464 | 1 | 2.66M | 16M | pass | pass | pass | 2000 pass |
| 768x1024 | 2 | 3525 | 768 x 3464 | 1536 x 6928 | 2 | 10.64M | 16M | pass | pass | pass | 2000 pass |
| 768x1024 | 3 | 3525 | 768 x 3464 | 1536 x 6928 | 2 | 10.64M | 16M | pass | pass | pass | 2000 pass |
| 1440x900 | 1 | 2582 | 1440 x 2521 | 1440 x 2521 | 1 | 3.63M | 16M | pass | pass | pass | 2000 pass |
| 1440x900 | 2 | 2582 | 1440 x 2521 | 2880 x 5042 | 2 | 14.52M | 16M | pass | pass | pass | 2000 pass |
| 1440x900 | 3 | 2582 | 1440 x 2521 | 2880 x 5042 | 2 | 14.52M | 16M | pass | pass | pass | 2000 pass |
| 1920x1080 | 1 | 2762 | 1920 x 2701 | 1920 x 2701 | 1 | 5.19M | 16M | pass | pass | pass | 2000 pass |
| 1920x1080 | 2 | 2762 | 1920 x 2701 | 3360 x 4727 | 1.75 | 15.88M | 16M | pass | pass | pass | 2000 pass |
| 1920x1080 | 3 | 2762 | 1920 x 2701 | 3360 x 4727 | 1.75 | 15.88M | 16M | pass | pass | pass | 2000 pass |
| 390x844 mobile (touch, coarse) | 3 | 3866 | 390 x 3713 | 780 x 7425 | 2 | 5.79M | 8M | pass | pass | pass | 800 pass |

All 13 rows pass. The budget lowers DPR at 1920 (1.75). The height cap (D-19) is never reached on the real page: the tallest buffer, 7425 px, is under 8192. On a typical desktop GPU (16384 limit, as seen in the dev browser pane) there is even more headroom.

## Density notes (AC-31)

Screenshots were taken at 1440x900 and 375x812 at scroll 0, mid and bottom. Not committed; they are in the orchestrator's scratch folder.

- 1440x900: 2000 stars over a 1440 x 2521 canvas is about 0.55 stars per 1000 px², roughly 700 visible per viewport. Verdict: acceptable. Evenly spread, reads as a starfield, does not compete with text or cards.
- 375x812: 800 stars over a 375 x 3652 canvas is about 0.58 stars per 1000 px², roughly 180 visible per viewport. Verdict: acceptable, matching the desktop density.
- Caps unchanged (D-20). Starting stars may look denser than the old hero-only view, as plan assumption 2 predicted. The owner can tune this.
