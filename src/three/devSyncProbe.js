import { devStats } from './devStats.js'

// DEV-only sync probe for verification (AC-38). Enabled only when a browser
// check sets `window.__syncProbe = true`. It then logs, once per render tick,
// [moon centre y in viewport px, Hero centre y in viewport px, time ms] into
// `window.__syncLog`. The layout read (getBoundingClientRect) happens only in
// this verification mode, never in normal dev or production runs.
const MAX_LOG_ENTRIES = 5000

export function recordSync() {
  if (!import.meta.env.DEV) return
  if (window.__syncProbe !== true) return
  const hero = document.getElementById('hero')
  if (!hero) return
  if (!window.__syncLog) window.__syncLog = []
  const log = window.__syncLog
  if (log.length >= MAX_LOG_ENTRIES) return
  const rect = hero.getBoundingClientRect()
  log.push([devStats.moonCyViewport, rect.top + rect.height / 2, performance.now()])
}
