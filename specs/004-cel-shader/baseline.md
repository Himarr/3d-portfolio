# Baseline and verification notes: 004 Cel Shader and Outline

## Risk verification (T-01)

Date: 2026-10-20. Read-only check of `node_modules` (three 0.186.1, @react-three/fiber 9.8.2). All paths are relative to `node_modules/`.

Result: all assumptions CONFIRMED. No fallback needed.

### (a) three 0.186.1 Lambert fragment shader

Source: `three/src/renderers/shaders/ShaderLib/meshlambert.glsl.js`, fragment `main()` at lines 87-125.

Fragment chunk order inside `main()`:

| Line | Chunk / statement |
| --- | --- |
| 89 | `vec4 diffuseColor = vec4( diffuse, opacity );` |
| 90 | `clipping_planes_fragment` |
| 95 | `logdepthbuf_fragment` |
| 96 | `map_fragment` (`diffuseColor *= sampledDiffuseColor`, `three/src/renderers/shaders/ShaderChunk/map_fragment.glsl.js:14`) |
| 97 | `color_fragment` (`diffuseColor *= vColor`, `ShaderChunk/color_fragment.glsl.js:4`) |
| 98-101 | `alphamap_fragment`, `alphatest_fragment`, `alphahash_fragment`, `specularmap_fragment` |
| 102 | `normal_fragment_begin` (declares `vec3 normal`, `ShaderChunk/normal_fragment_begin.glsl.js:8` flat / `:12` smooth; double-sided flip by `faceDirection` at `:16`) |
| 103 | `normal_fragment_maps` (reassigns `normal`, e.g. `ShaderChunk/normal_fragment_maps.glsl.js:19`, `:33`) |
| 104 | `emissivemap_fragment` |
| 107-110 | `lights_lambert_fragment`, `lights_fragment_begin`, `lights_fragment_maps`, `lights_fragment_end` |
| 113 | `aomap_fragment` |
| 115 | `vec3 outgoingLight = ...` |
| 117 | `envmap_fragment` |
| 118 | `opaque_fragment` |
| 119 | `tonemapping_fragment` |
| 120 | `colorspace_fragment` |
| 121 | `fog_fragment` |
| 122 | `premultiplied_alpha_fragment` |
| 123 | `dithering_fragment` |

