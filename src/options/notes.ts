// "All notes" page: list (cards or table), search, color filter, edit/delete, export/import.
import { LABEL_COLORS } from '../colors'
import { byId, el } from '../dom'
import { dateStamp, formatDateTime } from '../format'
import {
  deleteNote,
  exportAll,
  getViewMode,
  importAll,
  listNotes,
  onNotesChanged,
  setViewMode,
  upsertNote,
  type ImportMode,
  type ViewMode,
} from '../storage'
import type { NoteRecord } from '../types'

const searchInput = byId('search', HTMLInputElement)
const exportBtn = byId('export', HTMLButtonElement)
const importInput = byId('import-file', HTMLInputElement)
const listEl = byId('list', HTMLUListElement)
const countEl = byId('count', HTMLParagraphElement)
const emptyEl = byId('empty', HTMLParagraphElement)

// the table view lives in its own container, inserted right after the cards list
const tableEl = el('div', 'table-wrap')
tableEl.hidden = true
listEl.after(tableEl)

let allNotes: NoteRecord[] = []
let query = ''
let editingHandle: string | null = null
let draftColor: string | null = null
let viewMode: ViewMode = 'table'
// active color filters; a note's key is its color, or 'none' when it has no label
const activeColors = new Set<string>()

function filteredNotes(): NoteRecord[] {
  const needle = query.trim().toLowerCase()
  return allNotes.filter((n) => {
    const matchesText =
      !needle || n.handleLower.includes(needle) || n.text.toLowerCase().includes(needle)
    const matchesColor = activeColors.size === 0 || activeColors.has(n.color ?? 'none')
    return matchesText && matchesColor
  })
}

async function refresh(): Promise<void> {
  allNotes = await listNotes()
  applyFilter()
}

function applyFilter(): void {
  renderList(filteredNotes())
}

function renderCount(shown: number): void {
  if (allNotes.length === 0) {
    countEl.textContent = ''
  } else if (query.trim() || activeColors.size > 0) {
    countEl.textContent = `${shown} of ${allNotes.length} notes`
  } else {
    countEl.textContent = `${allNotes.length} ${allNotes.length === 1 ? 'note' : 'notes'}`
  }
}

function renderList(notes: NoteRecord[]): void {
  emptyEl.hidden = allNotes.length !== 0
  renderCount(notes.length)

  if (viewMode === 'table') {
    listEl.hidden = true
    tableEl.hidden = false
    renderTable(notes)
  } else {
    tableEl.hidden = true
    listEl.hidden = false
    listEl.replaceChildren()
    for (const note of notes) {
      listEl.appendChild(note.handleLower === editingHandle ? buildEditCard(note) : buildViewCard(note))
    }
  }
}

function accentClass(color: string | null): string {
  return color ? ` accent-${color}` : ''
}

function buildHandleLink(note: NoteRecord): HTMLAnchorElement {
  const link = el('a', 'handle', `@${note.handle}`)
  link.href = `https://x.com/${note.handle}`
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  return link
}

function startEdit(note: NoteRecord): void {
  editingHandle = note.handleLower
  draftColor = note.color
  applyFilter()
}

function confirmDelete(note: NoteRecord): void {
  if (!confirm(`Delete the note about @${note.handle}?`)) return
  void deleteNote(note.handle).then(refresh)
}

// --- cards view ---

function buildViewCard(note: NoteRecord): HTMLLIElement {
  const li = el('li', `card${accentClass(note.color)}`)

  const head = el('div', 'card-head')
  head.appendChild(buildHandleLink(note))
  head.appendChild(el('span', 'spacer'))

  const editBtn = el('button', 'btn btn--ghost', 'Edit')
  editBtn.type = 'button'
  editBtn.addEventListener('click', () => startEdit(note))
  const delBtn = el('button', 'btn btn--danger', 'Delete')
  delBtn.type = 'button'
  delBtn.addEventListener('click', () => confirmDelete(note))
  head.appendChild(editBtn)
  head.appendChild(delBtn)
  li.appendChild(head)

  li.appendChild(el('div', 'card-text', note.text))
  const meta =
    note.updatedAt > note.createdAt
      ? `created ${formatDateTime(note.createdAt)} · updated ${formatDateTime(note.updatedAt)}`
      : `created ${formatDateTime(note.createdAt)}`
  li.appendChild(el('div', 'card-meta', meta))
  return li
}

