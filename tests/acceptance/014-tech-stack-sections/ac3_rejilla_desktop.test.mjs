import test from 'node:test'
import assert from 'node:assert/strict'
import { readRepoFile } from './_parse.mjs'

const jsx = readRepoFile('src/components/sections/TechStack.jsx')
const grid = /className="([^"]*\bgap-x-8\b[^"]*)"/.exec(jsx)?.[1] ?? ''
const tokens = grid.split(/\s+/).filter(Boolean)
const colTokens = tokens.filter((t) => t.includes('grid-cols-')).sort()

test('AC3: rejilla de categorías sin md:grid-cols-3', () => {
  assert.ok(grid, 'no se encuentra la rejilla de categorías (gap-x-8)')
  assert.ok(!tokens.includes('md:grid-cols-3'), 'sigue en md:grid-cols-3')
})

test('AC3: 2 columnas en md y 4 en lg, sin columnas base (móvil apilado)', () => {
  assert.deepEqual(colTokens, ['lg:grid-cols-4', 'md:grid-cols-2'])
})
