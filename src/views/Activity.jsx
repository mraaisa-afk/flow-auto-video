import { useEffect, useState } from "preact/hooks"
import { getErrorLog, clearErrorLog } from "../lib/errorLog.js"
import { STORAGE_KEYS } from "../lib/constants.js"
import { Activity as ActivityIcon, AlertTriangle, ChevronDown, Trash2 } from "lucide-preact"

const KIND_LABEL = { image: "Image", video: "Video", grok: "Grok", system: "System" }

function codeStyle(code) {
  if (code === 429) return { cls: "bg-amber-500/15 text-amber-300", label: "429 quota" }
  if (code === 403) return { cls: "bg-rose-500/15 text-rose-300", label: "403 denied" }
  if (code === 400) return { cls: "bg-rose-500/15 text-rose-300", label: "400 invalid" }
  if (code === 500) return { cls: "bg-rose-500/15 text-rose-300", label: "500 upstream" }
  if (code === 0) return { cls: "bg-zinc-500/15 text-zinc-300", label: "validation" }
  if (code == null) return { cls: "bg-zinc-500/15 text-zinc-300", label: "error" }
  return { cls: "bg-zinc-500/15 text-zinc-300", label: String(code) }
}

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (_) {
    return ""
  }
}

function Row({ e }) {
  const [open, setOpen] = useState(false)
  const s = codeStyle(e.code)
  const hasDetail = !!e.detail
  return (
    <div class="rounded-lg border border-surface-border bg-surface-1 p-2.5">
      <div class="flex items-start gap-2">
        <span class={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${s.cls}`}>{s.label}</span>
        <div class="min-w-0 flex-1">
          <p class="text-xs leading-snug text-zinc-200">{e.message}</p>
          <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
            <span class="font-medium text-zinc-400">{KIND_LABEL[e.kind] || e.kind}</span>
            <span>\u00b7</span>
            <span>{fmt(e.ts)}</span>
            {e.account && (
              <>
                <span>\u00b7</span>
                <span class="truncate">{e.account}</span>
              </>
            )}
          </div>
        </div>
        {hasDetail && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            class="shrink-0 text-zinc-600 hover:text-zinc-300"
            title="Details"
          >
            <ChevronDown size={14} class={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {open && hasDetail && (
        <pre class="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-surface-0/60 p-2 text-[10px] leading-relaxed text-zinc-400">{e.detail}</pre>
      )}
    </div>
  )
}

export function Activity() {
  const [log, setLog] = useState([])

  useEffect(() => {
    getErrorLog().then(setLog)
    const onChanged = (changes, area) => {
      if (area !== "local") return
      if (changes[STORAGE_KEYS.errorLog]) {
        const v = changes[STORAGE_KEYS.errorLog].newValue
        setLog(Array.isArray(v) ? v : [])
      }
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  return (
    <div class="animate-fade-in space-y-4 p-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <ActivityIcon size={16} class="text-brand-300" /> Activity
          </h2>
          <p class="mt-0.5 text-[11px] text-zinc-500">Error timeline & diagnostics \u00b7 newest first</p>
        </div>
        {log.length > 0 && (
          <button
            type="button"
            onClick={() => clearErrorLog().then(() => setLog([]))}
            class="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-1 px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-rose-300"
          >
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {log.length === 0 ? (
        <div class="fav-card flex flex-col items-center gap-2 py-10 text-center">
          <span class="grid h-10 w-10 place-items-center rounded-full bg-surface-3/60 text-emerald-400">
            <AlertTriangle size={18} />
          </span>
          <p class="text-xs font-medium text-zinc-300">No errors logged</p>
          <p class="max-w-[16rem] text-[11px] text-zinc-500">
            Failed generations, quota hits, and backend issues will appear here with full debug detail.
          </p>
        </div>
      ) : (
        <div class="space-y-2">
          {log.map((e) => (
            <Row key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  )
}
