# 3D models

Convention for `.glb` models used by the R3F scene.

## 1. Where models live

Put `.glb` files in `src/assets/3D/`. They are bundled by Vite (the `.glb` extension is listed in `assetsInclude` in `vite.config.js`), emitted with a hashed file name, and a wrong path fails the build.

## 2. Import pattern and swapping the model

`src/three/Moon.jsx` is the only place that names the model file:

```jsx
import moonUrl from '../assets/3D/moon.glb'
// ...
<Model url={moonUrl} />
```

To swap the model, change only that import line:

```jsx
import moonUrl from '../assets/3D/moon.glb'
```

becomes

```jsx
import shipUrl from '../assets/3D/ship.glb'
```

and use `<Model url={shipUrl} />`. `Model.jsx` needs no change.

## 3. Blender glTF 2.0 export settings

- Format: glTF Binary (`.glb`).
- +Y up.
- Apply modifiers and transforms.
- Embed textures.
- Include normals and UVs.
- No cameras, no lights.
- No Draco or meshopt compression (the loader has both disabled, so no decoder is fetched).

## 4. Budget

- At most 1 MB per `.glb`.
- Textures at most 2048x2048, PNG or JPEG.
- At most about 50k vertices for hero use.

The current `moon.glb` (about 496 KB) is within budget.

## 5. Notes

- Materials are used as exported, unless the model opts in with `toon` (see section 6), in which case the instance's materials are replaced by the toon material. Without opt-in, unlit materials work with no lights in the scene.
- Framing is done by the scene, not by `Model`: `FitToUnit.jsx` scales and centres the model to a unit size, and `moonFraming.js` sets the on-screen size (camera distance and field of view reproduced as an orthographic pixel radius). A swapped model is framed automatically.
- `Model.jsx` clones the loaded scene and disposes it (geometry, materials, textures) and clears the `useGLTF` cache when the last user unmounts.
- React must stay below 19.4 because of the pinned `@react-three/fiber@9.8.2` peer range.

## 6. Toon shading and outline

Both are opt-in per model. A model without the props is used as exported.

```jsx
<Model url={moonUrl} toon outline />
// and in the scene, next to the model:
<OutlineLayer anchorRef={placeRef} />
```

- `toon`: replaces the instance's materials with a cel-shaded material (4 flat bands from N.L against a fixed view-space light).
- `outline`: tags the model so the outline pass sees it. Stars and everything else are never outlined.
- `OutlineLayer` anchor contract: `anchorRef` is a group whose world position is the model centre and whose world scale is the on-screen radius in CSS px. Non-spherical models also pass `boundsFactor`.

Toon reads the base colour texture and factor (sampled as sRGB), vertex normals, an optional glTF normal map, and double-sidedness. It ignores emissive, metalness/roughness and the unlit flag.

The active outline is a solid, hard-edged black silhouette band only, with no lines inside the disc (owner decision D-20). Inner crater strokes are a dormant feature: set `OUTLINE_INNER_EDGES = true` to re-enable them. They then appear only on the shadow side of rims, gated by N.L against `CEL_LIGHT_DIRECTION`, and use geometry normals and depth only (not the normal map).

Export note: opaque materials only (no alpha blend or alpha mask under toon).

### Constants

All tuning lives in `src/three/celConstants.js`.

| Constant | Default |
| --- | --- |
| **Cel ramp** | |
| `CEL_LIGHT_DIRECTION` | `[1, 1, 1]` |
| `CEL_LIGHT_SPOT_COLOR` | `"#D1D1D1"` |
| `CEL_LIT_MULTIPLIER` | `1.0` |
| `CEL_SHADOW1_MULTIPLIER` | `0.67` |
| `CEL_SHADOW2_MULTIPLIER` | `0.33` |
| `CEL_THRESHOLD_LIGHT_SPOT` | `0.9` |
| `CEL_THRESHOLD_LIT` | `0.3` |
| `CEL_THRESHOLD_SHADOW1` | `-0.3` |
| `CEL_BAND_AA_PX` | `1` |
| **Outline** | |
| `OUTLINE_COLOR` | `"#000000"` |
| `OUTLINE_THICKNESS_CSS_PX` | `3` |
| `POSTER_DISPLAY_CSS_PX` | `839` |
| `OUTLINE_INNER_EDGES` | `false` (owner decision D-20) |
| `OUTLINE_NORMAL_THRESHOLD` | `0.35` |
| `OUTLINE_DEPTH_THRESHOLD` | `0.03` |
| `OUTLINE_INNER_SILHOUETTE_MARGIN` | `2.0` |
| `OUTLINE_INNER_GRAZING_Z` | `0.35` |
| `OUTLINE_INNER_SHADOW_ONLY` | `true` |
| `OUTLINE_INNER_SHADOW_THRESHOLD` | `0.0` |
| `OUTLINE_RING_STEPS` | `4` |
| `OUTLINE_RING_TAPS` | `16` |
| `OUTLINE_RT_SCALE` | `1` |
| `OUTLINE_BOUNDS_FACTOR` | `1.05` |
| `OUTLINE_PAD_CSS_PX` | `2` |
| `OUTLINE_MAX_TEXELS` | `2048` |
| `OUTLINE_Z_FACTOR` | `1.2` |
| `OUTLINE_Z_MAX` | `900` |

The inner-edge constants (`OUTLINE_NORMAL_THRESHOLD`, `OUTLINE_DEPTH_THRESHOLD`, `OUTLINE_INNER_*`) have no effect while `OUTLINE_INNER_EDGES` is `false`.
