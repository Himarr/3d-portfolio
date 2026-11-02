// Helper (no es un test): renderiza rutas de la app a HTML estático con Vite SSR.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
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

export async function loadProjects() {
  const s = await getServer()
  return (await s.ssrLoadModule('/src/data/projects.js')).projects
}

export async function renderRoute(url) {
  const s = await getServer()
  const { Routes, Route } = await import('react-router-dom')
  const { StaticRouter } = await import('react-router')
  const ProjectPage = (await s.ssrLoadModule('/src/pages/ProjectPage.jsx')).default
  const tree = createElement(
    StaticRouter,
    { location: url },
    createElement(
      Routes,
      null,
      createElement(Route, { path: '/projects/:slug', element: createElement(ProjectPage) }),
    ),
  )
  return renderToStaticMarkup(tree)
}

export async function close() {
  await server?.close()
  server = undefined
}
