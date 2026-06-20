// Flow Auto Video — prompt template library with {variable} placeholders.
//
// Templates store a body like "A {character} in {setting}, {style} style".
// extractVariables finds the unique {names}; fillTemplate substitutes values
// and leaves any unfilled placeholders untouched.
import { getSecure, setSecure } from "./storage.js"
import { STORAGE_KEYS } from "./constants.js"

const VAR_RE = /\{\s*([a-zA-Z0-9_ -]+?)\s*\}/g

export function extractVariables(body) {
  const out = []
  let m
  VAR_RE.lastIndex = 0
  while ((m = VAR_RE.exec(body || "")) !== null) {
    const name = m[1].trim()
    if (name && !out.includes(name)) out.push(name)
  }
  return out
}

export function fillTemplate(body, values = {}) {
  return (body || "").replace(VAR_RE, (full, raw) => {
    const name = raw.trim()
    const v = values[name]
    return v == null || v === "" ? full : String(v)
  })
}

export async function getTemplates() {
  const list = await getSecure(STORAGE_KEYS.templates, [])
  return Array.isArray(list) ? list : []
}

export async function saveTemplate({ id, name, kind, body }) {
  const cur = await getTemplates()
  const clean = {
    id: id || "t_" + Date.now().toString(36),
    name: (name || "Untitled").trim(),
    kind: kind || "image",
    body: body || "",
    variables: extractVariables(body),
    updatedAt: Date.now(),
  }
  const idx = cur.findIndex((t) => t.id === clean.id)
  let next
  if (idx === -1) {
    next = [clean, ...cur]
  } else {
    next = cur.slice()
    next[idx] = { ...cur[idx], ...clean }
  }
  await setSecure(STORAGE_KEYS.templates, next)
  return next
}

export async function removeTemplate(id) {
  const cur = await getTemplates()
  const next = cur.filter((t) => t.id !== id)
  await setSecure(STORAGE_KEYS.templates, next)
  return next
}
