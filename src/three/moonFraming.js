// Reproduces the old perspective framing (D-2) as an orthographic pixel radius:
// the silhouette radius of a unit sphere seen from CAMERA_Z with FOV_DEG,
// expressed as a fraction of the hero stage height.
export const CAMERA_Z = 3.6;
export const FOV_DEG = 40;

export const MOON_RADIUS_PER_HERO_HEIGHT =
  1 /
  Math.sqrt(CAMERA_Z ** 2 - 1) /
  Math.tan(((FOV_DEG / 2) * Math.PI) / 180) /
  2;

export function moonRadiusPx(stageHeight) {
  return MOON_RADIUS_PER_HERO_HEIGHT * stageHeight;
}
