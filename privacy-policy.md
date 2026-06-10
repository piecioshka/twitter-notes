# Privacy Policy

_Last updated: June 10, 2026_

## Overview

Twitter Notes is a Chrome/Chromium extension that lets you attach private notes to profiles on
X.com (Twitter). This privacy policy explains how the extension handles your information.

The short version: **everything stays on your device. The extension has no server, makes no
network requests, and contains no analytics or tracking.**

## Information We Collect

### Notes You Create

The extension stores the notes you write locally in your browser using Chrome's storage API:

- **Profile handle** (`@handle`) the note is attached to
- **Note text** you type
- **Label color** you assign (optional)
- **Layout preference** for the "All notes" page (cards or table)

### Data Read From Pages

To do its job the extension reads, but does not store, the following from X.com pages you open:

- **The profile handle** in the page URL, to know which profile you are viewing
- **The avatar/profile markup** (`data-testid` attributes), to place the note panel and the
  small colored dot in the right spot

## How We Use Your Information

### Local Processing Only

- All processing happens locally in your browser.
- The extension does not send any data to external servers.
- No personal information is transmitted off your device.

### Functionality

Your stored notes are used only to:

- Show the note again when you return to a profile
- Mark profiles that have a note with a small colored dot on their avatar
- List, search, filter, edit and delete your notes on the "All notes" page

## Data Storage

### Local Storage

- All notes are stored locally using Chrome's `storage.local` API.
- Data stays on the device where it was created; it is not synced to the cloud by the extension.
- No data is stored on external servers.

### Data Retention

- Notes persist until you delete them or uninstall the extension.
- You can export all notes to a JSON file at any time, and import them back, from the
  "All notes" page.

## Data Sharing

### No Third-Party Sharing

- The extension does not share, sell, or transmit your data to anyone.
- No analytics, tracking, or monitoring services are used.
- No external APIs or services are contacted — including no calls to the X/Twitter API.

## Your Rights and Controls

### Data Management

- **View / Edit / Delete**: Manage every note on the "All notes" page.
- **Export**: Download all notes as a JSON backup.
- **Import**: Restore notes from a JSON backup (merge or replace).

### Uninstalling

- Uninstalling the extension removes all stored notes.
- No residual data remains after uninstallation.

## Security

### Data Protection

- All data remains on your local device.
- Chrome's built-in security protects your stored notes.
- No network transmission means no risk of data interception.

### Permissions

The extension requests only the minimum necessary permissions:

- **Storage**: to save your notes locally.
- **Host access to `x.com` / `twitter.com`**: to inject the note panel and read the profile
  handle on the pages you visit.

## Children's Privacy

This extension does not knowingly collect information from children under 13. It is a personal
note-taking tool for X.com users.

## Updates to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the
"Last updated" date at the top. Continued use of the extension after changes constitutes
acceptance of the updated policy.

## Technical Details

### Open Source

- The extension's source code is available for inspection.
- No obfuscated or hidden functionality.
- Transparent operation and data handling.

### Minimal Data Collection

- Only the notes you create are stored.
- No behavioral tracking or analytics.

## Compliance

This privacy policy is designed to comply with:

- Chrome Web Store Developer Program Policies
- General data protection principles
- Privacy best practices for browser extensions

---

_This privacy policy applies specifically to the "Twitter Notes" Chrome extension and describes
only the data practices of this extension._
