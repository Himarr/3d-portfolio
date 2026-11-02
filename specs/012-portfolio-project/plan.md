# Plan: Portfolio project
Nivel: M
Interfaces nuevas o modificadas: projects[1] = { slug: "portfolio", title: "3D Portfolio", type: "game", description, year: "2026", role: "Design & development", tools: string, sections: [{ heading: string, body: string }] } en src/data/projects.js
Interfaces nuevas o modificadas: GameProjectPage renderiza `project.sections?.map(...)` como `<section><h2>{heading}</h2><p>{body}</p></section>` tras la descripción y antes del enlace "Back to projects"; sin `sections` no renderiza nada extra
- [ ] T1 — /projects/portfolio existe en 2ª posición con ficha real y ≥4 secciones h2 en inglés (qué es, desarrollo con IA, uso eficiente, resultados); las otras páginas no cambian | AC: 1, 2, 3, 4 | Archivos: src/data/projects.js, src/components/projects/GameProjectPage.jsx | Depende de: — | Complejidad: normal
