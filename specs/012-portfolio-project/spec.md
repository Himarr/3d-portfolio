# Proyecto "Portfolio" (esta web) en el carrusel y su página
Nivel: M

## Objetivo
Añadir esta propia web como proyecto del portfolio, en segunda posición del carrusel, con una página orientada a conseguir trabajo: destaca la capacidad del autor para trabajar con IA, diseñar flujos de trabajo con agentes y dirigir un proyecto asistido por IA manteniendo el control y la calidad. Incluye capturas reales de la web como portada y en el carrusel de la página.

## Criterios de aceptación
- AC1: Dado `projects` en `src/data/projects.js`, entonces el segundo elemento tiene slug `portfolio`, título "3D Portfolio" y una `description` corta (≤ 200 caracteres) sin la palabra "Placeholder"; el orden relativo de los tres proyectos existentes no cambia.
- AC2: Dada la ruta `/projects/portfolio`, entonces se muestra con el mismo layout que las páginas de videojuego (hero carrusel + `h1` con el título + ficha), y la ficha muestra valores reales: Year "2026", Role "Design & development", Tools con el stack real (React, Three.js / React Three Fiber, GSAP, Lenis, Tailwind CSS, Vite, Claude Code).
- AC3: Dada esa página, entonces debajo de la descripción hay al menos 4 secciones, cada una con un `h2` y texto, redactadas para un reclutador o responsable técnico:
  1. Qué es: la web como pieza 3D en tiempo real (luna y alien en Three.js, cel shader propio con contorno, scroll con snap, carrusel de proyectos).
  2. Dirigir un proyecto con IA: el autor define producto, diseño, arquitectura y criterios de aceptación; los agentes de IA implementan bajo su dirección.
  3. Flujo de trabajo propio: diseñó un flujo con agentes especializados guiado por specs y tests de aceptación, con revisión independiente; descrito a alto nivel, sin revelar el detalle interno.
  4. Control y calidad: aprobación humana de cada spec, tests como contrato, lint/build y checks automáticos (rendimiento, contraste), revisión visual humana; y resultados reales (más de 10 features entregadas desde octubre de 2026).
- AC4: El texto visible de la página no menciona modelos concretos (ni "Haiku", "Sonnet", "Opus") ni nombres internos de agentes ("planner", "builder", "reviewer"), ni porcentajes ni URLs.
- AC5: El proyecto tiene `image` (portada del carrusel de la home) con `src`, `alt`, `width` y `height`, y `images` con 3 capturas reales de la web, cada una con `src`, `alt` descriptivo, `width` y `height`; los archivos existen en `src/assets/img/projects/` y la página muestra esas 3 imágenes en el hero (no placeholders).
- AC6: Las páginas existentes (Megaloterra, 3D Library, Super Unam Odyssey) se ven igual que antes: si un proyecto no tiene secciones, no se renderiza nada extra.

## No-objetivos
- No se crea un componente ni un `type` de página nuevo; no se rediseña el layout.
- No se cambia el contenido de los otros proyectos ni el carrusel de la home.
- No se enlaza al repositorio ni a ninguna web externa.

## Restricciones
- Archivos: `src/data/projects.js`, `src/components/projects/GameProjectPage.jsx` y las imágenes nuevas en `src/assets/img/projects/` (`portfolio*.webp`).
- Imágenes: capturas propias de la web en local, 16:10, ≥ 1600×1000, WebP, ≤ ~400 KB cada una, con comentario de procedencia ("own work").
- Todo el texto visible en inglés, como el resto de la web.
- Contenido factual: nada de métricas inventadas.

## Preguntas abiertas
- (vacío)
