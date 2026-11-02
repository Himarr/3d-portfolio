# Plan: Cel shader rayado en sombra y granulado en brillos
Nivel: M
Interfaces nuevas o modificadas: src/three/celConstants.js exporta CEL_HATCH_ANGLE_DEG, CEL_HATCH_PERIOD_CSS_PX, CEL_HATCH_WIDTH, CEL_HATCH_MULTIPLIER, CEL_GRAIN_CELL_CSS_PX, CEL_GRAIN_DOT_RADIUS, CEL_GRAIN_STRENGTH (listadas en la cabecera "What to change to")
Interfaces nuevas o modificadas: uniforms float en CEL_UNIFORMS y GLSL: uCelHatchAngle (radianes), uCelHatchPeriod (CSS px), uCelHatchWidth, uCelHatchMult, uCelGrainCell (CSS px), uCelGrainRadius, uCelGrainStrength, uCelDpr
Interfaces nuevas o modificadas: src/three/toonMaterial.js `export function setCelDpr(dpr: number): void` (escribe CEL_UNIFORMS.uCelDpr.value); OutlineLayer.jsx lo llama con el dpr de useThree (solo al cambiar)
Interfaces nuevas o modificadas: GLSL en celShade: sombra 2 = base * uCelShadow2 * mix(1.0, uCelHatchMult, mascaraRaya) con gl_FragCoord y periodo * uCelDpr; tras la banda lit, mezcla hacia uCelSpotColor con Voronoi 3x3 (for int -1..1) escalada por uCelGrainStrength
- [ ] T1 — El cel shader pinta rayas diagonales fijas a pantalla en sombra 2 y granulado Voronoi en lit/spot, neutro con mult=1 y strength=0 | AC: 1,2,3,4,5,6 | Archivos: src/three/celConstants.js, src/three/toonMaterial.js, src/three/OutlineLayer.jsx | Depende de: — | Complejidad: normal
