# Plan: Hero alien
Nivel: M
Interfaces nuevas o modificadas: `src/three/alienPlacement.js` (puro, sin imports de three): `ALIEN_HEIGHT_PER_MOON_RADIUS = 0.9`, `ALIEN_FLOAT_AMPLITUDE` (relativa al radio), `ALIEN_FLOAT_PERIOD_S`, constante de z delante de la luna
`alienPlacement({ moonX, moonY, radius, introScale, viewportWidth, viewportHeight, timeS }, out) -> out {x, y, z, height}` (coordenadas canvas: 1 unidad = 1 px, +Y arriba, luna en z=0; ancho si viewportWidth >= HERO_WRAP_MIN_WIDTH_PX; y incluye la senoide de flotación; sin asignaciones)
`alienOffsetInRadii(wide, out) -> out {dx, dy}` (offset del centro del alien respecto al de la luna, en radios de luna, sin flotación; lo usan la escena y el póster)
`Alien({ rigRef })` en `src/three/Alien.jsx`: `<group ref={rigRef}><FitToUnit><Model url={alienUrl} toon outline/></FitToUnit></group>`, sin spin
- [x] T1 — Alien vivo delante de la luna con textura, toon, contorno único, colocado, flotación e inclinación | AC: 1, 2, 3, 4, 5, 7 | Archivos: src/three/alienPlacement.js, src/three/Alien.jsx, src/three/PageScene.jsx, src/three/OutlineLayer.jsx | Depende de: — | Complejidad: normal
- [ ] T2 — Póster estático del alien en fallback con la misma posición relativa que en vivo, y captura por PosterCapture | AC: 6 | Archivos: src/components/sections/Hero.jsx, src/three/PosterCapture.jsx, src/assets/hero-alien-poster.png (placeholder PNG válido transparente; lo sustituye la captura) | Depende de: T1 | Complejidad: normal

Notas:
- T1: el mismo OutlineLayer y render target cubren a la luna y al alien (ampliar la región/anchor, sin segundo OutlineLayer). Inclinación del alien con rigRef y el mismo POINTER_MAX/suavizado; sin trabajo por frame si el hero no está a la vista.
- T2: Hero coloca el póster del alien con `alienOffsetInRadii`, comentario de procedencia (`/?capture-poster=alien`). La captura real del PNG la hace el agente browser/autor (ver browser.md); no es una tarea de builder.
- Comando por tarea: `node --test "tests/acceptance/008-hero-alien/**/*.test.*"` (T1: ac1-ac5; T2: ac6). Al final: suite completa `node --test "tests/**/*.test.*"`, `npm run check:buffer|check:cel|check:snap|check:moon|check:carousel|check:contrast`, `npm run lint`, `npm run build`.
