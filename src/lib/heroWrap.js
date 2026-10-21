// Hero text wrap geometry (spec 005 FR-22). Pure maths, no DOM.
// The float is a circle box of side `size`, floated right inside the Hero.
// Its centre is the Hero centre, the same point the canvas and poster use.
//   size = 2 (R + m)                  circle box side (moon radius R plus margin m)
//   mt   = max(0, heroH/2 - (R + m))  top margin, clamped so it is never negative
//   mr   = heroW/2 - (R + m)          right margin
export function wrapGeometry({ heroW, heroH, radius, margin }) {
  const half = radius + margin;
  return {
    size: 2 * half,
    mt: Math.max(0, heroH / 2 - half),
    mr: heroW / 2 - half,
  };
}
