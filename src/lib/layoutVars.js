// Writes the shared layout state onto <html> before React renders (spec 005 D-E, NFR-6).
// - data-snap-layout="on" | "off" from SNAP_QUERY, kept in sync on query change.
// - --moon-r and --moon-poster-side (px) from the shared moon size function.
import { SNAP_QUERY } from './snapConfig.js';
import { setViewport, getMoonRadius, subscribeMoonRadius, moonPosterSidePx } from './moonSize.js';

export function initLayoutVars() {
  const root = document.documentElement;
  const mq = window.matchMedia(SNAP_QUERY);

  const applyLayout = () => {
    root.dataset.snapLayout = mq.matches ? 'on' : 'off';
  };

  const applyVars = (r) => {
    root.style.setProperty('--moon-r', `${r}px`);
    root.style.setProperty('--moon-poster-side', `${moonPosterSidePx(r)}px`);
  };

  const applyMoon = () => {
    setViewport(window.innerWidth, window.innerHeight);
    applyVars(getMoonRadius());
  };

  applyLayout();
  applyMoon();
  // The column radius also changes when the text block is measured.
  subscribeMoonRadius(applyVars);
  mq.addEventListener('change', applyLayout);
  window.addEventListener('resize', applyMoon);
}
