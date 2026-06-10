// Builds and manages the note panel injected under the profile name on X.
import { LABEL_COLORS } from '../colors'
import { el } from '../dom'
import type { NoteRecord } from '../types'

export const ROOT_ID = 'tn-root'

export interface PanelHandlers {
  /** Saves a note — returns the saved record or null (when text empty -> deleted). */
  save(text: string, color: string | null): Promise<NoteRecord | null>
  /** Deletes the note. */
  remove(): Promise<void>
  /** Opens the page with all notes. */
  openNotes(): void
}

export interface PanelHandle {
  root: HTMLElement
  /** Updates the view after the data changed (e.g. from another tab). */
  update(note: NoteRecord | null): void
  destroy(): void
}

type Mode = 'view' | 'empty' | 'edit'

/** Whether X is in dark mode — based on the body background luminance. */
function isDarkTheme(): boolean {
  const bg = getComputedStyle(document.body).backgroundColor
  const match = bg.match(/\d+/g)
  if (!match || match.length < 3) return true
  const r = Number(match[0])
  const g = Number(match[1])
  const b = Number(match[2])
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

const ACCENT_PREFIX = 'tn-accent-'

export function buildPanel(handle: string, handlers: PanelHandlers): PanelHandle {
  const root = el('div', 'tn-root')
  root.id = ROOT_ID
  root.setAttribute('data-tn', '1')
  root.classList.add(isDarkTheme() ? 'tn-dark' : 'tn-light')

  const panel = el('div', 'tn-panel')
  root.appendChild(panel)

  let note: NoteRecord | null = null
  let mode: Mode = 'empty'
  let draftColor: string | null = null

  function setAccent(color: string | null): void {
    for (const c of LABEL_COLORS) root.classList.remove(`${ACCENT_PREFIX}${c.key}`)
    if (color) root.classList.add(`${ACCENT_PREFIX}${color}`)
  }

  function render(): void {
    panel.replaceChildren()
    setAccent(mode === 'edit' ? draftColor : note?.color ?? null)

    if (mode === 'edit') {
      renderEdit()
    } else if (note) {
      renderView()
    } else {
      renderEmpty()
    }
  }

  function renderEmpty(): void {
    const btn = el('button', 'tn-btn tn-btn--primary', '📝 Add note')
    btn.type = 'button'
    btn.addEventListener('click', () => enterEdit())
    panel.appendChild(btn)
    panel.appendChild(buildAllNotesLink())
  }

  function renderView(): void {
    if (!note) return
    panel.appendChild(el('div', 'tn-note-text', note.text))

    // compact action row — no timestamps, keeps the panel small on the profile
    const foot = el('div', 'tn-foot')
    const editLink = el('button', 'tn-link', 'Edit')
    editLink.type = 'button'
    editLink.addEventListener('click', () => enterEdit())
    const allLink = el('button', 'tn-link', 'All notes')
    allLink.type = 'button'
    allLink.addEventListener('click', () => handlers.openNotes())
    foot.append(editLink, el('span', 'tn-foot-sep', '·'), allLink)
    panel.appendChild(foot)
  }

  function renderEdit(): void {
    const textarea = el('textarea', 'tn-textarea')
    textarea.placeholder = `Private note about @${handle}…`
    textarea.value = note?.text ?? ''
    textarea.rows = 3
    panel.appendChild(textarea)

    // color picker
    const colors = el('div', 'tn-colors')
    const none = el('button', 'tn-swatch tn-swatch-none', '×')
    none.type = 'button'
    none.title = 'No color'
    none.setAttribute('aria-pressed', String(draftColor === null))
    if (draftColor === null) none.classList.add('tn-swatch--active')
    none.addEventListener('click', () => {
      draftColor = null
      setAccent(null)
      refreshSwatches(colors)
    })
    colors.appendChild(none)

    for (const c of LABEL_COLORS) {
      const sw = el('button', `tn-swatch tn-bg-${c.key}`)
      sw.type = 'button'
      sw.title = c.name
      sw.dataset.color = c.key
      sw.setAttribute('aria-pressed', String(draftColor === c.key))
      if (draftColor === c.key) sw.classList.add('tn-swatch--active')
      sw.addEventListener('click', () => {
        draftColor = c.key
        setAccent(c.key)
        refreshSwatches(colors)
      })
      colors.appendChild(sw)
    }
    panel.appendChild(colors)

    async function submit(): Promise<void> {
      const saved = await handlers.save(textarea.value, draftColor)
      note = saved
      mode = saved ? 'view' : 'empty'
      render()
    }

    // actions
    const actions = el('div', 'tn-actions')
    const saveBtn = el('button', 'tn-btn tn-btn--primary', 'Save')
    saveBtn.type = 'button'
    saveBtn.addEventListener('click', () => void submit())
    const cancelBtn = el('button', 'tn-btn tn-btn--ghost', 'Cancel')
    cancelBtn.type = 'button'
    cancelBtn.addEventListener('click', () => {
      mode = note ? 'view' : 'empty'
      render()
    })
    actions.appendChild(saveBtn)
    actions.appendChild(cancelBtn)
    if (note) {
      const delBtn = el('button', 'tn-btn tn-btn--danger', 'Delete')
      delBtn.type = 'button'
      delBtn.addEventListener('click', () => {
        void (async () => {
          await handlers.remove()
          note = null
          mode = 'empty'
          render()
        })()
      })
      actions.appendChild(delBtn)
    }
    panel.appendChild(actions)
    panel.appendChild(buildAllNotesLink())

    // Enter saves; Shift+Enter inserts a new line
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault()
        void submit()
      }
    })
    queueMicrotask(() => textarea.focus())
  }

  function refreshSwatches(colors: HTMLElement): void {
    for (const child of Array.from(colors.children)) {
      const isNone = child.classList.contains('tn-swatch-none')
      const key = child instanceof HTMLElement ? child.dataset.color ?? null : null
      const active = isNone ? draftColor === null : draftColor === key
      child.classList.toggle('tn-swatch--active', active)
      child.setAttribute('aria-pressed', String(active))
    }
  }

  function buildAllNotesLink(): HTMLElement {
    const wrap = el('div', 'tn-links')
    const link = el('button', 'tn-link', 'All notes')
    link.type = 'button'
    link.addEventListener('click', () => handlers.openNotes())
    wrap.appendChild(link)
    return wrap
  }

  function enterEdit(): void {
    mode = 'edit'
    draftColor = note?.color ?? null
    render()
  }

  return {
    root,
    update(next: NoteRecord | null): void {
      note = next
      // if the user is not editing, show the current state
      if (mode !== 'edit') mode = next ? 'view' : 'empty'
      render()
    },
    destroy(): void {
      root.remove()
    },
  }
}
