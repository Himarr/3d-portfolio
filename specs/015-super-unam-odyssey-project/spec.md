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
- AC4: Dado /projects/super-unam-odyssey, el carrusel muestra la portada real (entrada `images` con solo la portada) y ninguna diapositiva placeholder; con una sola imagen no hay flechas ni puntos. Los proyectos con ≥ 3 imágenes y los que no tienen `images` se ven igual que antes.

## No-objetivos
- No se cambia el orden de proyectos ni el carrusel de la home.
- No se modifican datos de otros proyectos. Solo se ajustan los tests anteriores que fijaban el placeholder de super-unam-odyssey.

## Restricciones
- Archivos: `src/data/projects.js`, `src/components/projects/GameProjectPage.jsx` (AC4: usar `images` reales cuando haya al menos 1), nuevo `src/assets/img/projects/super-unam-odyssey-cover.webp`, tests en `tests/acceptance/015-super-unam-odyssey-project/`.
- Imagen: origen `C:\Users\himar\AppData\Local\Temp\claude\C--Users-himar-Projects-3d-portfolio\236596cd-f0d0-4f3b-ae78-ed67f01eb6f8\images\1.webp` (2000×1125). Procesar con ffmpeg (disponible en PATH), salida WebP con ancho ≤ 1600 manteniendo proporción.

## Preguntas abiertas
- (vacío)
