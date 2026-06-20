import { isVideoUrl, filenameFromUrl, downloadFile } from "../../lib/files.js"
import { Loader2, Download, AlertTriangle } from "lucide-preact"

const KIND_LABEL = { image: "Image", video: "Video", grok: "Grok" }

export function TaskCard({ task }) {
  const { kind, prompt, status, results = [], error, errorCode } = task
  const running = status === "pending" || status === "running"

  return (
    <div class="fav-card animate-fade-in space-y-2 p-3">
      <div class="flex items-center justify-between gap-2">
        <span class="rounded-md bg-surface-3/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-300">
          {KIND_LABEL[kind] || kind}
        </span>
        <StatusBadge status={status} />
      </div>
      <p class="line-clamp-2 text-xs text-zinc-400">{prompt}</p>

      {running && (
        <div class="flex items-center gap-2 rounded-lg bg-surface-1/70 px-3 py-2 text-xs text-zinc-400">
          <Loader2 size={14} class="animate-spin text-brand-300" />
          {status === "pending" ? "Queued\u2026" : "Generating\u2026"}
        </div>
      )}

      {status === "failed" && (
        <div class="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          <AlertTriangle size={14} class="mt-0.5 shrink-0" />
          <div>
            <div>{error || "Generation failed"}</div>
            {errorCode === 429 && (
              <div class="mt-0.5 text-rose-400/80">Quota reached \u2014 try later or rotate accounts.</div>
            )}
          </div>
        </div>
      )}

      {status === "completed" && results.length > 0 && (
        <div class="grid grid-cols-2 gap-2">
          {results.map((url, i) => (
            <ResultTile key={i} url={url} />
          ))}
        </div>
      )}
      {status === "completed" && results.length === 0 && (
        <p class="text-xs text-zinc-500">Completed, but no files were returned.</p>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending: ["text-zinc-400", "Queued"],
    running: ["text-brand-300", "Running"],
    completed: ["text-emerald-400", "Done"],
    failed: ["text-rose-400", "Failed"],
  }
  const [cls, label] = map[status] || map.pending
  return <span class={`text-[11px] font-medium ${cls}`}>{label}</span>
}

function ResultTile({ url }) {
  const video = isVideoUrl(url)
  const name = filenameFromUrl(url)
  return (
    <div class="group relative overflow-hidden rounded-lg border border-surface-border bg-surface-1">
      {video ? (
        <video src={url} class="h-28 w-full object-cover" controls />
      ) : (
        <img src={url} alt={name} class="h-28 w-full object-cover" />
      )}
      <button
        type="button"
        onClick={() => downloadFile(url, name).catch(() => {})}
        class="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
        title="Download"
      >
        <Download size={13} />
      </button>
    </div>
  )
}
