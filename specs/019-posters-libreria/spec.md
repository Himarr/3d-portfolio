# Pósters de la librería 3D
Nivel: M

## Objetivo
Que el visor 3D herede el cielo de estrellas del resto del sitio y sacar del visor 3D una captura de cada modelo (Supra MK3, Alien, Luna) para usarla como póster de su tarjeta en la librería, y una captura del Supra MK3 como portada del proyecto "3D Library" en el carrusel de la página principal. Las capturas se descargan desde el visor en modo desarrollo; el usuario guarda los archivos y se enlazan en los datos.

## Criterios de aceptación
- AC0: Dado `/viewer?model=<id>` con un modelo válido, entonces detrás del modelo se ve el mismo cielo de estrellas que en las páginas de proyecto (mismo `PageCanvas starsOnly`, mismas reglas: no se monta con `prefers-reduced-motion`), y el canvas del visor es transparente para dejarlo ver.
- AC1: Dado el servidor de desarrollo y `/viewer?model=<id>&capture`, entonces el turntable se detiene, los controles de ratón siguen activos para elegir el ángulo, y aparece superpuesto un botón "Download poster" que descarga `<id>-poster.webp` (4:3, 1600x1200) y otro "Download cover" que descarga `3d-library-cover.webp` (16:10, 2000x1250), ambos con el fondo de la página y el cielo de estrellas incluidos (sin transparencia) y sin la UI superpuesta.
- AC2: Dado el build de producción, entonces el modo captura no existe (código eliminado por `import.meta.env.DEV`) y `/viewer?model=<id>&capture` se comporta como el visor normal.
- AC3: Dada la librería, cada tarjeta muestra el póster de su modelo (`src/assets/img/library/<id>-poster.webp`) con `alt` igual al título del modelo; los degradados quedan solo como reserva para modelos sin póster.
- AC4: Dado el carrusel de proyectos de la página principal, la tarjeta "3D Library" muestra `src/assets/img/projects/3d-library-cover.webp` con `alt`, `width`, `height` y comentario de procedencia, como el resto de proyectos.

## No-objetivos
- Capturas automáticas sin intervención (el ángulo lo elige el usuario en el visor).
- Cambiar iluminación, encuadre o controles del visor normal (solo cambia el fondo).
- Cambiar el cielo de estrellas (densidad, parallax, colores).
- Pósters de otros proyectos o del hero.
- Optimización de imágenes más allá de exportar webp con calidad 0.9.

## Restricciones
- Seguir el patrón de `src/three/PosterCapture.jsx` (dev-only, `preserveDrawingBuffer` solo en modo captura, descarga con `<a download>`).
- Las imágenes las guarda el usuario; ningún agente descarga ni genera archivos de imagen.
- Imágenes de proyectos: hasta ~400 KB (README de `src/assets/img/`).
- No romper los checks existentes.

## Preguntas abiertas
- (vacío)
