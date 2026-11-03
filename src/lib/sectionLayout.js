// Section layout constants (spec 006, FR-30, NFR-8). Pure values; no DOM access.
// Arrow geometry comes from spec 005 (arrowConfig.js). Change it there, not here.
import { SECTION_ARROW_OFFSET_PX, SECTION_ARROW_SIZE_PX } from './arrowConfig.js'

// Extra space between the arrow box and section content, in CSS px.
export const SECTION_ARROW_CLEARANCE_PX = 12

// Safe band above and below a snapped section that arrows and content must keep clear of.
export const SECTION_SAFE_BAND_PX = SECTION_ARROW_OFFSET_PX + SECTION_ARROW_SIZE_PX + SECTION_ARROW_CLEARANCE_PX

// About image frame: width : height (4 / 5 is portrait), and the maximum frame width in rem.
export const ABOUT_IMAGE_ASPECT = 4 / 5
export const ABOUT_IMAGE_MAX_REM = 32

// Inline style that exposes the safe band to CSS as `var(--safe-band)`.
export const safeBandStyle = { '--safe-band': `${SECTION_SAFE_BAND_PX}px` }
