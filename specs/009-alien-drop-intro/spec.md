# Intro del hero: el alien cae desde arriba
Nivel: S

## Objetivo
En la intro del hero el alien ya no crece con la luna. Espera fuera de pantalla por arriba y, cuando termina el crecimiento de la luna, cae hasta su posición. Después empieza la animación del texto.

## Criterios de aceptación
- AC1: Dada la intro en marcha, mientras crece la luna, entonces el alien no sigue `moonIntro.scale`: su tamaño es siempre el final (`ALIEN_HEIGHT_PER_MOON_RADIUS` × radio final de la luna) y está fuera del viewport por arriba.
- AC2: Dada la timeline de la intro, cuando termina el tween de la luna, entonces empieza un tween de caída del alien (`ALIEN_DROP_DURATION_S`, `ALIEN_DROP_EASE`, constantes calibrables a ojo con valores iniciales 1 s y `back.out(1.4)`) que lo lleva desde encima del viewport hasta su posición de reposo. La etiqueta `text` (eyebrow, titular, intro y flecha) empieza al terminar la caída, no antes.
- AC3: Dada la caída terminada, o sin intro (reduced-motion, intro ya jugada, fallback), entonces el alien está en la misma posición que hoy, con su flotación y su inclinación por el puntero. El póster del alien, si se ve durante la intro, tampoco crece con la luna y cae igual que el alien en vivo.

## No-objetivos
- Cambios en la animación de la luna, en su duración o en la del texto (solo se retrasa su inicio).
- Cambios en la posición final, el tamaño, la flotación o el contorno del alien.
- Rebote o efectos al aterrizar más allá del ease.

## Restricciones
- Archivos previstos: `src/three/alienPlacement.js` (constantes y desplazamiento de caída), `src/lib/moonIntro.js` o un singleton equivalente para el progreso de la caída, `src/three/PageScene.jsx` y `src/components/sections/Hero.jsx`.
- Un solo tween hace de reloj para el alien en vivo y su póster, como ya pasa con la luna. Sin leer el layout ni crear objetos por frame.

## Preguntas abiertas
- (vacío)
