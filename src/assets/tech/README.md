# Tech stack logos (`src/assets/tech/`)

Icons for the tools in `src/data/techStack.js`, shown in the Tech Stack section (spec 006, FR-20).

## Files

- One file per tool, named by the tool `id`: `blender.svg`, `unity.svg`, `threejs.svg`, `react.svg` (examples; add a file only when the tool entry gets an `icon` import).
- `placeholder.svg`: used for a tool with no `icon`. It is a marked generic glyph, not a brand mark. Replace it with your own generic glyph if you want.

## Format

- SVG only. Square-ish `viewBox` preferred (shown in a square slot and contained).
- No `width` or `height` attributes on the root `<svg>`.
- No scripts, no external references, no fonts.
- Slot size is 40 px.

## Tinting

- Default (`tint` not set or `false`): the logo is shown as is, so multicolour logos keep their colours.
- `tint: true` in the data entry: the logo is shown with a CSS mask in `currentColor`. The logo must be a single colour, and only its shape matters. Dark logos need `tint: true` on the dark theme.

## Where it is used

- `src/data/techStack.js`: each tool's `icon` import. The Tech Stack section (`TechCategory`) renders it through `img` or `IconMask`.
- Replacing a file with the same name needs no JSX change.

## Provenance

- Every real logo needs a `// Provenance:` / trademark comment next to its entry in `src/data/techStack.js`.
- Use honest, descriptive `alt` text in the data entry where the logo is not decorative.
