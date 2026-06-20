import { useEffect, useMemo, useState } from "preact/hooks"
import { getApiConfig } from "../lib/api.js"
import { getApiLog, clearApiLog, recordApiCall } from "../lib/apiLog.js"
import { STORAGE_KEYS } from "../lib/constants.js"
import { toastSuccess, toastError } from "../lib/toast.js"
import { Select } from "../components/forms.jsx"
import {
  Terminal,
  Send,
  Copy,
  Trash2,
  Loader2,
  Link2,
  ServerCog,
  ChevronDown,
} from "lucide-preact"

const PRESETS = [
  { id: "health", method: "GET", path: "/api/health", keyless: true, body: null },
  {
    id: "image",
    method: "POST",
    path: "/api/image/generate",
    body: { prompt: "A serene mountain lake at sunrise", model: "nano_banana_2", aspect_ratio: "16:9" },
  },
  {
    id: "video",
    method: "POST",
    path: "/api/video/generate",
    body: {
      prompt: "Slow cinematic drone shot over a misty forest",
      model: "veo_31_fast",
      aspect_ratio: "16:9",
      mode: "text_to_video",
      resolution: ["720p"],
      video_length: 8,
    },
  },
  {
    id: "grok",
    method: "POST",
    path: "/api/grok/generate",
    body: { prompt: "A neon cyberpunk cat on a rooftop", mode: "t2i", aspect_ratio: "9:16" },
  },
  { id: "status", method: "GET", path: "/api/status/", needsTaskId: true, body: null },
]

const PRESET_OPTIONS = PRESETS.map((p) => ({
  value: p.id,
  label: `${p.method} ${p.path}${p.needsTaskId ? "{task_id}" : ""}`,
}))

function maskKey(k) {
  if (!k) return "(not set)"
  if (k.length <= 6) return "\u2022".repeat(k.length)
  return k.slice(0, 3) + "\u2022".repeat(Math.min(12, k.length - 6)) + k.slice(-3)
}

function statusColor(ok, status) {
  if (status == null) return "text-rose-400"
  if (ok) return "text-emerald-400"
  if (status === 429) return "text-amber-400"
  return "text-rose-400"
}

async function copy(text, label) {
  try {
    await navigator.clipboard.writeText(text)
    toastSuccess(`${label} copied`)
  } catch (_) {
    toastError("Copy failed \u2014 select and copy manually")
  }
}

