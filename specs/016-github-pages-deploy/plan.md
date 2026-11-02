# Plan: GitHub Pages deploy
Nivel: M
Interfaces nuevas o modificadas: vite.config.js: `base: '/3d-portfolio/'`; src/main.jsx: `<BrowserRouter basename={import.meta.env.BASE_URL}>`; package.json scripts: `"postbuild": "node -e \"require('fs').copyFileSync('dist/index.html','dist/404.html')\""` (ESM: usar `import('node:fs')` si `require` no está disponible); .github/workflows/deploy.yml (push a main + workflow_dispatch, permisos pages/id-token write, npm ci, npm run build, upload-pages-artifact path dist, deploy-pages)
- [x] T1 — La app compila con base /3d-portfolio/, el router usa BASE_URL y el build genera dist/404.html igual que index.html | AC: 1, 2, 3 | Archivos: vite.config.js, src/main.jsx, package.json | Depende de: — | Complejidad: baja
- [x] T2 — Workflow de GitHub Actions que construye y publica dist en Pages en cada push a main | AC: 4 | Archivos: .github/workflows/deploy.yml | Depende de: — | Complejidad: baja
