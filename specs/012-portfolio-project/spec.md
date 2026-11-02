# Proyecto "Portfolio" (esta web) en el carrusel y su página
Nivel: M

## Objetivo
Añadir esta propia web como proyecto del portfolio, en segunda posición del carrusel, con una página de proyecto con contenido real que destaque cómo se construyó con un flujo de desarrollo asistido por IA eficiente (Claude Code, spec + test driven, subagentes con modelo según la tarea).

## Criterios de aceptación
- AC1: Dado `projects` en `src/data/projects.js`, entonces el segundo elemento tiene slug `portfolio`, título "3D Portfolio" y una `description` corta (≤ 200 caracteres) sin la palabra "Placeholder"; el orden relativo de los tres proyectos existentes no cambia.
- AC2: Dada la ruta `/projects/portfolio`, entonces se muestra con el mismo layout que las páginas de videojuego (hero carrusel con placeholders + `h1` con el título + ficha), y la ficha muestra valores reales: Year "2026", Role "Design & development", Tools con el stack real (React, Three.js / React Three Fiber, GSAP, Lenis, Tailwind CSS, Vite, Claude Code).
- AC3: Dada esa página, entonces debajo de la descripción se muestran secciones de contenido, cada una con un encabezado `h2` y su texto, al menos estas cuatro:
  1. Qué es: la web como pieza de portfolio 3D (luna y alien en Three.js, cel shader propio con contorno, scroll con snap, carrusel de proyectos).
  2. Desarrollo asistido por IA: Claude Code como orquestador; cada feature pasa por spec corta → tests de aceptación que fallan → implementación mínima → una revisión.
  3. Uso eficiente de la IA: subagentes especializados (planner, builder, builder rápido, reviewer, browser), modelo elegido según la complejidad (Haiku para tareas simples, Sonnet por defecto, Opus para orquestar), tests como contrato que la IA no puede modificar, comprobaciones de navegador agrupadas y revisión visual humana.
  4. Resultados: cifras reales del repo (≥ 11 features entregadas con spec propia, desarrollo iniciado en octubre de 2026) y el control humano en cada spec.
- AC4: Las páginas existentes (Megaloterra, 3D Library, Super Unam Odyssey) se ven igual que antes: si un proyecto no tiene secciones, no se renderiza nada extra.

## No-objetivos
- No se añaden capturas ni imágenes reales: el hero usa los placeholders actuales.
- No se crea un componente ni un `type` de página nuevo; no se rediseña el layout.
- No se cambia el contenido de los otros proyectos ni el carrusel de la home.
- No se enlaza al repositorio ni a ninguna web externa.

## Restricciones
- Archivos: `src/data/projects.js` y `src/components/projects/GameProjectPage.jsx`.
- Todo el texto visible en inglés, como el resto de la web.
- Contenido factual: nada de métricas inventadas (ni porcentajes de tiempo ahorrado ni similares).

## Preguntas abiertas
- (vacío)
