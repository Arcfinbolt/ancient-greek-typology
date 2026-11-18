// Checks every locale's content against the config. Run: npm run validate
// Exits with status 1 and a list of problems if anything does not line up.

import { loadFromDisk } from './load.mjs';
import { validateData } from '../js/validate.js';
import { sectionNames } from '../js/views/result-sections.js';

const locales = loadFromDisk().app.locales;
let failed = false;

for (const locale of locales) {
  let problems;
  try {
    problems = validateData(loadFromDisk(locale), { knownSections: sectionNames });
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
