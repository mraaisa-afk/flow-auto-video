import { useState } from "preact/hooks"
import { Trash2, Zap, Clock, AlertTriangle } from "lucide-preact"
import { scoreAccount, BAND_META, setEnabled, removeAccount } from "../../lib/accounts.js"

function fmtReset(ts) {
  const ms = ts - Date.now()
  if (ms <= 0) return "now"
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function AccountCard({ account }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [flash, setFlash] = useState("")
  const h = scoreAccount(account)
  const band = BAND_META[h.band]
  const dailyLimit = account.quota.dailyLimit

  const toggle = async () => {
    const next = !account.enabled
    await setEnabled(account.id, next)
    setFlash(next ? "Enabled" : "Disabled")
    setTimeout(() => setFlash(""), 1400)
  }

  const del = async () => {
    if (!confirmDel) {
      setConfirmDel(true)
      setTimeout(() => setConfirmDel(false), 3000)
      return
    }
    await removeAccount(account.id)
  }

  return (
    <div class={`fav-card space-y-3 ${account.enabled ? "" : "opacity-60"}`}>
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2.5">
          <span class={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${band.dot}`} />
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="truncate text-sm font-semibold text-white">{account.label}</span>
              {account.tier === "ultra" && (
                <span class="inline-flex items-center gap-0.5 rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-200">
                  <Zap size={9} /> ULTRA
                </span>
              )}
            </div>
            {account.email && <div class="truncate text-xs text-zinc-500">{account.email}</div>}
          </div>
        </div>
        <div class="flex items-center gap-2">
          {flash && <span class="text-[10px] font-medium text-brand-300">{flash}</span>}
          <button
            role="switch"
            aria-checked={account.enabled}
            onClick={toggle}
            title={account.enabled ? "Disable" : "Enable"}
            aria-label={account.enabled ? "Disable account" : "Enable account"}
            class={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${account.enabled ? "bg-brand" : "bg-surface-3"}`}
          >
            <span
              class={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${account.enabled ? "left-[18px]" : "left-0.5"}`}
            />
          </button>
        </div>
      </div>

      <div>
        <div class="mb-1 flex items-center justify-between text-[11px]">
          <span class={`font-medium ${band.text}`}>{band.label}</span>
          <span class="text-zinc-500">{h.score}% health</span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-1">
          <span class={`block h-full rounded-full ${band.dot}`} style={`width:${h.score}%`} />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-lg bg-surface-1/70 py-1.5">
          <div class="text-sm font-semibold text-white">{Math.round(h.successRate * 100)}%</div>
          <div class="text-[10px] text-zinc-500">success</div>
        </div>
        <div class="rounded-lg bg-surface-1/70 py-1.5">
          <div class="text-sm font-semibold text-white">{dailyLimit > 0 ? h.remaining : "\u221e"}</div>
          <div class="text-[10px] text-zinc-500">left today</div>
        </div>
        <div class="rounded-lg bg-surface-1/70 py-1.5">
          <div class="text-sm font-semibold text-white">{account.quota.usedToday}</div>
          <div class="text-[10px] text-zinc-500">used</div>
        </div>
      </div>

      {account.groups.length > 0 && (
        <div class="flex flex-wrap gap-1">
          {account.groups.map((g) => (
            <span
              key={g}
              class="rounded-md border border-surface-border bg-surface-1 px-1.5 py-0.5 text-[10px] text-zinc-400"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      <div class="flex items-center justify-between border-t border-surface-border pt-2 text-[11px] text-zinc-500">
        <span class="inline-flex items-center gap-1">
          <Clock size={11} /> resets {fmtReset(account.quota.resetAt)}
        </span>
        <div class="flex items-center gap-2.5">
          {account.stats.lastErrorCode === 429 && (
            <span class="inline-flex items-center gap-1 text-amber-400">
              <AlertTriangle size={11} /> quota
            </span>
          )}
          <button
            onClick={del}
            class={`inline-flex items-center gap-1 transition-colors ${confirmDel ? "text-rose-400" : "text-zinc-500 hover:text-rose-400"}`}
            title="Remove account"
          >
            <Trash2 size={11} /> {confirmDel ? "Confirm?" : ""}
          </button>
        </div>
      </div>
    </div>
  )
}
