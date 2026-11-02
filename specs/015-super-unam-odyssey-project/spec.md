# Super Unam Odyssey: datos reales y portada
Nivel: S

## Objetivo
Sustituir el placeholder de Super Unam Odyssey en `src/data/projects.js` por la información real del proyecto y su portada, igual que se hizo con Megaloterra.

## Criterios de aceptación
- AC1: Dado el proyecto `super-unam-odyssey`, su entrada tiene `year: "2025"`, `role: "Team lead & gameplay programmer"`, `tools: "Unity, C#"`, `link: { label: "View on GitHub", href: "https://github.com/Himarr/SuperMarioBrosClone" }`, una `description` real (sin "Placeholder") y `image` de portada con `src`, `alt` descriptivo, `width` y `height` reales, con comentario de procedencia ("own work").
- AC2: La portada es `src/assets/img/projects/super-unam-odyssey-cover.webp`, generada a partir de la captura del menú principal aportada por el usuario, sin la notificación de NVIDIA (la esquina superior derecha se rellena con el color de fondo plano).
- AC3: La entrada tiene `sections` con al menos estas cuatro, en inglés y en primera persona, sin atribuir trabajo que no se haya indicado:
  - "What it is": recreación del Super Mario Bros de NES, proyecto universitario de 2025 en la Universidad Atlántico Medio, equipo de 4 dirigido por mí (el único programador con experiencia), hecho en Unity.
  - "Movement physics and collisions": programación de las físicas del movimiento y las colisiones.
  - "Enemies, power-ups and levels": enemigos, power-ups, máquinas de estados y niveles.
  - "Odyssey mode": modo que añade a Cappy y la mecánica de rebotar sobre el gorro.

## No-objetivos
- No se añade galería `images` (solo hay una captura).
- No se cambia el orden de proyectos, el componente de la ficha ni el carrusel.
- No se modifican tests ni datos de otros proyectos.

## Restricciones
- Archivos: `src/data/projects.js`, nuevo `src/assets/img/projects/super-unam-odyssey-cover.webp`, tests en `tests/acceptance/015-super-unam-odyssey-project/`.
- Imagen: origen `C:\Users\himar\AppData\Local\Temp\claude\C--Users-himar-Projects-3d-portfolio\236596cd-f0d0-4f3b-ae78-ed67f01eb6f8\images\1.webp` (2000×1125). Procesar con ffmpeg (disponible en PATH), salida WebP con ancho ≤ 1600 manteniendo proporción.

## Preguntas abiertas
- (vacío)
