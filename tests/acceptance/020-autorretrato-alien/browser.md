# Browser checklist: 020-autorretrato-alien
- AC1/AC2: ruta `/`, viewport 1280x800, scroll a #about: el marco 4:5 contiene un `<canvas>` con tamaño igual al del marco (no 300x150) y sin errores en consola de WebGL/shader/outline (si el canvas queda 300x150, disparar resize: es el throttle del panel, no un bug).
- AC4: ruta `/`, viewport 1280x800: en la carga inicial el hero aparece y la sección About mantiene la altura del marco antes y después de montar el canvas (sin salto de layout).
