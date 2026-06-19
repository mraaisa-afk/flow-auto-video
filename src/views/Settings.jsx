import { useEffect, useState } from "preact/hooks"
import { getSecure, setSecure } from "../lib/storage.js"
import { STORAGE_KEYS, WEBHOOK_HOST } from "../lib/constants.js"

export function Settings() {
  const [apiKey, setApiKey] = useState("")
  const [host, setHost] = useState(WEBHOOK_HOST)
  const [reveal, setReveal] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSecure(STORAGE_KEYS.settings, null).then((s) => {
      if (s) {
        setApiKey(s.apiKey || "")
        setHost(s.webhookHost || WEBHOOK_HOST)
      }
    })
  }, [])

  const save = async () => {
    await setSecure(STORAGE_KEYS.settings, { apiKey, webhookHost: host })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div class="space-y-3 p-4">
      <h2 class="text-sm font-medium text-zinc-300">Settings</h2>
      <label class="block text-xs text-zinc-400">
        Webhook host
        <input
          value={host}
          onInput={(e) => setHost(e.currentTarget.value)}
          class="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
        />
      </label>
      <label class="block text-xs text-zinc-400">
        API key (X-API-Key)
        <div class="mt-1 flex gap-2">
          <input
            type={reveal ? "text" : "password"}
            value={apiKey}
            onInput={(e) => setApiKey(e.currentTarget.value)}
            placeholder="your webhook API key"
            class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
          />
          <button
            onClick={() => setReveal((r) => !r)}
            class="rounded-md border border-zinc-700 px-2 text-xs text-zinc-400 hover:text-zinc-200"
          >
            {reveal ? "Hide" : "Show"}
          </button>
        </div>
      </label>
      <p class="text-[11px] text-zinc-500">
        Stored encrypted at rest (Web Crypto). Guards against casual inspection,
        not a determined local attacker.
      </p>
      <button
        onClick={save}
        class="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-soft"
      >
        {saved ? "Saved \u2713" : "Save"}
      </button>
    </div>
  )
}
