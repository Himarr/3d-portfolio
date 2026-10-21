// Tech stack data, grouped by category (FR-20, AC-20).
//
// Rules:
// - Capacity: at most 3 categories with at most 5 tools each.
// - name: at most 20 characters.
// - use: at most 40 characters.
// - id: unique across all categories.
// - icon: optional. Add it only when an owner-supplied logo exists.
// - tint: optional, `tint: true` tints the icon with the current text colour
//   (single-colour SVGs only).
//
// How to add an icon (commented out, not used):
//
// // Provenance: official logo from <source>, trademark of <owner>, used to
// // identify the tool only.
// import blenderIcon from "../assets/tech/blender.svg";
// { id: "blender", name: "Blender", use: "Modeling and texturing", icon: blenderIcon, tint: true },

export const techStack = [
  {
    id: "modeling",
    title: "Modeling",
    tools: [
      { id: "blender", name: "Blender", use: "Modeling and texturing" },
      { id: "placeholder-tool", name: "Placeholder tool", use: "What I use it for" },
    ],
  },
  {
    id: "game-dev",
    title: "Game Dev",
    tools: [{ id: "unity", name: "Unity", use: "Game engine" }],
  },
  {
    id: "web",
    title: "Web",
    tools: [
      { id: "threejs", name: "Three.js", use: "3D on the web" },
      { id: "react", name: "React", use: "Interface and tooling" },
    ],
  },
];
