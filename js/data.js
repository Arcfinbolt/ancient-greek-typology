// Loads config/ and content/<locale>/ and joins them into one object.
// `assemble` is pure and shared with the Node tools; `loadData` is the
// browser's way of getting the same files.

import { buildModel } from './model.js';

export const CONFIG_FILES = ['model', 'items', 'scoring', 'app', 'plates'];
export const CONTENT_FILES = ['ui', 'gods', 'polarities', 'items', 'tags', 'snippets', 'plates'];

/** raw: { config: { model, items, scoring, app, plates }, content: { ui, gods, ... }, locale } */
export function assemble(raw) {
  return {
    model: buildModel(raw.config.model),
    items: raw.config.items,
    scoring: raw.config.scoring,
    app: raw.config.app,
    plates: raw.config.plates,
    content: raw.content,
    locale: raw.locale,
  };
}

async function getJson(path) {
  let response;
  try {
    response = await fetch(path, { cache: 'no-cache' });
  } catch (cause) {
    throw new Error(`${path} could not be fetched`);
  }
  if (!response.ok) throw new Error(`${path} answered ${response.status}`);
  try {
    return await response.json();
  } catch (cause) {
    throw new Error(`${path} is not valid JSON`);
  }
}

/** Picks ?lang=xx when config/app.json lists it, otherwise the default. */
export function chooseLocale(app, search = '') {
  const asked = new URLSearchParams(search).get('lang');
  return asked && app.locales.includes(asked) ? asked : app.defaultLocale;
}

export async function loadData(base = '.', search = '') {
  const config = {};
  await Promise.all(CONFIG_FILES.map(async (name) => {
    config[name] = await getJson(`${base}/config/${name}.json`);
  }));

  const locale = chooseLocale(config.app, search);
  const content = {};
  await Promise.all(CONTENT_FILES.map(async (name) => {
    try {
      content[name] = await getJson(`${base}/content/${locale}/${name}.json`);
    } catch (error) {
      // A locale may translate only some files; the rest fall back to the default.
      if (locale === config.app.defaultLocale) throw error;
      content[name] = await getJson(`${base}/content/${config.app.defaultLocale}/${name}.json`);
    }
  }));

  return assemble({ config, content, locale });
}
