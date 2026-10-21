import assert from 'node:assert/strict';
import * as C from '../src/lib/moonConfig.js';
import {
  moonFinalRadiusPx,
  moonPosterSidePx,
  moonColumnRadiusPx,
  setHeroColumnInputs,
  setViewport,
  getMoonRadius,
  subscribeMoonRadius,
} from '../src/lib/moonSize.js';
import { wrapGeometry } from '../src/lib/heroWrap.js';
import { SECTION_ARROW_OFFSET_PX, SECTION_ARROW_SIZE_PX } from '../src/lib/arrowConfig.js';
import { MOON_RADIUS_PER_HERO_HEIGHT } from '../src/three/moonFraming.js';

let passes = 0;
function check(name, fn) {
  fn();
  passes += 1;
  console.log(`pass: ${name}`);
}

const plainRadius = (vw, vh) =>
  C.MOON_REF_RADIUS_PX * C.MOON_SCALE_FACTOR * Math.min(vw / 1920, vh / 1080);

check('MOON_REF_RADIUS_PX is within 0.5 px of 404.8', () => {
  assert.ok(Math.abs(C.MOON_REF_RADIUS_PX - 404.8) <= 0.5, String(C.MOON_REF_RADIUS_PX));
});

check('constants have the planned values', () => {
  assert.equal(C.HERO_REF_WIDTH_PX, 1920);
  assert.equal(C.HERO_REF_HEIGHT_PX, 1080);
  assert.equal(C.NAVBAR_REF_HEIGHT_PX, 61);
  assert.equal(C.MOON_SCALE_FACTOR, 0.9);
  assert.equal(C.MOON_MIN_RADIUS_PX, 128);
  assert.equal(C.MOON_SIDE_MARGIN_PX, 24);
  assert.equal(C.MOON_INTRO_START_SCALE, 0.48);
  assert.equal(C.MOON_INTRO_DURATION_S, 3);
  assert.equal(C.MOON_INTRO_EASE, 'power2.out');
  assert.equal(C.HERO_WRAP_MARGIN_PX, 20);
  assert.equal(C.HERO_WRAP_MIN_WIDTH_PX, 1024);
  assert.equal(C.HERO_H1_RADIUS_RATIO, 0.26);
});

const table = [
  [1920, 1080, 728.6],
  [1440, 900, 546.5],
  [1366, 768, 518.2],
  [1280, 720, 485.7],
  [1920, 700, 472.2],
  [1024, 768, 388.6],
  [1024, 700, 388.6],
  [375, 812, 256],
  [320, 568, 256],
];
for (const [w, h, d] of table) {
  check(`diameter at ${w}x${h} is ${d} within 0.5 px`, () => {
    const got = 2 * moonFinalRadiusPx(w, h);
    assert.ok(Math.abs(got - d) <= 0.5, `${got} vs ${d}`);
  });
}

check('floor and ceiling inactive at or above 1024x700 (grid up to 2560x1440)', () => {
  for (let w = 1024; w <= 2560; w += 16) {
    for (let h = 700; h <= 1440; h += 10) {
      const plain = plainRadius(w, h);
      const got = moonFinalRadiusPx(w, h);
      assert.ok(Math.abs(got - plain) < 1e-9, `${w}x${h}: ${got} vs ${plain}`);
    }
  }
});

check('375x812 and 320x568: side clearance at least 24 px, diameter under 596', () => {
  for (const [w, h] of [
    [375, 812],
    [320, 568],
  ]) {
    const r = moonFinalRadiusPx(w, h);
    assert.ok((w - 2 * r) / 2 >= 24 - 1e-9, `${w}x${h} clearance ${(w - 2 * r) / 2}`);
    assert.ok(2 * r < 596, `${w}x${h} diameter ${2 * r}`);
  }
});

check('ratios 0.75 (1440x900) and 0.711 (1366x768) of the 1920x1080 diameter within 3%', () => {
  const ref = 2 * moonFinalRadiusPx(1920, 1080);
  const r1 = (2 * moonFinalRadiusPx(1440, 900)) / ref;
  const r2 = (2 * moonFinalRadiusPx(1366, 768)) / ref;
  assert.ok(Math.abs(r1 - 0.75) / 0.75 <= 0.03, String(r1));
  assert.ok(Math.abs(r2 - 0.711) / 0.711 <= 0.03, String(r2));
});

check('MOON_MIN_RADIUS_PX is at most the 1024x700 plain radius', () => {
  assert.ok(C.MOON_MIN_RADIUS_PX <= plainRadius(1024, 700));
});

check('poster side equals radius over the framing constant', () => {
  for (const r of [128, 194.3, 273.2, 364.3]) {
    assert.ok(Math.abs(moonPosterSidePx(r) - r / MOON_RADIUS_PER_HERO_HEIGHT) < 1e-9);
  }
});

check('store: initial radius is the 1920x1080 value, setViewport updates and notifies', () => {
  assert.equal(getMoonRadius(), moonFinalRadiusPx(1920, 1080));
  let seen = null;
  const unsub = subscribeMoonRadius((r) => {
    seen = r;
  });
  setViewport(1440, 900);
  assert.equal(getMoonRadius(), moonFinalRadiusPx(1440, 900));
  assert.equal(seen, getMoonRadius());
  unsub();
  seen = null;
  setViewport(375, 812);
  assert.equal(getMoonRadius(), moonFinalRadiusPx(375, 812));
  assert.equal(seen, null);
});

check('column constants have the planned values', () => {
  assert.equal(C.HERO_COLUMN_GAP_PX, 24);
  assert.equal(C.HERO_COLUMN_BOTTOM_PX, 24);
  assert.equal(C.HERO_COLUMN_HEIGHT_IGNORE_PX, 120);
});

