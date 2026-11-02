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

import megaloterraMap from "../assets/img/projects/megaloterra-map.webp";
import megaloterraCrossroads from "../assets/img/projects/megaloterra-crossroads.webp";
import megaloterraCombat from "../assets/img/projects/megaloterra-combat.webp";
import megaloterraCreature from "../assets/img/projects/megaloterra-creature.webp";
import megaloterraLearn from "../assets/img/projects/megaloterra-learn.webp";
import megaloterraShelf from "../assets/img/projects/megaloterra-shelf.webp";
import portfolioCover from "../assets/img/projects/portfolio-cover.webp";
import portfolioHero from "../assets/img/projects/portfolio-hero.webp";
import portfolioProjects from "../assets/img/projects/portfolio-projects.webp";
import portfolioContact from "../assets/img/projects/portfolio-contact.webp";
import superUnamOdysseyCover from "../assets/img/projects/super-unam-odyssey-cover.webp";

export const projects = [
  {
    slug: "megaloterra",
    title: "Megaloterra",
    type: "game",
    description:
      "A creature-capturing roguelike built by a team of 4. I made the 3D node map, the creature models, the save system and the UI.",
    // Provenance: own work, Megaloterra team (third-person view of the procedural map, crossroads)
    image: {
      src: megaloterraCrossroads,
      alt: "Third-person view of two creatures on pedestals at a path crossroads of the map, surrounded by a low-poly forest",
      width: 1209,
      height: 756,
    },
    // Provenance: own work, Megaloterra team
    images: [
      {
        src: megaloterraCrossroads,
        alt: "Third-person view of two creatures on pedestals at a path crossroads of the map, surrounded by a low-poly forest",
        width: 1209,
        height: 756,
      },
      {
        src: megaloterraMap,
        alt: "Top-down view of the procedural 3D map with branching paths, red combat nodes, event nodes and a low-poly forest",
        width: 1204,
        height: 753,
      },
      {
        src: megaloterraCombat,
        alt: "Turn-based combat with a horned creature on a pedestal and an ability menu",
        width: 1600,
        height: 1000,
      },
      {
        src: megaloterraCreature,
        alt: "Creature sheet showing HP, defense, attack, speed and luck stats with tabs for abilities, consumables and items",
        width: 1600,
        height: 1000,
      },
      {
        src: megaloterraLearn,
        alt: "Screen to learn a new ability, asking which existing ability the creature should replace",
        width: 1600,
        height: 1000,
      },
      {
        src: megaloterraShelf,
        alt: "Shelf of creature figurines with the Fusion and Battle buttons",
        width: 1600,
        height: 1000,
      },
    ],
    year: "2026",
    role: "Gameplay programmer & 3D artist",
    tools: "Unity, C#, Blender, ZBrush",
    link: { label: "Play on itch.io", href: "https://d3nuwu.itch.io/megaloterra" },
    sections: [
      {
        heading: "What it is",
        body: "Megaloterra is a creature-capturing roguelike with turn-based combat, procedural maps and battles, and a fusion system where creatures inherit abilities. It was a university project by a team of 4 for the Project Management course at Universidad Atlántico Medio, made in Unity and published on itch.io.",
      },
      {
        heading: "Procedural 3D node map",
        body: "I built the map as branching paths in the style of Slay the Spire, but in 3D. The paths never cross. Nodes come in several types: combat, random event, treasure, shop, healing and boss, and non-combat nodes never repeat twice in a row. Decorations are generated right after the paths, so they never overlap them.",
      },
      {
        heading: "Creature modeling",
        body: "I sculpted the creatures in ZBrush and did the retopology in Blender, so they are clean, game-ready models.",
      },
      {
        heading: "Save system",
        body: "I programmed the save system, which stores the complete game: the creature team with stats, moves and items, the inventory of items and consumables, and the creatures kept in the nursery.",
      },
      {
        heading: "Interfaces, menus and options",
        body: "I programmed the HUD, the menus, the inventory screens and the options, so players can move through the game and manage their team comfortably.",
      },
    ],
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
    description:
      "A Super Mario Bros. (NES) clone made in Unity for a university project. I led a team of 4 and programmed the gameplay, plus an Odyssey mode with Cappy.",
    // Provenance: own work (title screen of the game)
    image: {
      src: superUnamOdysseyCover,
      alt: "Title screen of Super Unam Odyssey with the logo on a brown plate and the Classic Mode, Odyssey Mode and Exit options over a blue sky with Mario and green hills",
      width: 1600,
      height: 900,
    },
    // Provenance: own work (title screen of the game)
    images: [
      {
        src: superUnamOdysseyCover,
        alt: "Title screen of Super Unam Odyssey with the logo on a brown plate and the Classic Mode, Odyssey Mode and Exit options over a blue sky with Mario and green hills",
        width: 1600,
        height: 900,
      },
    ],
    year: "2025",
    role: "Team lead & gameplay programmer",
    tools: "Unity, C#",
    link: { label: "View on GitHub", href: "https://github.com/Himarr/SuperMarioBrosClone" },
    sections: [
      {
        heading: "What it is",
        body: "Super Unam Odyssey is a recreation of the NES Super Mario Bros. It was a university project from 2025 at Universidad Atlántico Medio, made in Unity by a team of 4 that I led. I was the only programmer with experience on the team.",
      },
      {
        heading: "Movement physics and collisions",
        body: "I programmed the movement physics and the collisions, so Mario moves, jumps and hits the blocks and the ground the way the classic game does.",
      },
      {
        heading: "Enemies, power-ups and levels",
        body: "I programmed the enemies, the power-ups, the state machines that control their behaviour, and the levels needed to build a full clone of the NES game.",
      },
      {
        heading: "Odyssey mode",
        body: "The Odyssey mode adds Cappy to the game, along with the bounce mechanic on the hat.",
      },
    ],
  },
];

export function getProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug);
}
