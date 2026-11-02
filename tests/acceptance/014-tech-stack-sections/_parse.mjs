import { readFileSync } from 'node:fs'

// Lee los módulos de datos como texto (techStack.js importa .svg, no es importable en node).
const readRepo = (rel) => readFileSync(new URL(`../../../${rel}`, import.meta.url), 'utf8')

export const loadTechStackSource = () => readRepo('src/data/techStack.js')
export const readRepoFile = readRepo

// Parsea categorías y herramientas en orden de aparición. Las líneas de comentario se ignoran.
export function parseTechStack(src) {
  const code = src
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n')
  const imports = {}
  for (const m of code.matchAll(/import\s+(\w+)\s+from\s+"\.\.\/assets\/tech\/([^"]+)";/g)) {
    imports[m[1]] = m[2]
  }
  const categories = []
  const re = /title:\s*"([^"]+)"|\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)"([^}]*)\}/g
  for (const m of code.matchAll(re)) {
    if (m[1] !== undefined) {
      categories.push({ title: m[1], tools: [] })
      continue
    }
    const rest = m[4]
    const icon = /icon:\s*(\w+)/.exec(rest)
    const use = /use:\s*"([^"]*)"/.exec(rest)
    categories[categories.length - 1].tools.push({
      id: m[2],
      name: m[3],
      use: use ? use[1] : undefined,
      icon: icon ? imports[icon[1]] : undefined,
      tint: /tint:\s*true/.test(rest),
    })
  }
  return { categories, imports }
}
