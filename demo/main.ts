// Demo bootstrap: mounts the REAL note panel (ui.ts) on a mock X profile and
// boots the REAL "all notes" page (notes.ts), both backed by the localStorage shim.
import './shim' // must be first — installs globalThis.chrome
import '../src/content/content.css'
import '../src/options/notes.css'
import './demo.css'
import { decorateAvatars, initAvatarBadges } from '../src/content/avatars'
import { buildPanel, type PanelHandle } from '../src/content/ui'
import { deleteNote, getNote, listNotes, upsertNote } from '../src/storage'
import '../src/options/notes' // boots the All-notes view using the extension's real code

interface Sample {
  handle: string
  name: string
  bio: string
  avatarClass: string
}

const SAMPLES: readonly Sample[] = [
  {
    handle: 'naval',
    name: 'Naval',
    bio: 'Angel investor. Posts about wealth, leverage and clear thinking.',
    avatarClass: 'dx-av-blue',
  },
  {
    handle: 'paulg',
    name: 'Paul Graham',
    bio: 'Co-founded Y Combinator. Writes essays.',
    avatarClass: 'dx-av-green',
  },
  {
    handle: 'sama',
    name: 'Sam Altman',
    bio: 'Building useful things.',
    avatarClass: 'dx-av-purple',
  },
]

// people shown in the "Around X" list — includes one without a note (dhh) to show it stays plain
const PEOPLE: readonly Sample[] = [
  ...SAMPLES,
  { handle: 'dhh', name: 'David', bio: '', avatarClass: 'dx-av-orange' },
]

function need<T extends HTMLElement>(id: string, ctor: new () => T): T {
  const node = document.getElementById(id)
  if (!(node instanceof ctor)) throw new Error(`Missing demo element #${id}`)
  return node
}

const nameEl = need('dx-name', HTMLDivElement)
const handleEl = need('dx-handle', HTMLDivElement)
const bioEl = need('dx-bio', HTMLDivElement)
const avatarEl = need('dx-avatar', HTMLDivElement)
const identityEl = need('dx-identity', HTMLDivElement)
const switchRow = need('dx-switch-row', HTMLDivElement)
const peopleRow = need('dx-people', HTMLDivElement)

const tabProfile = need('dx-tab-profile', HTMLButtonElement)
const tabNotes = need('dx-tab-notes', HTMLButtonElement)
const viewProfile = need('dx-view-profile', HTMLElement)
const viewNotes = need('dx-view-notes', HTMLElement)
const resetBtn = need('dx-reset', HTMLButtonElement)

const firstSample = SAMPLES[0]
if (!firstSample) throw new Error('no demo samples')

let panel: PanelHandle | null = null
let current: Sample = firstSample

function switchTab(which: 'profile' | 'notes'): void {
  const profile = which === 'profile'
  viewProfile.hidden = !profile
  viewNotes.hidden = profile
  tabProfile.classList.toggle('dx-active', profile)
  tabNotes.classList.toggle('dx-active', !profile)
}

function mount(sample: Sample): void {
  current = sample
  nameEl.textContent = sample.name
  handleEl.textContent = `@${sample.handle}`
  bioEl.textContent = sample.bio
  avatarEl.textContent = sample.name.charAt(0)
  avatarEl.className = `dx-avatar ${sample.avatarClass}`

  for (const chip of Array.from(switchRow.children)) {
    chip.classList.toggle('dx-active', chip instanceof HTMLElement && chip.dataset.handle === sample.handle)
  }

  panel?.destroy()
  panel = buildPanel(sample.handle, {
    async save(text: string, color: string | null) {
      return upsertNote(sample.handle, { text, color })
    },
    async remove() {
      await deleteNote(sample.handle)
    },
    openNotes() {
      switchTab('notes')
    },
  })
  identityEl.insertAdjacentElement('afterend', panel.root)
  void getNote(sample.handle).then((note) => panel?.update(note))
  // current profile changed → refresh which list avatars are badged (current one is excluded)
  decorateAvatars()
}

function buildPeople(): void {
  for (const person of PEOPLE) {
    const row = document.createElement('div')
    row.className = 'dx-person'

    const avatar = document.createElement('div')
    avatar.className = `dx-pavatar ${person.avatarClass}`
    avatar.setAttribute('data-testid', `UserAvatar-Container-${person.handle}`)
    avatar.textContent = person.name.charAt(0)

    const meta = document.createElement('div')
    meta.className = 'dx-person-meta'
    const nm = document.createElement('div')
    nm.className = 'dx-person-name'
    nm.textContent = person.name
    const hd = document.createElement('div')
    hd.className = 'dx-person-handle'
    hd.textContent = `@${person.handle}`
    meta.append(nm, hd)

    row.append(avatar, meta)
    peopleRow.appendChild(row)
  }
}

function buildSwitcher(): void {
  for (const sample of SAMPLES) {
    const chip = document.createElement('button')
    chip.type = 'button'
    chip.className = 'dx-chip'
    chip.dataset.handle = sample.handle
    chip.textContent = `@${sample.handle}`
    chip.addEventListener('click', () => mount(sample))
    switchRow.appendChild(chip)
  }
}

async function seedIfEmpty(): Promise<void> {
  const existing = await listNotes()
  if (existing.length > 0) return
  await upsertNote('naval', {
    text: 'Sharp threads on wealth & leverage. Reached out about the podcast.',
    color: 'green',
  })
  await upsertNote('paulg', {
    text: 'Essays worth re-reading. Likes counterintuitive takes.',
    color: 'teal',
  })
}

tabProfile.addEventListener('click', () => switchTab('profile'))
tabNotes.addEventListener('click', () => switchTab('notes'))
resetBtn.addEventListener('click', () => {
  localStorage.removeItem('twitterNotes')
  location.reload()
})

buildSwitcher()
buildPeople()
initAvatarBadges(() => current.handle)
void seedIfEmpty().then(() => mount(current))
