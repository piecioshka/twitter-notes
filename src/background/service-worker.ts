// Minimal service worker: opens the page with all notes.
import { isRuntimeMessage } from '../types'

// extension icon click
chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage()
})

// request from the content script (content scripts can't call openOptionsPage directly)
chrome.runtime.onMessage.addListener((message: unknown) => {
  if (isRuntimeMessage(message)) {
    void chrome.runtime.openOptionsPage()
  }
})
