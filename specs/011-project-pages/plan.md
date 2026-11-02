# Plan: 011-project-pages
Nivel: M
Interfaces nuevas o modificadas: projects[] en src/data/projects.js: { slug, title, type: "game"|"library", description, image?, images?: [{src,alt,width,height}], role?, tools?, year?, models?: [{id,title,poster}] } (placeholders si faltan)
Interfaces nuevas o modificadas: <GameProjectPage project /> en src/components/projects/GameProjectPage.jsx (carrusel hero con botones aria-label, puntos con aria-current, ficha)
Interfaces nuevas o modificadas: <LibraryProjectPage project /> en src/components/projects/LibraryProjectPage.jsx (rejilla grid-cols-1 sm:grid-cols-2 lg:grid-cols-3, tarjetas, <dialog> con "3D viewer", cierre con foco devuelto a la tarjeta)
Interfaces nuevas o modificadas: ProjectPage elige layout por project.type; getProjectBySlug sin cambios
- [ ] T1 — La portada y /projects/:slug usan Megaloterra, 3D Library y Super Unam Odyssey con `type`; slugs project-one/two/three desaparecen y slug inexistente sigue en ProjectNotFound | AC: 1, 4 | Archivos: src/data/projects.js, scripts/check-carousel.mjs (cambiar slug 'project-one' por 'megaloterra' en test getProjectBySlug) | Depende de: — | Complejidad: baja
- [ ] T2 — Página de videojuego con hero carrusel (≥3 imágenes placeholder, anterior/siguiente, puntos, vuelta circular), título, descripción y ficha; ProjectPage despacha por type | AC: 2 | Archivos: src/pages/ProjectPage.jsx, src/components/projects/GameProjectPage.jsx, src/data/projects.js | Depende de: T1 | Complejidad: normal
- [ ] T3 — Página de librería con rejilla 1/2/3 columnas, tarjetas de póster + título y dialog modal con "3D viewer", cerrar y foco devuelto | AC: 3, 4 | Archivos: src/pages/ProjectPage.jsx, src/components/projects/LibraryProjectPage.jsx, src/data/projects.js | Depende de: T1 | Complejidad: normal

Notas
- Obsoleto por el cambio de datos (no editado por el Planner): scripts/check-carousel.mjs (test 'getProjectBySlug', líneas ~356-361) usa 'project-one'; se arregla en T1 (npm run check:carousel). No hay otros tests ni checks que dependan de los slugs antiguos.
- Si se añaden imágenes a projects.js, cada `image:` necesita comentario "Provenance" encima (checkProvenanceComments) y validateProjects exige src/alt/width/height.
- Los tests renderizan con Vite SSR (tests/acceptance/011-project-pages/_render.mjs, helper sin test). El estado inicial del carrusel es imagen 1 con un único aria-current. Interacciones (circularidad, foco, scroll horizontal) van en browser.md.
