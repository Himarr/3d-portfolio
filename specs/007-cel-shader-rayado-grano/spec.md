# Cel shader: rayado en sombra y granulado en brillos
Nivel: M

## Objetivo
El cel shader (`toonMaterial.js`) añade dos patrones procedurales fijos a la pantalla que imitan el material de Blender del autor (Wave Texture en bandas + Voronoi, referencia `temp/ShaderReference.png`): rayas diagonales oscuras en la sombra más oscura y un granulado de puntos en cuadrícula (semitono) que enmascara el foco de luz (el brillo blanco solo aparece en los puntos).

## Criterios de aceptación
- AC1: Dado `celConstants.js`, cuando se carga en Node, entonces exporta `CEL_HATCH_ANGLE_DEG` (número finito), `CEL_HATCH_PERIOD_CSS_PX` (> 0), `CEL_HATCH_WIDTH` (en (0, 1), fracción del periodo ocupada por la raya), `CEL_HATCH_MULTIPLIER` (en [0, 1], multiplica el color de sombra dentro de la raya), `CEL_GRAIN_CELL_CSS_PX` (> 0), `CEL_GRAIN_DOT_RADIUS` (en (0, 1), radio máximo del punto relativo a la celda) y `CEL_GRAIN_STRENGTH` (en [0, 1], intensidad de la máscara de granulado sobre el foco), con comentario de "qué tocar" en la cabecera como el resto.
- AC2: Dado un fragmento en la banda sombra 2 o en la mitad más oscura de sombra 1 (ndl por debajo del punto medio entre `CEL_THRESHOLD_SHADOW1` y `CEL_THRESHOLD_LIT`), cuando se sombrea, entonces se ven rayas paralelas con ángulo `CEL_HATCH_ANGLE_DEG` y periodo `CEL_HATCH_PERIOD_CSS_PX` × DPR efectivo en coordenadas de pantalla (mismo ángulo en todo el modelo, no se deforman con la malla). Dentro de sombra 1 la raya oscurece el color de sombra 1 con el mismo `CEL_HATCH_MULTIPLIER`. La mitad clara de sombra 1 no lleva rayas, y el corte en el punto medio usa el mismo suavizado `celBand`.
- AC3: Dado un fragmento en la banda del foco de luz (la más brillante, `CEL_LIGHT_SPOT_COLOR`), cuando se sombrea, entonces el granulado actúa como máscara del foco con trama de semitono: puntos centrados en una cuadrícula regular fija a pantalla (celdas cuadradas de `CEL_GRAIN_CELL_CSS_PX` × DPR, sin posición aleatoria ni hash). Dentro de los puntos se ve el color del foco y fuera el color de la banda iluminada. El radio de cada punto sigue al brillo: vale 0 en `CEL_THRESHOLD_LIGHT_SPOT` y crece hasta `CEL_GRAIN_DOT_RADIUS` (radio máximo, relativo a la celda) en ndl = 1, de modo que el centro del foco tiene puntos grandes y el borde puntos pequeños que transicionan a la banda iluminada. `CEL_GRAIN_STRENGTH` es la intensidad de la máscara (0 = foco sólido como antes, 1 = foco solo en los puntos). La banda iluminada (fuera del foco) y las sombras no llevan granulado.
- AC3b (revisión del autor): los valores por defecto cumplen `CEL_GRAIN_CELL_CSS_PX >= 15`, `CEL_HATCH_MULTIPLIER <= 0.3`, `CEL_GRAIN_STRENGTH = 1` y `CEL_GRAIN_DOT_RADIUS >= 0.5` (los puntos del centro del foco son grandes y casi se tocan).
- AC4: Dado `CEL_HATCH_MULTIPLIER = 1` y `CEL_GRAIN_STRENGTH = 0`, cuando se renderiza, entonces el resultado es idéntico al cel shader actual.
- AC5: Dado el patrón, cuando pasa el tiempo o se hace scroll sin mover el modelo, entonces el patrón no cambia (estático: sin uniform de tiempo). Los bordes del patrón siguen los mismos pesos suaves de banda (`celBand`) que ya usa el shader.
- AC6: Dado el proyecto, cuando se ejecutan los checks existentes y `npm run build`, entonces todo pasa; los uniforms nuevos se rellenan una vez desde `celConstants.js` como los actuales (sin escrituras por frame salvo el DPR si ya existe un mecanismo para ello).

## No-objetivos
- Animación del patrón.
- Patrón en espacio de objeto o UV; texturas o imágenes nuevas.
- Parámetros por material o por modelo (son globales).
- Cambios en umbrales, multiplicadores de banda existentes, contorno (outline) o iluminación.
- Igualar píxel a píxel el render de Blender; los valores se calibran a ojo.

## Restricciones
- Archivos: `src/three/celConstants.js`, `src/three/toonMaterial.js` (y, si hace falta pasar el DPR, el punto donde hoy se fija el DPR del outline). Nada de React nuevo.
- GLSL procedural en el fragment shader existente (`onBeforeCompile`), usando `gl_FragCoord`; WebGL1/2 compatible como el resto.
- Coste: cuadrícula de semitono sin hash ni bucles (un `fract` y una distancia por fragmento); el hash y el vecindario Voronoi 3×3 de la versión anterior se eliminan.

## Preguntas abiertas
- (vacío; decisiones del usuario: espacio de pantalla, rayas solo en sombra 2, valores a ojo, estático; revisión: granulado solo en el foco y como máscara, escala mucho mayor, rayas más oscuras; 2ª revisión: puntos en cuadrícula con radio según el brillo, rayas hasta la mitad de sombra 1)
