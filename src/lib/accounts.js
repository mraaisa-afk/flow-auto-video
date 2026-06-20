// Flow Auto Video — Account Intelligence: store, health scoring, rotation,
// quota tracking and bulk import. Accounts are the Google/Grok identities the
// desktop app manages; the extension adds local intelligence on top.
import { atom } from "nanostores"
import { getSecure, setSecure } from "./storage.js"
import { STORAGE_KEYS } from "./constants.js"

// --- Stores -----------------------------------------------------------
export const $accounts = atom([])

export const DEFAULT_ROTATION = {
  enabled: false,
  strategy: "priority", // priority | round_robin | least_used
  tierFilter: "any", // any | standard | ultra
  routing: { image: "any", video: "any", grok: "any" },
  cursor: 0, // round-robin pointer
}
export const $rotation = atom(DEFAULT_ROTATION)

export const GROUP_OPTIONS = ["Image", "Video", "Grok", "ULTRA"]

export function uid() {
  return "acc_" + Math.random().toString(36).slice(2, 10)
}

function nextMidnight() {
  const d = new Date()
  d.setHours(24, 0, 0, 0)
  return d.getTime()
}

function migrate(a) {
  return {
    id: a.id || uid(),
    label: a.label || a.email || "Account",
    email: a.email || "",
    tier: a.tier === "ultra" ? "ultra" : "standard",
    groups: Array.isArray(a.groups) ? a.groups : [],
    enabled: a.enabled !== false,
    priority: typeof a.priority === "number" ? a.priority : 100,
    stats: {
      success: a.stats?.success || 0,
      fail: a.stats?.fail || 0,
      lastLatencyMs: a.stats?.lastLatencyMs || null,
      lastError: a.stats?.lastError || null,
      lastErrorCode: a.stats?.lastErrorCode || null,
      lastUsedAt: a.stats?.lastUsedAt || null,
    },
    quota: {
      dailyLimit: a.quota?.dailyLimit || 0, // 0 = unknown / unlimited
      usedToday: a.quota?.usedToday || 0,
      resetAt: a.quota?.resetAt || nextMidnight(),
    },
    createdAt: a.createdAt || Date.now(),
  }
}

async function persist() {
  await setSecure(STORAGE_KEYS.accounts, $accounts.get())
}

async function persistRotation() {
  await setSecure(STORAGE_KEYS.rotation, $rotation.get())
}

export async function loadAccounts() {
  const [accts, rot] = await Promise.all([
    getSecure(STORAGE_KEYS.accounts, []),
    getSecure(STORAGE_KEYS.rotation, DEFAULT_ROTATION),
  ])
  $accounts.set(Array.isArray(accts) ? accts.map(migrate) : [])
  $rotation.set({ ...DEFAULT_ROTATION, ...(rot || {}), routing: { ...DEFAULT_ROTATION.routing, ...(rot?.routing || {}) } })
}

// --- CRUD -------------------------------------------------------------
export async function addAccount(patch) {
  const acct = migrate({ ...patch, id: uid(), createdAt: Date.now() })
  $accounts.set([...$accounts.get(), acct])
  await persist()
  return acct
}

export async function addAccounts(list) {
  const migrated = list.map((p) => migrate({ ...p, id: uid(), createdAt: Date.now() }))
  $accounts.set([...$accounts.get(), ...migrated])
  await persist()
  return migrated
}

function deepMerge(a, patch) {
  const out = { ...a, ...patch }
  if (patch.stats) out.stats = { ...a.stats, ...patch.stats }
  if (patch.quota) out.quota = { ...a.quota, ...patch.quota }
  return out
}

export async function updateAccount(id, patch) {
  $accounts.set($accounts.get().map((a) => (a.id === id ? deepMerge(a, patch) : a)))
  await persist()
}

export async function removeAccount(id) {
  $accounts.set($accounts.get().filter((a) => a.id !== id))
  await persist()
}

export async function setEnabled(id, enabled) {
  await updateAccount(id, { enabled })
}

// --- Quota reset ------------------------------------------------------
export function withQuotaReset(a) {
  if (a.quota?.resetAt && Date.now() >= a.quota.resetAt) {
    return { ...a, quota: { ...a.quota, usedToday: 0, resetAt: nextMidnight() } }
  }
  return a
}

export async function refreshQuotaResets() {
  let changed = false
  const next = $accounts.get().map((a) => {
    const r = withQuotaReset(a)
    if (r !== a) changed = true
    return r
  })
  if (changed) {
    $accounts.set(next)
    await persist()
  }
}

// --- Health scoring ---------------------------------------------------
// Returns { score 0-100, band, successRate, remaining, total }.
export function scoreAccount(a) {
  const acct = withQuotaReset(a)
  const total = acct.stats.success + acct.stats.fail
  const successRate = total === 0 ? 1 : acct.stats.success / total
  const remaining =
    acct.quota.dailyLimit > 0 ? Math.max(0, acct.quota.dailyLimit - acct.quota.usedToday) : null
  const quotaRatio = acct.quota.dailyLimit > 0 ? remaining / acct.quota.dailyLimit : 1

  // 65% success rate + 35% quota headroom.
  let score = Math.round((successRate * 0.65 + quotaRatio * 0.35) * 100)

  // A recent quota error is a strong negative signal.
  if (acct.stats.lastErrorCode === 429) score = Math.min(score, 35)
  if (!acct.enabled) score = 0

  const band = !acct.enabled
    ? "off"
    : score >= 75
      ? "green"
      : score >= 45
        ? "yellow"
        : "red"

  return { score, band, successRate, remaining, total }
}

