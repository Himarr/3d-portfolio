// Written only under `import.meta.env.DEV` (numeric writes, no allocation);
// read by the dev hook (`window.__planetInfo`) for verification counters.
export const devStats = {
  frames: 0,
  moonFrames: 0,
  starCount: 0,
  outlinePasses: 0,
  outlineRtWidth: 0,
  outlineRtHeight: 0,
  moonCyViewport: 0,
  introScale: 1,
  moonRadius: 0,
}
