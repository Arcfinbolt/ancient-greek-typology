// Fills {placeholders} in a string from content/<locale>/*.json.
// Unknown placeholders are left as written, so a typo shows up on the page.

/** 1 -> I, 4 -> IV. The polarities are numbered this way. */
export function roman(n) {
  const marks = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [value, mark] of marks) while (n >= value) { out += mark; n -= value; }
  return out;
}

export function fill(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (whole, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : whole,
  );
}
