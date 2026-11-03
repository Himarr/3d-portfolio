# Visor 3D
Nivel: M

## Objetivo
La librería 3D (`/projects/3d-library`) muestra mis modelos reales (Supra MK3, Alien, Luna) y cada uno se abre en el visor `/viewer`, que carga el modelo indicado con una animación turntable por defecto y controles básicos de ratón. El botón "3D Viewer" de la navbar lleva a la librería.

## Criterios de aceptación
- AC1: Dado `src/data/projects.js`, cuando se lee el proyecto `3d-library`, entonces `models` contiene exactamente tres entradas (Supra MK3, Alien, Luna), cada una con `id` único, `title` y su `.glb` de `src/assets/3D/` (incluido el nuevo `SupraMK3.glb`); ya no hay modelos placeholder.
- AC2: Dada la librería, cuando el usuario activa la tarjeta de un modelo, entonces navega a `/viewer?model=<id>` (enlace, no diálogo); las tarjetas mantienen los degradados como miniatura.
- AC3: Dado `/viewer?model=<id>` con un id válido, entonces se muestra un canvas WebGL con ese modelo encuadrado y centrado que ocupa todo el espacio de la pantalla menos la barra de navegación (sin scroll de página); no se muestra el título del modelo.
- AC4: Dado el visor sin interacción, entonces el modelo gira de forma continua sobre el eje vertical (turntable); con `prefers-reduced-motion: reduce` no gira solo.
- AC5: Dado el visor, cuando el usuario arrastra con el ratón, entonces orbita alrededor del modelo; con la rueda hace zoom dentro de unos límites; el turntable sigue activo tras soltar.
- AC6: Dado el modelo, el sombreado depende del modelo: Alien y Luna usan el cel shader (`toon`); el Supra se muestra con sus materiales tal cual.
- AC9: Dado un modelo sin `toon` (Supra), entonces se ilumina con un entorno de luz suave generado en código (sin descargas externas) más luz directa moderada y relleno, de modo que no hay zonas completamente negras ni zonas quemadas a blanco puro; esta iluminación extra solo se monta cuando `toon` es falso, así que Alien y Luna se ven igual que antes.
- AC7: Dado `/viewer` sin `model` o con un id desconocido, entonces se muestra un mensaje de modelo no encontrado con enlace a la librería, sin canvas.
- AC8: Dada la navbar (escritorio y panel móvil), el enlace "3D Viewer" lleva a `/projects/3d-library`. El visor tiene un enlace "Back to library" superpuesto encima del canvas (dentro del área del visor, no fuera).

## No-objetivos
- Pósters/miniaturas de los modelos (siguen los degradados); se sacarán del visor en una feature posterior, una vez implementado.
- Contorno (outline) en el visor; solo el cel shader.
- Pan, botones de UI para el turntable, pantalla completa, controles táctiles específicos más allá de lo que den los controles por defecto.
- Cambiar la escena del hero, sus modelos o el presupuesto de `.glb`.
- Descripciones o metadatos extra por modelo.

## Restricciones
- Reutilizar `Model.jsx` (prop `toon`) y `FitToUnit`; controles con `@react-three/drei` (ya instalado), sin dependencias nuevas.
- El visor es independiente de la librería: la librería solo enlaza con el `id`; el visor resuelve el modelo desde los datos.
- Debe funcionar con el deploy de GitHub Pages (016) y no romper los checks existentes (`check:buffer`, `check:cel`, etc.).
- El canvas del visor se libera al salir de `/viewer` (no queda WebGL activo en otras rutas).

## Preguntas abiertas
- (vacío)
