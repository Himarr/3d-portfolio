# Hero: alien flotante delante de la luna
Nivel: M

## Objetivo
El hero muestra el modelo `src/assets/3D/Alien.glb` como foco principal, delante de la luna (a la derecha en pantallas anchas y debajo en móvil). Usa sus texturas, el cel shader y el contorno que ya tiene la luna, flota arriba y abajo y se inclina un poco con el puntero. El póster de fallback también muestra el alien.

## Criterios de aceptación
- AC1: Dado el canvas en vivo, cuando el hero está a la vista, entonces el alien se renderiza con el toon material de `useToonMaterials` y conserva el `map` (base color) de cada material del glb. Se ven sus propias texturas embebidas (imágenes "BaseColor" y "Clothes" en los materiales `AlienBaseColor`, `Comic Shader.001` y `Comic Shader.004`), no las de la luna. También lleva el contorno exterior e interior, con el mismo grosor y color que la luna.
- AC2: Dado un viewport con ancho ≥ `HERO_WRAP_MIN_WIDTH_PX`, cuando se coloca el alien, entonces su centro queda a la derecha del centro de la luna, su silueta se solapa con la luna y se dibuja delante de ella (más cerca de la cámara). El alien queda entero dentro del viewport en el primer frame del hero.
- AC3: Dado un viewport con ancho < `HERO_WRAP_MIN_WIDTH_PX`, cuando se coloca el alien, entonces su centro queda por debajo del centro de la luna, su silueta se solapa con la parte baja de la luna y se dibuja delante de ella. El alien no se sale del viewport por los lados.
- AC4: Dado el tamaño, cuando cambia el radio de la luna (resize o intro), entonces la altura del alien en pantalla es `ALIEN_HEIGHT_PER_MOON_RADIUS` × radio de la luna, una constante con valor inicial 0.9 que se calibra a ojo. También sigue la escala de la intro (`moonIntro.scale`) como la luna.
- AC5: Dado el paso del tiempo, cuando el hero está a la vista, entonces el alien oscila en Y con una senoide (`ALIEN_FLOAT_AMPLITUDE`, relativa al radio de la luna, y `ALIEN_FLOAT_PERIOD_S` en segundos). Además se inclina siguiendo el puntero con el mismo suavizado que la luna. No gira sobre sí mismo. Si el hero no está a la vista, no se hace trabajo por frame para el alien.
- AC6: Dado reduced-motion, sin WebGL, fallo de carga de un modelo o pérdida de contexto, cuando se muestra el fallback, entonces aparece un póster estático del alien (nuevo PNG generado desde la escena con su procedencia documentada) en la misma posición relativa a la luna que en vivo, tanto en escritorio como en móvil. El póster de la luna no cambia.
- AC7: Dado el proyecto, cuando se ejecutan los checks existentes (`check:buffer`, `check:cel`, `check:snap`, `check:moon`, `check:carousel`, `check:contrast`), los tests, `npm run lint` y `npm run build`, entonces todo pasa. Al desmontar la escena, la geometría, los materiales y las texturas del alien se liberan como los de la luna (`Model` + `disposeObject`).

## No-objetivos
- Animaciones del glb, esqueleto o rig. El alien no gira sobre sí mismo.
- Compresión Draco o meshopt y optimización de texturas del glb (va en la feature de deploy).
- Cambios en el cel shader, en sus constantes o en el aspecto de la luna.
- Cambios en el texto del hero, en el wrap del texto alrededor de la luna o en el tamaño y la posición de la luna.
- El alien en `/viewer` o en otras secciones.
- Interacción con el alien (click, hover).

## Restricciones
- El modelo se carga con `Model` (import empaquetado desde `src/assets/3D/`), igual que la luna. Archivos previstos: un componente nuevo `src/three/Alien.jsx`, una constante o módulo de encuadre del alien, `PageScene.jsx`, `OutlineLayer.jsx` (para que el contorno cubra los dos modelos), `PosterCapture.jsx`, `Hero.jsx` (solo el póster del alien) y el nuevo PNG en `src/assets/`.
- El colocado se hace por frame a partir de las métricas cacheadas del hero y del radio de la luna, como hoy: sin leer el layout ni crear objetos por frame.
- El PNG del póster se genera con la herramienta de desarrollo `PosterCapture`. Lo captura el agente browser o el autor, no un test.
- El contorno sigue siendo una sola pasada (un render target) que cubre los dos modelos, sin un segundo `OutlineLayer` completo.

## Preguntas abiertas
- (vacío; decisiones del usuario: con contorno, póster regenerado con el alien, flotar y parallax del puntero, altura inicial de 0.9 × radio de la luna calibrada a ojo. Decisión del Orchestrator: el póster del alien es una imagen aparte del de la luna para que funcione en las dos disposiciones.)
