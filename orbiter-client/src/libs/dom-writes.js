// Per-frame DOM writes that skip Vue: animation code sets an element's attribute or style directly,
// and only when the value actually changed, so the browser has nothing to redo for a still element.

/** @type {WeakMap<Element, Record<string, string>>} */
const lastWritten = new WeakMap()

function changed(element, name, value) {
  let last = lastWritten.get(element)
  if (!last) lastWritten.set(element, (last = {}))
  if (last[name] === value) return false
  last[name] = value
  return true
}

/** Sets an attribute if it differs from what this module last wrote to it. */
export function writeAttribute(element, name, value) {
  if (element && changed(element, name, value)) element.setAttribute(name, value)
}

/** Sets a style property if it differs from what this module last wrote to it. */
export function writeStyle(element, property, value) {
  if (element && changed(element, 'style.' + property, value)) element.style[property] = value
}
