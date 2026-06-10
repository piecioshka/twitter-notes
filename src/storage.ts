// The only module that touches chrome.storage.local.
// The whole store is kept under a single key as StorageShape — atomic read/write
// and simple change detection via chrome.storage.onChanged.

import { SCHEMA_VERSION, type NoteInput, type NoteRecord, type StorageShape } from './types'

const STORAGE_KEY = 'twitterNotes'

/** Empty, default store shape. */
function emptyShape(): StorageShape {
  return { schemaVersion: SCHEMA_VERSION, notes: {} }
}

/** Normalizes a profile name into a key: no "@", trimmed, lowercased. */
export function normalizeHandle(handle: string): string {
  return handle.replace(/^@+/, '').trim().toLowerCase()
}

/** Display name: no "@" and no leading spaces, preserving letter case. */
export function displayHandle(handle: string): string {
  return handle.replace(/^@+/, '').trim()
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Validate-by-construction: builds a NoteRecord from unknown data, or returns null. */
function toNoteRecord(value: unknown): NoteRecord | null {
  if (!isPlainObject(value)) return null
  const { handle, text, createdAt, updatedAt } = value
  if (typeof handle !== 'string' || typeof text !== 'string') return null

  const display = displayHandle(handle)
  const handleLower =
    typeof value.handleLower === 'string' && value.handleLower.length > 0
      ? value.handleLower
      : normalizeHandle(handle)
  if (handleLower.length === 0) return null

  const color = typeof value.color === 'string' ? value.color : null
  const created = typeof createdAt === 'number' ? createdAt : 0
  const updated = typeof updatedAt === 'number' ? updatedAt : created

  return { handle: display, handleLower, text, color, createdAt: created, updatedAt: updated }
}

/** Builds a valid StorageShape from arbitrary data (e.g. from import or storage). */
export function toStorageShape(value: unknown): StorageShape {
  if (!isPlainObject(value)) return emptyShape()
  const notesRaw = isPlainObject(value.notes) ? value.notes : {}
  const notes: Record<string, NoteRecord> = {}
  for (const key of Object.keys(notesRaw)) {
    const record = toNoteRecord(notesRaw[key])
    if (record) notes[record.handleLower] = record
  }
  const schemaVersion =
    typeof value.schemaVersion === 'number' ? value.schemaVersion : SCHEMA_VERSION
  return { schemaVersion, notes }
}

/** Reads the whole store (always returns a valid shape). */
async function readShape(): Promise<StorageShape> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    return toStorageShape(result[STORAGE_KEY])
  } catch {
    // e.g. "Extension context invalidated" after the extension was reloaded/updated — fail soft
    return emptyShape()
  }
}

/** Writes the whole store. */
async function writeShape(shape: StorageShape): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: shape })
  } catch {
    // context invalidated — ignore (the old content script is about to be replaced)
  }
}

/** Returns the note for the given profile, or null. */
export async function getNote(handle: string): Promise<NoteRecord | null> {
  const key = normalizeHandle(handle)
  if (!key) return null
  const shape = await readShape()
  return shape.notes[key] ?? null
}

/** Creates or updates a note. Empty text deletes the note. */
export async function upsertNote(handle: string, input: NoteInput): Promise<NoteRecord | null> {
  const key = normalizeHandle(handle)
  if (!key) return null

  const text = input.text.trim()
  if (text.length === 0) {
    await deleteNote(handle)
    return null
  }

  const shape = await readShape()
  const existing = shape.notes[key]
  const now = Date.now()
  const record: NoteRecord = {
    handle: displayHandle(handle),
    handleLower: key,
    text,
    color: input.color,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  }
  shape.notes[key] = record
  await writeShape(shape)
  return record
}

/** Deletes the note for the given profile. */
export async function deleteNote(handle: string): Promise<void> {
  const key = normalizeHandle(handle)
  if (!key) return
  const shape = await readShape()
  if (!(key in shape.notes)) return
  delete shape.notes[key]
  await writeShape(shape)
}

/** List of all notes sorted by updatedAt descending. */
export async function listNotes(): Promise<NoteRecord[]> {
  const shape = await readShape()
  return Object.values(shape.notes).sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Exports the whole store (for a JSON backup). */
export async function exportAll(): Promise<StorageShape> {
  return readShape()
}

export type ImportMode = 'merge' | 'replace'

/** Imports data from a backup. merge — adds/updates; replace — overwrites everything. */
export async function importAll(data: unknown, mode: ImportMode): Promise<number> {
  const incoming = toStorageShape(data)
  if (mode === 'replace') {
    await writeShape(incoming)
    return Object.keys(incoming.notes).length
  }
  const current = await readShape()
  for (const key of Object.keys(incoming.notes)) {
    const next = incoming.notes[key]
    if (!next) continue
    const prev = current.notes[key]
    // on conflict the newer one wins (updatedAt)
    if (!prev || next.updatedAt >= prev.updatedAt) current.notes[key] = next
  }
  await writeShape(current)
  return Object.keys(incoming.notes).length
}

// --- notes-page view preference ---

export type ViewMode = 'cards' | 'table'
const VIEW_KEY = 'twitterNotesView'

/** Reads the saved "all notes" layout (defaults to table). */
export async function getViewMode(): Promise<ViewMode> {
  try {
    const result = await chrome.storage.local.get(VIEW_KEY)
    return result[VIEW_KEY] === 'cards' ? 'cards' : 'table'
  } catch {
    return 'table'
  }
}

/** Persists the chosen "all notes" layout. */
export async function setViewMode(mode: ViewMode): Promise<void> {
  try {
    await chrome.storage.local.set({ [VIEW_KEY]: mode })
  } catch {
    // context invalidated — ignore
  }
}

/** Subscribes to store changes (for live UI sync). Returns an unsubscribe function. */
export function onNotesChanged(listener: () => void): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: chrome.storage.AreaName,
  ): void => {
    if (area === 'local' && STORAGE_KEY in changes) listener()
  }
  chrome.storage.onChanged.addListener(handler)
  return () => chrome.storage.onChanged.removeListener(handler)
}
