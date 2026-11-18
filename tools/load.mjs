// Reads config/ and content/<locale>/ from disk for the Node tools and tests.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { assemble, CONFIG_FILES, CONTENT_FILES } from '../js/data.js';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

export function loadFromDisk(locale) {
  const config = Object.fromEntries(CONFIG_FILES.map((name) => [name, read(`config/${name}.json`)]));
  const chosen = locale || config.app.defaultLocale;
  const content = Object.fromEntries(CONTENT_FILES.map((name) => {
    try {
      return [name, read(`content/${chosen}/${name}.json`)];
    } catch (error) {
      if (chosen === config.app.defaultLocale || error.code !== 'ENOENT') throw error;
      return [name, read(`content/${config.app.defaultLocale}/${name}.json`)];
    }
  }));
  return assemble({ config, content, locale: chosen });
}
