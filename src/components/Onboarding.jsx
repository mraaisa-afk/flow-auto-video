import { useState } from "preact/hooks"
import { useStore } from "@nanostores/preact"
import { getSecure, setSecure } from "../lib/storage.js"
import { STORAGE_KEYS, WEBHOOK_HOST } from "../lib/constants.js"
import { setOnboarded } from "../lib/prefs.js"
import { $auth } from "../lib/stores.js"
import { signIn } from "../lib/auth.js"
import { toastSuccess } from "../lib/toast.js"
import { Sparkles, Server, ShieldCheck, ArrowRight, Check, X } from "lucide-preact"

const TOTAL = 3

export function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [host, setHost] = useState(WEBHOOK_HOST)
  const [apiKey, setApiKey] = useState("")
  const [saved, setSaved] = useState(false)
  const auth = useStore($auth)

  const finish = async () => {
    await setOnboarded(true)
    onDone && onDone()
  }

  const saveBackend = async () => {
    const cur = await getSecure(STORAGE_KEYS.settings, null)
    await setSecure(STORAGE_KEYS.settings, { ...(cur || {}), apiKey, webhookHost: host })
    setSaved(true)
    toastSuccess("Backend saved")
    setStep(2)
  }

  return (
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Getting started">
      <div class="fav-glass animate-fade-in w-full max-w-sm overflow-hidden p-5">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <span key={i} class={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-brand-400" : i < step ? "w-3 bg-brand-600" : "w-3 bg-surface-3"}`} />
            ))}
          </div>
          <button type="button" onClick={finish} class="text-zinc-500 hover:text-zinc-300" aria-label="Skip setup">
            <X size={16} />
          </button>
        </div>

        {step === 0 && (
          <div class="space-y-3 text-center">
            <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400/25 to-brand-700/25 text-brand-300">
              <Sparkles size={26} />
            </span>
            <h2 class="text-base font-semibold text-white">Welcome to Flow Auto Video</h2>
            <p class="mx-auto max-w-[18rem] text-xs leading-relaxed text-zinc-400">
              Generate AI images & videos through your local G-Labs webhook — with smart accounts,
              batching, templates and background queueing. Let’s get you connected.
            </p>
            <button onClick={() => setStep(1)} class="fav-btn-primary w-full">
              Get started <ArrowRight size={15} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div class="space-y-3">
            <div class="flex items-center gap-2.5">
              <span class="grid h-9 w-9 place-items-center rounded-xl bg-surface-3/70 text-brand-300"><Server size={17} /></span>
              <div>
                <h2 class="text-sm font-semibold text-white">Connect your backend</h2>
                <p class="text-[11px] text-zinc-500">Start the G-Labs server, then paste its API key.</p>
              </div>
            </div>
            <div>
              <label class="fav-label">Webhook host</label>
              <input value={host} onInput={(e) => setHost(e.currentTarget.value)} class="fav-input" placeholder="http://127.0.0.1:8765" />
            </div>
            <div>
              <label class="fav-label">API key</label>
              <input value={apiKey} onInput={(e) => setApiKey(e.currentTarget.value)} class="fav-input" placeholder="your webhook API key" />
            </div>
            <div class="flex gap-2">
              <button onClick={() => setStep(2)} class="fav-btn-ghost flex-1">Skip</button>
              <button onClick={saveBackend} class="fav-btn-primary flex-1">Save & continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div class="space-y-3">
            <div class="flex items-center gap-2.5">
              <span class="grid h-9 w-9 place-items-center rounded-xl bg-surface-3/70 text-brand-300"><ShieldCheck size={17} /></span>
              <div>
                <h2 class="text-sm font-semibold text-white">Sign in (optional)</h2>
                <p class="text-[11px] text-zinc-500">Identify yourself with Google for a personalized workspace.</p>
              </div>
            </div>
            {auth.status === "signed_in" ? (
              <div class="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                <Check size={14} /> Signed in as {auth.user?.email || "your account"}
              </div>
            ) : (
              <button onClick={signIn} disabled={auth.status === "signing_in"} class="fav-btn-ghost w-full">
                {auth.status === "signing_in" ? "Signing in\u2026" : "Sign in with Google"}
              </button>
            )}
            <button onClick={finish} class="fav-btn-primary w-full">
              {saved ? "Finish setup" : "Start using Flow Auto Video"} <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