Findings:
- Final-colour chunk is `opaque_fragment` (line 118): CONFIRMED. Its body (`ShaderChunk/opaque_fragment.glsl.js:2-10`) applies `#ifdef OPAQUE diffuseColor.a = 1.0;`, `USE_TRANSMISSION` alpha, then `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`. Replacement target for T-07: the literal text `#include <opaque_fragment>` in `shader.fragmentShader`. The replacement block should keep the OPAQUE alpha handling (set `diffuseColor.a = 1.0` under `#ifdef OPAQUE`) before writing `gl_FragColor = vec4( celShade( diffuseColor.rgb, normal ), diffuseColor.a );`. Note `OPAQUE` is defined by three for non-transparent materials, so alpha stays 1.0 only if the replacement includes that guard.
- Following chunks `tonemapping_fragment` (119), `colorspace_fragment` (120), `fog_fragment` (121): CONFIRMED, in that order.
- `colorspace_fragment` is `gl_FragColor = linearToOutputTexel( gl_FragColor );` (`ShaderChunk/colorspace_fragment.glsl.js:2`), i.e. it encodes linear to the output colour space (sRGB on the default canvas) AFTER the replaced chunk: CONFIRMED. `tonemapping_fragment` runs only under `#if defined( TONE_MAPPING )` (`ShaderChunk/tonemapping_fragment.glsl.js:2-6`); T-07/T-15 should not assume it is a no-op if the renderer sets a tone mapping (check `toneMapping` in `PageCanvas` when T-11 compares colours; `NoToneMapping` is the three default).
- `diffuseColor` produced by `map_fragment` + `color_fragment`: CONFIRMED (variable `diffuseColor`, `vec4`, linear since the sRGB map is decoded by the sampler). Colour factor comes from `diffuse` (line 89).
- View-space `normal`: CONFIRMED (variable `normal`, `vec3`, normalised, view space, double-sided flipped, optionally replaced by `normal_fragment_maps`). Usable at the `opaque_fragment` location since both chunks come before it in the same `main()` scope.
- `fwidth` usability: CONFIRMED. Built-in programs are compiled as GLSL ES 3.00 (`three/src/renderers/webgl/WebGLProgram.js:808` `versionString = '#version 300 es\n'` for non-raw materials), where `fwidth` / `dFdx` / `dFdy` are core. No extension directive is needed. (Lambert's own flat shading already uses `dFdx` at `normal_fragment_begin.glsl.js:6-7`.) The `gl_FragColor` output is provided by `#define gl_FragColor pc_fragColor` (`WebGLProgram.js:819-820`), so writing `gl_FragColor` in an injected block is valid.

Verdict (a): CONFIRMED. Replace `#include <opaque_fragment>`.

### (b) @react-three/fiber 9.8.2 loop and error propagation

Source: `@react-three/fiber/dist/events-e51d7528.esm.js` (loop/store/hooks) and `@react-three/fiber/dist/react-three-fiber.esm.js` (Canvas).

- Subscribers sorted ascending by priority: `events-e51d7528.esm.js:1319-1320` (`internal.subscribers.sort((a, b) => a.priority - b.priority)`, comment "highest priority renders last"). The frame `update()` iterates `subscribers` from index 0 upward (`:17531-17535`). So `-1` runs before `0`: CONFIRMED. (Equal priorities keep insertion order; `Array.sort` is stable.)
- Only positive priority disables the automatic render: `internal.priority = internal.priority + (priority > 0 ? 1 : 0)` (`:1312`) and the render is guarded by `if (!state.internal.priority && state.gl.render) state.gl.render(state.scene, state.camera)` (`:17537`). A priority of `-1` or `0` adds 0, so auto-render stays on: CONFIRMED.
- Automatic render runs after all callbacks: in `update()` the subscriber loop (`:17531-17535`) precedes the render line (`:17537`): CONFIRMED.
- `useFrame(callback, renderPriority = 0)` subscribes in a layout effect (`:1415-1423`), default priority 0. Callback signature is `(state, delta, frame)`.
- Layout-effect error reaches the outer boundary: CONFIRMED. R3F wraps children in its own class `ErrorBoundary` (`events-e51d7528.esm.js:96-111`, `componentDidCatch(err) { this.props.set(err) }`) rendered at `react-three-fiber.esm.js:123-125`; `Canvas` stores it with `setError` (`:56`) and re-throws during Canvas render: `if (error) throw error;` (`:61`). That throw happens in the `Canvas` component, which lives in the outer React tree, so the app's `CanvasErrorBoundary` (`src/three/CanvasErrorBoundary.jsx`, wrapping `<Canvas>` at `src/three/PageCanvas.jsx:99`) catches it and calls `onError={fail}`. React boundaries catch errors thrown in layout effects of descendants, so `OutlineLayer` throwing in its layout effect follows this path. Async errors from renderer init (`.catch(setError)`, `:118`) take the same route. Runtime confirmation is still covered by the browser check T-26.

Verdict (b): CONFIRMED. `PageScene` `useFrame(cb, -1)` runs before `OutlineLayer` `useFrame(cb, 0)`, which runs before R3F's automatic render.

### Notes for later tasks

- T-07: replace `#include <opaque_fragment>`. Keep the `#ifdef OPAQUE diffuseColor.a = 1.0; #endif` handling in the replacement. Use variables `diffuseColor` (vec4, linear) and `normal` (vec3, view space). Do not remove `colorspace_fragment`; it encodes the result. `fwidth` needs no extension.
- T-20: change the existing `useFrame` to priority `-1`, keep it the only one in `PageScene`. `OutlineLayer` uses `useFrame(cb, 0)`. Do NOT give any callback a positive priority (that disables the automatic render). The mask render inside the priority-0 callback happens before the auto-render.
- T-18: throwing in a layout effect inside `<Canvas>` reaches `CanvasErrorBoundary` (see (b)).
- Plan fallbacks (hand-written `ShaderMaterial`; single callback exposed by `OutlineLayer` via ref) are NOT needed.

## Before

Date: 2026-10-20. `npm run build` (Vite v8.3.4) on the unmodified 004 code, exit code 0.

| Chunk | Role | Raw | Gzip |
| --- | --- | --- | --- |
| `dist/assets/index-7x4F5WQm.js` | entry (referenced by `dist/index.html`) | 405.00 kB | 135.66 kB |
| `dist/assets/PageCanvas-Db0u57WD.js` | 3D chunk (dynamic `import()` from the entry) | 993.56 kB | 266.26 kB |

Sizes are as printed by Vite (kB, gzip from Vite's reporter).

Grep of the entry chunk `dist/assets/index-7x4F5WQm.js` for `WebGLRenderer` and `@react-three`: 0 matches (none, as expected). For reference, the 3D chunk contains `WebGLRenderer` matches.

## After
(T-33) Date: 2026-10-20. `npm run build` (Vite v8.3.4), exit code 0.

| Chunk | Role | Before raw / gzip | After raw / gzip | Delta raw / gzip |
| --- | --- | --- | --- | --- |
| `index-DBat10bb.js` (before: `index-7x4F5WQm.js`) | entry | 405.00 kB / 135.66 kB | 405.00 kB / 135.66 kB | 0 / 0 |
| `PageCanvas-BGUW2yu5.js` (before: `PageCanvas-Db0u57WD.js`) | 3D chunk | 993.56 kB / 266.26 kB | 1,001.60 kB / 269.34 kB | +8.04 kB / +3.08 kB |
| `index-B7vggI7G.css` | entry CSS | n/a (not recorded in 004 Before) | 25.27 kB / 5.55 kB | (003 After: 24.46 kB / 5.44 kB) |

`moon-BEGm5URp.glb` (508.16 kB) is present in `dist/assets/` with a hashed name.

Build output also prints Vite's generic "Some chunks are larger than 500 kB after minification" notice (the 3D chunk). It is not new: the 3D chunk was already about 994 kB before 004 and in 003. Not a project warning.

### Command results

| Command | Exit code | Notes |
| --- | --- | --- |
| `npm run lint` | 0 | no output beyond the header |
| `npm run build` | 0 | see above |
| `npm run check:cel` | 0 | "all cel checks passed (127 cases)" |
| `npm run check:buffer` | 0 | "all buffer-limit checks passed" (this is 003 AC-30) |

### Entry chunk markers

`dist/assets/index-DBat10bb.js`: 0 matches for `WebGLRenderer`, `@react-three`, `drei`, `OrbitControls`. The only `three` text is the project title string "Project title three" (Projects.jsx). The 3D chunk `PageCanvas-BGUW2yu5.js` contains `WebGLRenderer`. Entry references (`dist/index.html`) are `index-DBat10bb.js` and the CSS only.

### package.json vs 003

Reference: `specs/003-r3f-moon-model/plan.md` (pins `@react-three/fiber` 9.8.2, `@react-three/drei` 10.7.9, three ^0.186.1; one script `check:buffer`) and `specs/004-cel-shader/plan.md` line 23 ("No version pins change; only the `check:cel` script"). Current `package.json` dependencies: @fontsource/hanken-grotesk ^5.3.0, @fontsource/instrument-serif ^5.3.0, @react-three/drei 10.7.9, @react-three/fiber 9.8.2, gsap ^3.15.0, lenis ^1.3.27, react ^19.2.8, react-dom ^19.2.8, react-router-dom ^7.18.4, three ^0.186.1. devDependencies unchanged in shape. Scripts: dev, build, lint, `check:buffer`, `check:cel`, preview. Result: PASS (dependencies match the 003 pins; only `check:cel` added). No pre-004 copy of package.json exists to diff byte for byte (not a git repo).

### Grep results

Searched `src/` (plus `index.html`, `vite.config.*` for `?raw`).

| Grep | Result |
| --- | --- |
| `ShaderMaterial\|onBeforeCompile` outside `src/three/` | 0 matches. Inside `src/three/`: `outlineMaterials.js`, `toonMaterial.js` only. PASS |
| `?raw` | 0 matches. PASS |
| `new WebGLRenderer` | 0 matches. PASS |
| `from "three"` / `@react-three` imports outside `src/three/` | 0 matches. The only references are the lazy `import("../three/PageCanvas.jsx")` and `CanvasErrorBoundary` import in `src/pages/HomePage.jsx` (local paths, allowed). PASS |

### 003 AC quick re-check (static part)

| AC | Result | Basis |
| --- | --- | --- |
| AC-5 | PASS | Separate 3D chunk; entry has no markers (above); `moon-BEGm5URp.glb` hashed in `dist/assets/`; before/after sizes recorded. |
| AC-7 | pending BROWSER | 10x `/` -> `/viewer` -> `/` and memory hook. |
| AC-8 | pending BROWSER | Four fallback paths (reduced motion, no WebGL, bad glb, loseContext). |
| AC-15 | PARTIAL: static PASS, runtime pending BROWSER | `PageCanvas.jsx:44` sets star count `coarse ? 800 : 2000`. Parallax behaviour and runtime count need a browser. |
| AC-17 | pending BROWSER | Screenshots at scroll 0/mid/bottom. |
| AC-18 | pending BROWSER | Canvas rect/z-order checks. |
| AC-19 | pending BROWSER | scrollHeight/scrollWidth mounted vs unmounted. |
| AC-20 | pending BROWSER | aria/tabIndex/pointer-events computed styles and interaction. |
| AC-21 | PARTIAL: static PASS, runtime pending BROWSER | No `svh`, `dvh`, `vh` in `src/three/` or `HomePage.jsx`. `innerHeight` appears only in `usePointerTarget.js:21` (pointer normalisation) and `useScrollMetrics.js:18` (scroll range), not canvas or buffer sizing. Resize behaviour needs a browser. |
| AC-22 | pending BROWSER | Moon placement and scroll-out. |
| AC-23 | pending BROWSER | Drift and parallax. |
| AC-24 | pending BROWSER | Loop gating. |
| AC-25 | pending BROWSER | Buffer matrix at real widths/DPRs (the pure functions pass `check:buffer`). |
| AC-26 | PARTIAL: static PASS, runtime pending BROWSER | Count derived from `coarse` only (`PageCanvas.jsx:44`). |
| AC-27 | pending BROWSER | Fallback visuals. |
| AC-28 | PARTIAL | lint/build exit 0 and entry chunk clean: PASS. Navigation loop and 002 ACs: pending BROWSER. |
| AC-29 | PARTIAL: static PASS, runtime pending BROWSER | `HomePage.jsx` has the only `lazy(` outside `src/three/` (`PageCanvas.jsx:23` lazy-loads `PosterCapture.jsx`, a three-internal import); `Hero.jsx` has no three/canvas import. Transparent-hero/stars visuals need a browser. |
| AC-30 | PASS | `npm run check:buffer` exit 0, all checks passed. |

### Owner decisions (2026-10-20)

- **D-1:** The recurring dev console warning `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` is ACCEPTED as a known dependency warning. Source: `node_modules/@react-three/fiber/dist/events-e51d7528.esm.js:1207` (R3F 9.8.2 with three 0.186.1). It is not project code, and there will be no version bump. Recorded as an accepted exception to "no console warnings" (T-33, 003 AC-7).
- **D-2:** The browser-pane tooling limits are ACCEPTED. There was no DPR 2 at 1440x900, no 4x CPU throttle, and no emulation of reduced motion, WebGL off, corrupt glb or hidden tab. Frame timing is vsync-capped and shimmer was judged from stills. AC-19 (004) is recorded as "PASS with accepted tooling limits (owner decision 2026-10-20)".

### Console (T-33)

- `/`: no errors. There is one warning on each fresh load, the THREE.Clock deprecation from R3F, accepted per D-1.
- `/viewer`: no messages.
- Context lose/restore logs (`THREE.WebGLRenderer: Context Lost.` / `Context Restored.`) were caused by the test itself.

### 003 AC quick re-check (browser)

- **AC-7: PASS, with the Clock warning accepted per D-1.** 10 cycles of `/` to `/viewer` to `/`. Every cycle: viewer canvas 0, home canvas 1, `__planetInfo` geometries 4, textures 2, programs 4.
- **AC-8: PARTIAL.**
  - Context loss: PASS. Poster opacity is 1 during loss; on restore it goes to 0 and frames resume.
  - Reduced motion, WebGL disabled, corrupt glb: NOT CHECKABLE (D-2).
- **AC-15: PARTIAL.**
  - Runtime: stars 2000 at desktop widths, 800 at 375x812 coarse.
  - Pointer parallax and tilt: NOT CHECKABLE.
- **AC-17: PASS (low-res).** Stars are visible behind Hero, Projects, About and Tech Stack, and text stays legible.
- **AC-18: PASS.**
  - 1440x900: one canvas, top 61, 1425 x 2521.41, matching the wrapper. Static, z auto, and `elementFromPoint` never returns the canvas.
  - 1000x900: 985 x 3555.
  - 375x812: 375 wide.
- **AC-19 (003): PARTIAL.**
  - No horizontal scroll at either size: scrollWidth equals clientWidth.
  - The canvas bottom equals scrollHeight.
  - Unmounted comparison: NOT CHECKABLE.
- **AC-20: PASS (partial).**
  - Canvas has `aria-hidden=true`, `tabindex=-1` and `pointer-events: none`.
  - The nav link scrolls to `#projects`, and wheel scroll works through Lenis.
  - CTA, project links, text selection, touch and keyboard scroll: not exercised.
- **AC-21: PASS.**
  - Going from width 1440 to 1000, the canvas height tracks the content and ResizeObserver fires once.
  - A height-only change of 900 to 700 changes the canvas height only through the document height.
- **AC-22: PASS.**
  - In view, moonFrames equals frames.
  - Scrolled away, moonFrames is 0 and outline passes are 0.
  - Back in view, it resumes.
- **AC-23: NOT CHECKABLE (quantitatively).** Star drift is visible between screenshots but not measured.
- **AC-24: PARTIAL.**
  - The loop advances while offscreen.
  - Context loss stops it.
  - `document.hidden`: NOT CHECKABLE.
- **AC-25: PARTIAL.**
  - 1440x900 DPR 1: 1425x2521, RT 710x710.
  - 1000x900: 985x3555.
  - 1000x700: 985x3355.
  - 375x812 DPR 2: 750x7304, RT 1274x1274.
  - All are below maxRenderbuffer 16384.
  - DPR matrix: NOT CHECKABLE.
- **AC-26: PASS.** The star count is independent of page height.
- **AC-27: PARTIAL.**
  - Context-loss path: PASS.
  - Other fallbacks: NOT CHECKABLE.
- **AC-28: PARTIAL.**
  - Navigation loop: PASS.
  - Static checks: PASS.
  - 002 ACs: not re-run.
- **AC-29: PASS (low-res).**
  - Poster opacity is 0 while live, and stars are visible in the hero.
  - Hero text, CTA and navbar are visible.

### AC-19 (004)

- PASS with accepted tooling limits (owner decision 2026-10-20).
- No regression, so the D-E levers were not triggered. For reference, their order is: OUTLINE_RT_SCALE, then ring steps/taps, then annulus geometry.

## Frame times

Date: 2026-10-20. Unmodified 003 app (`npm run dev`), scroll 0, pointer idle, moon live (poster opacity 0). Measured in the Claude desktop app's built-in browser via `requestAnimationFrame` intervals over 5 s, moon in view.

Screenshots: `specs/004-cel-shader/before-1440x900.jpg` (captured downscaled to 800x500 by the browser pane, approximate only) and `specs/004-cel-shader/before-375x812.jpg` (full 375x812).

| Setup | Canvas backing | Frames (5 s) | Avg frame time | Max frame time | Frames > 50 ms |
| --- | --- | --- | --- | --- | --- |
| 1440x900, DPR 1 (custom viewport) | 1425x2521 | 901 | 5.56 ms | 5.7 ms | 0 |
| 375x812 mobile emulation, DPR 2, coarse pointer | 750x7304 | 901 | 5.56 ms | 5.8 ms | 0 |

Limitations (read before using these numbers):
- DPR 2 at 1440x900 was not measured (the pane could not emulate it); the 1440x900 row is DPR 1.
- 4x CPU throttle was not applied (not available in this browser); the 375x812 row is unthrottled.
- Values are rAF intervals, which are vsync-capped (display at about 180 Hz), not DevTools Performance output. GPU cost is not isolated.
- The owner may re-measure in Chrome DevTools (Performance, 5 s, DPR 2 and 4x CPU throttle for 375x812) to replace these values.

### After (T-34)

Measured over 5 s with rAF, moon in view, dev server, matching the Before method.

| Setup | Canvas | Avg Before/After/Δ | Max Before/After/Δ | >50 ms (Before/After) | Long tasks |
| --- | --- | --- | --- | --- | --- |
| 1440x900, DPR 1 | 1425x2521 | 5.56/5.56/0.00 ms | 5.7/5.8/+0.1 ms | 0/0 | none |
| 375x812, DPR 2, coarse | 750x7304 | 5.56/5.56/0.00 ms | 5.8/5.8/0.0 ms | 0/0 | none |

Limits, accepted per D-2:
- No DPR 2 at desktop size.
- No 4x throttle.
- Timing is vsync-capped at about 180 Hz.

### Scroll

Wheel scroll down and back up, with no long tasks and 0 frames over 20 ms:
- 1440x900: moving average 5.56 ms, max 5.7 ms.
- 375x812: moving average 5.56 ms, max 5.7 ms.

Verdict: smooth.

## Poster display width

Date: 2026-10-20. Same unmodified 003 setup as above.

Hero section at 1440x900: top 61 CSS px, height 839 CSS px, centre (712.5, 480.5) viewport CSS px.

Hero poster `<img>` rendered box at 1440x900: 1425 x 839 CSS px (full hero width; `object-fit` applies inside this box). This is the value for `POSTER_DISPLAY_CSS_PX` (T-29): 1425 CSS px.

Note for T-29: the image uses the box with `object-fit`, so the effective drawn moon width may differ from the box width. T-29 must confirm the effective drawn moon width (not only the box width) before setting `POSTER_DISPLAY_CSS_PX`.

Moon geometry (before, 003 unlit):

| Viewport | Hero top / height | Hero centre (CSS px) | Poster `<img>` box | `moonRadiusPx(hero height)` | Moon diameter (CSS px) | Moon centre (CSS px) |
| --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 61 / 839 | (712.5, 480.5) | 1425 x 839 | 333.27 | about 666.5 | (712.5, 480.5) |
| 375x812 (DPR 2) | 153 / 751 | (187.5, 528.5) | 375 x 751 | 298.32 | about 596.6 | (187.5, 528.5) |

The moon is centred on the hero centre at both viewports. Diameter is 2 x `moonRadiusPx(hero height)`.

## Outline render target sizes
(T-24)

Date: 2026-10-20. Built-in browser, `npm run dev` (StrictMode), current state: `OUTLINE_INNER_EDGES` = false (D-20), T-35 binary ring, owner-tuned ramp constants.

| Setup | Canvas backing | Outline RT | Limit | Result |
| --- | --- | --- | --- | --- |
| 1000x900, DPR 1 | 985x3555 | 710x710 | `OUTLINE_MAX_TEXELS` 2048, never canvas height | PASS |
| 375x812, DPR 2 | 750x7304 | 1274x1274 | `OUTLINE_MAX_TEXELS` 2048, never canvas height | PASS |

Offscreen stall (frame counter and outline passes per second):

| State | Frames/s | Outline passes/s | Result |
| --- | --- | --- | --- |
| Moon in view | 180 | 180 | PASS |
| Scrolled to page bottom (moon offscreen) | 180 | 0 | PASS |
| Back in view | 181 | 181 | PASS |

Per-frame allocation: builder self-review only (T-18 builder). The frame body lives in module-level `runFrame`, and the render target is relaid out only on change. The orchestrator did not re-review this line by line. Reviewer to confirm in `/verify`.

Resize-only-on-change: confirmed by code only (cached inputs compared in `runFrame`). Not measured.

## Shimmer notes
(T-23)

Formal 10 s frame-by-frame flicker study: NOT done.

- Band edges use `CEL_BAND_AA_PX` = 1.
- The ring is binary alpha (hard edge). It may alias slightly during spin.
- Owner visual check recommended.

(T-34)

- Settings: `CEL_BAND_AA_PX` = 1, `OUTLINE_THICKNESS_CSS_PX` = 3, `OUTLINE_RT_SCALE` = 1, ring steps 4, taps 16.
- Over a 10 s spin at 800x500 DPR 1, stills at 3 s and 8 s showed clean band edges and a uniform black ring.
- Temporal shimmer was not frame-by-frame verified; accepted per D-2.

## Inner-edge verdict
(T-23)

Verdict: OFF by owner decision D-20 (`OUTLINE_INNER_EDGES` = false).

AC-8b (no lines inside the disc): PASS. Black pixels inside 90% of the disc radius:

| Setup | Pixels sampled | Black pixels | Result |
| --- | --- | --- | --- |
| 1000x900, DPR 1 | 282,629 | 0 | PASS |
| 375x812, DPR 2 | 734,046 | 0 | PASS |

Comparison with `reference.png`: same band order and light direction. The reference also shows dark crater shading that is not reproduced (strokes off by owner choice).

## Toon verification (T-11)

Date: 2026-10-20. Built-in browser, `npm run dev`, unmodified source except the owner's tuned constants in `src/three/celConstants.js`: `CEL_THRESHOLD_LIGHT_SPOT` 0.9, `CEL_THRESHOLD_LIT` 0.3, `CEL_THRESHOLD_SHADOW1` -0.3 (others default). Measurements taken by the orchestrator with `gl.readPixels` after render.

Screenshots: `specs/004-cel-shader/toon-1440x900.png` (pane-downscaled to 800x500, approximate only) and `specs/004-cel-shader/toon-375x812.jpg` (full size). Reference: `specs/004-cel-shader/reference.png`.

Moon geometry at 1440x900, DPR 1: centre (712.5, 419.5) canvas px, radius 333.27 canvas px.

| AC | Result | Measured values | Notes |
| --- | --- | --- | --- |
| AC-3 (band order, 4 regions) | PASS | Diagonal from upper-right limb through centre to lower-left limb, 81 samples. Order: light spot (237,237,237) then lit (153) then shadow 1 (127) then shadow 2 (91); outside the limb alpha 0. Classification at 41 points: `SSSSSSSSSSLLLLLLLLLLLLLLLLL11111111111222`. Light spot is #EDEDED exactly (237), within +-2. | Interruptions along the line are craters (expected, see AC-5). Transitions are about 1 device px: dense ~1 px sampling over 654 points, with isolated intermediate samples (e.g. 109, 146, 188/189). Texture noise is within +-3 of band values (e.g. 150-152, 123-130, 89). Longest run of non-exact values is 3 samples, including texture noise. Consistent with `CEL_BAND_AA_PX` = 1. |
| AC-4 (lit band equals 003 unlit) | PASS | Lit band 153 (#999999). 003 unlit moon (T-03 before screenshot, #999999, JPEG so +-3 tolerance). | Shadow 1 expected: linear 0.3185 x 0.67 = 0.2134, sRGB about 127.3; measured 127. Shadow 2 expected: linear 0.3185 x 0.33 = 0.1051, sRGB about 91.2; measured 91. Both within +-3. Texture orientation consistent with the before screenshots (not mirrored or flipped, visual check). |
| AC-5 (craters inside and across bands) | PASS | Craters visible inside and across the bands in the screenshots. | Spin: 179 of 654 diagonal pixels changed over 3 s, so features sweep through the bands. |
| AC-5 (scroll does not move bands relative to moon) | PASS | After scrolling 150 px, band boundaries relative to the moon centre were identical: `SSSSSSSSSSLLLLLLLLLLLLLLLLL111L1L11111222` before vs after. | Differences are from spin and craters only. |
| AC-5 (pointer tilt shifts bands) | NOT VERIFIED | Not tested: no fine-pointer movement was simulated in the built-in browser. | Owner to check by moving the mouse over the hero and confirming the bands shift with tilt. |
| AC-5 (window resize does not move bands) | PARTIAL | Not tested as a resize. Reloads at 1440x900 and 375x812 both render correctly with bands. | Owner or a later check to resize the window with the moon in view. |

Other checks:
- 375x812, DPR 2: banded moon renders, light spot upper-right, no console errors. Screenshot `toon-375x812.jpg`.
- Console at both viewports: no errors.
- Visual comparison with `reference.png`: bands appear in the same order with light from the upper-right, matching the reference. With the owner's tuning the light spot is smaller than the defaults. No outline (layer 3 not yet built). Report only; the owner tunes the constants.
- No source files were changed by this verification.

## Constants and isolation verification (T-12)

Date: 2026-10-20. Built-in browser, `npm run dev`, 1440x900. Measurements taken by the orchestrator (the builder did not run the browser). Scratch edits were reverted from byte-for-byte backups taken before the task.

| AC | Result | Measured values | Notes |
| --- | --- | --- | --- |
| AC-6 (constant edit changes look, no other edit) | PASS | Only `CEL_LIGHT_SPOT_COLOR` changed to `"#FF0000"` in `src/three/celConstants.js`. After reload, a light-spot pixel read back `(255,0,0,255)` via `gl.readPixels`. | Threshold editing: the owner had already changed `CEL_THRESHOLD_LIGHT_SPOT` 0.85 to 0.9 and `CEL_THRESHOLD_SHADOW1` -0.20 to -0.30 in `celConstants.js` only; the band positions changed accordingly (see "Toon verification (T-11)"). A separate scratch threshold edit was not done. |
| AC-7 (cached GLB isolation) | PASS | A temporary second `<Model url={moonUrl} />` (no props, inside `FitToUnit`, at x=-400) was mounted in `src/three/PageScene.jsx`. Main moon mesh: `MeshLambertMaterial` (`customProgramCacheKey` `'cel-toon-v1'`). Second model mesh: `MeshBasicMaterial` named "Cell Shader" (the cached GLB's original material). Both share the same `map` texture object. Navigated `/` to `/viewer` (no canvas on viewer) to `/`: main moon again `MeshLambertMaterial` `cel-toon-v1` with its texture loaded. No console errors. | Scratch mount removed afterwards. |

Notes:
- The dev server had to be restarted once because Vite HMR served a stale `PageScene` module after the scratch edit. Dev-environment quirk, not a code issue.
- Revert: `cmp` confirmed `src/three/celConstants.js` and `src/three/PageScene.jsx` identical to their pre-task state. Spot-check after revert: `CEL_LIGHT_SPOT_COLOR` is `"#EDEDED"`, `PageScene.jsx` has no `Model` reference.

## Outline verification (T-22)

Date: 2026-10-20. Built-in browser, `npm run dev` (StrictMode), current state: `OUTLINE_INNER_EDGES` = false (D-20), T-35 binary ring, owner-tuned ramp constants. Method: `gl.readPixels` on the default framebuffer right after the main render (`onAfterRender`, no render target bound). Moon centre and radius from `moonFraming.moonRadiusPx(hero height)`.

Screenshot: `specs/004-cel-shader/outline-only-1000x900.png`.

| AC | Result | Measured values | Notes |
| --- | --- | --- | --- |
| AC-8 / AC-8c (ring thickness, 1440x900 DPR 1 sweep) | PASS | 5 rounds x 64 radial scans, plus 1 round of 16. Black run histogram per 64 scans: 2 px ~16, 3 px ~41, 4 px ~7, 5 px 1 (seen once). Expected 3 +-1. | PASS with note: a 1 px run was observed once, and a 5 px run was observed once, in about 600 scans. The 1 px run had an adjacent moon-edge pixel of value 23 (near-black MSAA). No partial-alpha pixel inside or adjacent to the run. Partial-alpha flags were stars at least 2 px beyond the ring. No moon-colour strip between body and ring. Sequence form: "moon colour, <=1 MSAA edge pixel, K K K, transparent". |
| AC-8 (1000x900 DPR 1, owner regression row) | PASS | 16 directions, all runs 2-4. Example, right: "153 153 K K K _". Previous defect was black, 153, black, 127, transparent. | Owner-reported regression row. |
| AC-8 (375x812 DPR 2) | PASS | 64 directions, 26 measurable. 38 were clipped by the canvas edge, since the moon is wider than the viewport. Runs: 5 px 8, 6 px 17, 7 px 1. Expected 6 +-1. | No partial alpha adjacent. |
| AC-8 (colour) | PASS | Ring colour #000000, alpha 255. | |
| AC-8 (uniform thickness) | PASS | Upper-right (lit) and lower-left (shadow) limbs have uniform thickness within +-1 px. | |
| AC-9 (no outline on stars or non-outline meshes) | PASS | Stars are layer 0 only. The mask camera renders only `OUTLINE_LAYER` (code). Scratch test: a second `<Model toon />` (no outline) and a `<Model />` (no props) mounted beside the moon. Horizontal pixel rows across both visible edges show no black pixels (edge goes 153 ... 134, 57a127, transparent). Mesh inspection: toon-only mesh layer1 = false, plain mesh layer1 = false, main moon layer1 = true. | Scratch reverted (`cmp` identical to backup). |
| AC-10 (outline in the same frame) | PASS (spin, scroll) / NOT VERIFIED (pointer tilt) | Outline `useFrame` priority 0 runs after `PageScene` priority -1 (verified in T-01 source). Scroll out and back, and spin, showed no lag in sampled frames. | Pointer tilt NOT VERIFIED: no real mouse in the built-in browser. Owner to check. |
| AC-11 (ring alpha) | PASS | Pixels beyond the ring have alpha 0. Ring alpha 255. | |
| AC-11 (aliasing vs 003) | NOT VERIFIED | Hard binary ring edge by owner decision D-15. Not compared at 100% zoom. | Owner visual check. |

## No-opt-in verification (T-25)

Date: 2026-10-20. Code grep and browser check, `npm run dev`.

| AC | Result | Measured values | Notes |
| --- | --- | --- | --- |
| AC-2 (no moon-specific code outside Moon.jsx) | PASS | Case-insensitive grep for `moon`, `Moon_BaseColor`, `.glb` over `toonMaterial.js`, `useToonMaterials.js`, `outlineLayers.js`, `outlineMaterials.js`, `OutlineLayer.jsx`, `outlineRegion.js`, `celConstants.js`, `Model.jsx`: no matches. `Moon.jsx` is the only file passing toon/outline. | |
| AC-1 (plain `<Model />` unchanged) | PASS | Plain `<Model />` mesh keeps the cached GLB's `MeshBasicMaterial` ("Cell Shader"), sharing the same `map` texture object. Not on the outline layer. No toon program for it. | |
| Program and memory count vs pre-004 | NOT VERIFIED (numeric) | Pre-004 program count was not recorded in T-03, so no numeric comparison. Current: geometries 4, textures 2, programs 4 without scratch. With scratch toon and plain models: 5 programs, the extra one being the stock MeshBasic program. | Scratch reverted (`cmp` identical). |

## Fallback verification (T-26)

Date: 2026-10-20. Built-in browser, `npm run dev`. Each deliberate error was reverted from a byte-for-byte backup (`cmp` identical).

| AC | Result | Measured values | Notes |
| --- | --- | --- | --- |
| AC-13a (GLSL error in toon `celShade`, `dott(`) | PASS | After reload: canvas count 0, hero poster opacity 1, page content intact. No uncaught error after load. | Reverted. |
| AC-13b (GLSL error in ring fragment, `texture2DD(`) | PASS | Canvas count 0, poster opacity 1, page intact. | Reverted. |
| Render-target extension failure path | NOT VERIFIED | Cannot stub the extension before load in this browser. | |
| Reduced motion | NOT VERIFIED | Built-in browser cannot emulate `prefers-reduced-motion`. | Owner to check in Chrome DevTools Rendering panel. |
| Third-party requests | PASS | All resource hosts are `localhost:5173`. | |
| 003 AC-8 (WebGL disabled) and AC-27 (corrupt model) | NOT VERIFIED | Not re-run in this task. | |

## Context loss (T-27)

Date: 2026-10-20. Built-in browser, `npm run dev`, 1000x900 DPR 1 only.

| Step | Result | Measured values |
| --- | --- | --- |
| `loseContext()` | PASS | Context lost. Poster opacity 1. Frame counter stopped (0 frames in 500 ms). |
| `restoreContext()` | PASS | Same canvas. Poster opacity 0. Outline passes resume (90 in 0.5 s). RT 710x710. Counts: geometries 4, textures 2, programs 4. Moon with bands and outline visible. |

DPR 2 repeat: NOT done.

## Disposal cycles (T-28)

Date: 2026-10-20. Built-in browser, `npm run dev`, 1000x900 DPR 1.

Baseline on `/`: geometries 4, textures 2, programs 4.

| Check | Result | Measured values |
| --- | --- | --- |
| 10 cycles `/` to `/viewer` (1.1 s) to `/` (3.3 s) | PASS | Every cycle: viewer canvas count 0, home canvas count 1, counts g4 t2 p4. No console warnings or errors from these loads. |

Disposable resources (code review): toon materials (`useToonMaterials` cleanup), outline render target, mask and ring materials, inner-edge material (null while off), `PlaneGeometry` (`OutlineLayer` `useEffect` cleanup).

## Stale console errors (note)

"Vector3 is not defined" and "grazingZ.toFixed is not a function" came from earlier page loads with `?t=` HMR timestamps caught mid-edit. They are not from the current code.
