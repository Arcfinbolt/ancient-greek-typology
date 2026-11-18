// Checks every locale's content against the config. Run: npm run validate
// Exits with status 1 and a list of problems if anything does not line up.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadFromDisk, root } from './load.mjs';
import { validateData } from '../js/validate.js';
import { sectionNames } from '../js/views/result-sections.js';

const locales = loadFromDisk().app.locales;
let failed = false;

for (const locale of locales) {
  let problems;
  try {
    const data = loadFromDisk(locale);
    problems = validateData(data, { knownSections: sectionNames });
    // Only this tool can see the disk: every plate named in config must exist.
    for (const set of ['statues', 'paintings']) {
      for (const [god, file] of Object.entries(data.plates[set] || {})) {
        for (const path of [file.file, file.small].filter(Boolean)) {
          if (!existsSync(join(root, path))) problems.push(`config/plates.json: ${set}.${god} points to ${path}, which does not exist.`);
        }
      }
    }
  } catch (error) {
    problems = [`could not read the files: ${error.message}`];
  }
  if (problems.length) {
    failed = true;
    console.error(`\n${locale}: ${problems.length} problem(s)`);
    for (const p of problems) console.error(`  - ${p}`);
  } else {
    console.log(`${locale}: config and content agree.`);
  }
}

process.exit(failed ? 1 : 0);
