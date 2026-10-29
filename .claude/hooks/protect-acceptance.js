#!/usr/bin/env node
// PreToolUse hook for builder / builder-rapido (declared in their frontmatter).
// tests/acceptance/ is the contract: block Edit on any file there and Write over
// existing files. Creating a new file is allowed so Mode S can write its tests once.
// Bash writes are not covered; the reviewer checks the contract with git diff.
'use strict';
const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const tool = input.tool_name || '';
  const args = input.tool_input || {};
  const target = args.file_path || args.notebook_path;
  if (!target) process.exit(0);

  const abs = path.resolve(input.cwd || process.cwd(), target);
  const norm = abs.replace(/\\/g, '/').toLowerCase();
  if (!norm.includes('/tests/acceptance/')) process.exit(0);

  const isWriteOfNewFile = tool === 'Write' && !fs.existsSync(abs);
  if (isWriteOfNewFile) process.exit(0);

  process.stderr.write(
    `Bloqueado: ${target} es parte del contrato (tests/acceptance/). ` +
      'No se edita, salta ni debilita. Si el test parece incorrecto, para y responde TEST_ISSUE con el motivo.\n'
  );
  process.exit(2);
});
