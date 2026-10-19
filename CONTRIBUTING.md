# Contributing to Twitter Notes

How to build the extension, run the demo and work on the code. For what the extension does and how to install it from the Chrome Web Store, see the [README](README.md).

## Requirements

- Node.js 24 LTS (from `.nvmrc`; `package.json` requires `node >= 24`)
- Chrome / Brave / Edge / Arc (Chromium engine)

## Install (developer mode)

```bash
npm install
npm run build      # one-off build into the dist/ folder
# or:
npm run dev        # developer mode with HMR (CRXJS)
```

Then:

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right corner).
3. Click **Load unpacked** and select the **`dist/`** folder.
4. Open any profile on `x.com` - the note panel appears under the name.

Open the all-notes page by clicking the extension icon in the toolbar (or the "All notes" button in the panel).

## Demo

A standalone page mounts the real note panel on a mock X profile and runs the real "all notes" page, backed by `localStorage` instead of `chrome.storage`, so you can try the UI without installing the extension or logging in to X:

```bash
npm install
npm run demo        # opens http://localhost:5174
```

`npm run demo:build` builds a static version into `demo-dist/`.

## Scripts

| Command              | What it does                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `npm run dev`        | Vite dev server with CRXJS HMR (port 5173)                        |
| `npm run build`      | type check, then production build into `dist/`                    |
| `npm run preview`    | preview of the build                                              |
| `npm run typecheck`  | `tsc --noEmit`                                                    |
| `npm run demo`       | standalone interactive demo (port 5174)                           |
| `npm run demo:build` | static build of the demo into `demo-dist/`                        |
| `npm run package`    | build and zip `dist/` into `twitter-notes.zip` (without maps/svg) |

## Project structure

| Path                         | Contents                                                  |
| ---------------------------- | --------------------------------------------------------- |
| `manifest.json`              | Manifest V3 definition                                    |
| `src/content/`               | content scripts injected into X (panel, avatars, UI, CSS) |
| `src/background/`            | service worker                                            |
| `src/options/`               | the all-notes page (HTML, TS, CSS)                        |
| `src/storage.ts`, `types.ts` | note storage over `chrome.storage.local` and data types   |
| `demo/`                      | standalone demo app (plain Vite, no CRXJS)                |
| `public/icons/`              | extension icons                                           |
| `vite.config.ts`             | extension build (CRXJS)                                   |
| `vite.config.demo.ts`        | demo build                                                |
| `docs/web-store-listing.md`  | copy for the Chrome Web Store console                     |

Notes live only in `chrome.storage.local`; there is no server, login or analytics. A note is keyed by profile `@handle`; the `schemaVersion` field leaves room for keying by an immutable ID later. The content scripts anchor on `data-testid` attributes, the most stable part of X's markup.

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests: `npm ci` and `npm run build` (which also type-checks) on the Node version from `.nvmrc`.

## Conventions

- TypeScript. Run `npm run typecheck` (or `npm run build`) before committing.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`); plain imperative sentences also appear in the history.
- Temporary files go to `tmp/`, which is gitignored.
