// Flow Auto Video — MV3 background service worker (v0.1.0)
//
// MV3 reality: this worker is EPHEMERAL. We use chrome.alarms (never
// setInterval) and persist all state to chrome.storage.

import { ALARMS } from "../lib/constants.js"
import { checkHealth, applyBadge } from "../lib/health.js"

function ensureAlarms() {
  chrome.alarms.create(ALARMS.healthCheck, { periodInMinutes: 1 })
}

// Side-panel-first: clicking the toolbar icon opens the roomy, resizable side
// panel (the real workspace) instead of a cramped fixed-width popup.
async function enableSidePanelOnClick() {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  } catch (_) {}
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log("[Flow Auto Video] installed — v0.1.0")
  applyBadge("unknown")
  ensureAlarms()
  await enableSidePanelOnClick()
  checkHealth()
})

chrome.runtime.onStartup?.addListener(async () => {
  ensureAlarms()
  await enableSidePanelOnClick()
  checkHealth()
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARMS.healthCheck) checkHealth()
  // ALARMS.pollTasks handled in Phase 4 (background long-task polling)
})

// On-demand requests from the side panel
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "CHECK_HEALTH") {
    checkHealth().then((r) => sendResponse(r))
    return true // keep channel open for async response
  }
  return false
})
