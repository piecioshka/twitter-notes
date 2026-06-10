// Tiny DOM helpers shared by the content panel and the options page.

/** Creates an element with an optional class and text content. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/** Gets a required element by id, narrowed to its concrete type (throws if missing/wrong). */
export function byId<T extends HTMLElement>(id: string, ctor: new () => T): T {
  const node = document.getElementById(id)
  if (!(node instanceof ctor)) throw new Error(`Missing element #${id}`)
  return node
}