function buildEditCard(note: NoteRecord): HTMLLIElement {
  const li = el('li', `card${accentClass(draftColor)}`)
  const head = el('div', 'card-head')
  head.appendChild(buildHandleLink(note))
  li.appendChild(head)
  appendEditForm(li, note, (color) => {
    li.className = `card${accentClass(color)}`
  })
  return li
}

// --- table view ---

function renderTable(notes: NoteRecord[]): void {
  tableEl.replaceChildren()
  const table = el('table', 'notes-table')

  const thead = el('thead')
  const htr = el('tr')
  for (const heading of ['', 'Profile', 'Note', 'Updated', '']) {
    htr.appendChild(el('th', undefined, heading))
  }
  thead.appendChild(htr)
  table.appendChild(thead)

  const tbody = el('tbody')
  for (const note of notes) {
    tbody.appendChild(note.handleLower === editingHandle ? buildTableEditRow(note) : buildTableRow(note))
  }
  table.appendChild(tbody)
  tableEl.appendChild(table)
}

function buildTableRow(note: NoteRecord): HTMLTableRowElement {
  const tr = el('tr', 't-row')

  const dotTd = el('td', 't-dot-cell')
  dotTd.appendChild(el('span', note.color ? `t-dot tn-bg-${note.color}` : 't-dot t-dot--gray'))
  tr.appendChild(dotTd)

  const handleTd = el('td', 't-handle')
  handleTd.appendChild(buildHandleLink(note))
  tr.appendChild(handleTd)

  tr.appendChild(el('td', 't-text', note.text))
  tr.appendChild(el('td', 't-date', formatDateTime(note.updatedAt)))

  const actTd = el('td', 't-actions')
  const editBtn = el('button', 'btn btn--ghost', 'Edit')
  editBtn.type = 'button'
  editBtn.addEventListener('click', () => startEdit(note))
  const delBtn = el('button', 'btn btn--danger', 'Delete')
  delBtn.type = 'button'
  delBtn.addEventListener('click', () => confirmDelete(note))
  actTd.append(editBtn, delBtn)
  tr.appendChild(actTd)

  return tr
}

function buildTableEditRow(note: NoteRecord): HTMLTableRowElement {
  const tr = el('tr', 't-row')
  const td = el('td', `t-edit${accentClass(draftColor)}`)
  td.colSpan = 5
  const head = el('div', 'card-head')
  head.appendChild(buildHandleLink(note))
  td.appendChild(head)
  appendEditForm(td, note, (color) => {
    td.className = `t-edit${accentClass(color)}`
  })
  tr.appendChild(td)
  return tr
}

// --- shared edit form (used by both card and table rows) ---

function appendEditForm(
  parent: HTMLElement,
  note: NoteRecord,
  applyAccent: (color: string | null) => void,
): void {
  const textarea = el('textarea', 'textarea')
  textarea.value = note.text
  textarea.rows = 3
  parent.appendChild(textarea)

  const colors = el('div', 'colors')
  const none = el('button', 'swatch swatch-none', '×')
  none.type = 'button'
  none.title = 'No color'
  if (draftColor === null) none.classList.add('swatch--active')
  none.addEventListener('click', () => {
    draftColor = null
    applyAccent(draftColor)
    refreshSwatches(colors)
  })
  colors.appendChild(none)
  for (const c of LABEL_COLORS) {
    const sw = el('button', `swatch tn-bg-${c.key}`)
    sw.type = 'button'
    sw.title = c.name
    sw.dataset.color = c.key
    if (draftColor === c.key) sw.classList.add('swatch--active')
    sw.addEventListener('click', () => {
      draftColor = c.key
      applyAccent(draftColor)
      refreshSwatches(colors)
    })
    colors.appendChild(sw)
  }
  parent.appendChild(colors)

  const actions = el('div', 'actions')
  const saveBtn = el('button', 'btn btn--primary', 'Save')
  saveBtn.type = 'button'
  saveBtn.addEventListener('click', () => {
    void (async () => {
      await upsertNote(note.handle, { text: textarea.value, color: draftColor })
      editingHandle = null
      await refresh()
    })()
  })
  const cancelBtn = el('button', 'btn btn--ghost', 'Cancel')
  cancelBtn.type = 'button'
  cancelBtn.addEventListener('click', () => {
    editingHandle = null
    applyFilter()
  })
  actions.appendChild(saveBtn)
  actions.appendChild(cancelBtn)
  parent.appendChild(actions)

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault()
      saveBtn.click()
    }
  })
  queueMicrotask(() => textarea.focus())
}

