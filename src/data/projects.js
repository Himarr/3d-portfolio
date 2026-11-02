// Project data shared by the Projects carousel and the project route (FR-1, AC-2).
//
// Field rules:
// - slug: lowercase letters, digits and hyphens only; unique across the list;
//   stable once published because it forms the URL /projects/:slug (FR-17).
// - title: required, non-empty.
// - description: optional string.
// - image: optional. When present it must have src, alt, width and height.
//   `alt` is required and must describe the image. Add a provenance comment
//   above every image entry (source, author, licence or "own work"), FR-33.
//
// Example entry (commented out, not used):
//
// {
//   slug: "project-example",
//   title: "Example project",
//   description: "One or two sentences on what this project is.",
//   // Provenance: <source, author, licence or own work>
//   image: {
//     src: projectExampleImage,
//     alt: "Short description of what the image shows",
//     width: 2000,
//     height: 1250,
//   },
// },

export const projects = [
  {
    slug: "megaloterra",
    title: "Megaloterra",
    type: "game",
    description: "Placeholder: descripción de Megaloterra.",
  },
  {
    slug: "portfolio",
    title: "3D Portfolio",
    type: "game",
    description:
      "This very site: a 3D portfolio built with React and Three.js, developed with an efficient AI-assisted workflow.",
    year: "2026",
    role: "Design & development",
    tools:
      "React, Three.js / React Three Fiber, GSAP, Lenis, Tailwind CSS, Vite, Claude Code",
    sections: [
      {
        heading: "What it is",
        body: "A portfolio for my 3D modeling and game development work, designed as a piece of 3D work in itself. A Three.js moon and alien share the scene with a custom cel shader that draws its own outlines, while snap scrolling and a project carousel guide visitors through the page.",
      },
      {
        heading: "Built with AI assistance",
        body: "Claude Code acts as the orchestrator of the whole build. Every feature goes through the same short loop: a brief spec, acceptance tests that fail first, the minimum implementation to make them pass, and a single review.",
      },
      {
        heading: "Using AI efficiently",
        body: "The work is split across specialized subagents: a planner, a builder, a faster builder for small tasks, a reviewer and a browser checker. The model is matched to the job, with Haiku for simple tasks, Sonnet as the default and Opus to orchestrate. The acceptance tests are a contract the AI cannot edit, browser checks are grouped into a few runs, and I review the visuals myself.",
      },
      {
        heading: "Results",
        body: "Development started in October 2026, and 11 features have been delivered so far, each with its own spec. I approve every spec before any code is written, so the AI speeds up the work while the decisions stay mine.",
      },
    ],
  },
  {
    slug: "3d-library",
    title: "3D Library",
    type: "library",
    description: "Placeholder: descripción de 3D Library.",
    models: Array.from({ length: 6 }, (_, i) => ({
      id: `model-${i + 1}`,
      title: `Placeholder model ${i + 1}`,
      poster: null,
    })),
  },
  {
    slug: "super-unam-odyssey",
    title: "Super Unam Odyssey",
    type: "game",
    description: "Placeholder: descripción de Super Unam Odyssey.",
  },
];

export function getProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug);
}
