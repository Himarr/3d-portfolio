// Pure maths for the outline mask region (no 3D library dependency, so Node
// checks can load this file). The mask covers a square around the model, not
// the whole page-tall canvas, so its size depends on the model radius only.
//
// Canvas coordinates: origin at the canvas centre, x right, y up, CSS px.

// Returns the square mask region around the anchor. With the optional `out` object
// the result is written into it and `out` is returned (no allocation, for per-frame
// use under a moving anchor); without it a new object is returned.
//   centerX, centerY: region centre, snapped so (center + canvas / 2) * rtDpr is an
//                     integer device pixel in x and y (mask texels map 1:1 to pixels).
//   halfCss:          half the region side in CSS px.
//   texels:           mask width and height in texels (even, at most maxTexels).
//   rtDpr:            mask texels per CSS px.
//   thicknessDev:     outline thickness in mask texels.
export function computeOutlineRegion(
  {
    x,
    y,
    radius,
    boundsFactor,
    thicknessCssPx,
    padCssPx,
    dpr,
    rtScale,
    maxTexels,
    canvasWidth,
    canvasHeight,
  },
  out,
) {
  const halfCss = radius * boundsFactor + thicknessCssPx + padCssPx;
  const rtDpr = Math.min(dpr * rtScale, maxTexels / (2 * halfCss));

  const evenMax = maxTexels - (maxTexels % 2);
  let texels = Math.ceil(2 * halfCss * rtDpr);
  if (texels % 2 !== 0) texels += 1;
  texels = Math.min(texels, evenMax);

  const centerX = Math.round((x + canvasWidth / 2) * rtDpr) / rtDpr - canvasWidth / 2;
  const centerY = Math.round((y + canvasHeight / 2) * rtDpr) / rtDpr - canvasHeight / 2;

  const result = out ?? {};
  result.centerX = centerX;
  result.centerY = centerY;
  result.halfCss = halfCss;
  result.texels = texels;
  result.rtDpr = rtDpr;
  result.thicknessDev = thicknessCssPx * rtDpr;
  return result;
}
