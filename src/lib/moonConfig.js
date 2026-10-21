// Moon sizing and Hero wrap constants. One source of truth for the live canvas,
// the poster and the text wrap (spec 005 FR-21, NFR-6). Pure: the only import is
// the framing constant, which comes from a pure file with no 3D library import.
import { MOON_RADIUS_PER_HERO_HEIGHT } from '../three/moonFraming.js';

// Reference window the moon size is scaled from (CSS px).
export const HERO_REF_WIDTH_PX = 1920;
export const HERO_REF_HEIGHT_PX = 1080;

// Navbar height at the reference size (CSS px). Used only to derive the
// reference radius below; the real navbar height is measured at runtime.
export const NAVBAR_REF_HEIGHT_PX = 61;

// Moon body radius the pre-005 code rendered at 1920x1080 (about 404.8 px).
// Derived from the framing constant and the reference Hero height, not typed.
export const MOON_REF_RADIUS_PX =
  MOON_RADIUS_PER_HERO_HEIGHT * (HERO_REF_HEIGHT_PX - NAVBAR_REF_HEIGHT_PX);

// Fraction of the reference radius used at the reference size (moon is 90% of before).
export const MOON_SCALE_FACTOR = 0.9;

// Floor for the radius on small windows (CSS px). Stays below the plain rule's
// value at 1024x700 (about 194 px) so desktop windows are never affected.
export const MOON_MIN_RADIUS_PX = 128;

// Clear space kept on each side of the moon on narrow windows (CSS px). It
// limits the radius to (width - 2 * margin) / 2.
export const MOON_SIDE_MARGIN_PX = 24;

// Intro: the moon grows from this fraction of its final scale to 1.
export const MOON_INTRO_START_SCALE = 0.48;
// Intro duration in seconds.
export const MOON_INTRO_DURATION_S = 3;
// GSAP ease name for the intro (decelerating approach).
export const MOON_INTRO_EASE = 'power2.out';

// Clear space between the moon edge and wrapped Hero text (CSS px, includes the 3 px outline).
export const HERO_WRAP_MARGIN_PX = 20;
// Text wraps around the moon only at or above this window width (CSS px).
export const HERO_WRAP_MIN_WIDTH_PX = 1024;
// Below HERO_WRAP_MIN_WIDTH_PX the moon sits under the text (column mode):
// gap between text and moon, and space below the moon (CSS px).
export const HERO_COLUMN_GAP_PX = 24;
export const HERO_COLUMN_BOTTOM_PX = 24;
// Below the wrap width, height-only viewport changes smaller than this at an
// unchanged width are ignored (mobile URL bar must not resize the moon).
export const HERO_COLUMN_HEIGHT_IGNORE_PX = 120;
// Hero heading font size as a fraction of the moon radius in wrap mode.
export const HERO_H1_RADIUS_RATIO = 0.26;
