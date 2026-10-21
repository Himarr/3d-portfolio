# Icons

## arrow-down.svg

The section arrow used by the fixed section controls on the home page.

- **Status:** placeholder. The file carries an XML comment `PLACEHOLDER, replace with owner SVG` until the owner supplies the final artwork.
- **Used by:** `SectionArrows` (`src/components/SectionArrows.jsx`, added in a later task). The down arrow sits at bottom-centre of the viewport and goes to the next section.
- **Up arrow:** there is no second SVG file for it. The up arrow (top-centre, previous section) is this same file rotated 180 degrees with a CSS transform. Do not add a second file for it.
- **Loading:** the file is applied as a CSS `mask-image` through the `.arrow-icon` class in `src/index.css`, with `background-color: currentColor`. The arrow therefore takes the colour of the surrounding text, so hover, focus and active colours from the theme apply with no code change.

### Expected format

- Single colour. Fill or stroke with `currentColor` only, no other colours.
- Any `viewBox`. The shape is scaled to fit its box with `mask-size: contain`.
- No `width` or `height` attributes on the `<svg>` element (the size comes from CSS).
- Opaque shape on a transparent background (the mask uses the alpha channel).

### How to replace

1. Save the owner SVG over `arrow-down.svg` with the same filename.
2. Keep the format above. No code change is needed.
3. Remove or keep the placeholder comment as appropriate; the comment is for humans only.

## Carousel and footer icons (spec 006)

Single-colour UI icons for the projects carousel and the footer. Each file is tinted by `currentColor` through the `.icon-mask` class in `src/index.css`, rendered by the `IconMask` component.

| File | Used by |
|---|---|
| `carousel-prev.svg` | Carousel previous button |
| `carousel-next.svg` | Carousel next button |
| `github.svg` | Footer GitHub link |
| `itchio.svg` | Footer itch.io link |

### Expected format

- Single colour. Fill or stroke with `currentColor` only, no other colours.
- Any `viewBox`. The shape is scaled to fit its box with `mask-size: contain`.
- No `width` or `height` attributes on the `<svg>` element (the size comes from CSS).
- Opaque shape on a transparent background (the mask uses the alpha channel). Only the shape matters because the colour comes from CSS.

### Status and replacement

- Each placeholder file is marked inside the file with an XML comment `PLACEHOLDER, replace with owner SVG` until the owner supplies the final artwork.
- To replace a file, save the owner SVG over the file with the same name. Replacing a file with the same name needs no code change.
- Remove or keep the placeholder comment as appropriate; the comment is for humans only.
