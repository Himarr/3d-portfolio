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

import portfolioCover from "../assets/img/projects/portfolio-cover.webp";
import portfolioHero from "../assets/img/projects/portfolio-hero.webp";
import portfolioProjects from "../assets/img/projects/portfolio-projects.webp";
import portfolioContact from "../assets/img/projects/portfolio-contact.webp";

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
      "This very site: a real-time 3D portfolio, designed and directed by me and built with AI agents under my control.",
    // Provenance: own work (screenshots of this site)
    image: {
      src: portfolioCover,
      alt: "Cel-shaded 3D moon with an alien and the navigation bar of the portfolio home page",
      width: 1600,
      height: 1000,
    },
    // Provenance: own work (screenshots of this site)
    images: [
      {
        src: portfolioHero,
        alt: "Portfolio home page showing a cel-shaded 3D moon with an alien and the navigation",
        width: 1600,
        height: 1000,
      },
      {
        src: portfolioProjects,
        alt: "Projects carousel of the portfolio over a starry background",
        width: 1600,
        height: 1000,
      },
      {
        src: portfolioContact,
        alt: "Contact section of the portfolio with a message form",
        width: 1600,
        height: 1000,
      },
    ],
    year: "2026",
    role: "Design & development",
    tools:
      "React, Three.js / React Three Fiber, GSAP, Lenis, Tailwind CSS, Vite, Claude Code",
    sections: [
      {
        heading: "What it is",
        body: "A portfolio for my 3D modeling and game development work, designed as a piece of real-time 3D in itself. A Three.js moon and alien share the scene with a custom cel shader that draws its own outlines, while snap scrolling and a project carousel guide visitors through the page.",
      },
      {
        heading: "Directing a project with AI",
        body: "I define the product, the design, the architecture and the acceptance criteria. AI agents do the implementation under my direction, so the vision and the technical decisions stay mine from the first idea to the final result.",
      },
      {
        heading: "A workflow of my own",
        body: "I designed a workflow built on specialized agents, guided by specs and acceptance tests, with an independent review of every feature. It turns AI assistance into a repeatable, predictable process rather than ad hoc prompting.",
      },
      {
        heading: "Control and quality",
        body: "I approve every spec before any code is written, and the acceptance tests act as a contract the agents cannot change. Lint, build and automated checks for performance and contrast run on every feature, and I review the visual result myself. Since October 2026, more than 10 features have been delivered this way.",
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
