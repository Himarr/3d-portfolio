# Plan: 004 Cel Shader and Outline

## Amendment D-20 (owner): silhouette only, inner edges off
Active outline = silhouette ring only. `OUTLINE_INNER_EDGES` is set to `false` in `celConstants.js` (task T-39). The inner-edge quad/material (D-D.3), shadow-side gate (D-D.4, D-16), grazing gate (D-19), silhouette margin and binary strokes (D-17) stay in the code as a dormant path, re-enabled by setting the constant to `true`; their text below remains valid for that case. With the flag false `OutlineLayer.jsx` creates no inner-edge material or quad (T-19). Verification (T-23) now checks "no lines inside the disc" (FR-27, AC-8b) and AC-8d/FR-24/FR-26 are N/A. The constants table default `OUTLINE_INNER_EDGES true` below is superseded: default is `false`.

## Approach
Brownfield on 003 (React 19 StrictMode, R3F 9.8.2, drei 10.7.9, three 0.186.1, Vite 8, oxlint). Two generic, per-object opt-ins on `Model`:
- `toon`: the loaded materials are replaced (on the per-instance clone only) by a toon material that reads the glTF base colour texture/factor and applies a 4-band ramp driven by a camera-fixed light term.
- `outline`: the model's meshes are tagged with a three.js layer; an `OutlineLayer` component renders only that layer into a small region-bounded render target (normal + depth + coverage) and composites a black outline from it with two thin quads placed in the same canvas scene.

No new npm dependency (see D-A). No three.js light objects. Moon is the first consumer from `Moon.jsx`. Everything lives in `src/three/` behind the existing lazy boundary.

Order matters: capture a "before" baseline (chunk sizes, frame times, screenshots) BEFORE code changes, because AC-18 and AC-19 compare against it.

## Architecture / design decisions

### D-A Outline approach and dependency decision (spec D-13)
Decision: custom outline pass built from `three` + R3F. No `postprocessing` / `@react-three/postprocessing`. Why this is the easier path to a correct result:
- `EffectComposer` takes over R3F's render loop and renders the whole scene into full-canvas buffers. The canvas is page-tall (up to the 003 NFR-6 budget), so this breaks D-14/FR-14 (no page-tall buffers) and would also post-process the stars. Avoiding that needs a second custom scene/composer anyway.
- Its selective outline effects give silhouette outlines only; crater-rim edges from normal/depth discontinuities (D-12) need a custom effect regardless.
- A transparent (`alpha`) canvas with MSAA through a composer is a known source of alpha/AA problems (FR-13).
- A new package adds peer-range, disposal and context-loss surface. The custom pass is about 3 small shaders and one component, and we control disposal and the skip-when-offscreen rule directly.
No version pins change; `package.json` only gets one script (`check:cel`).

### D-B Toon material: `onBeforeCompile` on a `MeshLambertMaterial`, not a raw `ShaderMaterial`
- Create a NEW `MeshLambertMaterial` per source material with `map`, `color` (the base colour factor), `normalMap`, `normalScale`, `side`, `vertexColors`, `flatShading` copied from the source (guarded: source may be `MeshBasicMaterial` from `KHR_materials_unlit`, `MeshStandardMaterial`, etc.). `map` is the SAME texture object (shared, not cloned; the toon material must never dispose it).
- Why: three's standard chunks give correct UV transform, texture sampling (sRGB texture is decoded to linear by the sampler), `color` factor, vertex colours, double-sided normal flipping (`faceDirection`), optional `normalMap` (FR-6 default: used if present) and the view-space `normal` variable, with no hand-written GLSL for those. Only the final colour is replaced, so the risk surface is small.
- `onBeforeCompile`: replace the `#include <opaque_fragment>` chunk with a block that computes `gl_FragColor = vec4(celShade(diffuseColor.rgb, normal), diffuseColor.a)`; the stock `colorspace_fragment` that follows encodes linear to sRGB. Builder confirms chunk names against `node_modules/three/src/renderers/shaders/ShaderLib/meshlambert.glsl.js` (0.186); if `opaque_fragment` differs, replace the equivalent final assignment, and report.
- `celShade(base, N)`: `ndl = dot(normalize(N), uCelLightDir)`. Linear-space colours: `spot = uCelSpotColor` (a `Color` built from `#EDEDED`, so three converts sRGB to linear; output encode returns exactly `#EDEDED`), `lit = base * 1.0`, `s1 = base * 0.67`, `s2 = base * 0.33` (D-10, linear). Band weights use `smoothstep(t - w, t + w, ndl)` with `w = 0.5 * CEL_BAND_AA_PX * fwidth(ndl)` (derivative-based, at most 1 device px, D-11; `0` gives pure `step`), blended in order `s2 -> s1 -> lit -> spot`. `fwidth` is core in WebGL2 GLSL3.
- Uniforms are module-level shared objects in `toonMaterial.js` filled from `celConstants.js` (no per-frame writes, FR-20). `customProgramCacheKey` returns a fixed string so all toon materials share one program.
- Light term (FR-7, D-3, D-8): `uCelLightDir` is the constant view-space unit vector from `CEL_LIGHT_DIRECTION`. It is not a scene light and has no relation to the camera object, so scroll/resize/DPR cannot change it; spin and tilt change shading because the mesh normals rotate. The orthographic camera has no rotation, so view space equals world axes (x right, y up, z to viewer).
- Does not mutate GLB materials (FR-8): the swap is on `mesh.material` of the clone's meshes only; the cached `scene` and other clones keep the originals (the clone shares geometry/materials by reference, so we only reassign the clone's property). `KHR_materials_unlit` is irrelevant because the new material is built from the source's data, not by reusing the source.

