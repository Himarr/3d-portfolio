# Checklist de navegador: 018-visor-3d
- AC3,AC4 | /viewer?model=<id de Alien> | hay un <canvas>, no se ve el título del modelo, sin errores de consola.
- AC3 | /viewer?model=<id> (escritorio y móvil) | el canvas ocupa el viewport menos la navbar y no hay scroll de página (document.documentElement.scrollHeight <= innerHeight). Nota: en el panel del navegador hacer window.dispatchEvent(new Event('resize')) antes de medir el canvas.
- AC8 | /viewer?model=<id> | "Back to library" visible sobre el canvas (dentro del área del visor) y al pulsarlo vuelve a /projects/3d-library.
- AC2,AC8 | /projects/3d-library | pulsar una tarjeta navega a /viewer?model=<id>; "3D Viewer" de la navbar (escritorio y móvil) lleva a /projects/3d-library.
- AC7 | /viewer?model=no-existe | mensaje de no encontrado y ningún <canvas>.
- AC4,AC5 | /viewer?model=<id> | arrastrar con el ratón y la rueda no producen errores de consola; al navegar a otra ruta no queda ningún <canvas> activo.
- AC9 | /viewer?model=<id de Supra MK3> | sin zonas completamente negras ni quemadas a blanco puro; Alien y Luna se ven como antes.