function refreshSwatches(colors: HTMLElement): void {
  for (const child of Array.from(colors.children)) {
    const isNone = child.classList.contains('swatch-none')
    const key = child instanceof HTMLElement ? child.dataset.color ?? null : null
    child.classList.toggle('swatch--active', isNone ? draftColor === null : draftColor === key)
  }
}

// --- export / import ---

function download(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

exportBtn.addEventListener('click', () => {
  void (async () => {
    const data = await exportAll()
    download(`twitter-notes-backup-${dateStamp(Date.now())}.json`, JSON.stringify(data, null, 2))
  })()
})

importInput.addEventListener('change', () => {
  const file = importInput.files?.[0]
  if (!file) return
  void (async () => {
    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      const merge = confirm(
        'How do you want to import?\n\nOK = merge with existing notes\nCancel = replace all existing notes',
      )
      const mode: ImportMode = merge ? 'merge' : 'replace'
      if (mode === 'replace' && !confirm('Really REPLACE all existing notes?')) return
      const imported = await importAll(parsed, mode)
      await refresh()
      alert(`Imported ${imported} notes (mode: ${mode === 'merge' ? 'merge' : 'replace'}).`)
    } catch (err) {
      console.error(err)
      alert('Failed to import the file — is it a valid JSON backup?')
    } finally {
      importInput.value = ''
    }
  })()
})

// --- color filter ---

function buildFilterBar(): void {
  const bar = el('div', 'filter')
  bar.appendChild(el('span', 'filter-label', 'Filter by color:'))

  const swatches: HTMLButtonElement[] = []
  function syncActive(): void {
    for (const sw of swatches) {
      sw.classList.toggle('swatch--active', activeColors.has(sw.dataset.color ?? ''))
    }
  }
  function addSwatch(key: string, extraClass: string, title: string, label?: string): void {
    const sw = el('button', `swatch ${extraClass}`, label)
    sw.type = 'button'
    sw.title = title
    sw.dataset.color = key
    sw.addEventListener('click', () => {
      if (activeColors.has(key)) activeColors.delete(key)
      else activeColors.add(key)
      syncActive()
      applyFilter()
    })
    swatches.push(sw)
    bar.appendChild(sw)
  }

  addSwatch('none', 'swatch-none', 'No label', '×')
  for (const c of LABEL_COLORS) addSwatch(c.key, `tn-bg-${c.key}`, c.name)

  countEl.before(bar)
}

// --- view toggle (cards / table) ---

const VIEWS: ReadonlyArray<{ view: ViewMode; label: string }> = [
  { view: 'table', label: 'Table' },
  { view: 'cards', label: 'Cards' },
]
const viewButtons: HTMLButtonElement[] = []

function syncViewToggle(): void {
  for (const b of viewButtons) b.classList.toggle('view-btn--active', b.dataset.view === viewMode)
}

function buildViewToggle(): void {
  const tools = document.querySelector('.tools')
  if (!tools) return
  const group = el('div', 'view-toggle')
  for (const { view, label } of VIEWS) {
    const b = el('button', 'view-btn', label)
    b.type = 'button'
    b.dataset.view = view
    b.addEventListener('click', () => {
      if (viewMode === view) return
      viewMode = view
      void setViewMode(view)
      syncViewToggle()
      applyFilter()
    })
    viewButtons.push(b)
    group.appendChild(b)
  }
  tools.appendChild(group)
  syncViewToggle()
}

searchInput.addEventListener('input', () => {
  query = searchInput.value
  applyFilter()
})

// live sync (changes from X or another tab) — skipped while editing
onNotesChanged(() => {
  if (editingHandle !== null) return
  void refresh()
})

buildFilterBar()
buildViewToggle()
void (async () => {
  viewMode = await getViewMode()
  syncViewToggle()
  await refresh()
})()