### D-C Opt-in API (FR-1, FR-3)
`Model({ url, toon = false, outline = false, ...props })`. Both booleans, independent, default off.
- `toon`: `useToonMaterials(clone, toon)` in `useToonMaterials.js` (a hook, so `Model.jsx` stays small). `useLayoutEffect` on `[clone, toon]`: if `!toon` return before touching anything (FR-2: no materials, programs or targets created). Else traverse meshes, build a toon material per distinct source material (a `Map`, so shared source materials share one toon material), remember each mesh's original material, assign. Cleanup restores originals and calls `dispose()` on the toon materials only (never on textures). Layout effect so the swap commits before the first rAF frame (no flash of unlit moon after Suspense reveals).
- `outline`: `useOutlineTag(clone, outline)` in `outlineLayers.js`-backed hook: layout effect enabling `OUTLINE_LAYER` (value 1) on every mesh of the clone; cleanup disables it. Meshes stay on layer 0 too, so the main camera still renders them. Stars never get layer 1 (FR-10, D-5).
- The pass itself is `OutlineLayer` (below). A scene that wants an outline mounts `<OutlineLayer anchorRef={...} />` next to the model. Contract (documented in the README): `anchorRef` is a group whose world position is the model centre and whose world scale is the on-screen radius in CSS px (what `PageScene`'s placement group already is, via `FitToUnit` + `moonRadiusPx`). Models that are not sphere-like pass `boundsFactor`.
- No moon-specific code in `toonMaterial.js`, `OutlineLayer.jsx`, `outline*.js`, `celConstants.js`, `Model.jsx` (FR-3, AC-2). The moon opts in only in `Moon.jsx`: `<Model url={moonUrl} toon outline />`. `PageScene.jsx` and `PosterCapture.jsx` mount the generic `OutlineLayer` with their placement group as anchor (they already own the moon placement).
- Per-model ramp overrides: not provided (spec Assumption); constants are shared.

### D-D Outline pipeline (FR-10 to FR-14, D-12, D-14)
Per frame, only while the anchor is visible, in `OutlineLayer`:
1. Mask pass: render the scene with a dedicated orthographic mask camera whose `layers` contain only `OUTLINE_LAYER`, into a half-float RGBA render target, with `scene.overrideMaterial = maskMaterial` (restored in `finally`). Because the camera sees only layer 1, stars and non-opted meshes are not drawn: they cannot create or break edges. Clear colour (0,0,0,0) saved/restored with preallocated objects. The mask material writes `vec4(n.xy, (-viewZ - uDepthRef) / uRadius, 1.0)`: view-space normal xy (flipped if back face), depth relative to the anchor in units of radius (small numbers, so half float is precise), coverage in alpha. `side = DoubleSide`, depth test on.
2. Silhouette ring quad (`RingMaterial`): sits just BEHIND the moon in z (`-min(OUTLINE_Z_FACTOR * radius, OUTLINE_Z_MAX)`), `transparent`, `depthTest: true`, `depthWrite: false`. For each fragment: if the centre texel is covered, alpha 1 (hidden by depth test under the moon); else sample `OUTLINE_RING_STEPS` rings of `OUTLINE_RING_TAPS` taps up to the thickness radius (device px). AMENDED (D-15, FR-23): alpha is BINARY: `alpha = 1` if any tap within `T = uThicknessDev` hit coverage (`dMin <= T`), else the fragment is `discard`ed. The old `clamp(T + 0.5 - dMin, 0, 1)` ramp (source of the alpha-127 fringe) is removed. Circular kernel, so thickness is uniform at all angles. Because the quad is behind and depth-tested, MSAA on the moon's own edge blends moon over black per sample, so the moon/band boundary keeps 003's moon-edge anti-aliasing and the band is outside the body (D-12). The outer edge of the band is now a hard cut (aliasing accepted per D-15; if the ring edge looks polygonal at DPR 1, raise `OUTLINE_RING_TAPS` before anything else, cost lever in D-E).
3. Inner-edge quad (`InnerEdgeMaterial`), only if `OUTLINE_INNER_EDGES`: in front of the moon (`+z`, `depthTest: false`, high `renderOrder`). Edge signal: Roberts-cross style differences of the mask at offset `d = thickness / 2` device px in x and y: `dN = |N(+d,0) - N(-d,0)| + |N(0,+d) - N(0,-d)|` (xy normal) and `dZ = same for depth`. AMENDED (D-17, FR-25): edge = `dN >= OUTLINE_NORMAL_THRESHOLD || dZ >= OUTLINE_DEPTH_THRESHOLD`, binary alpha (the old `smoothstep(T, 2T)` ramp is removed; stroke pixels are `#000000` alpha 1, others `discard`). Pixels with any uncovered tap output 0 (the silhouette belongs to the ring). Line width is about `2 * d = thickness`, matching the outline (uniform thickness). Only geometry normals/depth are used, not the glTF normal map (override material cannot know per-mesh maps); noted in the README.
   - Silhouette margin (D-15, FR-23): the measured gray strip came from this quad drawing an edge line a few px inside the limb (the normal xy gradient is steep near the limb of a sphere), leaving moon colour between that line and the ring. Fix: suppress inner strokes within `OUTLINE_INNER_SILHOUETTE_MARGIN * uThicknessDev` device px of the silhouette. Implementation: extra coverage taps of the mask at that radius (8 directions, one pass, no loops over the whole kernel); if any tap is uncovered the fragment is `discard`ed. Result: moon colour right up to the body edge, then the ring band; no inner stroke can form a second line near the limb. Alternative rejected: extending the ring inward would paint over body pixels (violates "outside the body", AC-8).
4. Shadow-side gating (D-16, FR-24): the mask stores view-space normal xy; the z component is reconstructed in the inner-edge shader as `z = sqrt(max(0.0, 1.0 - dot(xy, xy)))` (valid because back faces are flipped to face the viewer and the orthographic view has z towards the viewer, so z >= 0). `ndl = dot(vec3(xy, z), normalize(CEL_LIGHT_DIRECTION))`, taken from the CENTRE texel of the pixel (one extra fetch; the four Roberts taps straddle the edge so the centre is the surface the stroke is drawn on). Gate: when `OUTLINE_INNER_SHADOW_ONLY` is true, draw the stroke only if `ndl <= OUTLINE_INNER_SHADOW_THRESHOLD` (hard test, binary like the stroke itself). The light direction is baked into the shader source as a `const vec3` from `celConstants.js` at material creation (static constant, no uniform and no `OutlineLayer` change), the same convention as the thresholds. The N.L matches the toon shader's N.L because both use geometry normals in view space with the same camera-fixed `CEL_LIGHT_DIRECTION` (glTF normal map excluded, noted in README). Default threshold 0.0 (surface turned away from the light); raising towards 1 strokes more rims, lowering towards -1 leaves only the darkest rims. Caveat: gating is by shading at the pixel, so it is per-pixel (partial arcs on a crater straddling the terminator), not per crater. If the result differs from `reference.png`, the lever is the threshold (owner tweak), not code.
   - Grazing-angle gate (D-19, FR-26, amends the margin above): the margin alone left a gray strip at the bottom limb (scan: moon, 10-20 px black, 6 px moon colour, 3 px ring) because normals change fast near the limb and the detector fires beyond the 6 px margin. Fix in `innerEdgeFragment`: from the centre texel, `z = sqrt(max(0.0, 1.0 - dot(xy, xy)))`; `discard` if `z < GRAZING_Z` (baked from `OUTLINE_INNER_GRAZING_Z`, default 0.35). Applied regardless of `OUTLINE_INNER_SHADOW_ONLY` (reuses the centre fetch when the shadow gate is on; fetch it unconditionally otherwise). The silhouette margin stays; the ring alone forms the limb edge. Lever if a stroke still shows near the limb: raise `OUTLINE_INNER_GRAZING_Z`; if craters near the limb lose strokes: lower it.
   - Feasibility assessment: feasible. The signal is cheap (8 fetches), uses data the mask already holds, and the smooth-sphere limb does not trigger it (the gradient only exceeds thresholds within a fraction of a pixel of the limb, where the ring takes over). Real risk is the moon mesh's crater relief being too gentle in normals, or shimmer on noisy normals; this is judged by eye in the verification pass. Gate: if rims do not read cleanly or shimmer fails NFR-4 after tuning thresholds, set `OUTLINE_INNER_EDGES = false`, record it in `baseline.md`, and flag it to the owner (spec D-12 fallback). The infrastructure (ring) is unaffected.
5. Both quads output `vec4(OUTLINE_COLOR, 1.0)` for every non-discarded fragment (binary alpha, D-15/D-17) with the stock `colorspace_fragment`; black stays pure black. Non-premultiplied `NormalBlending`: black composes correctly on the transparent canvas, outline alpha 1 across the whole band (FR-13). Edge smoothing: none (owner did not ask; flagged in Risks).
- Same-frame guarantee (FR-12): the scene `useFrame` that spins/tilts runs at priority `-1`; `OutlineLayer`'s `useFrame` at priority `0` runs after it and before R3F's automatic render. Negative priority does not disable auto-render (only positive does); builder confirms sort order in 9.8.2 source. The mask therefore reflects the same transforms as the frame that follows. The anchor never moves in canvas coordinates during scroll (the canvas scrolls with the page), so scroll has no lag by construction; viewport clipping needs nothing special because quads live in the same canvas.
- Why not render in `onBeforeRender`: avoids nested renders inside the main render (re-entrancy), keeps ordering explicit.

### D-E Bounded cost (FR-14, D-14, AC-12)
- Region, not page: the render target covers the square around the anchor: `half = radius * OUTLINE_BOUNDS_FACTOR + thickness + OUTLINE_PAD_CSS_PX` (CSS px). Size in texels `N = even(ceil(2 * half * rtDpr))`. `rtDpr = min(effectiveDpr * OUTLINE_RT_SCALE, OUTLINE_MAX_TEXELS / (2 * half))`, so N never exceeds `OUTLINE_MAX_TEXELS` (2048) and is derived from the moon, not the page height. Typical: 1440x900, DPR 2 -> about 1350 texels square (RGBA16F about 15 MB); mobile coarse -> smaller.
- Alignment: the mask camera/quad centre is snapped so `(centre + canvasSize/2) * rtDpr` is an integer (x) and likewise for y, and N is even, so mask texels map 1:1 to canvas device pixels (no shimmer from sub-pixel resampling). Pure maths in `outlineRegion.js`, checked by `scripts/check-cel.mjs`.
- Resize only when inputs change: `OutlineLayer` caches anchor x, y, radius and `dpr` as numbers; each frame compares them (no allocation) and runs `relayout()` only on change (resize, hero metrics change, DPR change): `rt.setSize`, camera frustum, quad transforms, uniforms. Idle frames do not allocate (FR-20).
- Skipped while offscreen: if `anchor` is missing or `anchor.visible === false` (`PageScene` already sets it from `hero.inView`, 003 FR-33), the quads are hidden and no mask render happens. Star frames continue (dev counter `outlinePasses` stops, AC-12).
- Cost note: moon geometry is drawn twice per frame (mask + main); ring cost is bounded by region area x (1 + up to 64 taps) with the covered interior exiting after one tap. Measured in `baseline.md`. Levers if over budget, in order: `OUTLINE_RT_SCALE` (e.g. 0.75), fewer ring steps/taps, annulus geometry instead of a square quad. Changing the lever is an owner decision if it changes the look.

### D-F DPR handling (FR-11, NFR-3)
`OutlineLayer` reads the effective DPR from `useThree((s) => s.viewport.dpr)` (set by `DprController` via the `dpr` prop; not raw `devicePixelRatio`) and the thickness in device px is `OUTLINE_THICKNESS_CSS_PX * rtDpr`. Result: constant CSS thickness at DPR 1, 1.5, 2. The outline never changes `dpr` or the pixel budget. Band AA uses `fwidth`, so it adapts to device pixels automatically. The camera must have `zoom = 1` (true in `PageCanvas`/`PosterCapture`); `OutlineLayer` throws in DEV otherwise.

### D-G Robustness
- Shader errors (FR-17): every program (toon, mask, ring, inner) compiles through the existing renderer, so `CanvasGuard`'s `gl.debug.onShaderError` -> `fail()` -> poster fallback applies with no new hook. AC-13 uses deliberate GLSL typos in scratch.
- Render-target creation (FR-17): `OutlineLayer` checks `gl.extensions.has('EXT_color_buffer_float') || has('EXT_color_buffer_half_float')` and `gl.capabilities.isWebGL2` in its layout effect; failure throws, which the existing `CanvasErrorBoundary` turns into `fail()` (React boundaries catch effect errors). Builder confirms R3F 9.8.2 rethrows to the outer boundary (003 risk, already verified for corrupt models).
- Context loss/restore (FR-18): three re-creates GL resources lazily on next use after restore (the renderer re-initialises its property/state caches on `webglcontextrestored`), so toon materials, ring/inner materials, mask target and programs come back without code. `PageCanvas` already pauses the loop on loss and bumps `epoch` on restore. Verified by AC-14; if a stale target is observed, the fallback is to key `OutlineLayer` by `epoch` (a one-line prop, still in `PageScene`).
- Disposal (FR-19): `OutlineLayer` creates the render target, three `ShaderMaterial`s and one `PlaneGeometry` in `useMemo` (nothing touches the GPU until first render), and a `useEffect` cleanup disposes all of them and clears `scene.overrideMaterial` if left set. StrictMode: dispose-then-reuse is safe in three (it re-uploads on next use); the throwaway second `useMemo` evaluation never reached the GPU. Toon materials: disposed in the `useToonMaterials` cleanup (materials only; textures remain owned by the GLB, released by `Model`'s existing ref-counted `disposeObject`). The shared toon uniform objects are plain objects (nothing to dispose). R3F does not dispose instances passed as props, hence the explicit cleanup.
- StrictMode: all effects are idempotent (swap + restore, tag + untag, create in memo + dispose in cleanup). `Model`'s deferred ref-count disposal unchanged. Verified by the 10x route-cycle check (AC-15).
- Reduced motion (FR-21): `HomePage` does not mount the canvas; no code from this spec runs. Poster only.
- No per-frame allocation (FR-20): `OutlineLayer`'s frame callback uses preallocated `Color`, cached numbers and module-scope scratch; no object/array/closure creation.

### D-H Poster (FR-16, D-7)
`PosterCapture.jsx` keeps its 1200x1200 transparent flow and adds (a) `toon` + `outline` via `Moon`, (b) an anchor group (the existing `<group scale={moonRadiusPx(1200)}>` with a ref) and `<OutlineLayer anchorRef thicknessCssPx={POSTER_OUTLINE_PX} />`, (c) more settle time: `frameloop` stays `demand` but the capture calls `invalidate()` and waits 4 animation frames (first frames run the layout/relayout and mask pass). `POSTER_OUTLINE_PX = OUTLINE_THICKNESS_CSS_PX * 1 / POSTER_DISPLAY_SCALE`, where `POSTER_DISPLAY_SCALE = posterDisplayedCssWidthAt1440x900 / 1200`; `POSTER_DISPLAY_CSS_PX` is a constant measured in the browser at 1440x900 (the poster `<img>` rendered width) by the builder and recorded in `baseline.md`. Default pose unchanged (spin 0, tilt kept, no stars). The PNG is still saved by a human over `src/assets/hero-planet-poster.png`; `Hero.jsx` provenance comment date is the only edit there.

### D-I Reduced coupling to existing files
`PageScene.jsx` gains: `useFrame(cb, -1)` priority, `<OutlineLayer anchorRef={placeRef} />` inside the existing `Suspense` next to `MoonReady`. `Moon.jsx` gains two props. `PageCanvas.jsx`, `DprController.jsx`, `webgl.js`, `bufferLimits.js`, `disposeObject.js`, `CanvasErrorBoundary.jsx`, `FitToUnit`, hooks: unchanged.

## Tunable constants module (FR-9, FR-11, D-2): `src/three/celConstants.js`
Pure JS (no `three` import, so Node checks can import it). Two clearly separated, commented groups; every export has a one-line comment (meaning, unit, effect). This is the ONE place the owner edits.
```
// --- Cel ramp ---
CEL_LIGHT_DIRECTION       [1, 1, 1]  view-space direction toward the light (x right, y up, z to viewer); normalised at use
CEL_LIGHT_SPOT_COLOR      '#EDEDED'  flat sRGB colour of the brightest band
CEL_LIT_MULTIPLIER        1.0
CEL_SHADOW1_MULTIPLIER    0.67
CEL_SHADOW2_MULTIPLIER    0.33       multipliers applied to base colour in LINEAR space (Blender-style)
CEL_THRESHOLD_LIGHT_SPOT  0.85       NdotL at/above -> light spot
CEL_THRESHOLD_LIT         0.30       NdotL at/above -> lit
CEL_THRESHOLD_SHADOW1     -0.20      NdotL at/above -> shadow 1, below -> shadow 2
CEL_BAND_AA_PX            1          band-edge smoothing in device px, 0 = hard steps
// --- Outline ---
OUTLINE_COLOR             '#000000'
OUTLINE_THICKNESS_CSS_PX  3          uniform thickness, scaled by effective DPR
OUTLINE_INNER_EDGES       false      D-20: OFF by owner decision (silhouette only); set true to re-enable crater rims etc.
OUTLINE_NORMAL_THRESHOLD  0.35       inner edge: normal-xy difference across the line width (stroke is binary: at/above = stroke)
OUTLINE_DEPTH_THRESHOLD   0.03       inner edge: depth difference in units of radius (binary)
OUTLINE_INNER_SILHOUETTE_MARGIN 2.0  NEW (D-15): inner strokes are suppressed within this many outline thicknesses of the silhouette; raise if a stroke still shows near the limb, lower if strokes vanish too early; 0 = off
OUTLINE_INNER_SHADOW_ONLY true       NEW (D-16): true = strokes only where the surface faces away from the light; false = all rims
OUTLINE_INNER_SHADOW_THRESHOLD 0.0   NEW (D-16): view-space N.L in [-1, 1]; stroke only if N.L <= this. Raise (toward 1) = more strokes (lit side creeps in); lower (toward -1) = fewer, only the darkest rims. Uses CEL_LIGHT_DIRECTION
OUTLINE_INNER_GRAZING_Z   0.35       NEW (D-19): no inner stroke where reconstructed view-normal z (from mask xy) is below this, [0, 1]. Raise = strokes stay further from the limb (kills limb artefacts); lower = strokes allowed closer to the limb; 0 = off
OUTLINE_RING_STEPS        4          silhouette kernel rings
OUTLINE_RING_TAPS         16         taps per ring
OUTLINE_RT_SCALE          1          mask resolution multiplier (cost lever)
OUTLINE_BOUNDS_FACTOR     1.05       region radius as a multiple of the anchor radius
OUTLINE_PAD_CSS_PX        2          extra region margin
OUTLINE_MAX_TEXELS        2048       hard cap on mask size
OUTLINE_Z_FACTOR          1.2        ring quad depth behind the model, x radius
OUTLINE_Z_MAX             900        cap on that depth (stays in front of the star plane)
```
Defaults reproduce spec D-8/D-9/D-12 and D-15/D-16 (the three NEW outline constants above; the owner tweaks them). Note: the built `celConstants.js` currently has `CEL_THRESHOLD_LIGHT_SPOT` 0.9 and `CEL_THRESHOLD_SHADOW1` -0.3 (owner tuning after T-11), differing from the block above; those built values stand and are not changed by this amendment. The reference screenshot `specs/004-cel-shader/reference.png` is now in the repo (D-18): the verification tasks compare against it. Shared defaults only; the file header lists "what to change to ...".

## Files to create/modify
Create (`src/three/` unless noted):
- `celConstants.js` (constants above)
- `toonMaterial.js` (`createToonMaterial(source)`, shared uniforms, the GLSL `celShade` chunk as a JS string; no `?raw`)
- `useToonMaterials.js` (swap/restore/dispose hook)
- `outlineLayers.js` (`OUTLINE_LAYER = 1`, `useOutlineTag(root, enabled)`)
- `outlineRegion.js` (pure: `computeOutlineRegion`, snapping, texel size)
- `outlineMaterials.js` (GLSL strings; `createMaskMaterial`, `createRingMaterial`, `createInnerEdgeMaterial`)
- `OutlineLayer.jsx` (component: render target, mask camera, two quads, frame callback, disposal)
- `scripts/check-cel.mjs` (Node asserts, see Test strategy)
- `specs/004-cel-shader/baseline.md` (before/after sizes, frame times, RT sizes, shimmer notes, inner-edge verdict, poster display width)
Modify:
- `src/three/Model.jsx` (props `toon`, `outline`; call the two hooks)
- `src/three/Moon.jsx` (`<Model url={moonUrl} toon outline />`)
- `src/three/outlineMaterials.js` (post-layer-3 fix, T-35 to T-38: binary ring alpha, inner-edge silhouette margin, binary stroke alpha, shadow-side gate, grazing-angle gate)
- `src/three/celConstants.js` (post-layer-3 fix: three new outline constants)
- `scripts/check-cel.mjs` (asserts for the new constants)
- `src/three/PageScene.jsx` (`useFrame` priority -1; mount `OutlineLayer`)
- `src/three/PosterCapture.jsx` (anchor ref, `OutlineLayer`, poster thickness, frame wait)
- `src/three/devStats.js` (add `outlinePasses`, `outlineRtWidth`, `outlineRtHeight`)
- `src/three/CanvasGuard.jsx` (dev hook returns the new stats)
- `src/assets/3D/README.md` (FR-22, below)
- `src/components/sections/Hero.jsx` (provenance comment date only)
- `src/assets/hero-planet-poster.png` (regenerated, human-assisted)
- `package.json` (script `"check:cel": "node scripts/check-cel.mjs"`; dependencies unchanged)
Delete: none.
Unchanged: everything else, including `bufferLimits.js`, `DprController.jsx`, `PageCanvas.jsx`, `disposeObject.js`, `index.css`, Navbar, sections, GSAP/Lenis, `vite.config.js`.

## Data / interfaces
- `Model({ url, toon?: boolean, outline?: boolean, ...groupProps })`.
- `OutlineLayer({ anchorRef: RefObject<Object3D>, thicknessCssPx?: number = OUTLINE_THICKNESS_CSS_PX, boundsFactor?: number = OUTLINE_BOUNDS_FACTOR })`; renders null-equivalent (two meshes, hidden when the anchor is hidden); default export.
- `createToonMaterial(source: Material): MeshLambertMaterial`; `useToonMaterials(root: Object3D, enabled: boolean): void`.
- `OUTLINE_LAYER: 1`; `useOutlineTag(root, enabled): void`.
- `computeOutlineRegion({ x, y, radius, boundsFactor, thicknessCssPx, padCssPx, dpr, rtScale, maxTexels, canvasWidth, canvasHeight }) -> { centerX, centerY, halfCss, texels, rtDpr, thicknessDev }` (pure).
- Mask texel layout: R,G = view-space normal xy; B = (distance - uDepthRef) / radius; A = coverage.
- Dev global `window.__planetInfo()` additionally returns `outlinePasses`, `outlineRtWidth`, `outlineRtHeight`.

## Dependencies
None added. Uses `three` (`WebGLRenderTarget`, `OrthographicCamera`, `ShaderMaterial`, `MeshLambertMaterial`, `PlaneGeometry`, `Color`, `Vector3`) and R3F (`useFrame`, `useThree`). Spec D-13 satisfied by the decision in D-A. R3F 9.8.2 / three 0.186.1 / React range unchanged.

## README update (FR-22, AC-17): `src/assets/3D/README.md`
- Amend section 5 "Materials are used as exported": true without opt-in; with `toon`, the model's materials are replaced on the instance by the toon material.
- New section "Toon shading and outline": props `toon`, `outline` with example (`<Model url={moonUrl} toon outline />` plus `<OutlineLayer anchorRef={placeRef} />` in the scene and the anchor contract); what toon reads (base colour texture and factor, vertex normals, optional glTF normal map, double-sidedness; not emissive/metal/unlit flag); outline is per model by layer, stars never outlined; inner edges use geometry normals/depth only; non-spherical models need `boundsFactor`; non-opted models are used as exported.
- Constants: `src/three/celConstants.js`, group names and default values (table of the block above, including the three post-layer-3 outline constants).
- Export note: opaque materials only (no alpha blend/mask under toon).

## Test strategy (maps to AC-n; no test framework in the repo)
- `npm run check:cel` (`scripts/check-cel.mjs`, pure Node): thresholds strictly descending; multipliers in (0,1]; light direction non-zero; `OUTLINE_THICKNESS_CSS_PX > 0`; `computeOutlineRegion`: texels even and <= max, snapped centre gives integer device pixel for a grid of canvas sizes/DPRs (1, 1.5, 2) and positions, thickness in device px = css x rtDpr, region independent of canvas height (page-tall canvas yields the same N). Supports AC-12 (size from anchor, not page), AC-8.
- Static greps (AC-1, AC-2, AC-18): no `moon`, `Moon_BaseColor` in the new modules; `Moon.jsx` the only opt-in; `ShaderMaterial|onBeforeCompile` only under `src/three/`; no `?raw`; no `new WebGLRenderer`; lint + build exit 0; entry chunk free of three/R3F/drei; chunk sizes in `baseline.md`; `package.json` dependencies unchanged.
- AC-1 (no opt-in): scratch second `<Model url={moonUrl} />` without props; dev hook `renderer.info.programs.length` and `memory` equal to the same scene with the opt-ins absent; `mesh.material` identity equals the cached scene's.
- AC-3, AC-4, AC-5, AC-6: browser sampling along the diagonal, colour compare against a 003 unlit screenshot (baseline from step 0), spin capture, one-constant scratch edit (e.g. `CEL_LIGHT_SPOT_COLOR`).
- AC-7: scratch second consumer without props plus route cycle.
- AC-8, AC-8b, AC-9, AC-10, AC-11: pixel measurement at DPR 1 and 2 (DevTools device pixel ratio), limb thickness at upper-right and lower-left, crater rim screenshot compared side by side with `reference.png`, zoomed star screenshots, frame-by-frame capture during spin/tilt/scroll-clip, alpha check.
- AC-8c (no gray gap / no fade): pixel scan via `readPixels`/`toBlob` over >= 8 directions at DPR 1 and 2, scanning from 6 device px inside the silhouette to 6 device px beyond the band; check the sequence moon colour, black run of 3 x DPR +-1 pixels at rgb(0,0,0) alpha 255, then alpha 0, with no 0 < alpha < 255 pixel and no non-black pixel inside the run (T-22). Repeat the right-limb scan from the reported defect (1000x900 DPR 1).
- AC-8b (active, D-20): pixel/visual check at 1000x900 and 375x812 that no line lies inside the disc, side by side with `reference.png` (T-23). AC-8d is N/A while `OUTLINE_INNER_EDGES` is false; the text below applies only if re-enabled.
- AC-8d (dormant; shadow-side strokes): sample stroke pixels in a fixed pose, compute N.L from the mask or by eye from the band they sit in, and confirm none above `OUTLINE_INNER_SHADOW_THRESHOLD`; scratch-set the threshold to 1 and to -0.5 and compare stroke density (reverted); side by side with `reference.png` (T-23). `check:cel` asserts the new constants (margin >= 0, threshold in [-1, 1], boolean flag).
- AC-12: dev hook RT dims at 1440x900 DPR 2 and 375x812 coarse; scroll hero away and watch `outlinePasses` stall while `frames` grows; inspection of `useFrame` code.
- AC-13, AC-14, AC-15, AC-16, AC-17, AC-19: scratch broken GLSL (toon, then mask/ring), reduced motion, Network panel, `loseContext`/`restoreContext`, 10 route cycles, poster capture and crossfade compare, README review, frame-time and shimmer notes in `baseline.md`.

## Risks
- Inner edges (D-12): thresholds may need tuning; flagged fallback to silhouette-only described in D-D.3.
- Hard alpha (D-15, D-17): binary ring and stroke edges alias (stair-steps) and can shimmer on spin because mask texels are 1:1 with device px; no smoothing is planned because the owner asked for a solid cel look. If T-22/T-23 judge it unacceptable, flag to the owner (option: 1 device px alpha ramp on strokes only, or higher `OUTLINE_RING_TAPS`); do not add smoothing unasked.
- Ring thickness with hard alpha: the discrete tap kernel can make the outer edge slightly polygonal and thickness may read 1 px off; mitigation `OUTLINE_RING_TAPS` 24 (cost lever, ring cost grows). Thickness tolerance stays +-1 device px (AC-8).
- Silhouette margin (D-15): too small leaves a thin stroke near the limb (gap returns), too large drops legitimate strokes close to the limb. Tuned by eye against `reference.png`; one constant.
- Shadow-side gate (D-16): N.L at the centre texel uses geometry normals only (not the glTF normal map) and is per pixel, so strokes may look different from the Blender reference (hand-drawn). Light-facing test depends on the half-float mask normal xy precision near the limb (z reconstruction has `sqrt` sensitivity where |xy| -> 1); the silhouette margin removes that area, so it is not expected to matter. Threshold tuning is an owner decision.
- Reconstructed z assumes the view-space normal faces the viewer (back faces flipped in the mask pass); true for closed convex-ish moon geometry, may be wrong for thin double-sided surfaces on other models.
- `onBeforeCompile` chunk names can differ in three 0.186; mitigated by verifying the Lambert shader source first; worst case switch to a hand-written `ShaderMaterial` for the same `celShade` function.
- Priority ordering assumption (`-1` before `0`, no auto-render takeover) must be confirmed in R3F 9.8.2 source; fallback: do the spin update and the mask render in the same callback (call a function exposed by `OutlineLayer` through a ref).
- Half-float render targets need `EXT_color_buffer_*`; missing extension -> poster fallback (acceptable, rare on WebGL2).
- Mask render doubles geometry cost and the ring shader adds fragment work on mobile; levers listed in D-E; `baseline.md` records numbers; any look-changing lever goes to the owner.
- Sub-pixel resampling shimmer if snapping is wrong; covered by `check-cel` and frame capture.
- Nested ordering of transparent objects: ring z must stay in front of the star plane (`OUTLINE_Z_MAX`) and behind the model; non-sphere models need `boundsFactor`/`OUTLINE_Z_FACTOR` adjustment.
- The geometry-normal-only mask ignores glTF normal-map detail (documented).
- Band thresholds/light direction: the owner's screenshot `reference.png` is now in the spec folder; verification compares against it (D-18); the owner still tweaks constants.
- Poster outline thickness depends on a measured display width; wrong measurement shows as a thickness jump at crossfade (AC-16).
- StrictMode / disposal: covered by the 10-cycle check; R3F's deferred renderer disposal (about 500 ms) can make memory look leaky if read early.
- React cap `<19.4` from fiber 9.8.2 unchanged.

## Order of work
0. Baseline: build sizes, frame times at 1440x900 DPR 2 and mobile emulation, screenshots of the 003 moon (for AC-4) into `baseline.md`; measure poster display width and hero height.
1. `celConstants.js`, `outlineRegion.js`, `scripts/check-cel.mjs`, `package.json` script.
2. `toonMaterial.js`, `useToonMaterials.js`; `Model.jsx` `toon` prop; scratch-verify bands, colours (AC-3, AC-4).
3. `Moon.jsx` toon opt-in; tune nothing yet; verify AC-5 to AC-7.
4. `outlineLayers.js`, `outlineMaterials.js`, `OutlineLayer.jsx`; `Model.jsx` `outline` prop; `PageScene` priority and mount; silhouette ring first, then inner-edge quad; devStats and dev hook.
5. Robustness checks: broken shaders, context loss, disposal cycles, offscreen skip (AC-12 to AC-15).
5b. Post-layer-3 fixes (owner feedback, D-15 to D-19): T-35 (binary ring alpha), T-36 (inner-edge silhouette margin and binary strokes), T-37 (shadow-side gate and constants), T-38 (grazing-angle gate, D-19). Run before the Layer 4 verification tasks.
5c. T-39 (D-20): set `OUTLINE_INNER_EDGES = false`. Runs after T-38, before T-22.
6. Verdict: no lines inside the disc (inner-edge verdict: off by owner decision); shimmer notes for ring and band edges; compare against `reference.png`. No threshold tuning.
7. `PosterCapture` changes; human poster capture; `Hero.jsx` comment; compare at crossfade (AC-16).
8. README; lint, build, chunk report, final `baseline.md` (AC-17 to AC-19).

## Requirement traceability
| Req | Satisfied by |
| --- | --- |
| D-1, D-10 | `celConstants.js` multipliers/spot colour; `celShade` in linear space (D-B) |
| D-2, FR-9 | `celConstants.js` (single grouped, commented module) |
| D-3, D-8, FR-7 | `CEL_LIGHT_DIRECTION` as constant view-space uniform; no light object (D-B) |
| D-4, D-5, FR-10 | layer-tagged mask pass; stars on layer 0 only (D-D) |
| D-6, FR-1, FR-2, FR-3 | `toon`/`outline` props, early return when off, generic modules (D-C) |
| D-7, FR-16 | `PosterCapture` + human capture + `Hero.jsx` comment (D-H) |
| D-9, FR-4, FR-5 | `toonMaterial.js` thresholds, base colour via Lambert chunks (D-B) |
| D-11 | `CEL_BAND_AA_PX`, `fwidth` smoothing |
| D-12, FR-11 | ring (uniform, outside) + inner-edge quad; constants; flagged fallback |
| D-15, FR-23 | binary ring alpha (D-D.2); inner-edge silhouette margin (D-D.3); `OUTLINE_INNER_SILHOUETTE_MARGIN`; AC-8c |
| D-19, FR-26 | grazing-angle gate on reconstructed z (D-D.4 addendum); `OUTLINE_INNER_GRAZING_Z`; AC-8c |
| D-16, FR-24 | shadow-side gate with reconstructed z and `CEL_LIGHT_DIRECTION` (D-D.4); `OUTLINE_INNER_SHADOW_*`; AC-8d |
| D-17, FR-25 | binary stroke alpha (D-D.3, D-D.5); smoothing flagged in Risks |
| D-20, FR-27 | `OUTLINE_INNER_EDGES = false` (T-39); no inner material/quad created (T-19); inner path dormant; AC-8b replaced, AC-8d/FR-24/FR-26 N/A |
| D-18 | Test strategy: visual checks against `reference.png` |
| D-13 | D-A: custom pass, no new dependency |
| D-14, FR-14 | region-bounded RT, offscreen skip (D-E) |
| FR-6 | Lambert `normal` incl. optional `normalMap` |
| FR-8 | per-clone material swap, originals untouched |
| FR-12 | frame priority -1 / 0 ordering (D-D) |
| FR-13 | ring behind model with depth test; non-premultiplied blending |
| FR-15 | `Moon.jsx` opt-in; framing code untouched |
| FR-17 | `onShaderError`, extension check + boundary (D-G) |
| FR-18 | lazy re-creation by three; epoch fallback (D-G) |
| FR-19 | disposal list in D-G |
| FR-20 | cached numbers, preallocated scratch |
| FR-21 | reduced-motion gate unchanged; all code in lazy chunk; no network |
| FR-22 | README update section |
| NFR-1 | no dependency; chunk report |
| NFR-2 | lint/build |
| NFR-3, AC-19 | `baseline.md` before/after |
| NFR-4 | texel snapping, band AA, shimmer observation |
| NFR-5 | one concern per file (list above) |
| NFR-6 | disposal + 10-cycle check |
| AC-1 .. AC-19 | Test strategy rows above |

## Open questions
None. (Resolved: `reference.png` is in the spec folder, D-18. The owner tweaks `celConstants.js`, including the new outline constants.)
