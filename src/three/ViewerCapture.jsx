// Dev-only: composes ink background + star canvas + viewer canvas and downloads a webp.
const TARGETS = [
  { label: 'Download poster', w: 1600, h: 1200, name: (id) => `${id}-poster.webp` },
  { label: 'Download cover', w: 2000, h: 1250, name: () => '3d-library-cover.webp' },
]

// Source rect that crops src "cover" style to the w:h aspect.
function coverRect(src, w, h) {
  const scale = Math.max(w / src.width, h / src.height)
  const sw = w / scale
  const sh = h / scale
  return [(src.width - sw) / 2, (src.height - sh) / 2, sw, sh]
}

function capture({ w, h, name }, modelId) {
  const canvases = [...document.querySelectorAll('canvas')]
  const stars = canvases.find((c) => c.closest('[aria-hidden="true"]'))
  const viewer = canvases.find((c) => !c.closest('[aria-hidden="true"]'))
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--color-ink')
  ctx.fillStyle = ink.trim() || '#05070d'
  ctx.fillRect(0, 0, w, h)
  if (stars) ctx.drawImage(stars, ...coverRect(stars, w, h), 0, 0, w, h)
  if (viewer) ctx.drawImage(viewer, ...coverRect(viewer, w, h), 0, 0, w, h)
  out.toBlob(
    (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name(modelId)
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    },
    'image/webp',
    0.9,
  )
}

export default function ViewerCapture({ modelId }) {
  return TARGETS.map((t) => (
    <button
      key={t.label}
      type="button"
      onClick={() => capture(t, modelId)}
      className="min-h-11 bg-ink/70 px-3 text-sm uppercase tracking-widest text-muted hover:text-text"
    >
      {t.label}
    </button>
  ))
}
