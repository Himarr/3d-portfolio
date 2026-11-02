// Cel shader and outline constants (no 3D library dependency, so Node checks can
// load this file). This is the ONE place to tweak the look of toon shading
// and outlines; every other module reads these values.
//
// What to change to ...
//   - move the light:              CEL_LIGHT_DIRECTION
//   - change the brightest band:   CEL_LIGHT_SPOT_COLOR, CEL_THRESHOLD_LIGHT_SPOT
//   - make shadows lighter/darker: CEL_SHADOW1_MULTIPLIER, CEL_SHADOW2_MULTIPLIER
//   - move band boundaries:        CEL_THRESHOLD_* (higher = smaller lit area)
//   - soften or harden band edges: CEL_BAND_AA_PX
//   - diagonal stripes in shadow 2: CEL_HATCH_ANGLE_DEG, CEL_HATCH_PERIOD_CSS_PX,
//     CEL_HATCH_WIDTH, CEL_HATCH_MULTIPLIER (1 = no stripes)
//   - dot grain on lit areas:      CEL_GRAIN_CELL_CSS_PX, CEL_GRAIN_DOT_RADIUS,
//     CEL_GRAIN_STRENGTH (0 = no grain)
//   - thicker or thinner outline:  OUTLINE_THICKNESS_CSS_PX
//   - outline colour:              OUTLINE_COLOR
//   - silhouette only (no lines inside the model): OUTLINE_INNER_EDGES = false
//   - more or fewer inner lines:   OUTLINE_NORMAL_THRESHOLD, OUTLINE_DEPTH_THRESHOLD
//   - inner lines near the limb:    OUTLINE_INNER_SILHOUETTE_MARGIN
//   - keep strokes off grazing surfaces near the limb: OUTLINE_INNER_GRAZING_Z
//   - strokes on all rims or shadow side only: OUTLINE_INNER_SHADOW_ONLY
//   - how much of the lit side gets strokes:   OUTLINE_INNER_SHADOW_THRESHOLD
//   - cheaper outline on slow GPUs: OUTLINE_RT_SCALE, OUTLINE_RING_STEPS, OUTLINE_RING_TAPS

// --- Cel ramp ---

// View-space direction toward the light (x right, y up, z to viewer); normalised at use.
export const CEL_LIGHT_DIRECTION = [1, 1, 1];
// Flat sRGB colour of the brightest band (light spot).
export const CEL_LIGHT_SPOT_COLOR = "#D1D1D1";
// Lit band: multiplier on the base colour in linear space; raising brightens it.
export const CEL_LIT_MULTIPLIER = 1.0;
// Shadow 1 band: multiplier on the base colour in linear space; lower = darker.
export const CEL_SHADOW1_MULTIPLIER = 0.67;
// Shadow 2 band: multiplier on the base colour in linear space; lower = darker.
export const CEL_SHADOW2_MULTIPLIER = 0.33;
// N.L at or above this gives the light spot; raising shrinks the spot.
export const CEL_THRESHOLD_LIGHT_SPOT = 0.9;
// N.L at or above this gives the lit band; raising shrinks the lit area.
export const CEL_THRESHOLD_LIT = 0.3;
// N.L at or above this gives shadow 1, below gives shadow 2; raising grows shadow 2.
export const CEL_THRESHOLD_SHADOW1 = -0.3;
// Band-edge smoothing in device px; 0 = hard steps, raising softens the edges.
export const CEL_BAND_AA_PX = 1;

// --- Screen-space patterns (fixed to the screen, static) ---

// Stripe direction in shadow 2, degrees from the screen x axis (counter-clockwise).
export const CEL_HATCH_ANGLE_DEG = 45;
// Distance between stripes in CSS px (scaled by effective DPR); raising spaces them out.
export const CEL_HATCH_PERIOD_CSS_PX = 6;
// Fraction of the period covered by a stripe, in (0, 1); raising thickens stripes.
export const CEL_HATCH_WIDTH = 0.3;
// Multiplier on the shadow 2 colour inside a stripe, [0, 1]; lower = darker, 1 = no stripes.
export const CEL_HATCH_MULTIPLIER = 0.6;
// Grain cell size in CSS px (one dot per cell, scaled by effective DPR).
export const CEL_GRAIN_CELL_CSS_PX = 5;
// Grain dot radius relative to the cell, in (0, 1); raising enlarges the dots.
export const CEL_GRAIN_DOT_RADIUS = 0.15;
// Mix of the dots towards CEL_LIGHT_SPOT_COLOR, [0, 1]; 0 = no grain.
export const CEL_GRAIN_STRENGTH = 0.5;

// --- Outline ---

// Outline colour (sRGB hex).
export const OUTLINE_COLOR = "#000000";
// Outline thickness in CSS px (scaled by effective DPR); raising thickens it.
export const OUTLINE_THICKNESS_CSS_PX = 3;
// Drawn width in CSS px of the contained 1200x1200 hero poster image at 1440x900 (box
// 1425x839, height-limited, so the image is 839x839), measured 2026-10-20. PosterCapture
// scales the outline by 1200 / this so the poster outline reads as OUTLINE_THICKNESS_CSS_PX.
export const POSTER_DISPLAY_CSS_PX = 839;
// Off by owner decision (D-20): silhouette outline only. Set to true to re-enable
// strokes at crater rims and other inner edges.
export const OUTLINE_INNER_EDGES = false;
// Inner edge: normal-xy difference across the line width; lowering adds more lines.
export const OUTLINE_NORMAL_THRESHOLD = 0.35;
// Inner edge: depth difference in units of radius; lowering adds more lines.
export const OUTLINE_DEPTH_THRESHOLD = 0.03;
// Inner strokes are suppressed within this distance of the silhouette, in multiples of
// the outline thickness; raise if a stroke still shows near the limb, lower if strokes
// vanish too early; 0 = off.
export const OUTLINE_INNER_SILHOUETTE_MARGIN = 2.0;
// No inner stroke where the reconstructed view-normal z (from mask xy) is below this,
// range [0, 1]. Raise = strokes stay further from the limb; lower = allowed closer; 0 = off.
export const OUTLINE_INNER_GRAZING_Z = 0.35;
// true = inner strokes only where the surface faces away from the light (shadow side,
// partial arcs around craters); false = stroke all rims. Uses CEL_LIGHT_DIRECTION.
export const OUTLINE_INNER_SHADOW_ONLY = true;
// View-space N.L in [-1, 1]; a stroke is drawn only if N.L <= this. Raising toward 1 =
// more strokes (lit side creeps in); lowering toward -1 = fewer, only the darkest rims.
export const OUTLINE_INNER_SHADOW_THRESHOLD = 0.0;
// Silhouette kernel rings; fewer = cheaper but coarser.
export const OUTLINE_RING_STEPS = 4;
// Taps per silhouette kernel ring; fewer = cheaper but coarser.
export const OUTLINE_RING_TAPS = 16;
// Mask resolution multiplier on the effective DPR; lowering is cheaper but blurrier.
export const OUTLINE_RT_SCALE = 1;
// Mask region radius as a multiple of the anchor radius; raise for non-spherical models.
export const OUTLINE_BOUNDS_FACTOR = 1.05;
// Extra mask region margin in CSS px.
export const OUTLINE_PAD_CSS_PX = 2;
// Hard cap on mask texture width and height in texels.
export const OUTLINE_MAX_TEXELS = 2048;
// Silhouette quad depth behind the model, as a multiple of the anchor radius.
export const OUTLINE_Z_FACTOR = 1.2;
// Cap on that depth in world units; keeps the quad in front of the star plane.
export const OUTLINE_Z_MAX = 900;
