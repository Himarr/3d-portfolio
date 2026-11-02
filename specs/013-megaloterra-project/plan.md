# Plan: Megaloterra project page
Nivel: M
Interfaces nuevas o modificadas: `project.link?: { label: string, href: string }` (campo opcional en src/data/projects.js); `GameProjectPage` renderiza `<a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>` solo si `project.link` existe
- [ ] T1 — Página con datos reales: descripción, ficha (Year/Role/Tools), 5 secciones en inglés, 6 capturas webp 16:10 (`megaloterra*.webp`, portada = vista cenital) con alt/width/height y comentario de procedencia | AC: 1, 2, 3, 4, 5 | Archivos: src/data/projects.js, src/assets/img/projects/megaloterra-*.webp | Depende de: — | Complejidad: normal
- [ ] T2 — Enlace "Play on itch.io" (`link` en datos + render condicional en GameProjectPage, pestaña nueva, rel seguro) sin cambios en los demás proyectos | AC: 6 | Archivos: src/components/projects/GameProjectPage.jsx, src/data/projects.js | Depende de: T1 | Complejidad: baja
