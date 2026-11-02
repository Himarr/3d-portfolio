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
