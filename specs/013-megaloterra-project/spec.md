# Página del proyecto Megaloterra
Nivel: M

## Objetivo
Rellenar la página de Megaloterra (`/projects/megaloterra`) con contenido real orientado a conseguir trabajo. Debe destacar lo que hizo el autor en un equipo de 4: mapa procedural 3D de nodos, modelado de criaturas, sistema de guardado e interfaces. Incluye capturas reales del juego y un enlace a su página de itch.io.

## Criterios de aceptación
- AC1: Dado `projects` en `src/data/projects.js`, entonces el proyecto `megaloterra` sigue en primera posición y conserva su slug y su título. Tiene una `description` corta (≤ 200 caracteres) sin la palabra "Placeholder". El orden de los demás proyectos no cambia.
- AC2: Dada la ruta `/projects/megaloterra`, entonces la ficha muestra Year "2026", Role "Gameplay programmer & 3D artist" y Tools "Unity, C#, Blender, ZBrush".
- AC3: Dada esa página, entonces debajo de la descripción hay 5 secciones, cada una con un `h2` y texto, redactadas para un reclutador o responsable técnico:
  1. Qué es: roguelike de captura de criaturas con combate por turnos, mapas y combates procedurales y fusión de criaturas que heredan habilidades. Proyecto universitario en equipo de 4 (asignatura de Gestión de Proyectos, Universidad Atlántico Medio), hecho en Unity y publicado en itch.io.
  2. Mapa procedural 3D de nodos: mapa de caminos ramificados al estilo Slay the Spire, pero en 3D. Los caminos no se cruzan. Hay tipos de nodo (combate, evento aleatorio, tesoro, tienda, curación, jefe), y los nodos que no son de combate no se repiten dos veces seguidas. La decoración se genera justo después de los caminos para no solaparse con ellos.
  3. Modelado de criaturas: esculpido en ZBrush y retopología en Blender. No se mencionan las texturas.
  4. Sistema de guardado: guarda la partida completa (equipo de criaturas con estadísticas, movimientos e items; inventario de items y consumibles; criaturas de la guardería).
  5. Interfaces, menús y opciones: programación de HUD, menús, inventario y opciones.
- AC4: El texto visible no menciona texturizado ni Substance como trabajo del autor. Tampoco atribuye al autor trabajo que no hizo (combate, fusión o música se presentan como parte del juego, no como suyos).
- AC5: El proyecto tiene `image` (portada del carrusel de la home: la vista cenital del mapa) e `images` con 6 capturas reales. Cada imagen tiene `src`, un `alt` descriptivo, `width` y `height`. Los archivos existen en `src/assets/img/projects/` (`megaloterra*.webp`) y la página los muestra en el hero.
- AC6: Dada esa página, entonces hay un enlace visible a `https://d3nuwu.itch.io/megaloterra` (p. ej. "Play on itch.io") que se abre en una pestaña nueva con `rel="noopener noreferrer"`. Los proyectos sin enlace no muestran nada nuevo, y las páginas de 3D Portfolio, 3D Library y Super Unam Odyssey se ven igual que antes.

## No-objetivos
- No se crea un `type` ni un layout de página nuevo, ni se rediseña el existente.
- No se cambia el contenido de otros proyectos ni el carrusel de la home.
- No hay vídeo/tráiler ni descarga del juego.

## Restricciones
- Archivos: `src/data/projects.js`, `src/components/projects/GameProjectPage.jsx` (solo para el enlace) e imágenes nuevas `src/assets/img/projects/megaloterra*.webp`.
- Imágenes: recortadas a 16:10 y en WebP, ≤ ~400 KB cada una, con comentario de procedencia ("own work, Megaloterra team"). Las 4 de itch.io (1920×1080) pasan a 1600×1000. Las 2 del autor (≈1351×756) se recortan a 16:10 sin reescalar hacia arriba (≈1200×750).
- Todo el texto visible en inglés.
- Contenido factual: nada de métricas inventadas.

## Preguntas abiertas
- (vacío)
