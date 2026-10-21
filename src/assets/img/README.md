# Images (`src/assets/img/`)

Raster images used by the About and Projects sections (spec 006, FR-19, FR-1, FR-2). Image placeholders are a CSS gradient, so no file is needed until you supply one.

## About image

- File: `about.<webp|jpg|png>`
- Used by: About section image frame (`src/data/about.js`, FR-19).
- Aspect ratio: 4:5 (`ABOUT_IMAGE_ASPECT`).
- Recommended size: 1200x1500. Minimum: 800x1000. Up to about 300 KB.
- Cropped with `cover` inside the frame.
- Needs an honest `alt` in `src/data/about.js` and a provenance comment next to the entry.

## Project images

- Folder: `projects/`
- File: `projects/<slug>.<webp|jpg|png>`, where `<slug>` is the project `slug` in `src/data/projects.js`.
- Used by: project card image in the Projects carousel (FR-1, FR-2).
- Aspect ratio: 16:10 (`CAROUSEL_IMAGE_ASPECT`).
- Recommended size: 2000x1250. Minimum: 1600x1000. Up to about 400 KB.
- The data entry needs `alt`, `width`, `height` and a provenance comment.

## Replacing files

- Replacing a file with the same name needs no JSX change.
- Changing the file extension needs the matching path change in the data module.
