import path from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
export const exists = (rel) => existsSync(path.join(root, rel))
export const read = (rel) => (exists(rel) ? readFileSync(path.join(root, rel), 'utf8') : '')
