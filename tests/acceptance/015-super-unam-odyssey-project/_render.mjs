// Helper (no es un test): carga los datos de la app con Vite SSR.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

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

export async function close() {
  await server?.close()
  server = undefined
}
