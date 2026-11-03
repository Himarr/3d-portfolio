# Autorretrato alien
Nivel: M

## Objetivo
La sección About Me sustituye el placeholder de imagen por un "autorretrato": el modelo `AlienPosed.glb` (el mismo alien en otra postura) renderizado en 3D con el cel shader y outline del hero, dentro del marco 4:5 actual, girando ligeramente hacia el cursor.

## Criterios de aceptación
- AC1: Dada la home, cuando la sección About Me está en pantalla con WebGL disponible, entonces en el marco de la imagen (mismo ratio 4:5, borde y tamaño que ahora) se ve el modelo `AlienPosed.glb` encuadrado y centrado dentro del marco, sin desbordarlo.
- AC2: Dado el autorretrato, entonces usa el cel shader (`toon`) y el outline, igual que el alien del hero.
- AC3: Dado un dispositivo con puntero fino, cuando el usuario mueve el cursor, entonces el modelo gira suavemente un ángulo pequeño (acotado) hacia el puntero y vuelve a la pose de frente al salir/perder el foco la ventana. Con puntero táctil o `prefers-reduced-motion: reduce`, la pose queda fija de frente.
- AC4: Dado que no hay WebGL (o el modelo falla/aún carga), entonces se ve el degradado actual dentro del marco como fondo/fallback; el layout de la sección no salta.
- AC5: Dado el marco del autorretrato, entonces expone `role="img"` y `aria-label="Self-portrait: 3D alien character"` (ya no es `aria-hidden`), con o sin WebGL.
- AC6: El alien del hero no cambia (modelo, pose, animación de caída ni seguimiento), y los checks existentes (`check:buffer`, `check:cel`, `check:snap`, `check:moon`, `check:carousel`, `check:contrast`), lint y build siguen pasando.

## No-objetivos
- Orbitar, zoom, turntable o cualquier interacción de arrastre.
- Animaciones de esqueleto del glb, ni optimizar/recomprimir el `.glb`.
- Cambiar textos, facts o layout de About Me más allá del contenido del marco.
- Cambiar el modelo, shader o comportamiento del hero o del visor 3D.

## Restricciones
- Reutilizar `Model.jsx` (props `toon`, `outline`), `FitToUnit` y `usePointerTarget`; sin dependencias nuevas.
- Elegir entre renderizar en el canvas de página existente (alineado al rect del marco, como el hero) o un canvas propio en el marco; el outline debe funcionar en el elegido. El planner decide y lo anota en plan.md.
- No cargar ni montar el modelo antes de lo necesario si eso afecta a la carga del hero (`AlienPosed.glb`, versión optimizada): no debe retrasar la aparición del hero.
- Si algún presupuesto existente (p. ej. de `.glb` o buffers) bloquea el modelo, se reporta, no se relaja el check.

## Preguntas abiertas
- (vacío)
