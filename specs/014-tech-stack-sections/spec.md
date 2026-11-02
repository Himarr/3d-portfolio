# 014 Tech stack sections
Nivel: S

## Objetivo
La sección Tech Stack muestra las herramientas reales de Himar en cuatro categorías (Modeling, Game Dev, Programming, Web), cada herramienta con su logo en vez del icono placeholder.

## Criterios de aceptación
- AC1: Dado `src/data/techStack.js`, entonces contiene exactamente estas categorías y herramientas, en este orden (títulos y nombres literales):
  - Modeling: Blender, ZBrush, Maya, Substance 3D Painter
  - Game Dev: Unity, Godot, Unreal Engine 5
  - Programming: C#, Python, Java, GDScript
  - Web: React, Three.js
  y `validateTechStack(techStack)` devuelve `[]`. Ningún id ni nombre "placeholder" queda en los datos.
- AC2: Dado cada herramienta, entonces tiene `icon` que apunta a un SVG existente en `src/assets/tech/` (nombre = id de la herramienta), sin `width`/`height` en el `<svg>` raíz, sin `<script>` ni referencias externas, y con un comentario `// Provenance:` en `techStack.js`. GDScript puede reutilizar el logo de Godot.
- AC3: Dado la Home en desktop (≥ md), cuando se ve la sección Tech Stack, entonces las cuatro categorías caben en la rejilla sin dejar una sola categoría huérfana en una fila (p. ej. 2×2 en md, 4 columnas en lg); en móvil siguen apiladas.

## No-objetivos
- No se cambia el diseño de `TechCategory` (tamaño del slot, tipografía, animaciones).
- No se añade ninguna dependencia npm al proyecto.
- No se tocan otras secciones ni el validador más allá del comentario de capacidad.

## Restricciones
- Archivos: `src/data/techStack.js`, `src/components/sections/TechStack.jsx` (solo clases de la rejilla), nuevos SVG en `src/assets/tech/`.
- Fuente de logos: Simple Icons (CC0, una sola tinta → `tint: true`); si falta alguno, Devicon (MIT). Se copian los SVG desde el paquete descargado a una carpeta temporal fuera del repo (`npm pack`), sin instalarlo.
- Textos `use` (≤ 40 caracteres), propuesta: Blender "Modeling and texturing", ZBrush "Sculpting", Maya "Modeling and rigging", Substance 3D Painter "PBR texturing", Unity "Game engine", Godot "Game engine", Unreal Engine 5 "Game engine", C# "Unity scripting", Python "Tools and scripting", Java "Programming", GDScript "Godot scripting", React "Interface and tooling", Three.js "3D on the web".
- Capacidad del comentario de `techStack.js`: pasa a "at most 4 categories".

## Preguntas abiertas
- (vacío)
