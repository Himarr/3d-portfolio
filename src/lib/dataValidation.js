// Pure validators for the 006 data modules (FR-1, FR-20, AC-2, AC-20, AC-31).
// Each validate function returns string[]; an empty array means valid.
// Imports nothing so Node scripts can load it directly.

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ASSET_IMPORT_RE = /\bimport\b.*\.(?:svg|png|jpg|jpeg|webp)['"`]/i

const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== ''
const isPositiveInt = (v) => Number.isInteger(v) && v > 0

export function validateImage(img, label = 'image') {
  const errors = []
  if (img === null || typeof img !== 'object') return [`${label}: must be an object`]
  if (!isNonEmptyString(img.src)) errors.push(`${label}: src must be a non-empty string`)
  if (!isNonEmptyString(img.alt)) errors.push(`${label}: alt must be a non-empty string`)
  if (!isPositiveInt(img.width)) errors.push(`${label}: width must be a positive integer`)
  if (!isPositiveInt(img.height)) errors.push(`${label}: height must be a positive integer`)
  return errors
}

export function validateProjects(list) {
  if (!Array.isArray(list)) return ['projects: must be an array']
  const errors = []
  const seen = new Set()
  list.forEach((p, i) => {
    const label = `projects[${i}]`
    if (p === null || typeof p !== 'object') {
      errors.push(`${label}: must be an object`)
      return
    }
    if (typeof p.slug !== 'string' || !SLUG_RE.test(p.slug)) {
      errors.push(`${label}: bad slug ${JSON.stringify(p.slug)}`)
    } else if (seen.has(p.slug)) {
      errors.push(`${label}: duplicate slug ${JSON.stringify(p.slug)}`)
    } else {
      seen.add(p.slug)
    }
    if (!isNonEmptyString(p.title)) errors.push(`${label}: title must be non-empty`)
    if (p.image !== undefined && p.image !== null) {
      errors.push(...validateImage(p.image, `${label}.image`))
    }
  })
  return errors
}

export function validateTechStack(list) {
  if (!Array.isArray(list)) return ['techStack: must be an array']
  const errors = []
  const seen = new Set()
  list.forEach((cat, i) => {
    const tools = cat && cat.tools
    if (!Array.isArray(tools)) {
      errors.push(`techStack[${i}]: tools must be an array`)
      return
    }
    tools.forEach((t, j) => {
      const label = `techStack[${i}].tools[${j}]`
      if (t === null || typeof t !== 'object') {
        errors.push(`${label}: must be an object`)
        return
      }
      if (!isNonEmptyString(t.id)) {
        errors.push(`${label}: id must be non-empty`)
      } else if (seen.has(t.id)) {
        errors.push(`${label}: duplicate tool id ${JSON.stringify(t.id)}`)
      } else {
        seen.add(t.id)
      }
      if (!isNonEmptyString(t.name)) errors.push(`${label}: name must be non-empty`)
      if (t.use !== undefined && typeof t.use !== 'string') {
        errors.push(`${label}: use must be a string`)
      }
    })
  })
  return errors
}

export function validateSocialLinks(list) {
  if (!Array.isArray(list)) return ['socialLinks: must be an array']
  const errors = []
  list.forEach((s, i) => {
    const label = `socialLinks[${i}]`
    if (s === null || typeof s !== 'object') {
      errors.push(`${label}: must be an object`)
      return
    }
    if (typeof s.url !== 'string' || !s.url.startsWith('https://')) {
      errors.push(`${label}: url must start with https://`)
    }
    if (!isNonEmptyString(s.label)) errors.push(`${label}: label must be non-empty`)
  })
  return errors
}

// Every non-comment line with `image:`, `icon:` or an asset import needs a
// line matching /provenance/i directly above it.
export function checkProvenanceComments(sourceText) {
  const errors = []
  const lines = String(sourceText).split(/\r?\n/)
  lines.forEach((line, i) => {
    const t = line.trim()
    if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) return
    if (!/\b(?:image|icon):/.test(t) && !ASSET_IMPORT_RE.test(t)) return
    const above = i > 0 ? lines[i - 1] : ''
    if (!/provenance/i.test(above)) {
      errors.push(`line ${i + 1}: missing provenance comment above ${JSON.stringify(t)}`)
    }
  })
  return errors
}
