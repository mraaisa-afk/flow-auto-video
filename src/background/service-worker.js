// Flow Auto Video — MV3 background service worker
//
// IMPORTANT (MV3 reality): this worker is EPHEMERAL — Chrome kills it after
// ~30s idle. Do NOT use setInterval and do NOT keep state in memory. Use
// chrome.alarms for recurring work and persist everything to chrome.storage.
//
// This is the Push 0 scaffold; real logic lands in Phase 1 (health heartbeat)
// and Phase 2 (task polling + completion notifications).

import { ALARMS } from "../lib/constants.js"

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Flow Auto Video] installed — scaffold v0.0.1")
  // Phase 1: chrome.alarms.create(ALARMS.healthCheck, { periodInMinutes: 1 })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case ALARMS.healthCheck:
      // Phase 1: ping ENDPOINTS.health, cache status + update icon badge
      break
    case ALARMS.pollTasks:
      // Phase 2: poll in-flight tasks, download results, fire notifications
      break
    default:
      break
  }
})
