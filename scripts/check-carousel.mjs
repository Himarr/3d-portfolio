// Node checks for the pure carousel libs: npm run check:carousel
import assert from 'node:assert/strict'
import * as cfg from '../src/lib/carouselConfig.js'
import {
  poolSize,
  wrapSigned,
  slotRel,
  slotStyle,
  activeSlot,
  activeProject,
  shortestDelta,
  goTarget,
  autoplayAllowed,
  liveModeFor,
  classifyCarouselWheel,
  classifySwipe,
} from '../src/lib/carouselLogic.js'
import { computeCarouselGeometry } from '../src/lib/carouselGeometry.js'
import { SECTION_SAFE_BAND_PX, safeBandStyle } from '../src/lib/sectionLayout.js'
import { CONTACT_MESSAGE_MAX_LENGTH, CONTACT_MESSAGE_ROWS } from '../src/lib/contactConfig.js'
import { fieldMessage } from '../src/lib/contactValidation.js'
import {
  validateImage,
  validateProjects,
  validateTechStack,
  validateSocialLinks,
  checkProvenanceComments,
} from '../src/lib/dataValidation.js'
import { loadDataModule } from './lib/loadDataModule.mjs'

function test(name, fn) {
  fn()
  console.log(`pass ${name}`)
}
const r9 = (x) => Math.round(x * 1e9) / 1e9

test('config sanity', () => {
  assert.equal(cfg.CAROUSEL_AUTOPLAY_MS, 5000)
  assert.equal(cfg.CAROUSEL_SIDE_OPACITY, 0.4)
  assert.equal(cfg.CAROUSEL_SIDE_SCALE, 0.88)
})