function Section({ icon, title, desc, children, right }) {
  const Icon = icon
  return (
    <section class="fav-card space-y-3">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2.5">
          <span class="grid h-8 w-8 place-items-center rounded-lg bg-surface-3/70 text-brand-300">
            <Icon size={16} />
          </span>
          <div>
            <h2 class="text-sm font-semibold text-white">{title}</h2>
            {desc && <p class="text-[11px] text-zinc-500">{desc}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function EventLog() {
  const [log, setLog] = useState([])
  useEffect(() => {
    getApiLog().then(setLog)
    const onChanged = (changes, area) => {
      if (area !== "local") return
      if (changes[STORAGE_KEYS.apiLog]) {
        const v = changes[STORAGE_KEYS.apiLog].newValue
        setLog(Array.isArray(v) ? v : [])
      }
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  return (
    <Section
      icon={ServerCog}
      title="Webhook event log"
      desc="Recent API calls (live + playground)"
      right={
        log.length > 0 && (
          <button
            type="button"
            onClick={() => clearApiLog().then(() => setLog([]))}
            class="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-1 px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-rose-300"
          >
            <Trash2 size={13} /> Clear
          </button>
        )
      }
    >
      {log.length === 0 ? (
        <p class="py-4 text-center text-[11px] text-zinc-600">
          No calls yet. Run a generation or use the playground above.
        </p>
      ) : (
        <div class="max-h-72 space-y-1 overflow-y-auto font-mono">
          {log.map((e) => (
            <div key={e.id} class="flex items-center gap-2 rounded-md border border-surface-border bg-surface-1 px-2 py-1.5 text-[10px]">
              <span class={`w-9 shrink-0 font-semibold ${e.method === "POST" ? "text-brand-300" : "text-zinc-400"}`}>{e.method}</span>
              <span class="flex-1 truncate text-zinc-300">{e.path}</span>
              {e.source === "playground" && <span class="shrink-0 rounded bg-surface-3/60 px-1 text-[9px] text-zinc-400">test</span>}
              <span class="shrink-0 tabular-nums text-zinc-600">{e.ms == null ? "" : `${e.ms}ms`}</span>
              <span class={`w-7 shrink-0 text-right font-semibold ${statusColor(e.ok, e.status)}`}>{e.status == null ? "ERR" : e.status}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

export function Developer() {
  const [cfg, setCfg] = useState({ host: "", apiKey: "" })
  const [presetId, setPresetId] = useState("health")
  const [body, setBody] = useState("")
  const [taskId, setTaskId] = useState("")
  const [sending, setSending] = useState(false)
  const [resp, setResp] = useState(null)
  const [showCurl, setShowCurl] = useState(false)

  const preset = useMemo(() => PRESETS.find((p) => p.id === presetId) || PRESETS[0], [presetId])

  useEffect(() => {
    getApiConfig().then(setCfg)
  }, [])

  useEffect(() => {
    setResp(null)
    setBody(preset.body ? JSON.stringify(preset.body, null, 2) : "")
  }, [presetId])

  const fullPath = preset.path + (preset.needsTaskId ? (taskId.trim() || "{task_id}") : "")
  const fullUrl = (cfg.host || "http://127.0.0.1:8765") + fullPath

  const curl = useMemo(() => {
    const key = cfg.apiKey || "YOUR_API_KEY"
    if (preset.method === "GET") {
      return preset.keyless ? `curl '${fullUrl}'` : `curl '${fullUrl}' -H 'X-API-Key: ${key}'`
    }
    const payload = (body || "{}").replace(/'/g, "'\\''")
    return `curl -X POST '${fullUrl}' \\\n  -H 'X-API-Key: ${key}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${payload}'`
  }, [preset, fullUrl, body, cfg.apiKey])

  const send = async () => {
    const { host, apiKey } = await getApiConfig()
    if (preset.needsTaskId && !taskId.trim()) {
      setResp({ error: "Enter a task_id first." })
      return
    }
    const path = preset.path + (preset.needsTaskId ? encodeURIComponent(taskId.trim()) : "")
    const url = host + path
    const headers = {}
    if (!preset.keyless) headers["X-API-Key"] = apiKey
    const init = { method: preset.method, headers }
    if (preset.method === "POST") {
      let parsed
      try {
        parsed = body.trim() ? JSON.parse(body) : {}
      } catch (e) {
        setResp({ error: "Invalid JSON in request body: " + (e?.message || e) })
        return
      }
      headers["Content-Type"] = "application/json"
      init.body = JSON.stringify(parsed)
    }
    setSending(true)
    setResp(null)
    const t0 = Date.now()
    try {
      const res = await fetch(url, init)
      const text = await res.text()
      let pretty = text
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2)
      } catch (_) {}
      const ms = Date.now() - t0
      setResp({ status: res.status, ok: res.ok, ms, text: pretty })
      recordApiCall({ method: preset.method, path, status: res.status, ok: res.ok, ms, source: "playground" })
    } catch (e) {
      const ms = Date.now() - t0
      setResp({ error: "Request failed: " + (e?.message || e) + ". Is the backend running?" })
      recordApiCall({ method: preset.method, path, status: null, ok: false, ms, source: "playground", note: "network error" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div class="animate-fade-in space-y-4 p-4">
      <Section icon={Terminal} title="Developer" desc="Test the webhook API & inspect traffic">
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="rounded-lg border border-surface-border bg-surface-1 px-2.5 py-2">
            <div class="fav-eyebrow">Host</div>
            <div class="mt-0.5 truncate font-mono text-zinc-300">{cfg.host || "\u2014"}</div>
          </div>
          <div class="rounded-lg border border-surface-border bg-surface-1 px-2.5 py-2">
            <div class="fav-eyebrow">API key</div>
            <div class={`mt-0.5 truncate font-mono ${cfg.apiKey ? "text-zinc-300" : "text-amber-400"}`}>{maskKey(cfg.apiKey)}</div>
          </div>
        </div>
      </Section>

      <Section icon={Send} title="API playground" desc="Send a request and inspect the response">
        <div>
          <label class="fav-label">Endpoint</label>
          <Select value={presetId} onChange={setPresetId} options={PRESET_OPTIONS} />
        </div>

        {preset.needsTaskId && (
          <div>
            <label class="fav-label">task_id</label>
            <input
              value={taskId}
              onInput={(e) => setTaskId(e.currentTarget.value)}
              placeholder="paste a task_id from a submit response"
              class="fav-input font-mono"
            />
          </div>
        )}

        {preset.method === "POST" && (
          <div>
            <label class="fav-label">Request body (JSON)</label>
            <textarea
              value={body}
              onInput={(e) => setBody(e.currentTarget.value)}
              rows={8}
              spellcheck={false}
              class="fav-input resize-y font-mono text-[11px] leading-relaxed"
            />
          </div>
        )}

        <button onClick={send} disabled={sending} class="fav-btn-primary w-full">
          {sending ? <Loader2 size={15} class="animate-spin" /> : <Send size={15} />}
          {sending ? "Sending\u2026" : `Send ${preset.method}`}
        </button>

        {resp && (
          <div class="space-y-1.5">
            {resp.error ? (
              <div class="rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">{resp.error}</div>
            ) : (
              <>
                <div class="flex items-center justify-between text-[11px]">
                  <span class={`font-semibold ${statusColor(resp.ok, resp.status)}`}>HTTP {resp.status}</span>
                  <span class="tabular-nums text-zinc-500">{resp.ms}ms</span>
                </div>
                <pre class="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-surface-border bg-surface-0/60 p-2.5 font-mono text-[10px] leading-relaxed text-zinc-300">{resp.text}</pre>
              </>
            )}
          </div>
        )}
      </Section>

      <Section
        icon={Link2}
        title="Webhook URL generator"
        desc="Copy-ready URL & cURL for external callers"
      >
        <div class="flex items-center gap-2">
          <code class="flex-1 truncate rounded-lg border border-surface-border bg-surface-1 px-2.5 py-2 font-mono text-[11px] text-zinc-300">{fullUrl}</code>
          <button type="button" onClick={() => copy(fullUrl, "URL")} class="fav-btn-icon shrink-0" title="Copy URL" aria-label="Copy URL">
            <Copy size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowCurl((s) => !s)}
          class="flex w-full items-center justify-between text-[11px] font-medium text-zinc-400 hover:text-zinc-200"
        >
          <span>cURL command</span>
          <ChevronDown size={14} class={`transition-transform ${showCurl ? "rotate-180" : ""}`} />
        </button>
        {showCurl && (
          <div class="space-y-1.5">
            <pre class="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-surface-border bg-surface-0/60 p-2.5 font-mono text-[10px] leading-relaxed text-zinc-300">{curl}</pre>
            <button
              type="button"
              onClick={() => copy(curl, "cURL")}
              class="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-1 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:text-white"
            >
              <Copy size={13} /> Copy cURL
            </button>
            {!cfg.apiKey && (
              <p class="text-[10px] text-amber-400">Set your API key in Settings to embed it automatically.</p>
            )}
          </div>
        )}
      </Section>

      <EventLog />
    </div>
  )
}
