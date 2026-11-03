import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('AC5: npm run check:buffer pasa e incluye el contrato de dpr reducido', () => {
  const r = spawnSync(process.execPath, ['scripts/check-buffer-limits.mjs'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /pass:.*reduced DPR/i);
  assert.match(r.stdout, /all buffer-limit checks passed/);
});
