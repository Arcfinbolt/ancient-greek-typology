// Fills {placeholders} in a string from content/<locale>/*.json.
// Unknown placeholders are left as written, so a typo shows up on the page.

export function fill(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (whole, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : whole,
  );
}
