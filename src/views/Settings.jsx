import { useEffect, useState } from "preact/hooks"
import { getSecure, setSecure } from "../lib/storage.js"
import { STORAGE_KEYS, WEBHOOK_HOST } from "../lib/constants.js"
import { Eye, EyeOff, Check, Lock } from "lucide-preact"

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
    <div class="animate-fade-in space-y-4 p-4">
      <section class="fav-card space-y-4">
        <div>
          <div class="fav-eyebrow">Connection</div>
          <h2 class="text-sm font-semibold text-white">Backend settings</h2>
        </div>

        <div>
          <label class="fav-label">Webhook host</label>
          <input
            value={host}
            onInput={(e) => setHost(e.currentTarget.value)}
            class="fav-input"
            placeholder="http://127.0.0.1:8765"
          />
        </div>

        <div>
          <label class="fav-label">API key (X-API-Key)</label>
          <div class="flex gap-2">
            <input
              type={reveal ? "text" : "password"}
              value={apiKey}
              onInput={(e) => setApiKey(e.currentTarget.value)}
              placeholder="your webhook API key"
              class="fav-input"
            />
            <button
              onClick={() => setReveal((r) => !r)}
              class="fav-btn-icon shrink-0"
              title={reveal ? "Hide" : "Show"}
              aria-label={reveal ? "Hide" : "Show"}
            >
              {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button onClick={save} class="fav-btn-primary w-full">
          {saved ? (
            <>
              <Check size={15} /> Saved
            </>
          ) : (
            "Save settings"
          )}
        </button>
      </section>

      <div class="flex items-start gap-2 rounded-xl border border-surface-border bg-surface-2/50 p-3">
        <Lock size={14} class="mt-0.5 shrink-0 text-zinc-500" />
        <p class="text-[11px] leading-relaxed text-zinc-500">
          Stored encrypted at rest via Web Crypto (AES-GCM). This guards against casual
          inspection — not a determined attacker with local machine access.
        </p>
      </div>
    </div>
  )
}
