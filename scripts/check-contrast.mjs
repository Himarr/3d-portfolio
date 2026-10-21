// WCAG 2.x contrast check for the colour tokens in src/index.css.
// Usage: node scripts/check-contrast.mjs [path-to-css]   (defaults to src/index.css)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// T-26 adds --color-error to index.css and flips this flag to true.
// While false and the token is absent, the error section prints PENDING and the script continues.
const REQUIRE_ERROR_TOKEN = true

const cssPath = process.argv[2] ?? fileURLToPath(new URL('../src/index.css', import.meta.url))
const css = readFileSync(cssPath, 'utf8')

const themeMatch = css.match(/@theme[^{]*\{([\s\S]*?)\n\}/)
const themeBody = themeMatch ? themeMatch[1] : css
const tokens = {}
for (const m of themeBody.matchAll(/--color-([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  tokens[m[1]] = m[2].toLowerCase()
}

const EXISTING = ['ink', 'surface', 'line', 'text', 'muted', 'accent', 'rim', 'focus']

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

let failed = false
const fail = (msg) => {
  failed = true
  console.log(`FAIL: ${msg}`)
}
const pair = (fg, bg, min) => {
  const r = ratio(tokens[fg], tokens[bg])
  const ok = r >= min
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${fg} (${tokens[fg]}) on ${bg} (${tokens[bg]}): ${r.toFixed(2)} (min ${min})`)
  if (!ok) failed = true
}

const missing = EXISTING.filter((n) => !(n in tokens))
if (missing.length) fail(`missing tokens: ${missing.join(', ')}`)
else console.log(`PASS  existing tokens present: ${EXISTING.join(', ')}`)

if (!missing.length) {
  for (const fg of ['muted', 'text']) for (const bg of ['ink', 'surface']) pair(fg, bg, 4.5)
  pair('focus', 'ink', 3)
}

if (!('error' in tokens) && !REQUIRE_ERROR_TOKEN) {
  console.log('PENDING: --color-error not defined yet')
} else if (!('error' in tokens)) {
  fail('--color-error is required but not defined')
} else if (!missing.length) {
  for (const bg of ['ink', 'surface']) {
    pair('error', bg, 4.5)
    pair('error', bg, 3)
  }
  const expected = [...EXISTING, 'error'].sort().join(',')
  const actual = Object.keys(tokens).sort().join(',')
  if (expected !== actual) fail(`token set is ${actual}, expected ${expected}`)
  else console.log('PASS  token set is the eight existing plus error')
}

process.exit(failed ? 1 : 0)