const NAV = 61;
const colFloor = C.MOON_MIN_RADIUS_PX;
const colCeil = (vw) => (vw - 2 * C.MOON_SIDE_MARGIN_PX) / 2;
// Representative text heights (px) for the phone type scale.
for (const [vw, vh, textH] of [
  [375, 812, 300],
  [414, 896, 300],
  [768, 1024, 330],
]) {
  check(`column radius at ${vw}x${vh}: text + gap + diameter fit the viewport`, () => {
    const r = moonColumnRadiusPx({ vw, vh, navH: NAV, textH });
    const used = NAV + textH + C.HERO_COLUMN_GAP_PX + 2 * r + C.HERO_COLUMN_BOTTOM_PX;
    assert.ok(r >= colFloor && r <= colCeil(vw) + 1e-9, `r ${r}`);
    const unconstrained = (vh - NAV - textH - 48) / 2;
    if (unconstrained >= colFloor && unconstrained <= colCeil(vw)) {
      assert.ok(Math.abs(used - vh) < 1e-9, `used ${used} vs ${vh}`);
    }
    assert.ok(2 * r + 2 * C.MOON_SIDE_MARGIN_PX <= vw + 1e-9);
  });
}
check('column radius: floor wins at 320x568 and 812x375 (Hero grows, moon stays below text)', () => {
  assert.equal(moonColumnRadiusPx({ vw: 320, vh: 568, navH: NAV, textH: 330 }), colFloor);
  assert.equal(moonColumnRadiusPx({ vw: 812, vh: 375, navH: NAV, textH: 330 }), colFloor);
  assert.equal(moonColumnRadiusPx({ vw: 568, vh: 320, navH: NAV, textH: 330 }), colFloor);
});
check('column radius: width ceiling wins with a short text on a wide, tall window', () => {
  assert.equal(moonColumnRadiusPx({ vw: 600, vh: 1000, navH: NAV, textH: 100 }), colCeil(600));
});
check('store: column mode uses the text height; floor before it is known', () => {
  setViewport(1440, 900);
  setViewport(375, 812);
  assert.equal(getMoonRadius(), colFloor);
  setHeroColumnInputs(120, NAV);
  assert.equal(getMoonRadius(), moonColumnRadiusPx({ vw: 375, vh: 812, navH: NAV, textH: 120 }));
});
check('store: height-only change under 120 px at unchanged width is ignored below 1024', () => {
  setViewport(375, 812);
  const before = getMoonRadius();
  setViewport(375, 812 + 119);
  setViewport(375, 812 - 119);
  assert.equal(getMoonRadius(), before);
  setViewport(375, 812 + 120);
  assert.equal(getMoonRadius(), moonColumnRadiusPx({ vw: 375, vh: 932, navH: NAV, textH: 120 }));
  setViewport(1440, 900);
  setViewport(1440, 900 + 50);
  assert.equal(getMoonRadius(), moonFinalRadiusPx(1440, 950));
});

check('wrapGeometry: float circle centre equals the Hero centre within 0.01 px', () => {
  const margin = C.HERO_WRAP_MARGIN_PX;
  let fitting = 0;
  for (let w = 1024; w <= 2560; w += 32) {
    for (let vh = 700; vh <= 1440; vh += 20) {
      const heroW = w;
      const heroH = vh - C.NAVBAR_REF_HEIGHT_PX;
      const radius = moonFinalRadiusPx(w, vh);
      const g = wrapGeometry({ heroW, heroH, radius, margin });
      assert.ok(Math.abs(g.size - 2 * (radius + margin)) < 1e-9);
      const cx = heroW - g.mr - g.size / 2;
      assert.ok(Math.abs(cx - heroW / 2) <= 0.01, `${w}x${vh} cx ${cx}`);
      if (heroH / 2 >= radius + margin) {
        fitting += 1;
        assert.ok(g.mt >= 0);
        const cy = g.mt + g.size / 2;
        assert.ok(Math.abs(cy - heroH / 2) <= 0.01, `${w}x${vh} cy ${cy}`);
      }
    }
  }
  assert.ok(fitting > 0);
});

check('wrapGeometry: mt is clamped to 0 when the circle is taller than the Hero', () => {
  const g = wrapGeometry({ heroW: 1000, heroH: 100, radius: 200, margin: 20 });
  assert.equal(g.mt, 0);
});

check('arrow constants have the planned values', () => {
  assert.equal(SECTION_ARROW_OFFSET_PX, 16);
  assert.equal(SECTION_ARROW_SIZE_PX, 44);
});

const gapTable = [
  [1920, 1080],
  [1920, 700],
  [1440, 900],
  [1366, 768],
  [1024, 768],
  [1024, 700],
];
for (const [w, vh] of gapTable) {
  check(`arrow-to-moon gap at ${w}x${vh} is at least HERO_WRAP_MARGIN_PX`, () => {
    const r = moonFinalRadiusPx(w, vh);
    const arrowTop = vh - SECTION_ARROW_OFFSET_PX - SECTION_ARROW_SIZE_PX;
    const moonBottom = C.NAVBAR_REF_HEIGHT_PX + (vh - C.NAVBAR_REF_HEIGHT_PX) / 2 + r;
    const gap = arrowTop - moonBottom;
    console.log(`  gap ${w}x${vh}: ${gap.toFixed(1)} px`);
    assert.ok(gap >= C.HERO_WRAP_MARGIN_PX, `gap ${gap}`);
  });
}

console.log(`\n${passes} checks passed`);
