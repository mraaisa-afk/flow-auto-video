import { useState } from "preact/hooks"
import { useStore } from "@nanostores/preact"
import { $tasks } from "../lib/stores.js"
import { ImageForm } from "../components/generate/ImageForm.jsx"
import { VideoForm } from "../components/generate/VideoForm.jsx"
import { GrokForm } from "../components/generate/GrokForm.jsx"
import { TaskCard } from "../components/generate/TaskCard.jsx"
import { PromptTools } from "../components/generate/PromptTools.jsx"
import { Segmented, Field, ChipSingle } from "../components/forms.jsx"
import { validate } from "../lib/validation.js"
import { addHistory } from "../lib/history.js"
import { makeTask } from "../lib/taskQueue.js"
import { AlertTriangle, Info, Sparkles } from "lucide-preact"

const BATCH_OPTIONS = [1, 2, 3, 4, 6, 8]

export function Generate() {
  const [kind, setKind] = useState("image")
  const [prompt, setPrompt] = useState("")
  const [batch, setBatch] = useState(1)
  const [preflight, setPreflight] = useState({ errors: [], warnings: [] })
  const tasks = useStore($tasks)
  const activeCount = tasks.filter((t) => t.status === "queued" || t.status === "running").length

  const runGeneration = (genKind, body) => {
    const v = validate(genKind, body)
    setPreflight(v)
    if (v.errors.length > 0) return
    addHistory({ kind: genKind, prompt: body.prompt })
    const total = Math.max(1, Math.min(8, batch))
    const groupId = total > 1 ? "b_" + Date.now().toString(36) : null
    const newTasks = []
    for (let i = 0; i < total; i++) {
      newTasks.push(
        makeTask({ kind: genKind, body, batch: groupId ? { groupId, index: i + 1, total } : null })
      )
    }
    chrome.runtime.sendMessage({ type: "ENQUEUE_TASKS", tasks: newTasks })
  }

  const clearFinished = () => chrome.runtime.sendMessage({ type: "CLEAR_FINISHED" })

  return (
    <div class="animate-fade-in space-y-4 p-4">
      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: "image", label: "Image" },
          { value: "video", label: "Video" },
          { value: "grok", label: "Grok" },
        ]}
      />

      <PromptTools kind={kind} prompt={prompt} setPrompt={setPrompt} />

      <Field label="Batch" hint="variations per click">
        <ChipSingle value={batch} onChange={setBatch} options={BATCH_OPTIONS} />
      </Field>

      <section class="fav-card">
        {kind === "image" && <ImageForm onSubmit={runGeneration} prompt={prompt} setPrompt={setPrompt} />}
        {kind === "video" && <VideoForm onSubmit={runGeneration} prompt={prompt} setPrompt={setPrompt} />}
        {kind === "grok" && <GrokForm onSubmit={runGeneration} prompt={prompt} setPrompt={setPrompt} />}
      </section>

      {(preflight.errors.length > 0 || preflight.warnings.length > 0) && (
        <div class="space-y-1.5">
          {preflight.errors.map((m, i) => (
            <div key={`e${i}`} class="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
              <AlertTriangle size={13} class="mt-0.5 shrink-0" />
              {m}
            </div>
          ))}
          {preflight.warnings.map((m, i) => (
            <div key={`w${i}`} class="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
              <Info size={13} class="mt-0.5 shrink-0" />
              {m}
            </div>
          ))}
        </div>
      )}

      {tasks.length > 0 ? (
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="fav-eyebrow">Results{activeCount > 0 ? ` \u00b7 ${activeCount} active` : ""}</h3>
            <button onClick={clearFinished} class="text-[11px] text-zinc-500 hover:text-zinc-300">
              Clear finished
            </button>
          </div>
          {tasks.map((t) => (
            <TaskCard key={t.key} task={t} />
          ))}
        </div>
      ) : (
        <div class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-surface-border bg-surface-2/40 px-6 py-8 text-center">
          <span class="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-400/20 to-brand-700/20 text-brand-300">
            <Sparkles size={22} />
          </span>
          <h3 class="text-sm font-semibold text-white">Nothing generated yet</h3>
          <p class="mx-auto max-w-[18rem] text-xs text-zinc-500">
            Write a prompt above and hit generate. Results stream in here and keep running in the
            background — even if you switch tabs.
          </p>
        </div>
      )}
    </div>
  )
}
