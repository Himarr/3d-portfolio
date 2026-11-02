# Checklist de navegador: 007-cel-shader-rayado-grano

- AC2 | ruta `/` | 1440x900: en el lado en sombra del modelo (sombra 2) se ven rayas diagonales oscuras paralelas, con el mismo angulo en todo el modelo (no siguen la curvatura de la malla).
- AC2 | ruta `/` | 1440x900: la banda sombra 1 queda limpia, sin rayas.
- AC3 | ruta `/` | 1440x900: en la zona iluminada y el foco hay puntos claros finos y dispersos (aspecto Voronoi); las sombras no tienen puntos.
- AC4 | ruta `/` | 1440x900: con CEL_HATCH_MULTIPLIER=1 y CEL_GRAIN_STRENGTH=0 (cambio temporal via builder) el render es identico al anterior, sin rayas ni puntos.
- AC5 | ruta `/` | 1440x900: esperar 3 s y hacer scroll sin mover el modelo; el patron no cambia ni parpadea y sus bordes siguen el suavizado de las bandas.
- AC2/AC3 | ruta `/` | 390x844 con DPR 2: periodo de rayas y tamano de celda mantienen el mismo aspecto en pixeles CSS que en escritorio.
- AC6 | ruta `/` | cualquier viewport: consola sin errores ni avisos de compilacion de shader.
