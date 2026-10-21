# Tasks: 004 Cel Shader and Outline

Markers: `- [ ]` pending, `- [~]` built, `- [x]` verified.
Rules for all tasks: `three`, `@react-three/*` imported only inside `src/three/`. No new npm dependency (plan D-A); `package.json` gets only the `check:cel` script. No three.js light objects. No per-frame allocation in any `useFrame` or render pass (FR-20). `celConstants.js` has no `three` import. Shader code is inline JS strings (no `?raw`). No moon-specific code (URL, "Moon", "Moon_BaseColor") in `celConstants.js`, `toonMaterial.js`, `useToonMaterials.js`, `outlineLayers.js`, `outlineRegion.js`, `outlineMaterials.js`, `OutlineLayer.jsx`, `Model.jsx`. Helpers that are not components live in `.js` files (oxlint `only-export-components`). Change only the files listed; do not touch `src/index.css`, `DprController.jsx`, `PageCanvas.jsx`, `webgl.js`, `bufferLimits.js`, `disposeObject.js`, sections or `moon.glb`. `Hero.jsx` edit is limited to the provenance comment date. Do not improvise: if something is ambiguous or an option fails, stop and report. Every code task ends with `npm run lint` exit 0. "Needs" lists dependencies. Tasks marked HUMAN/BROWSER need a person or a browser; if the builder has none, return the step to the user and do not mark it built. Visual comparison tasks compare against `specs/004-cel-shader/reference.png` (owner's Blender screenshot) side by side; report differences, do not retune constants unless the task says so.

## Layer 0: Risk verification and baseline (before ANY code change)

- [~] T-01 Verify plan risks: three 0.186 Lambert chunk names and R3F 9.8.2 useFrame priority (read-only)
  - Files: `specs/004-cel-shader/baseline.md` (create; section "Risk verification")
  - Needs: none. Run before T-07 and T-20.
  - Do: (a) Open `node_modules/three/src/renderers/shaders/ShaderLib/meshlambert.glsl.js` (0.186.1) and list, in order, the exact fragment chunk names used: the final-colour chunk (expected `opaque_fragment`), the following `tonemapping_fragment`/`colorspace_fragment`/`fog_fragment`, and the chunks that produce `diffuseColor` and the view-space `normal` (expected `map_fragment`, `color_fragment`, `normal_fragment_begin`, `normal_fragment_maps`). Confirm the variable names `diffuseColor` and `normal` and that `colorspace_fragment` encodes linear to sRGB after the replaced chunk. Also check `fwidth` usability (GLSL3 in WebGL2). If `opaque_fragment` differs, record the exact replacement target. (b) Open `node_modules/@react-three/fiber` 9.8.2 source (loop/`useFrame` scheduling) and confirm: callbacks run in ascending priority order, so `-1` runs before `0`; a negative priority does NOT disable the automatic render (only positive does); the automatic render runs after all callbacks. Also confirm that an error thrown in a layout effect inside `<Canvas>` reaches the outer `CanvasErrorBoundary`. Write findings with file and line references. If any assumption is false, record the plan fallback (hand-written `ShaderMaterial`, or a single callback exposed by `OutlineLayer` via ref) and STOP for the orchestrator.
  - Covers: FR-6, FR-12, FR-17 (assumptions behind T-07, T-20)
  - Done when: `baseline.md` has a "Risk verification" section listing the exact chunk names and the priority/render-order verdict with source references; each assumption marked confirmed or refuted; no source files touched.

- [~] T-02 Record baseline build sizes
  - Files: `specs/004-cel-shader/baseline.md` (append "Before")
  - Needs: T-01. Run before T-04.
  - Do: Run `npm run build` on the unmodified 004 code. Record date, entry chunk and 3D chunk file names, raw and gzip sizes (Vite output), and a grep of the entry chunk for `WebGLRenderer`/`@react-three` (expected none). Leave placeholder headings: "After", "Frame times", "Poster display width", "Outline render target sizes", "Shimmer notes", "Inner-edge verdict".
  - Covers: NFR-1, AC-18
  - Done when: section "Before" has both chunk names with raw and gzip sizes; build exit 0; only `baseline.md` changed.

- [~] T-03 Capture baseline screenshots, frame times and poster display width (HUMAN/BROWSER)
  - Files: `specs/004-cel-shader/baseline.md` (append "Frame times" before-values and "Poster display width"); screenshots saved in the scratchpad or `specs/004-cel-shader/before-1440x900.png`, `before-375x812.png` (not imported by code)
  - Needs: none (do before T-10). Run before any toon change.
  - Do: On the unmodified app (`npm run dev`, 003 unlit moon), screenshot `/` at 1440x900 and 375x812 at scroll 0, pointer idle (needed as the 003 unlit colour reference for AC-4). Measure frame time with the moon in view (DevTools Performance, 5 s) at 1440x900 DPR 2 and at 375x812 mobile emulation (coarse pointer, 4x CPU throttle); record average frame time and long-frame count. Measure the rendered CSS width of the hero poster `<img>` at 1440x900 (used for `POSTER_DISPLAY_CSS_PX`, T-29) and hero height. Record the moon body diameter and centre at both viewports.
  - Covers: NFR-3, AC-4 (baseline), AC-19, FR-16 (display width)
  - Done when: two before-screenshots exist; `baseline.md` has before frame times for both setups, the poster display width in CSS px, and moon diameter/centre per viewport. HUMAN STEP: without a browser, the owner provides the screenshots and numbers.

## Layer 1: Constants, pure logic and check script

- [~] T-04 Create the constants module
  - Files: `src/three/celConstants.js` (create)
  - Needs: T-02
  - Do: Named exports exactly as in plan.md "Tunable constants module": ramp group (`CEL_LIGHT_DIRECTION` [1,1,1], `CEL_LIGHT_SPOT_COLOR` '#EDEDED', `CEL_LIT_MULTIPLIER` 1.0, `CEL_SHADOW1_MULTIPLIER` 0.67, `CEL_SHADOW2_MULTIPLIER` 0.33, `CEL_THRESHOLD_LIGHT_SPOT` 0.85, `CEL_THRESHOLD_LIT` 0.30, `CEL_THRESHOLD_SHADOW1` -0.20, `CEL_BAND_AA_PX` 1) and outline group (`OUTLINE_COLOR` '#000000', `OUTLINE_THICKNESS_CSS_PX` 3, `OUTLINE_INNER_EDGES` true, `OUTLINE_NORMAL_THRESHOLD` 0.35, `OUTLINE_DEPTH_THRESHOLD` 0.03, `OUTLINE_RING_STEPS` 4, `OUTLINE_RING_TAPS` 16, `OUTLINE_RT_SCALE` 1, `OUTLINE_BOUNDS_FACTOR` 1.05, `OUTLINE_PAD_CSS_PX` 2, `OUTLINE_MAX_TEXELS` 2048, `OUTLINE_Z_FACTOR` 1.2, `OUTLINE_Z_MAX` 900). File header explaining the file is the one place to tweak the look, plus "what to change to ..." hints; two group banners; one-line comment per export (meaning, unit, effect of raising/lowering). No `three` import, no moon references.
  - Covers: FR-9, FR-11 (constants), NFR-5, D-1, D-2, D-8, D-9, D-11, D-12
  - Done when: every export from the plan block exists with the stated default and a comment; `grep -n "import" src/three/celConstants.js` returns nothing; lint exits 0.

- [~] T-05 Create the pure outline region maths
  - Files: `src/three/outlineRegion.js` (create)
  - Needs: T-04
  - Do: Export `computeOutlineRegion({ x, y, radius, boundsFactor, thicknessCssPx, padCssPx, dpr, rtScale, maxTexels, canvasWidth, canvasHeight }) -> { centerX, centerY, halfCss, texels, rtDpr, thicknessDev }` per plan D-E: `halfCss = radius * boundsFactor + thicknessCssPx + padCssPx`; `rtDpr = min(dpr * rtScale, maxTexels / (2 * halfCss))`; `texels` = even `ceil(2 * halfCss * rtDpr)` capped at `maxTexels`; `centerX/Y` snapped so `(center + canvas/2) * rtDpr` is an integer device pixel in x and y (canvas coordinates: origin at canvas centre, y up); `thicknessDev = thicknessCssPx * rtDpr`. Pure, no `three` import. Result must not depend on `canvasHeight` except through the snap grid (page-tall canvas yields the same `texels`).
  - Covers: FR-11, FR-14, NFR-4, D-12, D-14
  - Done when: single named export; no imports from `three`; lint exits 0.

- [~] T-06 Add `check:cel` node script
  - Files: `scripts/check-cel.mjs` (create), `package.json` (add script `"check:cel": "node scripts/check-cel.mjs"` only)
  - Needs: T-04, T-05
  - Do: Using `node:assert`, import `../src/three/celConstants.js` and `../src/three/outlineRegion.js`. Assert: thresholds strictly descending (spot > lit > shadow1); multipliers in (0, 1] and ordered lit >= shadow1 >= shadow2; light direction has 3 numbers and non-zero length; `OUTLINE_THICKNESS_CSS_PX > 0`; `CEL_BAND_AA_PX >= 0`; colours match `/^#[0-9a-fA-F]{6}$/`. For `computeOutlineRegion` over a grid of canvas sizes (1440x900, 1440x6000, 375x4500), DPR (1, 1.5, 2) and several positions: `texels` even and <= `OUTLINE_MAX_TEXELS`; snapped centre gives integer device pixel; `thicknessDev === thicknessCssPx * rtDpr`; `texels` identical for canvas heights 900 vs 6000 (AC-12: size from anchor not page). Print a pass line per case.
  - Covers: FR-9, FR-14, NFR-5, AC-6 (sanity), AC-8, AC-12
  - Done when: `npm run check:cel` exits 0 printing a pass line per case; only the listed `package.json` script added; lint exits 0.

## Layer 2: Toon shading

- [~] T-07 Create the toon material factory
  - Files: `src/three/toonMaterial.js` (create)
  - Needs: T-01 (chunk names confirmed), T-04
  - Do: Export `createToonMaterial(source)`: new `MeshLambertMaterial` copying from `source` (guarded for `MeshBasicMaterial`/`MeshStandardMaterial`/others): `map` (the SAME texture object, never cloned or disposed), `color` (base colour factor), `normalMap`, `normalScale`, `side`, `vertexColors`, `flatShading`, `name`. `onBeforeCompile`: inject shared uniforms (`uCelLightDir`, `uCelSpotColor`, `uCelLit`, `uCelShadow1`, `uCelShadow2`, `uCelTSpot`, `uCelTLit`, `uCelTShadow1`, `uCelAA`) and replace the final-colour chunk confirmed in T-01 (expected `#include <opaque_fragment>`) with a block computing `gl_FragColor = vec4(celShade(diffuseColor.rgb, normal), diffuseColor.a)` so the stock `colorspace_fragment` encodes to sRGB. `celShade` per plan D-B: `ndl = dot(normalize(N), uCelLightDir)`; colours in linear space (spot from `new Color(CEL_LIGHT_SPOT_COLOR)` so three converts sRGB to linear; lit/shadow1/shadow2 = base x multipliers); band weights `smoothstep(t - w, t + w, ndl)` with `w = 0.5 * uCelAA * fwidth(ndl)` (pure `step` when `uCelAA` is 0, guard divide-by-zero), blended `s2 -> s1 -> lit -> spot`. Uniforms are module-level shared objects filled once from `celConstants.js` (normalised light direction, no per-frame writes). `customProgramCacheKey` returns a fixed string. Shader code is an inline JS string. No moon references, no light objects.
  - Covers: FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-20, NFR-5, D-1, D-10, D-11
  - Done when: single named export `createToonMaterial`; `grep -in "moon" src/three/toonMaterial.js` returns nothing; no `?raw`; no per-frame code; lint and `npm run build` exit 0.

- [~] T-08 Create the useToonMaterials hook
  - Files: `src/three/useToonMaterials.js` (create)
  - Needs: T-07
  - Do: `useToonMaterials(root, enabled)`: `useLayoutEffect` on `[root, enabled]`; if `!enabled` return immediately before touching anything (FR-2: no material/program/target creation). Else traverse meshes of the clone, build one toon material per distinct source material via a `Map` (array materials handled; shared source -> shared toon material), remember each mesh's original `material`, assign the toon material to the clone's meshes only. Cleanup restores the original materials and calls `dispose()` on the toon materials only (never on textures; GLB textures remain owned by `Model`'s ref-counted `disposeObject`). Idempotent for StrictMode double effects.
  - Covers: FR-2, FR-4, FR-8, FR-19, D-6
  - Done when: early return happens before any allocation when disabled; cleanup restores originals and disposes only toon materials; no texture dispose call in the file; no `moon` in the file; lint exits 0.

- [~] T-09 Add the `toon` prop to Model
  - Files: `src/three/Model.jsx`
  - Needs: T-08
  - Do: Change the signature to `Model({ url, toon = false, outline = false, ...props })` (declare `outline` now but leave it unused; it is wired in T-14); call `useToonMaterials(clone, toon)` after `clone` is created. Change nothing else (ref count, disposal, `useGLTF(url, false, false)` untouched).
  - Covers: FR-1, FR-2, FR-3, D-6
  - Done when: `toon` defaults to false; diff limited to the signature and the hook call; `grep -in "moon" src/three/Model.jsx` returns nothing; lint and `npm run build` exit 0.

- [~] T-10 Opt the moon into toon shading
  - Files: `src/three/Moon.jsx`
  - Needs: T-09, T-03
  - Do: Change `<Model url={moonUrl} />` to `<Model url={moonUrl} toon />`. No other change (rig, spin, tilt, FitToUnit untouched).
  - Covers: FR-15 (toon part), FR-3, AC-2
  - Done when: diff is one prop; `npm run dev` shows a banded moon without console errors; lint exits 0.

- [~] T-11 Verify toon bands, colours and motion against the reference (BROWSER)
  - Files: `specs/004-cel-shader/baseline.md` (append "Toon verification")
  - Needs: T-10, T-03
  - Do: At 1440x900 and 375x812 screenshot the moon and compare side by side with `specs/004-cel-shader/reference.png`; note differences in band positions and light direction (report only; owner tunes). (AC-3) sample pixels on the diagonal from upper-right limb through centre to lower-left limb: exactly 4 tonal regions in order light spot, lit, shadow 1, shadow 2; transitions at most 1 device px; light-spot pixels `#EDEDED` +-2. (AC-4) for a texel region, lit band equals the 003 unlit screenshot (T-03) within +-3 per channel; shadow 1 and 2 equal lit x 0.67 and x 0.33 in linear space (compute expected sRGB values) within +-3; texture not mirrored/flipped. (AC-5) craters visible inside and across bands; over a 10 s capture features sweep through bands; with fine pointer, tilt shifts bands; window resize and scroll with the moon in view do not move bands relative to the moon.
  - Covers: FR-4, FR-5, FR-6, FR-7, AC-3, AC-4, AC-5
  - Done when: each AC reported pass/fail with measured values; failures name the file to fix. HUMAN/BROWSER: if the builder has no browser, the owner runs this checklist.

- [~] T-12 Verify constants editing and cached-GLB isolation (BROWSER, scratch changes reverted)
  - Files: scratch edits to `src/three/celConstants.js` and `src/three/PageScene.jsx` (both reverted afterwards)
  - Needs: T-10
  - Do: (AC-6) change `CEL_LIGHT_SPOT_COLOR` (and separately one threshold) in `celConstants.js` only; confirm the look changes after reload with no other edit; revert. (AC-7) in `PageScene.jsx` temporarily mount a second `<Model url={moonUrl} />` without props (offset so it is visible); confirm it shows the original unlit materials while the main moon is toon-shaded, and in the dev console that its `mesh.material` is the cached scene's material; navigate `/` -> `/viewer` -> `/` and confirm the moon is toon-shaded and correct again. Revert all scratch edits.
  - Covers: FR-8, FR-9, AC-6, AC-7
  - Done when: both ACs reported pass/fail; `git diff`-equivalent check shows `celConstants.js` and `PageScene.jsx` identical to their pre-task state. HUMAN/BROWSER.

## Layer 3: Outline

- [~] T-13 Create the outline layer tag
  - Files: `src/three/outlineLayers.js` (create)
  - Needs: T-04
  - Do: Export `OUTLINE_LAYER = 1` and `useOutlineTag(root, enabled)`: `useLayoutEffect` on `[root, enabled]`; if `!enabled` return before touching anything; else traverse `root` and `mesh.layers.enable(OUTLINE_LAYER)` on every mesh (layer 0 stays enabled so the main camera still renders them); cleanup `mesh.layers.disable(OUTLINE_LAYER)`. Stars never get this layer.
  - Covers: FR-1, FR-2, FR-10, D-5
  - Done when: two named exports; nothing happens when disabled; no `moon` in file; lint exits 0.

- [~] T-14 Add the `outline` prop to Model
  - Files: `src/three/Model.jsx`
  - Needs: T-09, T-13
  - Do: Call `useOutlineTag(clone, outline)` next to the toon hook (the `outline` prop was declared in T-09). Change nothing else.
  - Covers: FR-1, FR-2, FR-3, D-5, D-6
  - Done when: diff limited to the import and the hook call; `outline` defaults to false; lint and `npm run build` exit 0.

- [~] T-15 Create the mask and silhouette ring materials
  - Files: `src/three/outlineMaterials.js` (create)
  - Needs: T-01, T-04
  - Do: Inline GLSL strings (no `?raw`). Export `createMaskMaterial()` (`ShaderMaterial`, `DoubleSide`, depth test on, writes `vec4(n.xy, (-viewZ - uDepthRef) / uRadius, 1.0)` with normal xy flipped for back faces; uniforms `uDepthRef`, `uRadius`) and `createRingMaterial()` (`ShaderMaterial`, `transparent`, `depthTest: true`, `depthWrite: false`, NormalBlending; samples the mask texture: covered centre texel -> alpha 1, else `OUTLINE_RING_STEPS` rings x `OUTLINE_RING_TAPS` taps up to the thickness radius in device px, `alpha = clamp(T + 0.5 - dMin, 0, 1)` from the nearest hit; circular kernel for uniform thickness; output `vec4(uColor, alpha)` through the stock `colorspace_fragment` so black stays `#000000`). Uniforms: `uMask`, `uTexelSize`, `uThicknessDev`, `uColor`. Ring/tap counts and colour read from `celConstants.js` at creation. No moon references.
  - Covers: FR-10, FR-11, FR-13, FR-17, D-4, D-12
  - Done when: two named exports; no `?raw`; `grep -in "moon" src/three/outlineMaterials.js` returns nothing; lint exits 0.

- [~] T-16 Add the inner-edge material
  - Files: `src/three/outlineMaterials.js`
  - Needs: T-15
  - Do: Export `createInnerEdgeMaterial()` (`ShaderMaterial`, `transparent`, `depthTest: false`, `depthWrite: false`): Roberts-cross style differences of the mask at offset `d = thickness / 2` device px in x and y: `dN` on normal xy, `dZ` on depth; `alpha = max(smoothstep over OUTLINE_NORMAL_THRESHOLD, smoothstep over OUTLINE_DEPTH_THRESHOLD)`; any uncovered tap -> alpha 0 (silhouette belongs to the ring); colour from `uColor`. Uniforms `uMask`, `uTexelSize`, `uThicknessDev`, `uColor`, thresholds from `celConstants.js`.
  - Covers: FR-10, FR-11, D-12
  - Done when: new named export added without altering the T-15 exports; no moon references; lint exits 0.

- [~] T-17 Extend dev stats and the dev hook
  - Files: `src/three/devStats.js`, `src/three/CanvasGuard.jsx`
  - Needs: none
  - Do: Add `outlinePasses: 0`, `outlineRtWidth: 0`, `outlineRtHeight: 0` to `devStats`. In `CanvasGuard.jsx` add `gl.info.programs?.length` as `programs` and the three new stats to the object returned by `window.__planetInfo` (still behind `import.meta.env.DEV`). Change nothing else.
  - Covers: FR-14, FR-19, AC-1, AC-12, AC-15
  - Done when: `window.__planetInfo()` in dev returns `programs`, `outlinePasses`, `outlineRtWidth`, `outlineRtHeight`; dev hook still gated by `import.meta.env.DEV`; lint exits 0.

- [~] T-18 Create OutlineLayer: render target, mask pass and silhouette ring
  - Files: `src/three/OutlineLayer.jsx` (create)
  - Needs: T-05, T-13, T-15, T-17
  - Do: Default export `OutlineLayer({ anchorRef, thicknessCssPx = OUTLINE_THICKNESS_CSS_PX, boundsFactor = OUTLINE_BOUNDS_FACTOR })` per plan D-D/D-E/D-F/D-G. `useMemo` creates: half-float RGBA `WebGLRenderTarget`, mask camera (`OrthographicCamera`, `layers` containing only `OUTLINE_LAYER`), mask material, ring material, one `PlaneGeometry`, ring mesh. Layout effect: check `gl.capabilities.isWebGL2` and `EXT_color_buffer_float`/`EXT_color_buffer_half_float`, throw on failure (boundary then falls back); DEV: throw if camera zoom is not 1. Effective DPR from `useThree(s => s.viewport.dpr)`. `useFrame(cb, 0)`: if the anchor is missing or `anchor.visible === false` hide the quads and return (no mask render, no counter bump); otherwise compare cached numbers (anchor x, y, radius, dpr, thickness) and run `relayout()` only on change (`rt.setSize`, camera frustum, quad transform, uniforms from `computeOutlineRegion`); then render the scene with the mask camera into the target using `scene.overrideMaterial = maskMaterial` restored in `finally`, clear colour (0,0,0,0) saved/restored with preallocated objects; ring quad placed behind the model at `-min(OUTLINE_Z_FACTOR * radius, OUTLINE_Z_MAX)`. DEV: write `devStats.outlinePasses++` and RT width/height. `useEffect` cleanup disposes render target, both materials and the geometry and clears `scene.overrideMaterial` if left set. No allocation inside the frame callback. Add `check` comments only where non-obvious. No moon references. Inner-edge quad is added in T-19.
  - Covers: FR-10, FR-11, FR-12 (ordering part), FR-13, FR-14, FR-17, FR-19, FR-20, NFR-4, NFR-5, D-4, D-5, D-14
  - Done when: default export only; inspection shows no `new`, array/object literal or closure creation inside the frame callback or `relayout` hot path other than on change; disposal list in the file matches every created resource; `grep -in "moon" src/three/OutlineLayer.jsx` returns nothing; lint exits 0.

- [~] T-19 Add the inner-edge quad to OutlineLayer
  - Files: `src/three/OutlineLayer.jsx`
  - Needs: T-16, T-18
  - Do: When `OUTLINE_INNER_EDGES` is true, create the inner-edge material (in `useMemo`, disposed in the same cleanup) and a second quad using the same geometry placed in front of the model (`+z`, `depthTest: false`, high `renderOrder`), sharing the mask target, sized/positioned by `relayout()`, hidden together with the ring when the anchor is hidden. When the constant is false, no inner material or quad is created.
  - Covers: FR-10, FR-11, FR-19, FR-20, D-12
  - Done when: flipping `OUTLINE_INNER_EDGES` to false creates no inner material (code inspection); disposal covers the new material; lint exits 0.

- [~] T-20 Wire OutlineLayer and frame priority into PageScene
  - Files: `src/three/PageScene.jsx`
  - Needs: T-01 (priority verified), T-19
  - Do: Change the existing single `useFrame` to `useFrame(cb, -1)` (callback body untouched). Mount `<OutlineLayer anchorRef={placeRef} />` inside the existing `Suspense` next to `MoonReady`. Nothing else changes (placement, constants, onLive logic).
  - Covers: FR-12, FR-14, FR-15, D-I
  - Done when: diff limited to the priority argument, one import and one element; the file still has exactly one `useFrame`; lint and `npm run build` exit 0.

- [~] T-21 Opt the moon into outline
  - Files: `src/three/Moon.jsx`
  - Needs: T-14, T-20
  - Do: Change `<Model url={moonUrl} toon />` to `<Model url={moonUrl} toon outline />`. No other change.
  - Covers: FR-15, FR-3, AC-2
  - Done when: diff is one prop; `npm run dev` shows a black outlined moon with no console errors; lint exits 0.

## Layer 4: Outline fixes (owner feedback after layer 3, spec D-15 to D-18) and verification (BROWSER unless noted; fix only the defect in the relevant file)

Fix tasks T-35 to T-38 supersede the alpha formulas and inner-edge behaviour of the built T-15, T-16 (markers of built tasks unchanged). Run them in order, before T-22/T-23. They change only the files listed; `OutlineLayer.jsx` needs no change (new values are baked into the shader source from `celConstants.js`, like the thresholds).

- [~] T-35 Make the silhouette ring solid (binary alpha, no fade)
  - Files: `src/three/outlineMaterials.js`
  - Needs: T-21 (built layer 3)
  - Do: In `ringFragment`, replace `alpha = clamp( uThicknessDev + 0.5 - dMin, 0.0, 1.0 )` with a binary result: alpha 1 if `dMin <= uThicknessDev` (a covered tap exists within the thickness radius), otherwise `discard`; the covered-centre-texel branch stays alpha 1. Output `vec4( uColor, 1.0 )` for every non-discarded fragment. Update the comments above `RING_VERTEX`/`ringFragment` (no more `clamp(T + 0.5 - d)`). Do not touch the mask material, inner-edge material or `OutlineLayer.jsx`. If the outer edge looks polygonal at DPR 1, report it (lever: `OUTLINE_RING_TAPS`, owner decision); do not change the constant.
  - Covers: FR-13, FR-23, AC-8c (outer half), AC-11, D-15
  - Done when: `grep -n "clamp( uThicknessDev" src/three/outlineMaterials.js` returns nothing; in the browser (1000x900 DPR 1) scanning outward across the right limb shows no pixel with 0 < alpha < 255 beyond the body edge pixel (black run then transparent); `npm run lint` exits 0.

- [~] T-36 Remove the inner-edge line and gray strip near the silhouette; make strokes binary
  - Files: `src/three/outlineMaterials.js`, `src/three/celConstants.js`, `scripts/check-cel.mjs`
  - Needs: T-35
  - Do: (1) `celConstants.js`: add `OUTLINE_INNER_SILHOUETTE_MARGIN = 2.0` in the outline group with a comment (unit: multiples of the outline thickness; inner strokes are suppressed within this distance of the silhouette; raise if a stroke still shows near the limb, lower if strokes vanish too early; 0 = off) and add it to the file-header "what to change to" list. (2) `innerEdgeFragment`: bake in the margin; add 8 mask taps at radius `OUTLINE_INNER_SILHOUETTE_MARGIN * uThicknessDev` texels (directions every 45 degrees, no loop over the ring kernel) and `discard` if any tap has coverage `a < 0.5`; keep the existing four-tap uncovered test. Replace the `smoothstep` ramps with a hard test: stroke if `dN >= NORMAL_THRESHOLD || dZ >= DEPTH_THRESHOLD`, else `discard`; output `vec4( uColor, 1.0 )`. Update the comment above the function (hard alpha, margin). (3) `scripts/check-cel.mjs`: assert `OUTLINE_INNER_SILHOUETTE_MARGIN` is a number >= 0 and print a pass line. Change nothing else.
  - Covers: FR-23, FR-25, AC-8b (hard), AC-8c, D-15, D-17
  - Done when: no `smoothstep` remains in `innerEdgeFragment`; `npm run check:cel` exits 0; in the browser (1000x900 DPR 1) the right-limb scan no longer shows black, moon colour, black: it shows moon colour then one black run of 3 x DPR +-1 px then transparent; `npm run lint` exits 0.

- [~] T-37 Draw crater strokes only on the shadow side
  - Files: `src/three/outlineMaterials.js`, `src/three/celConstants.js`, `scripts/check-cel.mjs`
  - Needs: T-36
  - Do: (1) `celConstants.js` (outline group, header hints updated): add `OUTLINE_INNER_SHADOW_ONLY = true` (true = strokes only where the surface faces away from the light; false = all rims) and `OUTLINE_INNER_SHADOW_THRESHOLD = 0.0` (view-space N.L in [-1, 1]; stroke only if N.L <= this; raise toward 1 = more strokes with the lit side creeping in, lower toward -1 = fewer, only darkest rims; uses `CEL_LIGHT_DIRECTION`). Import `CEL_LIGHT_DIRECTION` into `outlineMaterials.js`. (2) `innerEdgeFragment`: when `OUTLINE_INNER_SHADOW_ONLY` is true (baked define), fetch the centre mask texel; `xy = centre.xy`, `z = sqrt( max( 0.0, 1.0 - dot( xy, xy ) ) )`, `ndl = dot( vec3( xy, z ), normalize( LIGHT_DIR ) )` with `LIGHT_DIR` a `const vec3` baked from `CEL_LIGHT_DIRECTION` at material creation (normalised in JS, written with `toFixed(6)`); `discard` if `ndl > SHADOW_THRESHOLD`. When the flag is false the gate code is omitted. Hard test, no ramp (D-17). Add a comment that N.L uses geometry normals only, like the toon shader. (3) `scripts/check-cel.mjs`: assert `OUTLINE_INNER_SHADOW_ONLY` is boolean and `OUTLINE_INNER_SHADOW_THRESHOLD` is a number in [-1, 1]; print pass lines. Do not touch `OutlineLayer.jsx` or the mask material.
  - Covers: FR-24, FR-25, AC-8b, AC-8d, D-16, D-17
  - Done when: `npm run check:cel` exits 0; in the browser crater rims on the upper-right (lit) side of the disc carry no stroke while shadow-side rims (lower-left) do, as partial arcs; scratch-setting `OUTLINE_INNER_SHADOW_ONLY = false` strokes all rims (reverted); `npm run lint` exits 0.

- [~] T-38 Add grazing-angle gate to inner strokes (fix gray strip at the bottom limb)
  - Files: `src/three/outlineMaterials.js`, `src/three/celConstants.js`, `scripts/check-cel.mjs`
  - Needs: T-36, T-37
  - Do: (1) `celConstants.js`: add `OUTLINE_INNER_GRAZING_Z = 0.35` in the outline group with a comment (no inner stroke where the reconstructed view-normal z is below this; range [0, 1]; raise = strokes stay further from the limb, lower = allowed closer; 0 = off) and add it to the file-header "what to change to" list. (2) `innerEdgeFragment`: bake the constant (`toFixed(6)`); fetch the centre mask texel unconditionally (reuse it for the shadow gate); `z = sqrt( max( 0.0, 1.0 - dot( xy, xy ) ) )`; `discard` if `z < GRAZING_Z`. Keep the silhouette margin and all other logic unchanged. Update the function comment (grazing gate, D-19). (3) `scripts/check-cel.mjs`: assert `OUTLINE_INNER_GRAZING_Z` is a number in [0, 1]; print a pass line. Do not touch `OutlineLayer.jsx` or other materials.
  - Covers: FR-26, FR-23, AC-8c, D-19
  - Done when: `npm run check:cel` exits 0; in the browser (1000x900 DPR 1) a scan straight down through the bottom limb shows moon colour then one black run of 3 x DPR +-1 px then transparent (no 10-20 px black run, no moon-colour strip); `npm run lint` exits 0.

- [~] T-39 Switch inner edges off by owner decision (D-20)
  - Files: `src/three/celConstants.js`
  - Needs: T-38
  - Do: Set `OUTLINE_INNER_EDGES = false` (only that value changes). Update its comment: off by owner decision (D-20, silhouette outline only); re-enable by setting it to `true`. Update the file-header hint if it mentions inner edges being on. Do not touch any other constant or file; inner-edge code stays as the dormant path.
  - Covers: D-20, FR-27, AC-8b (active)
  - Done when: `npm run lint`, `npm run check:cel` and `npm run build` exit 0; code inspection of `src/three/OutlineLayer.jsx` shows that with the flag false no inner-edge material and no inner-edge quad are created; `git diff`-equivalent shows only the value and comment changed in `celConstants.js`.

- [~] T-22 Verify silhouette outline, stars, sync and alpha (BROWSER)
  - Files: `specs/004-cel-shader/baseline.md` (append "Outline verification")
  - Needs: T-21, T-03, T-35, T-36, T-38, T-39
  - Do: Compare screenshots at 1440x900 and 375x812 side by side with `specs/004-cel-shader/reference.png` (solid heavy black band, no gray fringe, no gap to the body). (AC-8) at DPR 1 and DPR 2: continuous black ring, thickness 3 CSS px +-1 (device px = 3 x effective DPR +-1), outside the moon body (body diameter still within 003 FR-16 tolerance vs T-03 measurement), same thickness at upper-right and lower-left limb (+-1 device px), colour `#000000`. (AC-8c) pixel scan at DPR 1 and DPR 2 over at least 8 directions (right, left, up, down, 4 diagonals), from 6 device px inside the silhouette to 6 device px beyond the band, via `readPixels`/`toBlob` or screenshot pixels over the page background: sequence must be moon colour, (one moon-edge MSAA pixel allowed), black `rgb(0,0,0)` alpha 255 run of 3 x DPR +-1 pixels, then alpha 0; FAIL on any 0 < alpha < 255 pixel in or after the run, any non-black pixel inside the run, or a moon-coloured strip between the body and the run; record the right-limb scan at 1000x900 DPR 1 (the owner-reported defect was black, 153, black, 127, transparent). (AC-9) zoomed star screenshots near and far from the moon identical to 003 (no dark rings); stars passing behind the moon edge do not alter the outline; scratch-test a model with `toon` but not `outline` (revert afterwards) renders without outline. (AC-10) frame-by-frame capture during spin, pointer tilt and scroll-out/back: no gap or lag between moon edge and outline; with the moon partly scrolled past the viewport top, the outline follows the clipped silhouette. (AC-11) outline over the page background has alpha 1; pixels away from moon/outline stay transparent; moon/outline outer edge not visibly more aliased than the 003 edge at 100% zoom.
  - Covers: FR-10, FR-11, FR-12, FR-13, FR-15, FR-23, AC-8, AC-8c, AC-9, AC-10, AC-11
  - Done when: each AC (incl. AC-8c with the scan table at DPR 1 and 2) reported pass/fail with measurements; failures name the file to fix; scratch edits reverted. HUMAN/BROWSER.

- [~] T-23 Verify no lines inside the disc, record verdict and shimmer (BROWSER)
  - Files: `specs/004-cel-shader/baseline.md` (append "Inner-edge verdict", "Shimmer notes"); no source changes
  - Needs: T-22, T-39
  - Do: (AC-8b active, D-20) with `OUTLINE_INNER_EDGES = false`, verify at 1000x900 and 375x812, side by side with `specs/004-cel-shader/reference.png`, that there are no lines inside the disc: only toon bands and crater shading inside the silhouette, the only black being the silhouette band. Write in `baseline.md` "Inner-edge verdict: off by owner decision". Over a 10 s spin note single-pixel flicker (NFR-4) of the ring edge and the band edges (hard edges are expected to alias; report honestly, FLAG to the orchestrator if unacceptable, do not add smoothing), with the `CEL_BAND_AA_PX` value used. Do NOT tune thresholds or change any constant. AC-8d, FR-24, FR-25 (stroke part) and FR-26 are N/A while the flag is off; mark them N/A in the notes. (Dormant, only if the flag is re-enabled later: compare crater strokes against `reference.png`, AC-8d shadow-side check, threshold tuning.)
  - Covers: FR-27, NFR-4, AC-8b (active), D-18, D-20
  - Done when: `baseline.md` has "Inner-edge verdict: off by owner decision" with the no-lines-inside-the-disc result at both viewports vs `reference.png`, and "Shimmer notes" for the ring and band edges (acceptable or not, with `CEL_BAND_AA_PX` used); no constant changed. HUMAN/BROWSER.

- [~] T-24 Verify bounded cost and per-frame allocation (BROWSER + code review)
  - Files: `specs/004-cel-shader/baseline.md` (append "Outline render target sizes")
  - Needs: T-22
  - Do: (AC-12) with `window.__planetInfo()` record `outlineRtWidth` x `outlineRtHeight` at 1440x900 DPR 2 and at 375x812 coarse emulation; both must be region-sized (at most `OUTLINE_MAX_TEXELS`) and never the page-tall canvas size (`canvasHeight`). Scroll the hero out of view: `outlinePasses` stops increasing while `frames` keeps increasing; scrolling back resumes it. Code-review `OutlineLayer.jsx`, `PageScene.jsx` and the outline materials for per-frame allocation (no `new`, literals, closures in frame or pass code). Confirm resizing the window changes the RT only on change (counter or log), not each frame.
  - Covers: FR-14, FR-20, AC-12, D-14
  - Done when: table of RT sizes recorded; offscreen stall confirmed; review result written (pass or list of defects with file); failures name the file to fix. HUMAN/BROWSER for the measurement part.

- [~] T-25 Verify no-opt-in behaviour and genericity (static + BROWSER)
  - Files: scratch edit to `src/three/PageScene.jsx` (reverted afterwards)
  - Needs: T-21, T-17
  - Do: (AC-2) grep the toon/outline modules and `Model.jsx` for `moon`, `Moon_BaseColor`, `.glb`, `moon.glb`: none; confirm `Moon.jsx` is the only file passing `toon`/`outline`. (AC-1) code inspection that `useToonMaterials`/`useOutlineTag` return before any work when off; scratch-mount a second `<Model url={moonUrl} />` without props in a copy of the scene with the opt-ins off everywhere and compare `window.__planetInfo()` `programs` and memory against the same scene before the 004 changes (task T-03 numbers or a stash), and verify in the console that the instance's `mesh.material` objects are the loaded originals (same type, identity with the cached scene's). Revert the scratch edit.
  - Covers: FR-1, FR-2, FR-3, AC-1, AC-2
  - Done when: grep results listed (empty); program/memory counts reported equal; `PageScene.jsx` identical to its pre-task state. HUMAN/BROWSER for the runtime part.

- [~] T-26 Verify shader-failure fallbacks and reduced motion (BROWSER, scratch changes reverted)
  - Files: scratch edits to `src/three/toonMaterial.js` and `src/three/outlineMaterials.js` (both reverted afterwards)
  - Needs: T-22
  - Do: (AC-13a) introduce a deliberate GLSL typo in the toon `celShade` block: page status becomes `'fallback'`, poster shown, no uncaught error; revert. (AC-13b) same with the mask/ring shader; revert. Also test the render-target failure path if feasible (temporarily force the extension check to fail) and revert. Reduced motion emulation before load: no canvas, 3D chunk not requested. Network panel: no third-party requests. Re-check 003 AC-8 and AC-27 behaviours (WebGL disabled, corrupt model) still pass.
  - Covers: FR-17, FR-21, AC-13
  - Done when: each sub-check reported pass/fail; both source files identical to their pre-task state. HUMAN/BROWSER.

- [~] T-27 Verify context loss and restore (BROWSER)
  - Files: none (if a stale target appears, the plan fallback is keying `OutlineLayer` by `epoch` in `PageScene.jsx`: report it, apply only with orchestrator approval)
  - Needs: T-22
  - Do: (AC-14) `WEBGL_lose_context.loseContext()`: poster shown and loop paused; `restoreContext()`: moon returns with correct bands and outline (screenshot) or stays in fallback; no console errors. Repeat once while the moon is toon-shaded and outlined at DPR 2.
  - Covers: FR-18, AC-14
  - Done when: result reported with screenshots or description; failures name the file to fix. HUMAN/BROWSER.

- [~] T-28 Verify disposal and memory over route cycles (BROWSER)
  - Files: `specs/004-cel-shader/baseline.md` (append "Disposal cycles"); code-review list in the report
  - Needs: T-22
  - Do: (AC-15) dev, StrictMode on: read `window.__planetInfo()` baseline (`geometries`, `textures`, `programs`); do 10 cycles `/` -> `/viewer` -> `/` (wait over 1 s on `/viewer`, allow R3F's deferred disposal about 500 ms); counts equal baseline each time on `/`; zero or one canvas on `/`, none on `/viewer`; no console warnings. Code review listing every disposable created by this spec (toon materials, render target, ring/inner/mask materials, plane geometry) and where each is released.
  - Covers: FR-19, NFR-6, AC-15
  - Done when: cycle table recorded; disposable list complete; failures name the file to fix. HUMAN/BROWSER for the cycle part.

## Layer 5: Poster

- [~] T-29 Update PosterCapture for the cel-shaded outlined moon
  - Files: `src/three/PosterCapture.jsx`, `src/three/celConstants.js` (add `POSTER_DISPLAY_CSS_PX` export in the outline group only)
  - Needs: T-21, T-03
  - Do: In `celConstants.js` add `POSTER_DISPLAY_CSS_PX` (value measured in T-03, with a comment) . In `PosterCapture.jsx`: give the existing `<group scale={moonRadiusPx(1200)}>` a ref, mount `<OutlineLayer anchorRef thicknessCssPx={POSTER_OUTLINE_PX} />` where `POSTER_OUTLINE_PX = OUTLINE_THICKNESS_CSS_PX / (POSTER_DISPLAY_CSS_PX / 1200)`, and make the capture wait longer: call `invalidate()` and wait 4 animation frames after the model is ready before `toBlob` (frames run layout/relayout and the mask pass). Keep 1200x1200, transparent, `dpr={1}`, default pose (spin 0, tilt kept), no stars. Dev-only path stays gated by `import.meta.env.DEV` in `PageCanvas.jsx` (unchanged).
  - Covers: FR-16, D-7
  - Done when: `/?capture-poster` in dev downloads a 1200x1200 PNG showing the banded outlined moon (BROWSER check); `npm run build` exits 0 and `grep -rl "capture-poster\|CaptureOnReady" dist/assets` returns nothing; lint exits 0.

- [~] T-30 Capture and save the poster (HUMAN)
  - Files: `src/assets/hero-planet-poster.png` (overwrite)
  - Needs: T-23 (final look and inner-edge decision), T-29
  - Do: HUMAN STEP: the owner opens `http://localhost:5173/?capture-poster` in dev and saves the downloaded `hero-planet-poster.png` over `src/assets/hero-planet-poster.png`. Without a browser the builder stops and returns this step; it must not invent placeholder art.
  - Covers: FR-16, D-7, AC-16
  - Done when: the file is 1200x1200, transparent, and shows the cel-shaded outlined moon in the default pose.

- [~] T-31 Update Hero provenance comment and verify poster crossfade (BROWSER)
  - Files: `src/components/sections/Hero.jsx` (provenance comment date only)
  - Needs: T-30
  - Do: Update only the provenance comment in `Hero.jsx` to the capture date (keep the existing wording, mention cel-shaded outlined moon). (AC-16) at 1440x900 compare poster and live moon at the crossfade: no visible jump in bands or outline thickness (within 1 CSS px); confirm `Hero.jsx` diff is only the comment and the capture path is still gated by `import.meta.env.DEV`.
  - Covers: FR-16, AC-16
  - Done when: `Hero.jsx` diff is comment-only; crossfade comparison reported with measured thickness of both; `npm run build` exits 0. HUMAN/BROWSER for the comparison.

## Layer 6: Docs and final checks

- [~] T-32 Update the 3D README
  - Files: `src/assets/3D/README.md`
  - Needs: T-21, T-39
  - Do: Per plan "README update": amend section 5 "Materials are used as exported" (true only without opt-in; with `toon` the instance's materials are replaced by the toon material); add section "Toon shading and outline": props `toon` and `outline` with example (`<Model url={moonUrl} toon outline />` plus `<OutlineLayer anchorRef={placeRef} />` and the anchor contract: world position = model centre, world scale = on-screen radius in CSS px; `boundsFactor` for non-spherical models); what toon reads (base colour texture and factor sampled as sRGB, vertex normals, optional glTF normal map, double-sidedness; not emissive/metal/unlit flag); outline is per model by layer and stars are never outlined; inner edges use geometry normals/depth only; the constants module `src/three/celConstants.js` with a table of both groups and their defaults (including `OUTLINE_INNER_EDGES` = false by owner decision D-20, `OUTLINE_INNER_SILHOUETTE_MARGIN`, `OUTLINE_INNER_SHADOW_ONLY`, `OUTLINE_INNER_SHADOW_THRESHOLD`, `OUTLINE_INNER_GRAZING_Z`); the active outline is a solid hard-edged black silhouette band only, with no lines inside the disc; note that inner crater strokes are a dormant feature re-enabled by setting `OUTLINE_INNER_EDGES = true` (then strokes appear only on the shadow side of rims, gated by N.L against `CEL_LIGHT_DIRECTION`); opaque materials only (no alpha blend/mask under toon); non-opted models are used as exported. Keep it short.
  - Covers: FR-22, AC-17, D-20
  - Done when: README contains every item above and the amended note; defaults in the table match `celConstants.js`; no code change.

- [~] T-33 Final static checks, build, chunk and dependency report
  - Files: `specs/004-cel-shader/baseline.md` (append "After")
  - Needs: T-23, T-26, T-32
  - Do: Run `npm run lint`, `npm run build`, `npm run check:cel`, `npm run check:buffer`. Record after-build entry and 3D chunk names with raw and gzip sizes next to "Before"; entry chunk has no `three`/R3F/drei markers; `package.json` dependencies unchanged vs 003 (only the `check:cel` script added); grep `ShaderMaterial|onBeforeCompile` only under `src/three/`; no `?raw`; no `new WebGLRenderer`; no three/R3F import outside `src/three/`; no console errors or warnings on `/` and `/viewer` (BROWSER); 003 AC-5, AC-7, AC-8, AC-15, AC-17 to AC-30 quick re-check noted pass/fail.
  - Covers: FR-21, NFR-1, NFR-2, NFR-5, AC-18
  - Done when: all commands exit 0 with no project warnings; before/after sizes recorded; every grep result listed; regression list reported.

- [~] T-34 Record frame times and shimmer observation (HUMAN/BROWSER)
  - Files: `specs/004-cel-shader/baseline.md` (complete "Frame times" and "Shimmer notes")
  - Needs: T-23, T-33
  - Do: Repeat the T-03 frame-time measurements (1440x900 DPR 2; 375x812 coarse, 4x CPU throttle; moon in view, 5 s) on the final build and fill the after column with deltas. Confirm scrolling stays smooth (no main-thread block beyond the frame budget). Record the 10 s spin shimmer observation (band edges and outline) with the `CEL_BAND_AA_PX` value used. If frame time regressed beyond budget, list the plan D-E levers in order (`OUTLINE_RT_SCALE`, fewer ring steps/taps, annulus geometry) and flag to the orchestrator; do not apply a look-changing lever.
  - Covers: NFR-3, NFR-4, AC-19
  - Done when: before/after frame times for both setups and the shimmer verdict are in `baseline.md`; AC-19 reported pass/fail. HUMAN/BROWSER.

## Requirement traceability

| Req | Tasks |
| --- | --- |
| FR-1 | T-09, T-13, T-14, T-25 |
| FR-2 | T-08, T-09, T-13, T-14, T-25 |
| FR-3 | T-09, T-10, T-14, T-21, T-25 |
| FR-4 | T-07, T-08, T-11 |
| FR-5 | T-07, T-11 |
| FR-6 | T-01, T-07, T-11 |
| FR-7 | T-07, T-11 |
| FR-8 | T-07, T-08, T-12 |
| FR-9 | T-04, T-06, T-07, T-12 |
| FR-10 | T-13, T-15, T-16, T-18, T-19, T-22 |
| FR-11 | T-04, T-05, T-15, T-16, T-18, T-19, T-22, T-23 |
| FR-23 | T-35, T-36, T-38, T-22 |
| FR-26 | T-38 (dormant, N/A while inner edges off) |
| FR-24 | T-37 (dormant, N/A while inner edges off) |
| FR-25 | T-36, T-37 (dormant, N/A while inner edges off) |
| FR-27, D-20 | T-39, T-23, T-32 |
| FR-12 | T-01, T-18, T-20, T-22 |
| FR-13 | T-15, T-18, T-35, T-22 |
| FR-14 | T-05, T-06, T-17, T-18, T-20, T-24 |
| FR-15 | T-10, T-20, T-21, T-22 |
| FR-16 | T-03, T-29, T-30, T-31 |
| FR-17 | T-01, T-15, T-18, T-26 |
| FR-18 | T-27 |
| FR-19 | T-08, T-17, T-18, T-19, T-28 |
| FR-20 | T-07, T-18, T-19, T-24 |
| FR-21 | T-26, T-33 |
| FR-22 | T-32 |
| NFR-1 | T-02, T-33 |
| NFR-2 | T-33 |
| NFR-3 | T-03, T-34 |
| NFR-4 | T-05, T-18, T-23, T-34 |
| FR-11 (inner-edge part) | dormant per D-20 |
| NFR-5 | T-04, T-06, T-07, T-18, T-33 |
| NFR-6 | T-28 |
| AC-1 | T-17, T-25 |
| AC-2 | T-10, T-21, T-25 |
| AC-3 | T-11 |
| AC-4 | T-03, T-11 |
| AC-5 | T-11 |
| AC-6 | T-06, T-12 |
| AC-7 | T-12 |
| AC-8 | T-06, T-22 |
| AC-8b (active: no lines inside the disc) | T-39, T-23 |
| AC-8b-dormant | T-36, T-37 (N/A while off) |
| AC-8c | T-35, T-36, T-38, T-22 |
| AC-8d | T-37 (N/A while inner edges off) |
| AC-9 | T-22 |
| AC-10 | T-22 |
| AC-11 | T-35, T-22 |
| AC-12 | T-06, T-17, T-24 |
| AC-13 | T-26 |
| AC-14 | T-27 |
| AC-15 | T-17, T-28 |
| AC-16 | T-30, T-31 |
| AC-17 | T-32 |
| AC-18 | T-02, T-33 |
| AC-19 | T-03, T-34 |

## Open questions
None. Human/browser steps: T-03 (baseline screenshots, frame times, poster display width), T-11, T-12, T-22 to T-28 (browser verification), T-30 (save the captured poster over `src/assets/hero-planet-poster.png`), T-31 (crossfade comparison), T-34 (frame times). T-01 must be completed first: if either plan risk (Lambert chunk names, R3F negative priority ordering) is refuted, stop and report to the orchestrator before T-07 / T-20. Inner edges are OFF by owner decision D-20 (T-39 sets `OUTLINE_INNER_EDGES = false`); T-23 verifies no lines inside the disc and may flag unacceptable shimmer of the ring/band edges. Fix tasks T-35 to T-38 (owner feedback, spec D-15 to D-19) and T-39 run before T-22/T-23.
