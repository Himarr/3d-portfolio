# Cel shader: rayado en sombra y granulado en brillos
Nivel: M

## Objetivo
El cel shader (`toonMaterial.js`) añade dos patrones procedurales fijos a la pantalla que imitan el material de Blender del autor (Wave Texture en bandas + Voronoi, referencia `temp/ShaderReference.png`): rayas diagonales oscuras en la sombra más oscura y un granulado de puntos claros en las zonas iluminadas.

## Criterios de aceptación
- AC1: Dado `celConstants.js`, cuando se carga en Node, entonces exporta `CEL_HATCH_ANGLE_DEG` (número finito), `CEL_HATCH_PERIOD_CSS_PX` (> 0), `CEL_HATCH_WIDTH` (en (0, 1), fracción del periodo ocupada por la raya), `CEL_HATCH_MULTIPLIER` (en [0, 1], multiplica el color de sombra 2 dentro de la raya), `CEL_GRAIN_CELL_CSS_PX` (> 0), `CEL_GRAIN_DOT_RADIUS` (en (0, 1), relativo a la celda) y `CEL_GRAIN_STRENGTH` (en [0, 1], mezcla hacia `CEL_LIGHT_SPOT_COLOR`), con comentario de "qué tocar" en la cabecera como el resto.
- AC2: Dado un fragmento en la banda sombra 2, cuando se sombrea, entonces se ven rayas paralelas con ángulo `CEL_HATCH_ANGLE_DEG` y periodo `CEL_HATCH_PERIOD_CSS_PX` × DPR efectivo en coordenadas de pantalla (mismo ángulo en todo el modelo, no se deforman con la malla). Sombra 1 no lleva rayas.
- AC3: Dado un fragmento en la banda iluminada o en el foco de luz, cuando se sombrea, entonces se ve un granulado de puntos tipo Voronoi (celdas de `CEL_GRAIN_CELL_CSS_PX` × DPR, un punto por celda con posición pseudoaleatoria y estable) aclarado hacia el color del foco. Las sombras no llevan granulado.
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
- Coste: un hash y un vecindario Voronoi de 3×3 como máximo por fragmento; sin bucles dinámicos.

## Preguntas abiertas
- (vacío; decisiones del usuario: espacio de pantalla, rayas solo en sombra 2, granulado en iluminada + foco, valores a ojo, estático)
