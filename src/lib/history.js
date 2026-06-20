// Flow Auto Video — prompt history (last 50, newest-first, one-click reuse).
import { getSecure, setSecure } from "./storage.js"
import { STORAGE_KEYS } from "./constants.js"

const MAX_HISTORY = 50

export async function getHistory() {
  const list = await getSecure(STORAGE_KEYS.promptHistory, [])
  return Array.isArray(list) ? list : []
}

export async function addHistory({ kind, prompt }) {
  const text = (prompt || "").trim()
  if (!text) return getHistory()
  const cur = await getHistory()
  // De-dupe identical prompts, then prepend the newest.
  const deduped = cur.filter((h) => h.prompt !== text)
  const next = [
    { id: "h_" + Date.now().toString(36), kind: kind || "image", prompt: text, at: Date.now() },
    ...deduped,
  ].slice(0, MAX_HISTORY)
  await setSecure(STORAGE_KEYS.promptHistory, next)
  return next
}

export async function removeHistory(id) {
  const cur = await getHistory()
  const next = cur.filter((h) => h.id !== id)
  await setSecure(STORAGE_KEYS.promptHistory, next)
  return next
}

export async function clearHistory() {
  await setSecure(STORAGE_KEYS.promptHistory, [])
  return []
}

export function searchHistory(list, q) {
  const term = (q || "").trim().toLowerCase()
  if (!term) return list
  return list.filter((h) => h.prompt.toLowerCase().includes(term))
}
