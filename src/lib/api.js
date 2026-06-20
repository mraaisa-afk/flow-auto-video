// Flow Auto Video — G-Labs Webhook API client (submit → poll → download).
import { getSecure } from "./storage.js"
import { STORAGE_KEYS, WEBHOOK_HOST } from "./constants.js"
import { recordApiCall } from "./apiLog.js"

export async function getApiConfig() {
  const s = await getSecure(STORAGE_KEYS.settings, null)
  const host = (s?.webhookHost || WEBHOOK_HOST).replace(/\/+$/, "")
  const apiKey = s?.apiKey || ""
  return { host, apiKey }
}

export async function submitGeneration(kind, body) {
  const { host, apiKey } = await getApiConfig()
  if (!apiKey) throw new Error("Add your webhook API key in Settings first.")
  const path = `/api/${kind}/generate`
  const t0 = Date.now()
  let res
  try {
    res = await fetch(`${host}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify(body),
    })
  } catch (_) {
    recordApiCall({ method: "POST", path, status: null, ok: false, ms: Date.now() - t0, note: "network error" })
    throw new Error("Cannot reach the backend. Is the G-Labs Webhook server running?")
  }
  const data = await res.json().catch(() => ({}))
  recordApiCall({ method: "POST", path, status: res.status, ok: res.ok, ms: Date.now() - t0 })
  if (!res.ok) throw new Error(data?.error || `Submit failed (${res.status})`)
  return data // { task_id, status, poll_url }
}

export async function getStatus(taskId) {
  const { host, apiKey } = await getApiConfig()
  const res = await fetch(`${host}/api/status/${taskId}`, { headers: { "X-API-Key": apiKey } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `Status failed (${res.status})`)
  return data
}

// Result URLs come back absolute (http://127.0.0.1:port/...). Rebase onto the
// configured host so a custom port/tunnel still resolves.
export function rebaseFileUrl(resultUrl, host) {
  try {
    const u = new URL(resultUrl)
    return `${host}${u.pathname}${u.search}`
  } catch (_) {
    return `${host}${resultUrl.startsWith("/") ? "" : "/"}${resultUrl}`
  }
}

export async function pollUntilDone(taskId, opts = {}) {
  const { onUpdate, intervalMs = 4000, timeoutMs = 900000, signal } = opts
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error("Cancelled")
    const s = await getStatus(taskId)
    onUpdate?.(s)
    if (s.status === "completed") return s
    if (s.status === "failed") {
      const err = new Error(s.error || "Generation failed")
      err.code = s.error_code
      err.detail = s.error_detail
      throw err
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`Timed out after ${Math.round(timeoutMs / 1000)}s`)
}
