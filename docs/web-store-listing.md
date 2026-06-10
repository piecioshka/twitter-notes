# Chrome Web Store — listing

Copy/paste fields for the Chrome Web Store developer console.

## Title & summary (auto-filled "from package")

The store reads these from `manifest.json` (`name` and `description`) — they are not edited on the Store listing page.

- **Title** (manifest `name`): `Twitter Notes — private notes on X profiles`
- **Summary** (manifest `description`): `Add private notes to profiles on X.com (Twitter). Data stays local and is visible only to you.`

## Product description

```
Twitter Notes lets you keep your own private notes on the people you see on X (Twitter) — reminders, context, anything you want to remember about a profile.

Open any profile and a small panel appears under their name. Write a note, optionally tag it with a color label, and it is saved instantly. Next time you visit that profile, your note is right there.

As you browse, every profile you have noted gets a small colored dot on its avatar across X, so you can spot them at a glance — and your note is shown inside X's own profile hover card.

A dedicated "All notes" page collects everything in one place: switch between a compact table and cards, search by handle or text, filter by color label, and edit or delete notes. Back up or move your notes any time with one-click JSON export and import.

★ 100% private and local
Your notes never leave your device. There is no account, no server, no analytics, and no tracking. Everything is stored locally in your browser using Chrome's storage API. The extension makes zero network requests and does not use the X/Twitter API.

Features
• Add a private note to any X.com profile
• Notes reappear automatically when you return to a profile
• Colored labels (e.g. red = caution, green = OK) — 11 colors to choose from
• A colored dot marks noted profiles on their avatars everywhere on X
• Your note is injected into X's native profile hover card
• "All notes" page: table or card layout, search, color filter, edit, delete
• Export / import all notes as JSON (backup & restore)
• Works on x.com and twitter.com

Permissions
• Storage — to save your notes locally
• Access to x.com / twitter.com — to show the note panel and read the profile handle on the pages you visit

Open source. See the privacy policy for full details.
```

## Category

```
Social Networking
```

(Current Chrome Web Store category names — the old "Productivity" / "Social & Communication" no longer exist. **Social Networking** is a good fit for an X-specific tool. Reasonable alternatives: **Workflow & Planning** (the note-taking angle) or **Tools**.)

## Language

```
English (United States) — en
```

## Privacy practices (developer console → "Privacy" tab)

### Single purpose description

```
Twitter Notes lets you attach your own private text notes to profiles on X.com (Twitter). When you open a profile, a small panel under the profile name lets you write, color-label, and read a note for that profile; the note reappears automatically on later visits, and a small colored dot marks the avatars of profiles you have noted. A dedicated options page lists all your notes for searching, filtering, editing, deleting, and JSON export/import. The single purpose is private, local note-taking about X profiles. All data is stored locally in the browser — nothing is sent to any server.
```

### Permission justifications

**`storage` justification**

```
The storage permission is used to save your notes locally in the browser (chrome.storage.local), so a note you write on a profile persists and reappears when you return. It also stores your layout preference for the "all notes" page (cards or table). No data is transmitted off the device — storage is used purely to keep your notes between sessions.
```

**Host permission justification** (`https://x.com/*`, `https://twitter.com/*`)

```
Host access is limited to x.com and twitter.com — the only sites the extension works on. A content script there reads the profile handle from the page URL/DOM to know which profile you are viewing, injects the note panel under the profile name, and marks noted profiles' avatars with a small dot. It does not send any page data anywhere; it only reads the profile handle locally to match it with your stored note. Access is restricted to these two hosts, not all sites.
```

### Data usage

What user data do you collect? — check only:

- [x] **Website content** — the extension reads the profile handle (text) from x.com pages to associate it with your note, and stores the text notes you write. (Everything stays on your device.)
- [ ] Personally identifiable information · Health · Financial · Authentication · Personal communications · Location · Web history · User activity — **not** collected.

> Note: nothing is transmitted off the device, so under a strict "collect = transmit" reading you could select none — but because the extension reads page content via the host permission, declaring **Website content** is the honest, conservative choice.

Certify all three (true for this extension — check all):

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases.
- [x] I do not use or transfer user data for purposes unrelated to my item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Other listing assets (reference)

- **Store icon:** 128×128 PNG (`public/icons/128.png`).
- **Screenshots:** 1280×800, 24-bit PNG, no alpha — `screenshots/` (light mode). ✓ verified format.
- **Promo tiles** (optional): Small 440×280, Marquee 1400×560 — can be left empty.
- **Homepage URL:** `https://github.com/piecioshka/twitter-notes`
- **Support URL:** `https://github.com/piecioshka/twitter-notes/issues` _(currently empty — worth adding)_
- **Privacy policy URL:** raw/blob URL of `privacy-policy.md` on GitHub.
- **Mature content:** No.
- **Package to upload:** run `npm run package` → `twitter-notes.zip`.
