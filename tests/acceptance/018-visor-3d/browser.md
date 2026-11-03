# Checklist de navegador: 018-visor-3d
- AC3,AC4 | /viewer?model=<id de Alien> | hay un <canvas>, el título del modelo visible, sin errores de consola.
- AC2,AC8 | /projects/3d-library | pulsar una tarjeta navega a /viewer?model=<id>; "Back to library" vuelve a /projects/3d-library; "3D Viewer" de la navbar (escritorio y móvil) lleva a /projects/3d-library.
- AC7 | /viewer?model=no-existe | mensaje de no encontrado y ningún <canvas>.
- AC4,AC5 | /viewer?model=<id> | arrastrar con el ratón y la rueda no producen errores de consola; al navegar a otra ruta no queda ningún <canvas> activo.
