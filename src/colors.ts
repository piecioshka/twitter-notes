// Profile label color palette. The color key is stored in NoteRecord.color and drives
// the CSS classes (`tn-bg-<key>`, `accent-<key>`, `tn-ring-<key>`); the hex values live in
// the stylesheets (content.css / notes.css), not here.

export interface LabelColor {
  /** Key stored in the data and used to build CSS class names. */
  key: string
  /** Display name (shown as the swatch tooltip). */
  name: string
}

export const LABEL_COLORS: readonly LabelColor[] = [
  { key: 'red', name: 'Red — warning' },
  { key: 'orange', name: 'Orange' },
  { key: 'yellow', name: 'Yellow' },
  { key: 'green', name: 'Green — OK' },
  { key: 'blue', name: 'Blue' },
  { key: 'purple', name: 'Purple' },
  { key: 'pink', name: 'Pink' },
  { key: 'teal', name: 'Teal' },
  { key: 'lime', name: 'Lime' },
  { key: 'brown', name: 'Brown' },
  { key: 'indigo', name: 'Indigo' },
] as const
