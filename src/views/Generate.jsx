import { useState } from "preact/hooks"
import { useStore } from "@nanostores/preact"
import { $tasks, upsertTask, clearTasks } from "../lib/stores.js"
import { submitGeneration, pollUntilDone, rebaseFileUrl, getApiConfig } from "../lib/api.js"
import { ImageForm } from "../components/generate/ImageForm.jsx"
import { VideoForm } from "../components/generate/VideoForm.jsx"
import { GrokForm } from "../components/generate/GrokForm.jsx"
import { TaskCard } from "../components/generate/TaskCard.jsx"
import { Segmented } from "../components/forms.jsx"

export function Generate() {
  const [kind, setKind] = useState("image")
  const tasks = useStore($tasks)
  const activeCount = tasks.filter((t) => t.status === "pending" || t.status === "running").length

  const runGeneration = async (genKind, body) => {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    upsertTask({ key, kind: genKind, prompt: body.prompt, status: "pending", results: [], createdAt: Date.now() })
    try {
      const { host } = await getApiConfig()
      const sub = await submitGeneration(genKind, body)
      upsertTask({ key, id: sub.task_id, status: "running" })
      const done = await pollUntilDone(sub.task_id, {
        onUpdate: (s) => {
          if (s.status === "pending" || s.status === "running") upsertTask({ key, status: s.status })
        },
      })
      const results = (done.results || []).map((u) => rebaseFileUrl(u, host))
      upsertTask({ key, status: "completed", results })
    } catch (e) {
      upsertTask({ key, status: "failed", error: e?.message, errorCode: e?.code })
    }
  }

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

      <section class="fav-card">
        {kind === "image" && <ImageForm onSubmit={runGeneration} />}
        {kind === "video" && <VideoForm onSubmit={runGeneration} />}
        {kind === "grok" && <GrokForm onSubmit={runGeneration} />}
      </section>

      {tasks.length > 0 && (
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="fav-eyebrow">
              Results{activeCount > 0 ? ` \u00b7 ${activeCount} running` : ""}
            </h3>
            <button onClick={clearTasks} class="text-[11px] text-zinc-500 hover:text-zinc-300">
              Clear
            </button>
          </div>
          {tasks.map((t) => (
            <TaskCard key={t.key} task={t} />
          ))}
        </div>
      )}
    </div>
  )
}
