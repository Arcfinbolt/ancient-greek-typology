// Two small helpers for building elements without a framework.

function build(el, attrs, children) {
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'style' && typeof value === 'object') {
      for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop, v);
    } else {
      el.setAttribute(key, value === true ? '' : value);
    }
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** h('p', { class: 'note' }, 'text', childNode) */
export function h(tag, attrs, ...children) {
  return build(document.createElement(tag), attrs, children);
}

/** The same for SVG elements. */
export function s(tag, attrs, ...children) {
  return build(document.createElementNS('http://www.w3.org/2000/svg', tag), attrs, children);
}
