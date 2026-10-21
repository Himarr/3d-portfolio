// Social links shown in the contact footer (FR-27).
// Each icon is an owner-supplied or placeholder SVG under src/assets/icons/.
// Provenance: github.svg and itchio.svg are PLACEHOLDER glyphs, not the GitHub
// or itch.io logos. Replace them with owner SVGs and document the source.

import githubIcon from "../assets/icons/github.svg";
import itchioIcon from "../assets/icons/itchio.svg";

export const socialLinks = [
  {
    id: "github",
    label: "GitHub",
    // PLACEHOLDER, replace with real profile URL
    url: "https://github.com/",
    icon: githubIcon,
  },
  {
    id: "itchio",
    label: "itch.io",
    // PLACEHOLDER, replace with real profile URL
    url: "https://itch.io/",
    icon: itchioIcon,
  },
];
