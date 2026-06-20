// Flow Auto Video — lightweight UI preferences (plain chrome.storage.local).
// Currently: high-contrast theme + first-run onboarding flag.
import { STORAGE_KEYS } from "./constants.js"

const DEFAULT_PREFS = { highContrast: false }

export async function getPrefs() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.prefs)
  return { ...DEFAULT_PREFS, ...(r[STORAGE_KEYS.prefs] || {}) }
}

export async function setPrefs(patch) {
  const cur = await getPrefs()
  const next = { ...cur, ...patch }
  await chrome.storage.local.set({ [STORAGE_KEYS.prefs]: next })
  applyTheme(next)
  return next
}

// Reflect prefs onto <html> so CSS hooks (data-contrast) take effect.
export function applyTheme(prefs) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  if (prefs && prefs.highContrast) root.setAttribute("data-contrast", "high")
  else root.removeAttribute("data-contrast")
}

export async function isOnboarded() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.onboarded)
  return !!r[STORAGE_KEYS.onboarded]
}

export async function setOnboarded(v = true) {
  await chrome.storage.local.set({ [STORAGE_KEYS.onboarded]: !!v })
}
