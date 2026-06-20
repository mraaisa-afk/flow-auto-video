// Flow Auto Video — portable config backup (export / import as JSON).
//
// Bundles the user's local intelligence — settings, accounts, rotation,
// templates and prompt history — into one JSON file that can be restored on
// another machine. Secrets (the API key) are included only when the user opts
// in. Values are exported DECRYPTED so they survive a per-install crypto key.
import { getSecure, setSecure } from "./storage.js"
import { STORAGE_KEYS } from "./constants.js"

const EXPORT_VERSION = 1

// Sections stored via the encrypted wrapper.
const SECURE_SECTIONS = {
  settings: STORAGE_KEYS.settings,
  accounts: STORAGE_KEYS.accounts,
  rotation: STORAGE_KEYS.rotation,
  templates: STORAGE_KEYS.templates,
  promptHistory: STORAGE_KEYS.promptHistory,
}

export async function buildExport({ includeSecrets = true } = {}) {
  const data = {}
  for (const [name, key] of Object.entries(SECURE_SECTIONS)) {
    data[name] = await getSecure(key, null)
  }
  if (!includeSecrets && data.settings) {
    data.settings = { ...data.settings, apiKey: "" }
  }
  const prefsRec = await chrome.storage.local.get(STORAGE_KEYS.prefs)
  data.prefs = prefsRec[STORAGE_KEYS.prefs] || null
  return {
    app: "flow-auto-video",
    type: "config-backup",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export async function exportConfigJson(opts) {
  return JSON.stringify(await buildExport(opts), null, 2)
}

export function summarizeConfig(obj) {
  const d = (obj && obj.data) || {}
  return {
    accounts: Array.isArray(d.accounts) ? d.accounts.length : 0,
    templates: Array.isArray(d.templates) ? d.templates.length : 0,
    promptHistory: Array.isArray(d.promptHistory) ? d.promptHistory.length : 0,
    hasSettings: !!d.settings,
    hasRotation: !!d.rotation,
  }
}

export function parseConfig(text) {
  let obj
  try {
    obj = JSON.parse(text)
  } catch (_) {
    throw new Error("Not valid JSON.")
  }
  if (!obj || obj.app !== "flow-auto-video" || obj.type !== "config-backup") {
    throw new Error("This file is not a Flow Auto Video backup.")
  }
  if (!obj.data || typeof obj.data !== "object") {
    throw new Error("Backup contains no data.")
  }
  return obj
}

export async function importConfig(obj, { sections } = {}) {
  const d = obj.data || {}
  const applied = []
  const want = (name) => !sections || sections.includes(name)
  for (const [name, key] of Object.entries(SECURE_SECTIONS)) {
    if (want(name) && d[name] != null) {
      await setSecure(key, d[name])
      applied.push(name)
    }
  }
  if (want("prefs") && d.prefs != null) {
    await chrome.storage.local.set({ [STORAGE_KEYS.prefs]: d.prefs })
    applied.push("prefs")
  }
  return applied
}
