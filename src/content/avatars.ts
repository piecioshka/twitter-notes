// Marks the avatars of profiles that have a note with a small colored dot, wherever they appear
// on X — except the avatar of the profile currently being viewed (its panel already shows the
// note). When X opens its native hover card for a noted profile, the note text is injected into it.
import { listNotes, onNotesChanged } from '../storage'
import type { NoteRecord } from '../types'

const AVATAR_SELECTOR = '[data-testid^="UserAvatar-Container-"]'
const PREFIX = 'UserAvatar-Container-'
const MARK = 'data-tn-badge'
const HOVERCARD_SELECTOR = '[data-testid="HoverCard"]'
const HC_MARK = 'data-tn-hc'
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/

let notes = new Map<string, NoteRecord>()
let getCurrentHandle: () => string | null = () => null

/** Reads the (lowercased) handle encoded in an avatar container's data-testid. */
function handleOf(el: Element): string | null {
  const testid = el.getAttribute('data-testid')
  if (!testid || !testid.startsWith(PREFIX)) return null
  const handle = testid.slice(PREFIX.length).trim()
  return handle ? handle.toLowerCase() : null
}

function addBadge(container: Element, note: NoteRecord): void {
  // a small colored dot marking that the profile has a note — the preview lives in X's hover card
  const badge = document.createElement('span')
  badge.className = note.color ? `tn-badge tn-ring-${note.color}` : 'tn-badge'
  container.appendChild(badge)
}

function removeBadge(el: Element): void {
  el.querySelector(':scope > .tn-badge')?.remove()
}

/** Finds which profile a native X hover card is about. */
function handleFromHoverCard(card: Element): string | null {
  const avatar = card.querySelector(AVATAR_SELECTOR)
  if (avatar) {
    const h = handleOf(avatar)
    if (h) return h
  }
  const link = card.querySelector('a[href^="/"]')
  const href = link?.getAttribute('href') ?? ''
  const seg = href.replace(/^\/+/, '').split('/')[0] ?? ''
  return HANDLE_RE.test(seg) ? seg.toLowerCase() : null
}

/** Builds the note block injected into the native hover card (inherits the card's theme). */
function buildHoverNote(note: NoteRecord): HTMLElement {
  const box = document.createElement('div')
  box.className = note.color ? `tn-hc-note tn-accent-${note.color}` : 'tn-hc-note'
  const label = document.createElement('div')
  label.className = 'tn-hc-label'
  label.append('Your note')
  const text = document.createElement('div')
  text.className = 'tn-hc-text'
  text.textContent = note.text
  box.append(label, text)
  return box
}

/** Injects the note into X's native hover card when the hovered profile has one. */
function decorateHoverCards(): void {
  for (const card of document.querySelectorAll(HOVERCARD_SELECTOR)) {
    const handle = handleFromHoverCard(card)
    const note = handle ? notes.get(handle) : undefined
    const marked = card.getAttribute(HC_MARK)

    if (!note || !handle) {
      if (marked) {
        card.querySelector(':scope > .tn-hc-note')?.remove()
        card.removeAttribute(HC_MARK)
      }
      continue
    }

    if (marked === handle && card.querySelector(':scope > .tn-hc-note')) continue
    card.querySelector(':scope > .tn-hc-note')?.remove()
    card.appendChild(buildHoverNote(note))
    card.setAttribute(HC_MARK, handle)
  }
}

/** Scans the DOM and (un)badges avatars. Idempotent — safe to call on every tick. */
export function decorateAvatars(): void {
  const current = getCurrentHandle()
  for (const el of document.querySelectorAll(AVATAR_SELECTOR)) {
    const handle = handleOf(el)
    if (!handle) continue
    const note = notes.get(handle)
    const marked = el.getAttribute(MARK)

    // not wanted here: no note, or this is the profile we're viewing
    if (!note || handle === current) {
      if (marked) {
        removeBadge(el)
        el.removeAttribute(MARK)
      }
      continue
    }

    // wanted: ensure a current badge exists (re-add if X wiped our node)
    if (marked === handle && el.querySelector(':scope > .tn-badge')) continue
    removeBadge(el)
    addBadge(el, note)
    el.setAttribute(MARK, handle)
  }

  decorateHoverCards()
}

function clearAll(): void {
  for (const el of document.querySelectorAll(`[${MARK}]`)) {
    removeBadge(el)
    el.removeAttribute(MARK)
  }
  for (const card of document.querySelectorAll(`[${HC_MARK}]`)) {
    card.querySelector(':scope > .tn-hc-note')?.remove()
    card.removeAttribute(HC_MARK)
  }
}

async function reload(): Promise<void> {
  const list = await listNotes()
  notes = new Map(list.map((n) => [n.handleLower, n]))
  clearAll()
  decorateAvatars()
}

/** Initializes avatar badges. `getCurrent` returns the handle of the profile being viewed. */
export function initAvatarBadges(getCurrent: () => string | null): void {
  getCurrentHandle = getCurrent
  void reload()
  onNotesChanged(() => void reload())
}
