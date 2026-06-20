import { useEffect, useRef, useState } from "preact/hooks"
import { getSecure, setSecure } from "../lib/storage.js"
import { STORAGE_KEYS, WEBHOOK_HOST } from "../lib/constants.js"
import { loadAccounts } from "../lib/accounts.js"
import { exportConfigJson, parseConfig, importConfig, summarizeConfig } from "../lib/configIo.js"
import { getPrefs, setPrefs } from "../lib/prefs.js"
import { toastSuccess, toastError } from "../lib/toast.js"
import { Eye, EyeOff, Check, Lock, Download, Upload, Contrast } from "lucide-preact"

export function Settings() {
  const [apiKey, setApiKey] = useState("")
  const [host, setHost] = useState(WEBHOOK_HOST)
  const [reveal, setReveal] = useState(false)
  const [saved, setSaved] = useState(false)
  const [includeKey, setIncludeKey] = useState(true)
  const [highContrast, setHighContrast] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    getSecure(STORAGE_KEYS.settings, null).then((s) => {
      if (s) {
        setApiKey(s.apiKey || "")
        setHost(s.webhookHost || WEBHOOK_HOST)
      }
    })
    getPrefs().then((p) => setHighContrast(!!p.highContrast))
  }, [])

  const save = async () => {
    await setSecure(STORAGE_KEYS.settings, { apiKey, webhookHost: host })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const toggleContrast = async (v) => {
    setHighContrast(v)
    await setPrefs({ highContrast: v })
  }

  const doExport = async () => {
    try {
      const json = await exportConfigJson({ includeSecrets: includeKey })
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `flow-auto-video-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toastSuccess("Config exported")
    } catch (e) {
      toastError("Export failed: " + (e?.message || e))
    }
  }

  const onPickFile = async (e) => {
    const file = e.currentTarget.files && e.currentTarget.files[0]
    e.currentTarget.value = ""
    if (!file) return
    try {
      const text = await file.text()
      const obj = parseConfig(text)
      const sum = summarizeConfig(obj)
      const applied = await importConfig(obj)
      const s = await getSecure(STORAGE_KEYS.settings, null)
      if (s) {
        setApiKey(s.apiKey || "")
        setHost(s.webhookHost || WEBHOOK_HOST)
      }
      await loadAccounts()
      toastSuccess(
        `Imported ${applied.length} section${applied.length === 1 ? "" : "s"} \u00b7 ${sum.accounts} accounts, ${sum.templates} templates`
      )
    } catch (err) {
      toastError("Import failed: " + (err?.message || err))
    }
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
              aria-label={reveal ? "Hide API key" : "Show API key"}
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

      <section class="fav-card space-y-3">
        <div>
          <div class="fav-eyebrow">Appearance</div>
          <h2 class="text-sm font-semibold text-white">Accessibility</h2>
        </div>
        <label class="flex items-center justify-between gap-3">
          <span class="flex items-center gap-2.5">
            <span class="grid h-8 w-8 place-items-center rounded-lg bg-surface-3/70 text-brand-300"><Contrast size={16} /></span>
            <span>
              <span class="block text-sm font-medium text-white">High contrast</span>
              <span class="block text-[11px] text-zinc-500">Stronger borders and brighter text</span>
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={highContrast ? "true" : "false"}
            aria-label="Toggle high contrast"
            onClick={() => toggleContrast(!highContrast)}
            class={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${highContrast ? "bg-brand" : "bg-surface-3"}`}
          >
            <span class={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${highContrast ? "left-[1.375rem]" : "left-0.5"}`} />
          </button>
        </label>
      </section>

      <section class="fav-card space-y-3">
        <div>
          <div class="fav-eyebrow">Backup</div>
          <h2 class="text-sm font-semibold text-white">Export &amp; import config</h2>
          <p class="mt-0.5 text-[11px] text-zinc-500">
            Move settings, accounts, rotation, templates and prompt history between machines.
          </p>
        </div>
        <label class="flex items-center gap-2 text-[11px] text-zinc-400">
          <input
            type="checkbox"
            checked={includeKey}
            onChange={(e) => setIncludeKey(e.currentTarget.checked)}
            class="accent-brand-500"
          />
          Include API key in export
        </label>
        <div class="flex gap-2">
          <button onClick={doExport} class="fav-btn-ghost flex-1">
            <Download size={14} /> Export JSON
          </button>
          <button onClick={() => fileRef.current && fileRef.current.click()} class="fav-btn-ghost flex-1">
            <Upload size={14} /> Import JSON
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onPickFile}
          class="hidden"
        />
        <p class="text-[10px] text-amber-400/80">
          Importing overwrites matching sections. Only export with the key on trusted machines.
        </p>
      </section>

      <div class="flex items-start gap-2 rounded-xl border border-surface-border bg-surface-2/50 p-3">
        <Lock size={14} class="mt-0.5 shrink-0 text-zinc-500" />
        <p class="text-[11px] leading-relaxed text-zinc-500">
          Stored encrypted at rest via Web Crypto (AES-GCM). This guards against casual
          inspection \u2014 not a determined attacker with local machine access.
        </p>
      </div>
    </div>
  )
}
