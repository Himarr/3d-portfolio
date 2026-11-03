# Plan: Escena 3D en viewports grandes
Nivel: M
Interfaces nuevas o modificadas: `src/three/camera.js`: `export const CAMERA = { position: [0, 0, 5000], near: 1, far: 8000, zoom: 1 }` (sin dependencias; PageCanvas lo importa y lo pasa a `<Canvas camera>`)
`computeDpr({ cssWidth, cssHeight, deviceDpr, maxDim, pixelBudget })` en bufferLimits.js: si el tamaño no cabe a dpr 1 devuelve dpr < 1 (maxDim/max(css) con el margen 1-1e-9, floor a 2 decimales); si cabe, igual que hoy (mín 1, máx 2, presupuesto)
`DprController({ maxDim, pixelBudget, onDpr })`: sin prop `onUnfit`; siempre llama a `onDpr(computeDpr(...))`
- [x] T1 — La cámara ortográfica (z 5000, far 8000) cubre estrellas y alien completos en 2K/4K y el outline sigue con la misma cámara | AC: 1, 2 | Archivos: src/three/camera.js, src/three/PageCanvas.jsx (OutlineLayer.jsx solo si hiciera falta: hoy ya copia near/far/z de la cámara principal) | Depende de: — | Complejidad: baja
- [ ] T2 — Con buffer limitado se renderiza a dpr reducido en vez de caer a posters; check:buffer actualizado | AC: 3, 4, 5 | Archivos: src/three/bufferLimits.js, src/three/DprController.jsx, src/three/PageCanvas.jsx (quitar `onUnfit={fail}`), scripts/check-buffer-limits.mjs | Depende de: — | Complejidad: normal

Notas para el Orchestrator:
- T1 y T2 tocan ambos PageCanvas.jsx (líneas distintas): NO lanzar en paralelo; ejecutar secuencialmente.
- Por T2: `Math.max(1, ...)` solo debe aplicarse cuando el tamaño cabe a dpr 1; si no cabe, el dpr es maxDim/max(css) (< 1). `fitsAtDprOne` puede quedarse en bufferLimits.js (no se testea) o borrarse si queda sin usos.
- check-buffer-limits.mjs: el check "DPR always within [1, DPR_MAX]" y "ceil(css*dpr) <= maxDim" ya saltan los tamaños que no caben; añadir un check cuyo nombre contenga "reduced DPR" (p. ej. 'oversize viewport gets reduced DPR below 1 that fits maxDim'), y el test AC5 exige esa línea `pass: ... reduced DPR ...` en la salida.