test('poolSize n = 0..12', () => {
  const expected = [0, 1, 4, 6, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  for (let n = 0; n <= 12; n++) {
    assert.equal(poolSize(n), expected[n], `n=${n}`)
    if (n >= 2) assert.ok(poolSize(n) / 2 >= 2, `pool/2 n=${n}`)
    if (n >= 1) assert.equal(poolSize(n) % n, 0)
  }
})

test('wrapSigned range and tie', () => {
  assert.equal(wrapSigned(2, 4), 2)
  assert.equal(wrapSigned(-2, 4), 2)
  assert.equal(wrapSigned(3, 4), -1)
  assert.equal(wrapSigned(-3, 4), 1)
  assert.equal(wrapSigned(4, 4), 0)
})

test('slot invariants over a pos sweep', () => {
  for (const n of [1, 2, 3, 4, 5, 10, 11]) {
    const pool = poolSize(n)
    for (let k = 0; k <= (2 * pool) / 0.05; k++) {
      const pos = k * 0.05
      const rels = []
      for (let s = 0; s < pool; s++) rels.push(r9(slotRel(s, pos, pool)))
      const near = rels.filter((r) => r > -0.5 && r <= 0.5)
      assert.equal(near.length, 1, `n=${n} pos=${pos} near`)
      assert.equal(new Set(rels).size, pool, `n=${n} pos=${pos} unique`)
      for (const rel of rels) {
        const st = slotStyle(rel)
        if (Math.abs(rel) >= 2) {
          assert.equal(st.opacity, 0)
          assert.equal(st.visible, false)
        }
      }
      if (Number.isInteger(r9(pos)) && n >= 2) {
        assert.ok(rels.includes(-1) && rels.includes(1), `n=${n} pos=${pos} neighbours`)
      }
    }
    assert.equal(slotStyle(1).opacity, 0.4)
    assert.equal(slotStyle(-1).opacity, 0.4)
  }
})

test('slotStyle values', () => {
  assert.deepEqual(slotStyle(0), { x: 0, scale: 1, opacity: 1, visible: true })
  assert.equal(slotStyle(1).scale, 0.88)
  assert.equal(slotStyle(-1).x, -1)
  assert.equal(slotStyle(2).opacity, 0)
  assert.equal(slotStyle(2.5).visible, false)
  assert.equal(slotStyle(1.5).opacity, 0.2)
})

test('loop simulation', () => {
  for (const n of [2, 3, 5, 10]) {
    let t = 0
    for (let i = 0; i < 3 * n; i++) t = goTarget(t, 'next', n)
    assert.equal(activeProject(t, n), 0)
    assert.equal(activeProject(goTarget(0, 'prev', n), n), n - 1)
    let rapid = 0
    for (let i = 0; i < 7; i++) rapid = goTarget(rapid, 'next', n)
    assert.equal(rapid, 7)
    assert.equal(activeSlot(rapid, poolSize(n)), 7 % poolSize(n))
  }
  assert.equal(goTarget(0, { type: 'project', index: 4 }, 5), -1)
})

test('shortestDelta table', () => {
  const cases = [
    [0, 1, 5, 1], [0, 4, 5, -1], [0, 2, 5, 2], [0, 3, 5, -2],
    [0, 2, 4, 2], [2, 0, 4, 2], [0, 3, 4, -1], [1, 1, 4, 0],
    [0, 1, 2, 1], [1, 0, 2, 1], [0, 0, 1, 0], [0, 5, 10, 5],
  ]
  for (const [f, t, n, d] of cases) assert.equal(shortestDelta(f, t, n), d, `${f}->${t} n=${n}`)
})

test('autoplayAllowed truth table', () => {
  const open = { n: 3, reducedMotion: false, hover: false, focusWithin: false, documentHidden: false, visible: true }
  assert.equal(autoplayAllowed(open), true)
  for (const patch of [
    { n: 1 }, { n: 0 }, { reducedMotion: true }, { hover: true },
    { focusWithin: true }, { documentHidden: true }, { visible: false },
  ]) {
    assert.equal(autoplayAllowed({ ...open, ...patch }), false, JSON.stringify(patch))
  }
})

test('liveModeFor table', () => {
  assert.equal(liveModeFor({ autoplayRunning: true, lastChangeManual: false }), 'off')
  assert.equal(liveModeFor({ autoplayRunning: true, lastChangeManual: true }), 'polite')
  assert.equal(liveModeFor({ autoplayRunning: false, lastChangeManual: false }), 'polite')
  assert.equal(liveModeFor({ autoplayRunning: false, lastChangeManual: true }), 'polite')
})

// ---- Geometry (plan D-E, D-22) ----
const near = (a, b, msg) => assert.ok(Math.abs(a - b) <= 1, `${msg}: ${a} vs ${b}`)
const geo = (w, h, snapOn = true) => computeCarouselGeometry({ regionWidth: w, viewportHeight: h, snapOn, rootPx: 16 })

test('geometry D-E table', () => {
  // [w, h, cardW, peek, gap]
  const rows = [
    [1920, 1080, 1024, 410, 38],
    [1920, 700, 416, 366.1, 385.9],
    [1440, 900, 736, 294, 58],
    [1366, 768, 524, 357, 64],
    [1280, 720, 448, 352, 64],
    [1024, 768, 524, 210, 40],
    [1024, 700, 416, 240, 64],
  ]
  for (const [w, h, cardW, peek, gap] of rows) {
    const g = geo(w, h)
    near(g.cardW, cardW, `${w}x${h} cardW`)
    near(g.peek, peek, `${w}x${h} peek`)
    near(g.gap, gap, `${w}x${h} gap`)
    near(g.step, ((1 + 0.88) / 2) * g.cardW + g.gap, `${w}x${h} step`)
    assert.ok(g.cardW >= 400, `${w}x${h} centre >= 400`)
  }
  assert.ok(geo(1920, 1080).cardW >= 700)
  assert.ok(geo(1440, 900).cardW >= 700)
})

test('geometry below snap', () => {
  const a = geo(375, 812, false)
  assert.equal(a.cardW, 303)
  assert.equal(a.gap, 12)
  assert.equal(a.peek, 24)
  assert.equal(geo(320, 568, false).cardW, 248)
  assert.equal(geo(1440, 650, false).gap, 64)
})

test('geometry sweep snap', () => {
  for (let w = 1024; w <= 2560; w += 16) {
    for (let h = 700; h <= 1080; h += 10) {
      const g = geo(w, h)
      const sideW = 0.88 * g.cardW
      const tag = `${w}x${h}`
      assert.ok(g.peek >= 0.15 * g.cardW, `${tag} peek floor`)
      assert.ok(g.peek <= sideW + 1e-9, `${tag} peek <= sideW`)
      if (Math.abs(g.peek - sideW) > 1e-9) assert.ok(g.gap <= 64 + 1e-9, `${tag} gap max`)
      assert.ok(g.gap >= 24 - 1e-9, `${tag} gap min`)
      const imgH = g.cardW / cfg.CAROUSEL_IMAGE_ASPECT
      assert.ok(296 + imgH + 144 <= h + 1e-9, `${tag} fits height`)
    }
  }
})

test('geometry sweep below snap', () => {
  for (let w = 320; w <= 1919; w++) {
    const g = geo(w, 800, false)
    assert.ok(g.cardW > 0, `w=${w} cardW`)
    assert.ok(g.peek >= 12, `w=${w} peek`)
  }
})

// ---- Wheel and swipe classifiers (plan D-C) ----
test('wheel classifier', () => {
  const base = { deltaX: 0, deltaY: 0, ctrlKey: false, deltaMode: 0, now: 0, lastEventAt: -Infinity, moving: false, innerWidth: 1000 }
  const run = (events) => {
    let last = -Infinity
    return events.map((e) => {
      const res = classifyCarouselWheel({ ...base, ...e, lastEventAt: last })
      if (res !== 'pass') last = e.now
      return res
    })
  }
  // decaying 60-event horizontal stream over 1.5 s
  const stream = []
  for (let i = 0; i < 60; i++) stream.push({ deltaX: Math.max(1, Math.round(80 * Math.pow(0.9, i))), deltaY: 0, now: i * 25 })
  const res = run(stream)
  assert.equal(res.filter((x) => x.startsWith('slide')).length, 1)
  assert.equal(res[0], 'slide-next')
  assert.equal(res.filter((x) => x === 'consume').length, 59)
  // second gesture after 150 ms quiet
  const two = run([...stream, { deltaX: -80, deltaY: 0, now: 59 * 25 + 150 }])
  assert.equal(two.filter((x) => x.startsWith('slide')).length, 2)
  assert.equal(two[60], 'slide-prev')
  // vertical stream and exact diagonal
  assert.ok(run(stream.map((e) => ({ ...e, deltaX: 0, deltaY: 80 }))).every((x) => x === 'pass'))
  assert.ok(run(stream.map((e) => ({ ...e, deltaX: 50, deltaY: 50 }))).every((x) => x === 'pass'))
  // Ctrl
  assert.equal(classifyCarouselWheel({ ...base, deltaX: 100, ctrlKey: true }), 'pass')
  // lone small horizontal
  assert.equal(classifyCarouselWheel({ ...base, deltaX: 10 }), 'pass')
  // Shift+wheel style
  assert.equal(classifyCarouselWheel({ ...base, deltaX: 100, deltaY: 0 }), 'slide-next')
  // moving
  assert.equal(classifyCarouselWheel({ ...base, deltaX: 100, moving: true }), 'consume')
  assert.equal(classifyCarouselWheel({ ...base, deltaX: 100, deltaY: 200, moving: true }), 'pass')
  // delta modes
  assert.equal(classifyCarouselWheel({ ...base, deltaX: 2, deltaMode: 1 }), 'slide-next')
  assert.equal(classifyCarouselWheel({ ...base, deltaX: 1, deltaMode: 1 }), 'pass')
  assert.equal(classifyCarouselWheel({ ...base, deltaX: -0.1, deltaMode: 2 }), 'slide-prev')
  assert.equal(classifyCarouselWheel({ ...base, deltaX: 2, deltaY: 1, deltaMode: 1 }), 'slide-next')
})

test('swipe classifier', () => {
  assert.equal(classifySwipe({ dx: -40, dy: 0 }), 'next')
  assert.equal(classifySwipe({ dx: 40, dy: 0 }), 'prev')
  assert.equal(classifySwipe({ dx: -39, dy: 0 }), null)
  assert.equal(classifySwipe({ dx: -60, dy: 40 }), 'next')
  assert.equal(classifySwipe({ dx: 60, dy: -40 }), 'prev')
  assert.equal(classifySwipe({ dx: -60, dy: 41 }), null)
  assert.equal(classifySwipe({ dx: 10, dy: 100 }), null)
  assert.equal(classifySwipe({ dx: 0, dy: 0 }), null)
})

// ---- Section layout constants (spec 006 FR-30, NFR-8, AC-4) ----
test('section safe band constant', () => {
  assert.equal(SECTION_SAFE_BAND_PX, 72)
  assert.equal(safeBandStyle['--safe-band'], '72px')
  // carouselGeometry's default band is not exported, so compare behaviour: default call == explicit band.
  for (let h = 700; h <= 1080; h += 10) {
    const def = computeCarouselGeometry({ regionWidth: 1440, viewportHeight: h, snapOn: true, rootPx: 16 })
    const explicit = computeCarouselGeometry({
      regionWidth: 1440,
      viewportHeight: h,
      snapOn: true,
      rootPx: 16,
      bandPx: SECTION_SAFE_BAND_PX,
    })
    assert.deepEqual(def, explicit, `h=${h} default band`)
  }
})

// ---- Contact field messages (spec 006 FR-23, AC-22, plan D-K) ----
test('contact constants', () => {
  assert.equal(CONTACT_MESSAGE_MAX_LENGTH, 2000)
  assert.equal(CONTACT_MESSAGE_ROWS, 4)
})

test('contact fieldMessage table', () => {
  const ok = { valueMissing: false, typeMismatch: false, tooLong: false }
  const v = (patch) => ({ ...ok, ...patch })
  const msg = `Keep your message under ${CONTACT_MESSAGE_MAX_LENGTH} characters.`
  const cases = [
    // [field, validity, value, expected]
    ['name', v({}), 'Ada', null],
    ['name', v({ valueMissing: true }), '', 'Enter your name.'],
    ['name', v({}), '   ', 'Enter your name.'],
    ['name', v({}), ' \t\n ', 'Enter your name.'],
    ['email', v({}), 'a@b.co', null],
    ['email', v({ valueMissing: true }), '', 'Enter your email address.'],
    ['email', v({}), '  ', 'Enter your email address.'],
    ['email', v({ typeMismatch: true }), 'a@', 'Enter a valid email address.'],
    ['email', v({ typeMismatch: true }), 'a b', 'Enter a valid email address.'],
    ['message', v({}), 'Hello', null],
    ['message', v({ valueMissing: true }), '', 'Write a message.'],
    ['message', v({}), '   ', 'Write a message.'],
    ['message', v({ tooLong: true }), 'x'.repeat(CONTACT_MESSAGE_MAX_LENGTH + 1), msg],
    // missing wins over the other checks
    ['email', v({ valueMissing: true, typeMismatch: true }), '', 'Enter your email address.'],
    ['message', v({ valueMissing: true, tooLong: true }), '', 'Write a message.'],
  ]
  for (const [field, validity, value, expected] of cases) {
    assert.equal(fieldMessage(field, validity, value), expected, `${field} ${JSON.stringify(value)}`)
  }
  // a non-empty name never gets the length or type messages from a stray flag
  assert.equal(fieldMessage('name', v({ typeMismatch: true, tooLong: true }), 'Ada'), null)
})

const okImg = { src: 'a.png', alt: 'A', width: 10, height: 10 }
const okProject = (slug) => ({ slug, title: 'T', image: okImg })

test('data validators: valid data passes', () => {
  assert.deepEqual(validateImage(okImg), [])
  assert.deepEqual(validateProjects([okProject('a'), okProject('b-2')]), [])
  assert.deepEqual(validateProjects([{ slug: 'a', title: 'T' }]), [])
  const tech = [{ id: 'c', title: 'C', tools: [{ id: 'x', name: 'X', use: 'u' }, { id: 'y', name: 'Y' }] }]
  assert.deepEqual(validateTechStack(tech), [])
  assert.deepEqual(validateSocialLinks([{ id: 'g', label: 'G', url: 'https://g.io/' }]), [])
})

test('data validators: failing cases are reported', () => {
  const bad = [
    validateProjects([okProject('a'), okProject('a')]),
    validateProjects([okProject('Bad Slug')]),
    validateProjects([{ slug: 'a', title: '   ' }]),
    validateProjects([{ slug: 'a', title: 'T', image: { ...okImg, alt: '' } }]),
    validateProjects([{ slug: 'a', title: 'T', image: { src: 'a.png', width: 10, height: 10 } }]),
    validateProjects([{ slug: 'a', title: 'T', image: { ...okImg, width: 0 } }]),
    validateProjects([{ slug: 'a', title: 'T', image: { ...okImg, height: 1.5 } }]),
    validateTechStack([
      { id: 'c1', tools: [{ id: 'x', name: 'X' }] },
      { id: 'c2', tools: [{ id: 'x', name: 'Y' }] },
    ]),
    validateTechStack([{ id: 'c', tools: [{ id: 'x', name: '' }] }]),
    validateSocialLinks([{ label: 'G', url: 'http://g.io/' }]),
    validateSocialLinks([{ url: 'https://g.io/' }]),
    validateSocialLinks([{ label: ' ', url: 'https://g.io/' }]),
  ]
  bad.forEach((errs, i) => assert.ok(errs.length > 0, `case ${i} should report`))
})

test('provenance comment check', () => {
  const good = '// Provenance: own work\nimport a from "./a.svg";\n// Provenance: own\nimage: {'
  assert.deepEqual(checkProvenanceComments(good), [])
  assert.deepEqual(checkProvenanceComments('// image: not code\nconst a = 1'), [])
  assert.equal(checkProvenanceComments('import a from "./a.png";').length, 1)
  assert.equal(checkProvenanceComments('// Provenance: own\n\nicon: a,').length, 1)
  assert.equal(checkProvenanceComments('x\nimage: {').length, 1)
})

const loadData = (name) => loadDataModule(new URL(`../src/data/${name}.js`, import.meta.url))
const projectsMod = await loadData('projects')
const techMod = await loadData('techStack')
const socialMod = await loadData('socialLinks')

test('real data modules load and validate', () => {
  assert.deepEqual(validateProjects(projectsMod.projects), [])
  assert.deepEqual(validateTechStack(techMod.techStack), [])
  assert.deepEqual(validateSocialLinks(socialMod.socialLinks), [])
  assert.ok(socialMod.socialLinks.every((s) => s.icon.startsWith('stub:')))
})

test('getProjectBySlug', () => {
  const { getProjectBySlug } = projectsMod
  assert.equal(getProjectBySlug('project-one')?.slug, 'project-one')
  assert.equal(getProjectBySlug('Project-One'), undefined)
  assert.equal(getProjectBySlug('x'), undefined)
})
