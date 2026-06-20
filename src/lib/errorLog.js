// Flow Auto Video — error timeline log (diagnostics).
//
// Plain chrome.storage.local: these are codes/messages for the Activity tab,
// not secrets. Newest-first, capped. Written by the background worker and the
// UI; read by the Activity (error timeline) view.
import { STORAGE_KEYS } from "./constants.js"

const MAX_ENTRIES = 200

export async function getErrorLog() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.errorLog)
  const list = r[STORAGE_KEYS.errorLog]
  return Array.isArray(list) ? list : []
}

export async function recordError(entry = {}) {
  try {
    const cur = await getErrorLog()
    const item = {
      id: "err_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ts: Date.now(),
      kind: entry.kind || "system", // image | video | grok | system
      taskKey: entry.taskKey || null,
      code: entry.code == null ? null : entry.code, // numeric error_code (429, 403, ...)
      message: entry.message || "Error",
      detail: entry.detail || null,
      account: entry.account || null, // advisory account email/label
    }
    const next = [item, ...cur].slice(0, MAX_ENTRIES)
    await chrome.storage.local.set({ [STORAGE_KEYS.errorLog]: next })
    return item
  } catch (_) {
    // best effort — never let logging break a flow
  }
}

export async function clearErrorLog() {
  await chrome.storage.local.set({ [STORAGE_KEYS.errorLog]: [] })
}
