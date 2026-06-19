import { useStore } from "@nanostores/preact"
import { $health, $auth } from "../lib/stores.js"
import { signIn, signOut } from "../lib/auth.js"
import { RefreshCw } from "lucide-preact"

function StatusPill({ state }) {
  const map = {
    connected: ["Connected", "text-green-400"],
    partial: ["Degraded", "text-yellow-400"],
    disconnected: ["Disconnected", "text-red-400"],
    unknown: ["Unknown", "text-zinc-400"],
  }
  const [label, cls] = map[state] || map.unknown
  return <span class={`font-medium ${cls}`}>{label}</span>
}

export function Dashboard() {
  const health = useStore($health)
  const auth = useStore($auth)
  const refresh = () => chrome.runtime.sendMessage({ type: "CHECK_HEALTH" })

  return (
    <div class="space-y-4 p-4">
      <section class="rounded-lg border border-zinc-800 p-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-medium text-zinc-300">Backend connection</h2>
          <button onClick={refresh} class="text-zinc-400 hover:text-zinc-200" title="Re-check">
            <RefreshCw size={14} />
          </button>
        </div>
        <p class="mt-1 text-sm">Status: <StatusPill state={health.state} /></p>
        <p class="mt-1 text-xs text-zinc-500">
          {health.lastChecked
            ? `Checked ${new Date(health.lastChecked).toLocaleTimeString()}`
            : "Not checked yet"}
        </p>
      </section>

      <section class="rounded-lg border border-zinc-800 p-3">
        <h2 class="text-sm font-medium text-zinc-300">Google account</h2>
        {auth.status === "signed_in" ? (
          <div class="mt-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              {auth.user?.picture && (
                <img src={auth.user.picture} class="h-7 w-7 rounded-full" alt="" />
              )}
              <div class="text-sm">
                <div>{auth.user?.name}</div>
                <div class="text-xs text-zinc-500">{auth.user?.email}</div>
              </div>
            </div>
            <button onClick={signOut} class="text-xs text-red-400 hover:text-red-300">
              Sign out
            </button>
          </div>
        ) : (
          <div class="mt-2">
            <button
              onClick={signIn}
              disabled={auth.status === "signing_in"}
              class="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-soft disabled:opacity-50"
            >
              {auth.status === "signing_in" ? "Signing in\u2026" : "Sign in with Google"}
            </button>
            {auth.status === "error" && (
              <p class="mt-2 text-xs text-red-400">{auth.error}</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
