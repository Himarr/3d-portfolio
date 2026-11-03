// Helper (no es un test): renderiza rutas a HTML estático con Vite SSR y lee datos/fuentes.
import path from 'node:path'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
let server

async function getServer() {
  server ??= await createServer({
    root,
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'silent',
  })
  return server
}

export async function loadLibrary() {
  const s = await getServer()
  const { projects } = await s.ssrLoadModule('/src/data/projects.js')
  return projects.find((p) => p.slug === '3d-library')
}

export async function renderRoute(url) {
  const s = await getServer()
  const { Routes, Route } = await import('react-router-dom')
  const { StaticRouter } = await import('react-router')
  const ProjectPage = (await s.ssrLoadModule('/src/pages/ProjectPage.jsx')).default
  const ViewerPage = (await s.ssrLoadModule('/src/pages/ViewerPage.jsx')).default
  const tree = createElement(
    StaticRouter,
    { location: url },
    createElement(
      Routes,
      null,
      createElement(Route, { path: '/projects/:slug', element: createElement(ProjectPage) }),
      createElement(Route, { path: '/viewer', element: createElement(ViewerPage) }),
    ),
  )
  return renderToStaticMarkup(tree)
}

export function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8')
}

// Código fuente del visor: la página y cualquier src/three/Viewer*.jsx.
export function viewerSource() {
  const three = readdirSync(path.join(root, 'src/three')).filter((f) => /^Viewer.*\.jsx$/.test(f))
  return ['src/pages/ViewerPage.jsx', ...three.map((f) => `src/three/${f}`)].map(read).join('\n')
}

export async function close() {
  await server?.close()
  server = undefined
}
