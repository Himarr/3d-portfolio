// The shared moon size function and a tiny radius store (spec 005 FR-19, FR-21).
// Canvas, poster and text wrap all read the radius from here.
import { MOON_RADIUS_PER_HERO_HEIGHT } from '../three/moonFraming.js';
import {
  HERO_REF_WIDTH_PX,
  HERO_REF_HEIGHT_PX,
  MOON_REF_RADIUS_PX,
  MOON_SCALE_FACTOR,
  MOON_MIN_RADIUS_PX,
  MOON_SIDE_MARGIN_PX,
  NAVBAR_REF_HEIGHT_PX,
  HERO_WRAP_MIN_WIDTH_PX,
  HERO_COLUMN_GAP_PX,
  HERO_COLUMN_BOTTOM_PX,
  HERO_COLUMN_HEIGHT_IGNORE_PX,
} from './moonConfig.js';

// Final moon body radius in CSS px for a viewport of vw x vh.
export function moonFinalRadiusPx(vw, vh) {
  const plain =
    MOON_REF_RADIUS_PX *
    MOON_SCALE_FACTOR *
    Math.min(vw / HERO_REF_WIDTH_PX, vh / HERO_REF_HEIGHT_PX);
  const ceiling = (vw - 2 * MOON_SIDE_MARGIN_PX) / 2;
  return Math.min(Math.max(plain, MOON_MIN_RADIUS_PX), ceiling);
}

// Moon body radius below the wrap width, where the moon sits under the text:
// fits the space left under the text, floored, and capped by the side margins.
export function moonColumnRadiusPx({ vw, vh, navH, textH }) {
  const fit =
    (vh - navH - textH - HERO_COLUMN_GAP_PX - HERO_COLUMN_BOTTOM_PX) / 2;
  const ceiling = (vw - 2 * MOON_SIDE_MARGIN_PX) / 2;
  return Math.min(Math.max(fit, MOON_MIN_RADIUS_PX), ceiling);
}

// Side length of the square poster image whose moon has radius r.
export function moonPosterSidePx(r) {
  return r / MOON_RADIUS_PER_HERO_HEIGHT;
}

let vpW = HERO_REF_WIDTH_PX;
let vpH = HERO_REF_HEIGHT_PX;
let heroTextH = null; // unknown until the text block is measured: floor applies
let navH = NAVBAR_REF_HEIGHT_PX;
let radius = moonFinalRadiusPx(vpW, vpH);
const listeners = new Set();

function compute() {
  if (vpW >= HERO_WRAP_MIN_WIDTH_PX) return moonFinalRadiusPx(vpW, vpH);
  return moonColumnRadiusPx({
    vw: vpW,
    vh: vpH,
    navH,
    textH: heroTextH ?? Infinity,
  });
}

function update() {
  const next = compute();
  if (next === radius) return;
  radius = next;
  listeners.forEach((fn) => fn(radius));
}

export function setViewport(w, h) {
  if (
    w < HERO_WRAP_MIN_WIDTH_PX &&
    w === vpW &&
    Math.abs(h - vpH) < HERO_COLUMN_HEIGHT_IGNORE_PX
  ) {
    return;
  }
  vpW = w;
  vpH = h;
  update();
}

// Text block and navbar heights for column mode (set from observer callbacks).
export function setHeroColumnInputs(textHeight, navHeight) {
  heroTextH = textHeight;
  navH = navHeight;
  update();
}

export function getMoonRadius() {
  return radius;
}

export function subscribeMoonRadius(fn) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
