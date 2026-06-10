// Minimal chrome.storage shim for the standalone demo, backed by localStorage.
// Lets the real storage.ts / ui.ts / notes.ts run unmodified, with no extension and no login.
type Changes = Record<string, { oldValue?: unknown; newValue?: unknown }>
type Listener = (changes: Changes, area: string) => void

const listeners = new Set<Listener>()

function read(key: string): unknown {
  const raw = localStorage.getItem(key)
  if (raw === null) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

const storageLocal = {
  async get(key: string): Promise<Record<string, unknown>> {
    return { [key]: read(key) }
  },
  async set(items: Record<string, unknown>): Promise<void> {
    for (const key of Object.keys(items)) {
      const oldValue = read(key)
      localStorage.setItem(key, JSON.stringify(items[key]))
      const changes: Changes = { [key]: { oldValue, newValue: items[key] } }
      for (const l of listeners) l(changes, 'local')
    }
  },
}

const onChanged = {
  addListener(l: Listener): void {
    listeners.add(l)
  },
  removeListener(l: Listener): void {
    listeners.delete(l)
  },
}

// cross-document sync (another tab editing the same origin)
window.addEventListener('storage', (e) => {
  if (!e.key) return
  const changes: Changes = { [e.key]: { oldValue: undefined, newValue: read(e.key) } }
  for (const l of listeners) l(changes, 'local')
})

Reflect.set(globalThis, 'chrome', { storage: { local: storageLocal, onChanged } })
