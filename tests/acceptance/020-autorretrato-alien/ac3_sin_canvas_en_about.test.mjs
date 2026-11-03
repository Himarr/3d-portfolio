import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const read = (rel) => (existsSync(path.join(root, rel)) ? readFileSync(path.join(root, rel), 'utf8') : '')

const section = () => read('src/components/sections/AboutMe.jsx')
const about = () => read('src/data/about.js')

test('AC3: About Me no monta ningún <Canvas>', () => {
  assert.doesNotMatch(section(), /<Canvas\b/)
})

test('AC3: About Me no importa three ni R3F', () => {
  assert.doesNotMatch(section(), /from\s+["'](three|@react-three\/[^"']*)["']/)
  assert.doesNotMatch(about(), /from\s+["'](three|@react-three\/[^"']*)["']/)
})
