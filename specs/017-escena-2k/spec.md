# Escena 3D en viewports grandes
Nivel: M

## Objetivo
Que la escena 3D (estrellas, luna y alien) se vea completa en viewports grandes (2K y mayores): el alien no se recorta con el near plane de la cámara, y en navegadores que limitan el buffer WebGL (p. ej. LibreWolf con `resistFingerprinting`, MAX_RENDERBUFFER_SIZE = 2048) se renderiza a resolución reducida en lugar de caer a los posters.

## Criterios de aceptación
- AC1: Dada la cámara ortográfica de la página, entonces su posición z es 5000 y su far 8000 (near y zoom sin cambios: 1 y 1), de modo que el rango visible en z cubre el plano de estrellas (STAR_Z) y todo el alien (z = 2.5·r ± r) para el radio de luna máximo que da `moonFinalRadiusPx` en viewports de hasta 3840×2160.
- AC2: La cámara de la máscara del outline sigue usando el mismo near/far y la misma z que la cámara principal (el outline se ve igual que antes; los quads del outline siguen dentro del frustum).
- AC3: Dado `computeDpr` con un tamaño CSS mayor que `maxDim` en algún lado, entonces devuelve un dpr < 1 tal que `cssWidth·dpr ≤ maxDim` y `cssHeight·dpr ≤ maxDim` (p. ej. 2560×1076 con maxDim 2048 → dpr ≤ 0.8, redondeado hacia abajo a 2 decimales). Con tamaños que caben, el resultado no cambia respecto a hoy (máx. 2, presupuesto de píxeles, nunca por debajo de 1 si cabe a dpr 1).
- AC4: Dado `DprController` con un tamaño CSS que no cabe a dpr 1, entonces no llama a `onUnfit` (ni hay fallback a posters por ese motivo) y aplica el dpr reducido de AC3 vía `onDpr`.
- AC5: `npm run check:buffer` refleja el nuevo contrato (AC3–AC4) y pasa; el resto de checks y tests existentes siguen pasando.

## No-objetivos
- Suelo mínimo de dpr o calidad para viewports enormes con maxDim pequeño.
- Cambiar tamaño, posición o escala del alien o la luna, o el plano de estrellas.
- Cambiar OUTLINE_MAX_TEXELS o la lógica de resolución de la máscara.
- Detectar LibreWolf / resistFingerprinting o avisar al usuario.
- Nuevos posters o cambios en el fallback por falta de WebGL2, pérdida de contexto o errores de shader.

## Restricciones
- Archivos: `src/three/PageCanvas.jsx`, `src/three/OutlineLayer.jsx` (solo si hace falta para AC2), `src/three/DprController.jsx`, `src/three/bufferLimits.js`, `scripts/check-buffer-limits.mjs`.
- `bufferLimits.js` sigue sin dependencias de three/React (lo carga Node).
- Cambios visuales: los revisa el usuario a mano; sin checklist de navegador.

## Preguntas abiertas
