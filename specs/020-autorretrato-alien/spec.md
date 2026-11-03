# Autorretrato alien
Nivel: S

## Objetivo
La sección About Me sustituye el placeholder de imagen por un "autorretrato": la imagen `src/assets/img/AlienAboutMe.png` (render del alien en otra postura) dentro del marco 4:5 actual. Sin canvas WebGL propio: un segundo canvas cambiaba la resolución del shader y alteraba cómo se ve el hero (decisión del usuario, sustituye a la versión 3D).

## Criterios de aceptación
- AC1: Dada la home, cuando se ve la sección About Me, entonces el marco (mismo ratio 4:5, borde y tamaño que ahora) muestra `AlienAboutMe.png` llenándolo, sin desbordarlo, con el degradado actual detrás como fondo (el PNG es transparente).
- AC2: La imagen tiene `alt="Self-portrait: 3D alien character"` y `width`/`height` declarados para que el layout no salte al cargar; un comentario de procedencia ("own work") acompaña la entrada en `src/data/about.js`.
- AC3: About Me no monta ningún `<Canvas>` ni importa three/R3F; el hero no cambia y los checks existentes (`check:buffer`, `check:cel`, `check:snap`, `check:moon`, `check:carousel`, `check:contrast`), lint y build siguen pasando.

## No-objetivos
- Seguimiento del cursor, animación o cualquier efecto 3D en el autorretrato.
- Recomprimir, redimensionar o convertir el PNG.
- Cambiar textos, facts o layout de About Me más allá del contenido del marco.
- Cambiar el hero, el visor 3D o el canvas de página.

## Restricciones
- Usar el slot existente `aboutImage` de `src/data/about.js` (forma documentada allí) y `ABOUT_IMAGE_ASPECT`.
- Sin dependencias nuevas.

## Preguntas abiertas
- (vacío)
