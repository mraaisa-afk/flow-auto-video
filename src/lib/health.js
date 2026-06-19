// Backend health check + extension icon badge.
// Runs in the service worker (chrome.action) but is also safe to import in UI.
import { ENDPOINTS, STORAGE_KEYS } from "./constants.js"

const BADGE = {
  connected: { text: " ", color: "#22c55e" },
  partial: { text: "!", color: "#eab308" },
  disconnected: { text: "\u00d7", color: "#ef4444" },
  unknown: { text: "", color: "#71717a" },
}

export function applyBadge(state) {
  const cfg = BADGE[state] || BADGE.unknown
  try {
    chrome.action.setBadgeBackgroundColor({ color: cfg.color })
    chrome.action.setBadgeText({ text: cfg.text })
  } catch (_) {}
}

export async function checkHealth() {
  let state = "disconnected"
  let detail = null
  try {
    const res = await fetch(ENDPOINTS.health, { method: "GET" })
    if (res.ok) {
      const body = await res.json().catch(() => ({}))
      state = body?.status === "degraded" ? "partial" : "connected"
      detail = body
    } else {
      state = "partial"
      detail = { httpStatus: res.status }
    }
  } catch (e) {
    state = "disconnected"
    detail = { error: e?.message || String(e) }
  }
  const record = { state, detail, lastChecked: Date.now() }
  await chrome.storage.local.set({ [STORAGE_KEYS.healthState]: record })
  applyBadge(state)
  return record
}
