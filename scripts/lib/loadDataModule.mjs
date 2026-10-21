// Loads a src/data module in Node by stubbing asset imports (svg, png, jpg, jpeg, webp).
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ASSET_IMPORT_RE = /import\s+(\w+)\s+from\s+(['"])([^'"]+\.(?:svg|png|jpg|jpeg|webp))\2\s*;?/g

export function stubAssetImports(source) {
  return source.replace(ASSET_IMPORT_RE, (_m, name, _q, file) => {
    return `const ${name} = ${JSON.stringify(`stub:${path.basename(file)}`)};`
  })
}

export async function loadDataModule(filePath) {
  const source = await readFile(filePath, 'utf8')
  const rewritten = stubAssetImports(source)
  const url = 'data:text/javascript;base64,' + Buffer.from(rewritten).toString('base64')
  return import(url)
}
