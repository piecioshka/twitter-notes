// Shared domain and storage types.

/** A single note pinned to an X profile (keyed by `handleLower`). */
export interface NoteRecord {
  /** Profile name in its original letter case (for display), without "@". */
  handle: string
  /** Storage key — the profile name in lowercase. */
  handleLower: string
  /** Note text. */
  text: string
  /** Label color key from the palette (`colors.ts`), or `null` when none. */
  color: string | null
  /** Creation time (epoch ms). */
  createdAt: number
  /** Last update time (epoch ms). */
  updatedAt: number
}

/** Shape of the whole store in `chrome.storage.local`. */
export interface StorageShape {
  /** Schema version — reserved for future data migrations. */
  schemaVersion: number
  /** Notes map: key = `handleLower`. */
  notes: Record<string, NoteRecord>
}

/** Input data for creating/updating a note. */
export interface NoteInput {
  text: string
  color: string | null
}

/** Current data schema version. */
export const SCHEMA_VERSION = 1

// --- Runtime message protocol (content script <-> service worker) ---

/** Request to open the page with all notes. */
export interface OpenNotesMessage {
  kind: 'open-notes'
}

export type RuntimeMessage = OpenNotesMessage

/** Type guard for runtime messages (no type assertions). */
export function isRuntimeMessage(value: unknown): value is RuntimeMessage {
  if (typeof value !== 'object' || value === null) return false
  return 'kind' in value && value.kind === 'open-notes'
}
