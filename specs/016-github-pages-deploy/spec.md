# GitHub Pages deploy
Nivel: M

## Objetivo
Que la web se publique automáticamente en https://himarr.github.io/3d-portfolio/ en cada push a `main`, con assets, rutas de proyecto y recargas en rutas profundas funcionando bajo el subpath `/3d-portfolio/`.

## Criterios de aceptación
- AC1: Dado `npm run build`, entonces `dist/index.html` referencia sus scripts y estilos bajo `/3d-portfolio/assets/` (Vite `base: '/3d-portfolio/'`).
- AC2: Dado `src/main.jsx`, entonces `BrowserRouter` recibe `basename={import.meta.env.BASE_URL}`, de modo que `Link`/`NavLink` y las rutas `/projects/:slug` resuelven bajo `/3d-portfolio/`.
- AC3: Dado `npm run build`, entonces existe `dist/404.html` con el mismo contenido que `dist/index.html` (fallback SPA para entradas directas o recargas en rutas profundas en Pages). Se genera con un script `postbuild` en package.json, sin dependencias nuevas.
- AC4: Existe `.github/workflows/deploy.yml` que: se dispara en `push` a `main` y con `workflow_dispatch`; tiene permisos `pages: write` e `id-token: write`; ejecuta `npm ci` y `npm run build`; sube `dist` con `actions/upload-pages-artifact` y publica con `actions/deploy-pages`.

## No-objetivos
- Dominio propio / archivo `CNAME`.
- Cambiar a `HashRouter` o reescribir rutas/componentes.
- Ejecutar lint o tests en el workflow.
- Hacer push, activar Pages en GitHub (Settings → Pages → Source: GitHub Actions) o comprobar el deploy real: lo hace el usuario.

## Restricciones
- Archivos: `vite.config.js`, `src/main.jsx`, `package.json` (solo `scripts`), `.github/workflows/deploy.yml`.
- El script `postbuild` debe funcionar en Windows y en Linux (usar `node -e` con `fs.copyFileSync`, no `cp`).
- Node del workflow: versión LTS compatible con Vite 8 (≥ 20.19).
- Consecuencia aceptada: el dev server y `vite preview` pasan a servir en `/3d-portfolio/` (p. ej. `localhost:5173/3d-portfolio/`).

## Preguntas abiertas
