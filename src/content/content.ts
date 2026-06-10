// Content script: detects a profile, mounts the note panel and keeps it in sync
// during SPA navigation on X. The note key = the profile name from the URL.
import './content.css'
import { parseProfileFromHref } from '../profile'
import { deleteNote, getNote, onNotesChanged, upsertNote } from '../storage'
import type { NoteRecord, RuntimeMessage } from '../types'
import { decorateAvatars, initAvatarBadges } from './avatars'
import { buildPanel, ROOT_ID, type PanelHandle } from './ui'

/** The profile name lives in the main column header (not in hover cards/tweets). */
const ANCHOR_SELECTOR = '[data-testid="primaryColumn"] [data-testid="UserName"]'

const LOG = '[twitter-notes]'

let currentHandle: string | null = null
let panel: PanelHandle | null = null
let navToken = 0
let lastHref = ''
let observer: MutationObserver | null = null
let intervalId: ReturnType<typeof setInterval> | undefined

function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

/** Removes the panel and clears state. */
function teardown(): void {
  panel?.destroy()
  panel = null
  document.getElementById(ROOT_ID)?.remove()
}

function openNotes(): void {
  try {
    const msg: RuntimeMessage = { kind: 'open-notes' }
    void chrome.runtime.sendMessage(msg).catch(() => {})
  } catch {
    // extension context invalidated — ignore
  }
}

/** The extension context dies when it is reloaded/updated; a stale content script must stop. */
function extensionAlive(): boolean {
  try {
    return Boolean(chrome.runtime?.id)
  } catch {
    return false
  }
}

/** Stops all background activity of a stale content script. */
function stop(): void {
  observer?.disconnect()
  observer = null
  if (intervalId !== undefined) {
    clearInterval(intervalId)
    intervalId = undefined
  }
  teardown()
}

/** Builds a panel for the given profile and wires up the storage handlers. */
function createPanelFor(handle: string): PanelHandle {
  return buildPanel(handle, {
    async save(text: string, color: string | null): Promise<NoteRecord | null> {
      return upsertNote(handle, { text, color })
    },
    async remove(): Promise<void> {
      await deleteNote(handle)
    },
    openNotes,
  })
}

/** Waits until the profile header anchor appears in the DOM (up to ~4s). */
function waitForAnchor(timeoutMs: number): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(ANCHOR_SELECTOR)
    if (existing instanceof HTMLElement) {
      resolve(existing)
      return
    }
    const start = Date.now()
    const id = setInterval(() => {
      const node = document.querySelector(ANCHOR_SELECTOR)
      if (node instanceof HTMLElement) {
        clearInterval(id)
        resolve(node)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(id)
        resolve(null)
      }
    }, 120)
  })
}

/** Mounts the panel for the current profile (idempotently, with a navigation token). */
async function mountFor(handle: string, token: number): Promise<void> {
  const anchor = await waitForAnchor(4000)
  if (token !== navToken || currentHandle !== handle) return // navigation changed
  if (!anchor) {
    console.warn(LOG, 'profile header anchor not found — panel skipped')
    return
  }
  // idempotently: remove any stale panel
  teardownDomOnly()
  const fresh = createPanelFor(handle)
  panel = fresh
  anchor.insertAdjacentElement('afterend', fresh.root)
  const note = await getNote(handle)
  if (token !== navToken || currentHandle !== handle) {
    fresh.destroy()
    return
  }
  fresh.update(note)
}

/** Removes only the panel DOM node (without clearing navigation references). */
function teardownDomOnly(): void {
  document.getElementById(ROOT_ID)?.remove()
  panel = null
}

/** Reacts to an address change / re-render. */
function onNavigation(): void {
  const match = parseProfileFromHref(location.href)
  if (!match) {
    if (currentHandle !== null) {
      currentHandle = null
      navToken++
      teardown()
    }
    return
  }

  if (match.handle !== currentHandle) {
    currentHandle = match.handle
    navToken++
    teardown()
    void mountFor(match.handle, navToken)
  }
}

/** Ensures the panel exists while we are on a profile (X may remove the injected node). */
function ensureMounted(): void {
  if (!currentHandle) return
  if (document.getElementById(ROOT_ID)) return
  void mountFor(currentHandle, navToken)
}

function tick(): void {
  if (!extensionAlive()) {
    stop()
    return
  }
  if (location.href !== lastHref) {
    lastHref = location.href
    onNavigation()
  } else {
    ensureMounted()
  }
  decorateAvatars()
}

const debouncedTick = debounce(tick, 150)

function start(): void {
  lastHref = location.href
  // first check
  onNavigation()
  initAvatarBadges(() => currentHandle)

  observer = new MutationObserver(() => debouncedTick())
  observer.observe(document.body, { childList: true, subtree: true })

  // backstop in case navigation happens without DOM mutations
  intervalId = setInterval(tick, 700)

  // live sync on changes from another tab / the notes page
  onNotesChanged(() => {
    if (!currentHandle || !panel) return
    void (async () => {
      const note = await getNote(currentHandle)
      panel?.update(note)
    })()
  })
}

if (document.body) {
  start()
} else {
  document.addEventListener('DOMContentLoaded', start, { once: true })
}