export const BAND_META = {
  green: { dot: "bg-emerald-400", text: "text-emerald-400", label: "Healthy" },
  yellow: { dot: "bg-amber-400", text: "text-amber-400", label: "Watch" },
  red: { dot: "bg-rose-500", text: "text-rose-400", label: "At risk" },
  off: { dot: "bg-zinc-600", text: "text-zinc-500", label: "Disabled" },
}

// --- Usage recording (consumed by auto-retry/rotation in Phase 4) -----
export async function recordResult(id, { ok, latencyMs, errorCode, error } = {}) {
  const a = $accounts.get().find((x) => x.id === id)
  if (!a) return
  const stats = { ...a.stats, lastUsedAt: Date.now() }
  if (ok) {
    stats.success = a.stats.success + 1
    stats.lastLatencyMs = latencyMs ?? a.stats.lastLatencyMs
    stats.lastError = null
    stats.lastErrorCode = null
  } else {
    stats.fail = a.stats.fail + 1
    stats.lastError = error || "error"
    stats.lastErrorCode = errorCode ?? null
  }
  const quota = { ...a.quota, usedToday: a.quota.usedToday + 1 }
  await updateAccount(id, { stats, quota })
}

// --- Rotation selection -----------------------------------------------
// Pick the next eligible account for an endpoint (image|video|grok).
export function selectAccount(kind, opts = {}) {
  const rot = $rotation.get()
  const route = rot.routing?.[kind] || "any"
  let pool = $accounts.get().map(withQuotaReset).filter((a) => a.enabled)

  if (rot.tierFilter && rot.tierFilter !== "any") {
    pool = pool.filter((a) => a.tier === rot.tierFilter)
  }
  if (route && route !== "any") {
    pool = pool.filter((a) => a.groups.includes(route))
  }
  pool = pool.filter((a) => {
    if (a.stats.lastErrorCode === 429) return false
    if (a.quota.dailyLimit > 0 && a.quota.usedToday >= a.quota.dailyLimit) return false
    return true
  })
  if (opts.exclude) pool = pool.filter((a) => !opts.exclude.includes(a.id))
  if (pool.length === 0) return null

  if (rot.strategy === "least_used") {
    pool.sort((x, y) => x.quota.usedToday - y.quota.usedToday)
    return pool[0]
  }
  if (rot.strategy === "round_robin") {
    return pool[(rot.cursor || 0) % pool.length]
  }
  // priority (default): lowest priority number, tie-break by health.
  pool.sort((x, y) => x.priority - y.priority || scoreAccount(y).score - scoreAccount(x).score)
  return pool[0]
}

export async function advanceCursor() {
  const rot = $rotation.get()
  $rotation.set({ ...rot, cursor: (rot.cursor || 0) + 1 })
  await persistRotation()
}

export async function setRotation(patch) {
  $rotation.set({ ...$rotation.get(), ...patch })
  await persistRotation()
}

export async function setRouting(kind, value) {
  const rot = $rotation.get()
  await setRotation({ routing: { ...rot.routing, [kind]: value } })
}

// --- Bulk import / export --------------------------------------------
// Accepts CSV / pasted lines. Columns (flexible, header optional):
//   label, email, tier, groups (| or ; separated), dailyLimit
// A single email per line also works.
function splitCsvLine(line) {
  const out = []
  let cur = ""
  let q = false
  for (const ch of line) {
    if (ch === '"') q = !q
    else if (ch === "," && !q) {
      out.push(cur.trim())
      cur = ""
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}

export function parseAccountsImport(text) {
  const rows = []
  const errors = []
  const lines = (text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return { rows, errors }

  let start = 0
  const first = lines[0].toLowerCase()
  if (/\b(label|email|tier|group|limit)\b/.test(first) && first.includes(",")) start = 1

  for (let i = start; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    let label = ""
    let email = ""
    let tier = "standard"
    let groups = []
    let dailyLimit = 0
    if (cells.length === 1) {
      const v = cells[0]
      if (v.includes("@")) {
        email = v
        label = v
      } else label = v
    } else {
      label = cells[0] || cells[1] || "Account"
      email = cells[1] || ""
      tier = /ultra/i.test(cells[2] || "") ? "ultra" : "standard"
      groups = (cells[3] || "").split(/[|;]/).map((g) => g.trim()).filter(Boolean)
      const n = parseInt(cells[4] || "", 10)
      dailyLimit = Number.isFinite(n) ? n : 0
    }
    if (!label && !email) {
      errors.push(`Line ${i + 1}: empty`)
      continue
    }
    rows.push({ label: label || email, email, tier, groups, quota: { dailyLimit } })
  }
  return { rows, errors }
}

export function exportAccountsCsv(list) {
  const header = "label,email,tier,groups,dailyLimit"
  const body = list
    .map((a) =>
      [a.label, a.email, a.tier, a.groups.join("|"), a.quota.dailyLimit]
        .map((v) => (String(v).includes(",") ? `"${v}"` : String(v)))
        .join(",")
    )
    .join("\n")
  return `${header}\n${body}`
}
