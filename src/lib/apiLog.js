// Flow Auto Video — webhook event log (developer diagnostics).
//
// Plain chrome.storage.local: a rolling record of API calls the extension made
// (real generations from the background + manual calls from the Dev playground).
// Newest-first, capped. Read by the Developer tab's event log.
import { STORAGE_KEYS } from "./constants.js"

const MAX_ENTRIES = 100

export async function getApiLog() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.apiLog)
  const list = r[STORAGE_KEYS.apiLog]
  return Array.isArray(list) ? list : []
}

export async function recordApiCall(entry = {}) {
  try {
    const cur = await getApiLog()
    const item = {
      id: "log_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ts: Date.now(),
      method: entry.method || "GET",
      path: entry.path || "",
      status: entry.status == null ? null : entry.status,
      ok: !!entry.ok,
      ms: entry.ms == null ? null : entry.ms,
      source: entry.source || "app", // app | background | playground
      note: entry.note || null,
    }
    const next = [item, ...cur].slice(0, MAX_ENTRIES)
    await chrome.storage.local.set({ [STORAGE_KEYS.apiLog]: next })
    return item
  } catch (_) {
    // best effort — never let logging break a flow
  }
}

export async function clearApiLog() {
  await chrome.storage.local.set({ [STORAGE_KEYS.apiLog]: [] })
}
