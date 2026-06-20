import { useStore } from "@nanostores/preact"
import { $health, $auth } from "../lib/stores.js"
import { signIn, signOut } from "../lib/auth.js"
import { RefreshCw, LogOut, Server, ShieldCheck } from "lucide-preact"
import { StatusPill, Avatar } from "../components/ui.jsx"

export function Dashboard() {
  const health = useStore($health)
  const auth = useStore($auth)
  const refresh = () => chrome.runtime.sendMessage({ type: "CHECK_HEALTH" })

  return (
    <div class="animate-fade-in space-y-3 p-4">
      <section class="fav-card">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2.5">
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-surface-3/70 text-brand-300">
              <Server size={17} />
            </span>
            <div>
              <div class="fav-eyebrow">Backend</div>
              <div class="text-sm font-semibold text-white">Local webhook</div>
            </div>
          </div>
          <button onClick={refresh} class="fav-btn-icon" title="Re-check now" aria-label="Re-check">
            <RefreshCw size={14} />
          </button>
        </div>
        <div class="mt-3 flex items-center justify-between">
          <StatusPill state={health.state} />
          <span class="text-[11px] text-zinc-500">
            {health.lastChecked
              ? `Checked ${new Date(health.lastChecked).toLocaleTimeString()}`
              : "Not checked yet"}
          </span>
        </div>
      </section>

      <section class="fav-card">
        <div class="flex items-center gap-2.5">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-surface-3/70 text-brand-300">
            <ShieldCheck size={17} />
          </span>
          <div>
            <div class="fav-eyebrow">Identity</div>
            <div class="text-sm font-semibold text-white">Google account</div>
          </div>
        </div>

        {auth.status === "signed_in" ? (
          <div class="mt-3 flex items-center justify-between rounded-xl bg-surface-1/70 p-2.5">
            <div class="flex min-w-0 items-center gap-2.5">
              <Avatar src={auth.user?.picture} name={auth.user?.name} size={34} />
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-white">{auth.user?.name}</div>
                <div class="truncate text-xs text-zinc-500">{auth.user?.email}</div>
              </div>
            </div>
            <button onClick={signOut} class="fav-btn-ghost shrink-0 px-2.5 py-1.5 text-xs" title="Sign out">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        ) : (
          <div class="mt-3">
            <button onClick={signIn} disabled={auth.status === "signing_in"} class="fav-btn-primary w-full">
              {auth.status === "signing_in" ? "Signing in\u2026" : "Sign in with Google"}
            </button>
            {auth.status === "error" && (
              <p class="mt-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{auth.error}</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
