# 011-project-pages
Nivel: M

## Objetivo
Los tres proyectos de la portada pasan a ser Megaloterra (videojuego), 3D Library (librería de modelos) y Super Unam Odyssey (videojuego), y cada uno abre su página real en `/projects/:slug` siguiendo los prototipos aprobados: `temp/template-game.html` para los videojuegos y `temp/layout-3d-library.html` para la librería. El contenido real se rellenará más adelante; ahora va con textos e imágenes placeholder.

## Criterios de aceptación
- AC1: Dado `src/data/projects.js`, cuando se carga la portada, entonces el carrusel de proyectos muestra, en este orden, "Megaloterra", "3D Library" y "Super Unam Odyssey", con slugs `megaloterra`, `3d-library` y `super-unam-odyssey` y un campo `type` (`"game"` o `"library"`). Los placeholders `project-one/two/three` desaparecen.
- AC2: Dado un proyecto `type: "game"`, cuando se abre `/projects/<slug>`, entonces se ve el layout de `template-game.html`: hero a pantalla completa convertido en carrusel de imágenes (≥ 3, placeholder si el proyecto no trae imágenes) con botones anterior/siguiente con `aria-label`, puntos clicables con `aria-current` en el activo y vuelta circular; debajo, título, descripción y ficha (rol, herramientas, año) con valores placeholder cuando falten. Se mantiene el enlace "Back to projects".
- AC3: Dado el proyecto `3d-library`, cuando se abre `/projects/3d-library`, entonces se ve la rejilla de `layout-3d-library.html` (1 columna en móvil, 2 desde 640 px, 3 desde 1024 px, máximo 3) con tarjetas de póster + título debajo a partir de una lista de modelos placeholder en datos; al pulsar una tarjeta se abre un `<dialog>` modal con el título del modelo, un hueco vacío "3D viewer" y un botón de cerrar (Escape también cierra y el foco vuelve a la tarjeta).
- AC4: Un slug inexistente sigue mostrando `ProjectNotFound`, y ninguna de las páginas tiene scroll horizontal a 375 px.

## No-objetivos
- No se rellena contenido real (textos, imágenes, modelos): solo la estructura de datos con placeholders.
- No hay visor 3D real ni carga de modelos (siguiente feature); `/viewer` y `ViewerPage.jsx` no se tocan.
- Sin autoplay ni swipe en el carrusel; sin animaciones nuevas de scroll/GSAP.
- No se cambia el carrusel de la portada más allá de los datos.

## Restricciones
- Tailwind con los tokens de `src/index.css`; nada de CSS suelto de los prototipos salvo lo imprescindible.
- Archivos previstos: `src/data/projects.js`, `src/pages/ProjectPage.jsx` (elige layout según `type`) y componentes nuevos en `src/components/projects/`. Validación de datos existente (`src/lib/dataValidation.js`) debe seguir pasando.
- `temp/` es solo referencia visual; no se importa desde `src/`.

## Preguntas abiertas
- (vacío)
