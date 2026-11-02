# Checklist de navegador: 008-hero-alien
Solo lo que no se puede comprobar en Node. El aspecto (altura, flotación, contorno) lo revisa el autor a ojo.

- [ ] Captura | dev | abrir `/?capture-poster=alien`, generar `src/assets/hero-alien-poster.png` (sustituye al placeholder): alien con contorno sobre fondo transparente.
- [ ] AC1 | 1440x900 | el alien se ve con texturas propias (cara y ropa), cel shader y contorno exterior e interior como la luna.
- [ ] AC2 | 1440x900 | alien a la derecha de la luna, solapado y delante, entero en pantalla en el primer frame.
- [ ] AC3 | 390x844 | alien debajo de la luna, solapando su parte baja y delante, sin salirse por los lados.
- [ ] AC6 | 1440x900 y 390x844, reduced-motion emulado | el póster del alien aparece en la misma posición relativa a la luna que en vivo.
