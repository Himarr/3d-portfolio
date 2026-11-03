// Helper (no es un test): lee fuentes y renderiza AboutMe a HTML estático con Vite SSR.
import path from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
export const read = (rel) => readFileSync(path.join(root, rel), 'utf8')
export const exists = (rel) => existsSync(path.join(root, rel))
export const PORTRAIT = 'src/three/SelfPortrait.jsx'

let server
export async function renderAbout() {
  server ??= await createServer({
    root,
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'silent',
  })
  const AboutMe = (await server.ssrLoadModule('/src/components/sections/AboutMe.jsx')).default
  return renderToStaticMarkup(createElement(AboutMe))
}
export async function close() {
  await server?.close()
  server = undefined
}
